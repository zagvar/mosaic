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

const marketOrder: OrderIntent = {
  symbol: "AAPL",
  assetClass: "equity",
  side: "buy",
  type: "market",
  tif: "day",
  qty: 2,
};

const marketReference = {
  symbol: "AAPL",
  assetClass: "equity" as const,
  px: 100,
  kind: "ask" as const,
  observedAt: 1000,
  mode: "real_time" as const,
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

    const marketReference = {
      symbol: "BTC/USD",
      assetClass: "crypto" as const,
      px: 65000,
      kind: "bid" as const,
      observedAt: 1000,
      mode: "real_time" as const,
      displaySource: "Coinbase",
    };

    expect(createOrderSummary(order, { marketReference, now: 1000 })).toEqual({
      order,
      estimatedNotional: 650,
      estimateBasis: "reference_px",
      marketReference,
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

    expect(createOrderSummary(order)).toEqual({
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

    expect(
      createOrderSummary(order, {
        marketReference: {
          symbol: "AAPL",
          assetClass: "equity",
          px: 195,
          kind: "ask",
          observedAt: 1000,
        },
        now: 1000,
      }),
    ).toEqual({
      order,
      marketReference: {
        symbol: "AAPL",
        assetClass: "equity",
        px: 195,
        kind: "ask",
        observedAt: 1000,
      },
      warnings: [{ code: "market_price_not_guaranteed" }],
    });
  });

  it("does not emit freshness warnings when a reference does not affect the estimate", () => {
    const summary = createOrderSummary(limitOrder, {
      marketReference: {
        symbol: "AAPL",
        assetClass: "equity",
        px: 95,
        kind: "last",
        observedAt: 1000,
        mode: "delayed",
      },
      staleAfterMs: 5000,
      now: 8001,
    });

    expect(summary.warnings).toEqual([{ code: "estimated_notional" }]);
  });

  it("warns when market data is stale, delayed, or indicative", () => {
    const order: OrderIntent = {
      symbol: "AAPL",
      assetClass: "equity",
      side: "sell",
      type: "market",
      tif: "day",
      qty: 1,
    };

    const delayed = createOrderSummary(order, {
      marketReference: {
        symbol: "AAPL",
        assetClass: "equity",
        px: 100,
        kind: "bid",
        observedAt: 1000,
        receivedAt: 2000,
        mode: "delayed",
      },
      staleAfterMs: 5000,
      now: 8001,
    });

    expect(delayed.warnings).toEqual([
      { code: "market_price_not_guaranteed" },
      { code: "market_data_delayed" },
      { code: "market_data_stale" },
      { code: "estimated_notional" },
    ]);

    const indicative = createOrderSummary(order, {
      marketReference: {
        symbol: "AAPL",
        assetClass: "equity",
        px: 100,
        kind: "mark",
        observedAt: 8000,
        mode: "indicative",
      },
      staleAfterMs: 5000,
      now: 8001,
    });

    expect(indicative.warnings).toContainEqual({
      code: "market_data_indicative",
    });
    expect(indicative.warnings).not.toContainEqual({
      code: "market_data_stale",
    });
  });

  it("validates market references and freshness options", () => {
    expect(() =>
      createOrderSummary(limitOrder, {
        marketReference: {
          symbol: "MSFT",
          assetClass: "equity",
          px: 100,
          kind: "last",
          observedAt: 1000,
        },
      }),
    ).toThrow("Market reference does not match");

    expect(() =>
      createOrderSummary(limitOrder, {
        marketReference: {
          symbol: "AAPL",
          assetClass: "equity",
          px: 0,
          kind: "last",
          observedAt: 1000,
        },
      }),
    ).toThrow();

    expect(() =>
      createOrderSummary(limitOrder, {
        marketReference: {
          symbol: "AAPL",
          assetClass: "equity",
          px: 100,
          kind: "last",
          observedAt: 1000,
          displaySource: " ",
        },
      }),
    ).toThrow();

    expect(() =>
      createOrderSummary(limitOrder, {
        staleAfterMs: 0,
      }),
    ).toThrow();
  });

  it("uses backend preview estimates over market estimates", () => {
    const result = createOrderSummary(marketOrder, {
      marketReference,
      quotePreview: {
        previewId: "preview-123",
        estimatedFillPx: 101,
        estimatedNotional: 202,
        slippageBps: 20,
        observedAt: 2000,
        expiresAt: 5000,
      },
      now: 3000,
    });

    expect(result.estimatedNotional).toBe(202);
    expect(result.estimateBasis).toBe("quote_preview");
    expect(result.quotePreview?.estimatedFillPx).toBe(101);
  });

  it("uses preview fees instead of separately supplied fees", () => {
    const result = createOrderSummary(limitOrder, {
      fees: [
        {
          type: "regulatory",
          amount: 0.01,
          currency: "USD",
        },
      ],
      quotePreview: {
        previewId: "preview-123",
        fees: [
          {
            type: "commission",
            amount: 0.25,
            currency: "USD",
          },
        ],
        observedAt: 1000,
      },
      now: 1000,
    });

    expect(result.fees).toEqual([
      {
        type: "commission",
        amount: 0.25,
        currency: "USD",
      },
    ]);
  });

  it("warns only when preview slippage is above the host threshold", () => {
    const aboveThreshold = createOrderSummary(marketOrder, {
      quotePreview: {
        previewId: "preview-high",
        slippageBps: 51,
        observedAt: 1000,
      },
      highSlippageBps: 50,
      now: 1000,
    });

    expect(aboveThreshold.warnings).toContainEqual({
      code: "slippage_high",
    });

    const atThreshold = createOrderSummary(marketOrder, {
      quotePreview: {
        previewId: "preview-accepted",
        slippageBps: 50,
        observedAt: 1000,
      },
      highSlippageBps: 50,
      now: 1000,
    });

    expect(atThreshold.warnings).not.toContainEqual({
      code: "slippage_high",
    });
  });

  it("marks a preview expired at its expiration timestamp", () => {
    const result = createOrderSummary(marketOrder, {
      quotePreview: {
        previewId: "preview-123",
        observedAt: 1000,
        expiresAt: 5000,
      },
      now: 5000,
    });

    expect(result.warnings).toContainEqual({
      code: "preview_expired",
    });
  });

  it("suppresses market freshness warnings when preview economics take precedence", () => {
    const result = createOrderSummary(marketOrder, {
      marketReference: {
        ...marketReference,
        observedAt: 1000,
        mode: "delayed",
      },
      staleAfterMs: 5000,
      quotePreview: {
        previewId: "preview-123",
        estimatedNotional: 202,
        observedAt: 7000,
        expiresAt: 9000,
      },
      now: 8000,
    });

    expect(result.warnings).not.toContainEqual({
      code: "market_data_delayed",
    });
    expect(result.warnings).not.toContainEqual({
      code: "market_data_stale",
    });
  });

  it("validates the high-slippage threshold", () => {
    expect(() =>
      createOrderSummary(marketOrder, {
        highSlippageBps: -1,
      }),
    ).toThrow();

    expect(() =>
      createOrderSummary(marketOrder, {
        highSlippageBps: Number.POSITIVE_INFINITY,
      }),
    ).toThrow();
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
