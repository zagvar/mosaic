import { describe, expect, it } from "vitest";
import type {
  OrderDraft,
  OrderValidationCode,
  OrderValidationContext,
} from "../src/order";
import { validateOrderDraft } from "../src/order";
import {
  cryptoContext,
  equityContext,
  equityRules,
} from "./order-test-fixtures";

function expectIssue(
  draft: OrderDraft,
  code: OrderValidationCode,
  context: OrderValidationContext = equityContext(),
) {
  const result = validateOrderDraft(draft, context);

  expect(result.valid).toBe(false);
  expect(result.issues).toEqual(
    expect.arrayContaining([expect.objectContaining({ code })]),
  );
}

describe("validateOrderDraft", () => {
  it("accepts a valid equity limit buy using quantity and limitPrice", () => {
    const result = validateOrderDraft(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        quantity: 2,
        limitPrice: 100,
        tif: "day",
      },
      equityContext(),
    );

    expect(result).toEqual({
      valid: true,
      issues: [],
    });
  });

  it("accepts a valid market buy using notional", () => {
    const result = validateOrderDraft(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "market",
        notional: 250,
        tif: "day",
      },
      equityContext(),
    );

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("accepts fractional quantity aligned to the asset increment", () => {
    const result = validateOrderDraft(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        quantity: 1.00001,
        limitPrice: 100,
        tif: "day",
      },
      equityContext(),
    );

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("accepts notional values aligned to the notional increment", () => {
    const result = validateOrderDraft(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "market",
        notional: 1.12,
        tif: "day",
      },
      equityContext(),
    );

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("requires either quantity or notional", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "market",
        tif: "day",
      },
      "quantity_or_notional_required",
    );
  });

  it("rejects quantity and notional together", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "market",
        quantity: 1,
        notional: 100,
        tif: "day",
      },
      "quantity_and_notional_conflict",
    );
  });

  it("requires limitPrice for limit orders", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        quantity: 1,
        tif: "day",
      },
      "limit_price_required",
    );
  });

  it("rejects unsupported TIFs based on asset rules", () => {
    expectIssue(
      {
        symbol: "BTC/USD",
        assetClass: "crypto",
        side: "buy",
        type: "market",
        notional: 25,
        tif: "day",
      },
      "unsupported_tif",
      cryptoContext(),
    );
  });

  it("rejects unsupported notional order types", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        notional: 100,
        limitPrice: 50,
        tif: "day",
      },
      "notional_not_supported_for_order_type",
    );
  });

  it("rejects extended-hours market orders", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "market",
        notional: 100,
        tif: "day",
        extendedHours: true,
      },
      "extended_hours_unsupported_order_type",
    );
  });

  it("rejects quantity below minQuantity", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        quantity: 0.0000001,
        limitPrice: 100,
        tif: "day",
      },
      "quantity_below_min",
    );
  });

  it("rejects quantity precision above asset precision", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        quantity: 0.1234567,
        limitPrice: 100,
        tif: "day",
      },
      "quantity_precision_exceeded",
    );
  });

  it("rejects quantity values not aligned to the lot size", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        quantity: 1.000006,
        limitPrice: 100,
        tif: "day",
      },
      "quantity_lot_size_mismatch",
      equityContext({
        assetRules: {
          ...equityRules,
          lotSize: 0.000005,
        },
      }),
    );
  });

  it("rejects limit price precision above asset precision", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        quantity: 1,
        limitPrice: 100.123,
        tif: "day",
      },
      "limit_price_precision_exceeded",
    );
  });

  it("rejects limit prices below the minimum price", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        quantity: 1,
        limitPrice: 0.001,
        tif: "day",
      },
      "limit_price_below_min",
      equityContext({
        assetRules: {
          ...equityRules,
          minPrice: 0.01,
        },
      }),
    );
  });

  it("rejects limit prices above the maximum price", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        quantity: 1,
        limitPrice: 1001,
        tif: "day",
      },
      "limit_price_above_max",
      equityContext({
        assetRules: {
          ...equityRules,
          maxPrice: 1000,
        },
      }),
    );
  });

  it("rejects limit prices not aligned to the tick size", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        quantity: 1,
        limitPrice: 100.06,
        tif: "day",
      },
      "limit_price_tick_size_mismatch",
      equityContext({
        assetRules: {
          ...equityRules,
          tickSize: 0.05,
        },
      }),
    );
  });

  it("rejects notional values not aligned to the quote increment", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "market",
        notional: 1.15,
        tif: "day",
      },
      "notional_quote_increment_mismatch",
      equityContext({
        assetRules: {
          ...equityRules,
          quoteIncrement: 0.1,
        },
      }),
    );
  });

  it("rejects market buys above available cash", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "market",
        notional: 1001,
        tif: "day",
      },
      "insufficient_cash",
    );
  });

  it("rejects limit buys above available cash using decimal-safe cost", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        quantity: 0.1,
        limitPrice: 10000.01,
        tif: "day",
      },
      "insufficient_cash",
    );
  });

  it("rejects sells above available asset quantity", () => {
    expectIssue(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "sell",
        type: "market",
        quantity: 11,
        tif: "day",
      },
      "insufficient_asset_quantity",
    );
  });

  it("rejects asset rules that do not match the draft asset", () => {
    expectIssue(
      {
        symbol: "TSLA",
        assetClass: "equity",
        side: "buy",
        type: "market",
        notional: 100,
        tif: "day",
      },
      "asset_rules_mismatch",
    );
  });
});
