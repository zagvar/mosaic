import { describe, expect, it } from "vitest";
import type { PreparedOrder } from "../src/order";
import { createOrderSummary } from "../src/order";

describe("createOrderSummary", () => {
  it("estimates limit-order notional from quantity and limit price", () => {
    const order: PreparedOrder = {
      symbol: "AAPL",
      assetClass: "equity",
      side: "buy",
      type: "limit",
      tif: "day",
      qty: 1.25,
      limitPx: 100.1,
    };

    expect(createOrderSummary(order)).toEqual({
      order,
      estimatedNotional: 125.125,
      estimateBasis: "limit_px",
      warnings: [{ code: "estimated_notional" }],
    });
  });

  it("estimates market-order notional from a host reference price", () => {
    const order: PreparedOrder = {
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
    const order: PreparedOrder = {
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
    const order: PreparedOrder = {
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

  it("includes an extended-hours warning", () => {
    const order: PreparedOrder = {
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
