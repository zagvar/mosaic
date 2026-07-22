import { describe, expect, it } from "vitest";
import { orderDetailsRecordSchema } from "../src/order";

const orderDetails = {
  order: {
    symbol: "BTC/USD",
    assetClass: "crypto",
    venue: "COINBASE",
    baseAsset: "BTC",
    quoteAsset: "USD",
    orderId: "order-1",
    clientOrderId: "client-order-1",
    side: "buy",
    type: "limit",
    tif: "gtc",
    status: "partially_filled",
    quoteCurrency: "USD",
    quantity: "2",
    filledQuantity: "1.5",
    remainingQuantity: "0.5",
    filledNotional: "93750",
    limitPrice: "62500",
    averageFillPrice: "62500",
    submittedAt: "2026-07-22T05:00:00Z",
    updatedAt: "2026-07-22T05:02:00Z",
    capabilities: {
      cancel: true,
      replace: true,
    },
  },
  fills: [
    {
      fillId: "fill-1",
      orderId: "order-1",
      price: "62500",
      quantity: "1",
      notional: "62500",
      liquidity: "maker",
      timestamp: "2026-07-22T05:01:00Z",
      sequence: 1,
    },
    {
      fillId: "fill-2",
      orderId: "order-1",
      price: "62500",
      quantity: "0.5",
      notional: "31250",
      liquidity: "maker",
      timestamp: "2026-07-22T05:02:00Z",
      sequence: 2,
    },
  ],
  fees: [
    {
      feeId: "fee-1",
      orderId: "order-1",
      fillId: "fill-1",
      type: "commission",
      amount: "1.25",
      currency: "USD",
      timestamp: "2026-07-22T05:01:00Z",
    },
  ],
  events: [
    {
      eventId: "event-1",
      orderId: "order-1",
      status: "pending",
      timestamp: "2026-07-22T05:00:00Z",
      sequence: 1,
    },
    {
      eventId: "event-2",
      orderId: "order-1",
      status: "open",
      timestamp: "2026-07-22T05:00:01Z",
      sequence: 2,
    },
    {
      eventId: "event-3",
      orderId: "order-1",
      status: "partially_filled",
      timestamp: "2026-07-22T05:01:00Z",
      sequence: 3,
    },
  ],
  statusReason: {
    code: "unknown",
    message: "The remaining quantity is still working.",
  },
} as const;

describe("orderDetailsRecordSchema", () => {
  it("parses a complete order-details record", () => {
    expect(orderDetailsRecordSchema.safeParse(orderDetails).success).toBe(true);
  });

  it("retains the nested order-list validation", () => {
    expect(
      orderDetailsRecordSchema.safeParse({
        ...orderDetails,
        order: {
          ...orderDetails.order,
          quantity: "2.0",
        },
      }).success,
    ).toBe(false);
  });

  it("requires fills, fees, and events to belong to the order", () => {
    expect(
      orderDetailsRecordSchema.safeParse({
        ...orderDetails,
        fills: [
          {
            ...orderDetails.fills[0],
            orderId: "another-order",
          },
        ],
        fees: [],
        events: [],
      }).success,
    ).toBe(false);

    expect(
      orderDetailsRecordSchema.safeParse({
        ...orderDetails,
        fills: [],
        fees: [
          {
            ...orderDetails.fees[0],
            fillId: undefined,
            orderId: "another-order",
          },
        ],
        events: [],
      }).success,
    ).toBe(false);

    expect(
      orderDetailsRecordSchema.safeParse({
        ...orderDetails,
        fills: [],
        fees: [],
        events: [
          {
            ...orderDetails.events[0],
            orderId: "another-order",
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate fill, fee, and event identifiers", () => {
    expect(
      orderDetailsRecordSchema.safeParse({
        ...orderDetails,
        fills: [orderDetails.fills[0], orderDetails.fills[0]],
        fees: [],
        events: [],
      }).success,
    ).toBe(false);

    expect(
      orderDetailsRecordSchema.safeParse({
        ...orderDetails,
        fills: [],
        fees: [
          {
            ...orderDetails.fees[0],
            fillId: undefined,
          },
          {
            ...orderDetails.fees[0],
            fillId: undefined,
          },
        ],
        events: [],
      }).success,
    ).toBe(false);

    expect(
      orderDetailsRecordSchema.safeParse({
        ...orderDetails,
        fills: [],
        fees: [],
        events: [orderDetails.events[0], orderDetails.events[0]],
      }).success,
    ).toBe(false);
  });

  it("rejects a fee referencing a missing fill", () => {
    expect(
      orderDetailsRecordSchema.safeParse({
        ...orderDetails,
        fills: [orderDetails.fills[1]],
        fees: orderDetails.fees,
      }).success,
    ).toBe(false);
  });

  it("allows order-level fees without a fill reference", () => {
    const result = orderDetailsRecordSchema.safeParse({
      ...orderDetails,
      fills: [],
      fees: [
        {
          ...orderDetails.fees[0],
          fillId: undefined,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("supports empty activity for a newly pending order", () => {
    const result = orderDetailsRecordSchema.safeParse({
      order: {
        ...orderDetails.order,
        status: "pending",
        filledQuantity: "0",
        remainingQuantity: "2",
        filledNotional: undefined,
        averageFillPrice: undefined,
      },
      fills: [],
      fees: [],
      events: [],
    });

    expect(result.success).toBe(true);
  });
});
