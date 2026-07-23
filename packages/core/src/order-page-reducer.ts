import { compareDecimals } from "@zagvar/decimal";
import type {
  OrderFilters,
  OrdersPage,
  OrdersQuery,
  OrderSort,
  OrderSortField,
} from "./order-query.js";
import type { OrderListItem } from "./order-record.js";
import { isOpenOrderStatus, isTerminalOrderStatus } from "./order-status.js";
import {
  applyOrderUpdate,
  type OrderUpdate,
  type OrderUpdateFailure,
} from "./order-update.js";

export type OrdersPageUpdateFailure = OrderUpdateFailure | "order_not_found";

export type OrdersPageUpdateResult =
  | {
      applied: true;
      page: OrdersPage;
      effect: "updated" | "removed";
      requiresRefetch: boolean;
    }
  | {
      applied: false;
      reason: OrdersPageUpdateFailure;
    };

/**
 * Applies a complete order update to an existing cursor page.
 *
 * New orders are not inserted because the reducer cannot know whether they
 * belong before, inside, or after the current cursor window. A missing order
 * therefore asks the host to decide whether to refetch.
 */
export function applyOrderUpdateToPage(
  page: OrdersPage,
  query: OrdersQuery,
  update: OrderUpdate,
): OrdersPageUpdateResult {
  const index = page.items.findIndex((order) =>
    hasMatchingOrderKey(order, update.order),
  );

  if (index === -1) {
    return {
      applied: false,
      reason: "order_not_found",
    };
  }

  const current = page.items[index];
  if (current === undefined) {
    return {
      applied: false,
      reason: "order_not_found",
    };
  }

  const result = applyOrderUpdate(current, update);

  if (!result.applied) {
    return result;
  }

  const requiresRefetch = hasSortValueChanged(
    current,
    result.order,
    query.sort.field,
  );

  const asOf = getLaterTimestamp(
    page.asOf,
    update.receivedAt ?? result.order.updatedAt,
  );

  if (!matchesOrdersQuery(result.order, query)) {
    const items = page.items.filter((_order, itemIndex) => itemIndex !== index);

    return {
      applied: true,
      page: {
        ...page,
        items,
        asOf,
        ...(page.totalCount === undefined
          ? {}
          : {
              totalCount: Math.max(0, page.totalCount - 1),
            }),
      },
      effect: "removed",
      requiresRefetch: true,
    };
  }

  const items = [...page.items];
  items[index] = result.order;
  items.sort((left, right) => compareOrders(left, right, query.sort));

  return {
    applied: true,
    page: {
      ...page,
      items,
      asOf,
    },
    effect: "updated",
    requiresRefetch,
  };
}

/**
 * Evaluates whether an order belongs in the semantic query.
 *
 * This is used only for reconciling rows already returned by the backend. The
 * backend remains authoritative for the complete matching result set.
 */
export function matchesOrdersQuery(
  order: OrderListItem,
  query: OrdersQuery,
): boolean {
  if (
    query.scope === "open"
      ? !isOpenOrderStatus(order.status)
      : !isTerminalOrderStatus(order.status)
  ) {
    return false;
  }

  const { filters } = query;

  return (
    matchesOptionalFilter(filters.accountIds, order.accountId) &&
    matchesOptionalFilter(filters.symbols, order.symbol) &&
    matchesOptionalFilter(filters.assetClasses, order.assetClass) &&
    matchesOptionalFilter(filters.venues, order.venue) &&
    matchesOptionalFilter(filters.quoteCurrencies, order.quoteCurrency) &&
    matchesOptionalFilter(filters.sides, order.side) &&
    matchesOptionalFilter(filters.types, order.type) &&
    matchesOptionalFilter(filters.tifs, order.tif) &&
    matchesOptionalFilter(filters.statuses, order.status) &&
    matchesSubmissionRange(order, filters)
  );
}

function matchesOptionalFilter<T extends string>(
  values: readonly T[] | undefined,
  value: T | undefined,
): boolean {
  if (values === undefined) {
    return true;
  }

  return value !== undefined && values.includes(value);
}

function matchesSubmissionRange(
  order: OrderListItem,
  filters: OrderFilters,
): boolean {
  const submittedAt = Date.parse(order.submittedAt);

  if (
    filters.submittedFrom !== undefined &&
    submittedAt < Date.parse(filters.submittedFrom)
  ) {
    return false;
  }

  if (
    filters.submittedTo !== undefined &&
    submittedAt >= Date.parse(filters.submittedTo)
  ) {
    return false;
  }

  return true;
}

function compareOrders(
  left: OrderListItem,
  right: OrderListItem,
  sort: OrderSort,
): number {
  if (sort.field === "completedAt") {
    const leftMissing = left.completedAt === undefined;
    const rightMissing = right.completedAt === undefined;

    if (leftMissing && !rightMissing) return 1;
    if (!leftMissing && rightMissing) return -1;
  }

  const comparison = compareOrderField(left, right, sort.field);
  const directed = sort.direction === "asc" ? comparison : -comparison;

  if (directed !== 0) {
    return directed;
  }

  return compareStrings(getOrderKey(left), getOrderKey(right));
}

function compareOrderField(
  left: OrderListItem,
  right: OrderListItem,
  field: OrderSortField,
): number {
  switch (field) {
    case "submittedAt":
      return Date.parse(left.submittedAt) - Date.parse(right.submittedAt);

    case "updatedAt":
      return Date.parse(left.updatedAt) - Date.parse(right.updatedAt);

    case "completedAt":
      if (left.completedAt === undefined || right.completedAt === undefined) {
        return 0;
      }

      return Date.parse(left.completedAt) - Date.parse(right.completedAt);

    case "symbol":
      return compareStrings(left.symbol, right.symbol);

    case "status":
      return compareStrings(left.status, right.status);

    case "side":
      return compareStrings(left.side, right.side);

    case "type":
      return compareStrings(left.type, right.type);

    case "filledQuantity":
      return compareDecimals(left.filledQuantity, right.filledQuantity);
  }
}

function hasSortValueChanged(
  current: OrderListItem,
  next: OrderListItem,
  field: OrderSortField,
): boolean {
  if (field === "completedAt") {
    return current.completedAt !== next.completedAt;
  }

  return compareOrderField(current, next, field) !== 0;
}

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function hasMatchingOrderKey(
  left: OrderListItem,
  right: OrderListItem,
): boolean {
  return left.orderId === right.orderId && left.accountId === right.accountId;
}

function getOrderKey(order: OrderListItem): string {
  return JSON.stringify([order.accountId ?? null, order.orderId]);
}

function getLaterTimestamp(current: string, candidate: string): string {
  return Date.parse(candidate) > Date.parse(current) ? candidate : current;
}
