import { describe, expect, it } from "vitest";
import {
  marketTradeSchema,
  marketTradesSnapshotSchema,
  marketTradeUpdateSchema,
} from "../src/market-trade";

describe("market trade schemas", () => {
  it("parses a valid trade print", () => {
    const parsed = marketTradeSchema.parse({
      symbol: "BTC/USD",
      assetClass: "crypto",
      tradeId: "t-1",
      px: 67250.12,
      qty: 0.015,
      side: "buy",
      executedAt: 1_772_000_000_000,
      sequence: 10,
    });

    expect(parsed.side).toBe("buy");
  });

  it("default unknown side when a provider omits aggressor side", () => {
    const parsed = marketTradeSchema.parse({
      symbol: "BTC/USD",
      assetClass: "crypto",
      px: 67250.12,
      qty: 0.015,
      executedAt: 1_772_000_000_000,
    });

    expect(parsed.side).toBe("unknown");
  });

  it("rejects invalid prices and quantities", () => {
    expect(() =>
      marketTradeSchema.parse({
        symbol: "BTC/USD",
        assetClass: "crypto",
        px: 0,
        qty: 0.015,
        executedAt: 1_772_000_000_000,
      }),
    ).toThrow();

    expect(() =>
      marketTradeSchema.parse({
        symbol: "BTC/USD",
        assetClass: "crypto",
        px: 67250.12,
        qty: 0,
        executedAt: 1_772_000_000_000,
      }),
    ).toThrow();
  });

  it("parses snapshots and updates", () => {
    const trade = {
      symbol: "BTC/USD",
      assetClass: "crypto" as const,
      px: 67250.12,
      qty: 0.015,
      side: "sell" as const,
      executedAt: 1_772_000_000_000,
    };

    expect(
      marketTradesSnapshotSchema.parse({
        symbol: "BTC/USD",
        assetClass: "crypto",
        trades: [trade],
        observedAt: 1_772_000_000_000,
        sequence: 1,
      }).trades,
    ).toHaveLength(1);

    expect(
      marketTradeUpdateSchema.parse({
        symbol: "BTC/USD",
        assetClass: "crypto",
        trades: [trade],
        observedAt: 1_772_000_000_100,
        previousSequence: 1,
        sequence: 2,
      }).trades,
    ).toHaveLength(1);
  });
});
