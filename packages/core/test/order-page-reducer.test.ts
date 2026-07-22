import { describe, expect, it } from "vitest";
import {
  applyOrderUpdateToPage,
  matchesOrdersQuery,
  ordersQuerySchema,
  type OrderListItem,
  type OrdersPage,
  type OrderUpdate,
} from "../src/order";

const firstOrder: OrderListItem = {
  symbol: "AAPL",
  assetClass: "equity",
  venue: "NASDAQ",
  orderId: "order-1",
  accountId: "account-1",
  side: "buy",
  type: "limit",
  tif: "day",
  status: "open",
  version: 4,
  quoteCurrency: "USD",
  quantity: "2",
  filledQuantity: "0",
  remainingQuantity: "2",
  limitPrice: "195.75",
  submittedAt: "2026-07-22T07:00:00Z",
  updatedAt: "2026-07-22T07:00:01Z",
  capabilities: {
    cancel: true,
    replace: true,
  },
};

const secondOrder: OrderListItem = {
  ...firstOrder,
  symbol: "MSFT",
  orderId: "order-2",
  version: 2,
  limitPrice: "430",
  submittedAt: "2026-07-22T07:00:01Z",
  updatedAt: "2026-07-22T07:00:02Z",
};

const page: OrdersPage = {
  items: [secondOrder, firstOrder],
  totalCount: 2,
  asOf: "2026-07-22T07:00:02Z",
};

const openQuery = ordersQuerySchema.parse({
  scope: "open",
});

describe("applyOrderUpdateToPage", () => {
  it("replaces and re-sorts an existing row", () => {
    const update = createUpdate({
      status: "partially_filled",
      version: 5,
      filledQuantity: "0.5",
      remainingQuantity: "1.5",
      updatedAt: "2026-07-22T07:00:03Z",
    });

    const result = applyOrderUpdateToPage(page, openQuery, update);

    expect(result.applied).toBe(true);

    if (result.applied) {
      expect(result.effect).toBe("updated");
      expect(result.requiresRefetch).toBe(true);
      expect(result.page.items.map((order) => order.orderId)).toEqual([
        "order-1",
        "order-2",
      ]);
      expect(result.page.items[0]?.filledQuantity).toBe("0.5");
      expect(result.page.asOf).toBe("2026-07-22T07:00:04Z");
    }
  });

  it("removes a terminal order from an open query", () => {
    const result = applyOrderUpdateToPage(
      page,
      openQuery,
      createUpdate({
        status: "filled",
        version: 5,
        filledQuantity: "2",
        remainingQuantity: "0",
        completedAt: "2026-07-22T07:00:03Z",
        updatedAt: "2026-07-22T07:00:03Z",
        capabilities: {
          cancel: false,
          replace: false,
        },
      }),
    );

    expect(result.applied).toBe(true);

    if (result.applied) {
      expect(result.effect).toBe("removed");
      expect(result.requiresRefetch).toBe(true);
      expect(result.page.items.map((order) => order.orderId)).toEqual([
        "order-2",
      ]);
      expect(result.page.totalCount).toBe(1);
    }
  });

  it("removes an order that no longer matches status filters", () => {
    const filteredQuery = ordersQuerySchema.parse({
      scope: "open",
      filters: {
        statuses: ["open"],
      },
    });

    const result = applyOrderUpdateToPage(
      page,
      filteredQuery,
      createUpdate({
        status: "partially_filled",
        version: 5,
        filledQuantity: "0.5",
        remainingQuantity: "1.5",
      }),
    );

    expect(result.applied).toBe(true);

    if (result.applied) {
      expect(result.effect).toBe("removed");
      expect(result.requiresRefetch).toBe(true);
    }
  });

  it("does not insert an update outside the current cursor page", () => {
    const result = applyOrderUpdateToPage(
      page,
      openQuery,
      createUpdate({
        orderId: "order-3",
      }),
    );

    expect(result).toEqual({
      applied: false,
      reason: "order_not_found",
    });
  });

  it("propagates stale update failures", () => {
    const result = applyOrderUpdateToPage(
      page,
      openQuery,
      createUpdate({
        version: 4,
      }),
    );

    expect(result).toEqual({
      applied: false,
      reason: "stale_version",
    });
  });

  it("keeps the page current when the active sort value is unchanged", () => {
    const result = applyOrderUpdateToPage(
      page,
      openQuery,
      createUpdate({
        status: "partially_filled",
        filledQuantity: "0.5",
        remainingQuantity: "1.5",
        updatedAt: firstOrder.updatedAt,
      }),
    );

    expect(result.applied).toBe(true);

    if (result.applied) {
      expect(result.requiresRefetch).toBe(false);
    }
  });
});

describe("matchesOrdersQuery", () => {
  it("matches mixed server-facing filters", () => {
    const query = ordersQuerySchema.parse({
      scope: "open",
      filters: {
        accountIds: ["account-1"],
        symbols: ["AAPL"],
        assetClasses: ["equity"],
        venues: ["NASDAQ"],
        quoteCurrencies: ["USD"],
        sides: ["buy"],
        types: ["limit"],
        tifs: ["day"],
        statuses: ["open"],
        submittedFrom: "2026-07-22T06:59:00Z",
        submittedTo: "2026-07-22T07:01:00Z",
      },
    });

    expect(matchesOrdersQuery(firstOrder, query)).toBe(true);
  });

  it("does not classify unknown status as open or history", () => {
    expect(
      matchesOrdersQuery(
        {
          ...firstOrder,
          status: "unknown",
        },
        openQuery,
      ),
    ).toBe(false);

    expect(
      matchesOrdersQuery(
        {
          ...firstOrder,
          status: "unknown",
        },
        ordersQuerySchema.parse({
          scope: "history",
        }),
      ),
    ).toBe(false);
  });
});

function createUpdate(overrides: Partial<OrderListItem> = {}): OrderUpdate {
  return {
    order: {
      ...firstOrder,
      version: 5,
      updatedAt: "2026-07-22T07:00:03Z",
      ...overrides,
    },
    receivedAt: "2026-07-22T07:00:04Z",
  };
}
