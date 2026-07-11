import { describe, expect, it } from "vitest";
import { createOrderIntent } from "../src/order";
import { equityContext } from "./order-test-fixtures";

describe("createOrderIntent", () => {
  it("returns a canonical valid limit order", () => {
    const result = createOrderIntent(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        tif: "day",
        quantity: 2,
        limitPrice: 100,
      },
      equityContext(),
    );

    expect(result).toEqual({
      valid: true,
      order: {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        tif: "day",
        quantity: 2,
        limitPrice: 100,
      },
      issues: [],
    });
  });

  it("removes a stale limit price from a market order", () => {
    const result = createOrderIntent(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "market",
        tif: "day",
        notional: 100,
        limitPrice: 95,
      },
      equityContext(),
    );

    expect(result).toEqual({
      valid: true,
      order: {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "market",
        tif: "day",
        notional: 100,
      },
      issues: [],
    });
  });

  it("does not silently normalize an invalid increment", () => {
    const result = createOrderIntent(
      {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "limit",
        tif: "day",
        quantity: 1.000006,
        limitPrice: 100,
      },
      equityContext({
        assetRules: {
          ...equityContext().assetRules,
          lotSize: 0.000005,
        },
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "quantity_lot_size_mismatch",
        }),
      ]),
    );
  });
});
