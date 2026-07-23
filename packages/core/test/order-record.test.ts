import { describe, expect, it } from "vitest";
import {
  orderListItemSchema,
  orderRecordTifSchema,
  orderRecordTypeSchema,
} from "../src/order";

const openLimitOrder = {
  symbol: "MSFT",
  assetClass: "equity",
  venue: "NASDAQ",
  orderId: "order-1",
  clientOrderId: "client-order-1",
  accountId: "account-1",
  side: "buy",
  type: "limit",
  tif: "day",
  status: "partially_filled",
  quoteCurrency: "USD",
  quantity: "1.25",
  filledQuantity: "0.25",
  remainingQuantity: "1",
  limitPrice: "430.5",
  submittedAt: "2026-07-22T01:00:00Z",
  updatedAt: "2026-07-22T01:01:00Z",
  capabilities: {
    cancel: true,
    replace: true,
  },
} as const;

describe("order record vocabulary", () => {
  it("supports record types beyond the current TradeTicket types", () => {
    expect(orderRecordTypeSchema.safeParse("stop_limit").success).toBe(true);
    expect(orderRecordTypeSchema.safeParse("trailing_stop").success).toBe(true);
  });

  it("supports good-til-date records", () => {
    expect(orderRecordTifSchema.safeParse("gtd").success).toBe(true);
  });

  it("rejects provider-specific values that have not been adapted", () => {
    expect(orderRecordTypeSchema.safeParse("STOP_LOSS_LIMIT").success).toBe(
      false,
    );
    expect(orderRecordTifSchema.safeParse("GOOD_TILL_DATE").success).toBe(
      false,
    );
  });
});

describe("orderListItemSchema", () => {
  it("parses a mixed-precision partially filled equity order", () => {
    const result = orderListItemSchema.safeParse(openLimitOrder);

    expect(result.success).toBe(true);
  });

  it("parses a completed notional crypto market order", () => {
    const result = orderListItemSchema.safeParse({
      symbol: "BTC/USD",
      assetClass: "crypto",
      venue: "COINBASE",
      baseAsset: "BTC",
      quoteAsset: "USD",
      orderId: "order-2",
      side: "buy",
      type: "market",
      tif: "ioc",
      status: "filled",
      quoteCurrency: "USD",
      notional: "25",
      filledQuantity: "0.0004",
      filledNotional: "24.98",
      averageFillPrice: "62450",
      submittedAt: "2026-07-22T02:00:00Z",
      updatedAt: "2026-07-22T02:00:01Z",
      completedAt: "2026-07-22T02:00:01Z",
      capabilities: {
        cancel: false,
        replace: false,
      },
    });

    expect(result.success).toBe(true);
  });

  it("requires exactly one requested amount", () => {
    expect(
      orderListItemSchema.safeParse({
        ...openLimitOrder,
        quantity: undefined,
      }).success,
    ).toBe(false);

    expect(
      orderListItemSchema.safeParse({
        ...openLimitOrder,
        notional: "500",
      }).success,
    ).toBe(false);
  });

  it("rejects fills greater than the requested quantity", () => {
    expect(
      orderListItemSchema.safeParse({
        ...openLimitOrder,
        filledQuantity: "1.26",
        remainingQuantity: "0",
      }).success,
    ).toBe(false);
  });

  it("rejects inconsistent filled and remaining quantities", () => {
    expect(
      orderListItemSchema.safeParse({
        ...openLimitOrder,
        filledQuantity: "0.5",
        remainingQuantity: "1",
      }).success,
    ).toBe(false);
  });

  it("requires limit and stop prices for applicable order types", () => {
    expect(
      orderListItemSchema.safeParse({
        ...openLimitOrder,
        limitPrice: undefined,
      }).success,
    ).toBe(false);

    expect(
      orderListItemSchema.safeParse({
        ...openLimitOrder,
        type: "stop_limit",
        stopPrice: undefined,
      }).success,
    ).toBe(false);
  });

  it("rejects numbers and noncanonical decimal strings", () => {
    expect(
      orderListItemSchema.safeParse({
        ...openLimitOrder,
        quantity: 1.25,
      }).success,
    ).toBe(false);

    expect(
      orderListItemSchema.safeParse({
        ...openLimitOrder,
        quantity: "1.250",
      }).success,
    ).toBe(false);
  });

  it("requires explicit backend action capabilities", () => {
    const { capabilities: _, ...withoutCapabilities } = openLimitOrder;

    expect(orderListItemSchema.safeParse(withoutCapabilities).success).toBe(
      false,
    );
  });

  it("preserves extended-hours and replacement metadata", () => {
    expect(
      orderListItemSchema.safeParse({
        ...openLimitOrder,
        extendedHours: true,
        replacesOrderId: "order-0",
        replacedByOrderId: "order-2",
      }).success,
    ).toBe(true);
  });

  it("rejects self-referential replacement relationships", () => {
    expect(
      orderListItemSchema.safeParse({
        ...openLimitOrder,
        replacesOrderId: openLimitOrder.orderId,
      }).success,
    ).toBe(false);

    expect(
      orderListItemSchema.safeParse({
        ...openLimitOrder,
        replacedByOrderId: openLimitOrder.orderId,
      }).success,
    ).toBe(false);
  });

  it("requires an expiry for good-til-date orders", () => {
    expect(
      orderListItemSchema.safeParse({
        ...openLimitOrder,
        tif: "gtd",
      }).success,
    ).toBe(false);

    expect(
      orderListItemSchema.safeParse({
        ...openLimitOrder,
        tif: "gtd",
        expiresAt: "2026-07-23T01:00:00Z",
      }).success,
    ).toBe(true);
  });
});
