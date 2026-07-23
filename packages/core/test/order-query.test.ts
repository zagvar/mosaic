import { describe, expect, it } from "vitest";
import { ordersPageSchema, ordersQuerySchema } from "../src/order";

const order = {
  symbol: "AAPL",
  assetClass: "equity",
  venue: "NASDAQ",
  orderId: "order-1",
  accountId: "account-1",
  side: "buy",
  type: "limit",
  tif: "day",
  status: "open",
  quoteCurrency: "USD",
  quantity: "1",
  filledQuantity: "0",
  remainingQuantity: "1",
  limitPrice: "195.75",
  submittedAt: "2026-07-22T06:00:00Z",
  updatedAt: "2026-07-22T06:00:01Z",
  capabilities: {
    cancel: true,
    replace: true,
  },
} as const;

describe("ordersQuerySchema", () => {
  it("applies stable query defaults", () => {
    const result = ordersQuerySchema.safeParse({
      scope: "open",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        scope: "open",
        filters: {},
        sort: {
          field: "updatedAt",
          direction: "desc",
        },
        pagination: {
          limit: 50,
        },
      });
    }
  });

  it("parses mixed-instrument filters and cursor pagination", () => {
    const result = ordersQuerySchema.safeParse({
      scope: "history",
      filters: {
        accountIds: ["account-1", "account-2"],
        symbols: ["AAPL", "BTC/USD"],
        assetClasses: ["equity", "crypto"],
        venues: ["NASDAQ", "COINBASE"],
        quoteCurrencies: ["USD", "USDC"],
        sides: ["buy", "sell"],
        types: ["limit", "stop_limit"],
        tifs: ["day", "gtc"],
        statuses: ["filled", "canceled"],
        submittedFrom: "2026-07-01T00:00:00Z",
        submittedTo: "2026-08-01T00:00:00Z",
      },
      sort: {
        field: "completedAt",
        direction: "desc",
      },
      pagination: {
        cursor: "opaque-cursor",
        limit: 100,
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty and duplicate filter arrays", () => {
    expect(
      ordersQuerySchema.safeParse({
        scope: "open",
        filters: {
          symbols: [],
        },
      }).success,
    ).toBe(false);

    expect(
      ordersQuerySchema.safeParse({
        scope: "open",
        filters: {
          symbols: ["AAPL", "AAPL"],
        },
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid submission-time range", () => {
    expect(
      ordersQuerySchema.safeParse({
        scope: "history",
        filters: {
          submittedFrom: "2026-08-01T00:00:00Z",
          submittedTo: "2026-07-01T00:00:00Z",
        },
      }).success,
    ).toBe(false);

    expect(
      ordersQuerySchema.safeParse({
        scope: "history",
        filters: {
          submittedFrom: "2026-07-01T00:00:00Z",
          submittedTo: "2026-07-01T00:00:00Z",
        },
      }).success,
    ).toBe(false);
  });

  it("rejects invalid page sizes and cursors", () => {
    expect(
      ordersQuerySchema.safeParse({
        scope: "open",
        pagination: {
          limit: 0,
        },
      }).success,
    ).toBe(false);

    expect(
      ordersQuerySchema.safeParse({
        scope: "open",
        pagination: {
          limit: 201,
        },
      }).success,
    ).toBe(false);

    expect(
      ordersQuerySchema.safeParse({
        scope: "open",
        pagination: {
          cursor: "",
          limit: 50,
        },
      }).success,
    ).toBe(false);
  });
});

describe("ordersPageSchema", () => {
  it("parses a mixed-account order page", () => {
    const result = ordersPageSchema.safeParse({
      items: [
        order,
        {
          ...order,
          accountId: "account-2",
        },
      ],
      nextCursor: "next-page",
      totalCount: 2,
      asOf: "2026-07-22T06:01:00Z",
    });

    expect(result.success).toBe(true);
  });

  it("rejects duplicate order identifiers in one account", () => {
    expect(
      ordersPageSchema.safeParse({
        items: [order, order],
        asOf: "2026-07-22T06:01:00Z",
      }).success,
    ).toBe(false);
  });

  it("allows the same provider order identifier across accounts", () => {
    const result = ordersPageSchema.safeParse({
      items: [
        order,
        {
          ...order,
          accountId: "account-2",
        },
      ],
      asOf: "2026-07-22T06:01:00Z",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid page metadata", () => {
    expect(
      ordersPageSchema.safeParse({
        items: [order],
        nextCursor: "",
        asOf: "2026-07-22T06:01:00Z",
      }).success,
    ).toBe(false);

    expect(
      ordersPageSchema.safeParse({
        items: [order],
        totalCount: -1,
        asOf: "2026-07-22T06:01:00Z",
      }).success,
    ).toBe(false);

    expect(
      ordersPageSchema.safeParse({
        items: [order],
        asOf: "not-a-timestamp",
      }).success,
    ).toBe(false);
  });
});
