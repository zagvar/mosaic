import { z } from "zod";
import { orderListItemSchema, type OrderListItem } from "./order-record.js";
import { isoTimestampSchema } from "./timestamp.js";

/**
 * A complete canonical replacement for one order-list record.
 *
 * Provider-specific partial messages must be assembled by the backend or host
 * adapter before entering this contract.
 */
export const orderUpdateSchema = z.object({
  order: orderListItemSchema,

  /**
   * Time at which the host received this update.
   *
   * This is observability metadata and is not used for lifecycle ordering.
   */
  receivedAt: isoTimestampSchema.optional(),
});

export type OrderUpdate = z.infer<typeof orderUpdateSchema>;

export type OrderUpdateFailure =
  | "order_mismatch"
  | "instrument_mismatch"
  | "immutable_field_mismatch"
  | "stale_version"
  | "version_missing"
  | "stale_timestamp";

export type OrderUpdateResult =
  | {
      applied: true;
      order: OrderListItem;
    }
  | {
      applied: false;
      reason: OrderUpdateFailure;
    };

/**
 * Reconciles a complete order update with the current canonical order.
 *
 * Backend versions are authoritative when the current record is versioned.
 * Otherwise, `updatedAt` provides a deterministic fallback.
 */
export function applyOrderUpdate(
  current: OrderListItem,
  update: OrderUpdate,
): OrderUpdateResult {
  const next = update.order;

  if (
    current.orderId !== next.orderId ||
    current.accountId !== next.accountId
  ) {
    return {
      applied: false,
      reason: "order_mismatch",
    };
  }

  if (!hasMatchingInstrument(current, next)) {
    return {
      applied: false,
      reason: "instrument_mismatch",
    };
  }

  if (
    current.side !== next.side ||
    current.type !== next.type ||
    current.submittedAt !== next.submittedAt
  ) {
    return {
      applied: false,
      reason: "immutable_field_mismatch",
    };
  }

  if (current.version !== undefined) {
    if (next.version === undefined) {
      return {
        applied: false,
        reason: "version_missing",
      };
    }

    if (next.version <= current.version) {
      return {
        applied: false,
        reason: "stale_version",
      };
    }

    return {
      applied: true,
      order: next,
    };
  }

  if (Date.parse(next.updatedAt) <= Date.parse(current.updatedAt)) {
    return {
      applied: false,
      reason: "stale_timestamp",
    };
  }

  return {
    applied: true,
    order: next,
  };
}

function hasMatchingInstrument(
  current: OrderListItem,
  next: OrderListItem,
): boolean {
  return (
    current.symbol === next.symbol &&
    current.assetClass === next.assetClass &&
    current.venue === next.venue &&
    current.baseAsset === next.baseAsset &&
    current.quoteAsset === next.quoteAsset &&
    current.quoteCurrency === next.quoteCurrency
  );
}
