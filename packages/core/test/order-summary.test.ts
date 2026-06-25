import { describe, expect, it } from "vitest";
import type { OrderIntent } from "../src/order";
import { createOrderSummary } from "../src/order";

const limitOrder: OrderIntent = {
  symbol: "AAPL",
  assetClass: "equity",
  side: "buy",
  type: "limit",
  tif: "day",
  qty: 1.25,
  limitPx: 100.1,
};

describe("createOrderSummary", () => {
  it("estimates limit-order notional from quantity and limit price", () => {
    expect(createOrderSummary(limitOrder)).toEqual({
      order: limitOrder,
      estimatedNotional: 125.125,
      estimateBasis: "limit_px",
      warnings: [{ code: "estimated_notional" }],
    });
  });

  it("estimates market-order notional from a host reference price", () => {
    const order: OrderIntent = {
      symbol: "BTC/USD",
      assetClass: "crypto",
      side: "sell",
      type: "market",
      tif: "gtc",
      qty: 0.01,
    };

    expect(createOrderSummary(order, { referencePx: 65000 })).toEqual({
      order,
      estimatedNotional: 650,
      estimateBasis: "reference_px",
      warnings: [
        { code: "market_price_not_guaranteed" },
        { code: "estimated_notional" },
      ],
    });
  });

  it("does not estimate a market quantity without a usable reference price", () => {
    const order: OrderIntent = {
      symbol: "AAPL",
      assetClass: "equity",
      side: "sell",
      type: "market",
      tif: "day",
      qty: 2,
    };

    expect(createOrderSummary(order, { referencePx: 0 })).toEqual({
      order,
      warnings: [{ code: "market_price_not_guaranteed" }],
    });
  });

  it("keeps a notional market order exact while warning about execution price", () => {
    const order: OrderIntent = {
      symbol: "AAPL",
      assetClass: "equity",
      side: "buy",
      type: "market",
      tif: "day",
      notional: 100,
    };

    expect(createOrderSummary(order, { referencePx: 195 })).toEqual({
      order,
      warnings: [{ code: "market_price_not_guaranteed" }],
    });
  });

  it("includes host-provided fee estimates without calculating them", () => {
    const order: OrderIntent = {
      symbol: "BTC/USD",
      assetClass: "crypto",
      side: "buy",
      type: "market",
      tif: "gtc",
      notional: 100,
    };

    const result = createOrderSummary(order, {
      fees: [
        {
          type: "commission",
          amount: 0.25,
          currency: "USD",
        },
      ],
    });

    expect(result.fees).toEqual([
      {
        type: "commission",
        amount: 0.25,
        currency: "USD",
      },
    ]);
  });

  it("normalizes fee currency and preserves per-fee precision", () => {
    const result = createOrderSummary(limitOrder, {
      fees: [
        {
          type: "commission",
          amount: 0.000001,
          currency: " BTC ",
          fractionDigits: 8,
        },
      ],
    });

    expect(result.fees).toEqual([
      {
        type: "commission",
        amount: 0.000001,
        currency: "BTC",
        fractionDigits: 8,
      },
    ]);
  });

  it("copies host-provided fee estimates", () => {
    const fees = [
      {
        type: "commission" as const,
        amount: 0.25,
        currency: "USD",
      },
    ];

    const result = createOrderSummary(limitOrder, { fees });

    fees[0]!.amount = 99;

    expect(result.fees?.[0]?.amount).toBe(0.25);
  });

  it.each([
    {
      name: "negative amount",
      fee: {
        type: "commission" as const,
        amount: -0.01,
        currency: "USD",
      },
    },
    {
      name: "non-finite amount",
      fee: {
        type: "commission" as const,
        amount: Number.POSITIVE_INFINITY,
        currency: "USD",
      },
    },
    {
      name: "empty currency",
      fee: {
        type: "commission" as const,
        amount: 0.01,
        currency: "   ",
      },
    },
    {
      name: "fractional precision",
      fee: {
        type: "commission" as const,
        amount: 0.01,
        currency: "USD",
        fractionDigits: 2.5,
      },
    },
    {
      name: "negative precision",
      fee: {
        type: "commission" as const,
        amount: 0.01,
        currency: "USD",
        fractionDigits: -1,
      },
    },
    {
      name: "precision above 18",
      fee: {
        type: "commission" as const,
        amount: 0.01,
        currency: "USD",
        fractionDigits: 19,
      },
    },
  ])("rejects a fee with $name", ({ fee }) => {
    expect(() =>
      createOrderSummary(limitOrder, {
        fees: [fee],
      }),
    ).toThrow();
  });

  it("accepts zero-value fees and precision boundaries", () => {
    const result = createOrderSummary(limitOrder, {
      fees: [
        {
          type: "commission",
          amount: 0,
          currency: "USD",
          fractionDigits: 0,
        },
        {
          type: "other",
          amount: 0,
          currency: "ETH",
          fractionDigits: 18,
        },
      ],
    });

    expect(result.fees).toHaveLength(2);
  });

  it("includes an extended-hours warning", () => {
    const order: OrderIntent = {
      symbol: "AAPL",
      assetClass: "equity",
      side: "buy",
      type: "limit",
      tif: "day",
      qty: 1,
      limitPx: 100,
      extendedHours: true,
    };

    expect(createOrderSummary(order).warnings).toEqual([
      { code: "estimated_notional" },
      { code: "extended_hours" },
    ]);
  });
});
