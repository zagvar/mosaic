import { describe, expect, it } from "vitest";
import {
  marketTradeSchema,
  marketTradesSnapshotSchema,
  marketTradeUpdateSchema,
} from "../src/market-trade";

const timestamp = new Date(1_772_000_000_000).toISOString();
const nextTimestamp = new Date(1_772_000_000_100).toISOString();

describe("market trade schemas", () => {
  it("parses a valid trade print", () => {
    const parsed = marketTradeSchema.parse({
      symbol: "BTC/USD",
      assetClass: "crypto",
      tradeId: "t-1",
      price: "67250.12",
      quantity: "0.015",
      side: "buy",
      timestamp,
      sequence: 10,
    });

    expect(parsed.side).toBe("buy");
  });

  it("default unknown side when a provider omits aggressor side", () => {
    const parsed = marketTradeSchema.parse({
      symbol: "BTC/USD",
      assetClass: "crypto",
      price: "67250.12",
      quantity: "0.015",
      timestamp,
    });

    expect(parsed.side).toBe("unknown");
  });

  it("rejects invalid prices and quantities", () => {
    expect(() =>
      marketTradeSchema.parse({
        symbol: "BTC/USD",
        assetClass: "crypto",
        price: "0",
        quantity: "0.015",
        timestamp: "not-a-date",
      }),
    ).toThrow();

    expect(() =>
      marketTradeSchema.parse({
        symbol: "BTC/USD",
        assetClass: "crypto",
        price: "67250.12",
        quantity: "0",
        timestamp,
      }),
    ).toThrow();
  });

  it("parses snapshots and updates", () => {
    const trade = {
      symbol: "BTC/USD",
      assetClass: "crypto" as const,
      price: "67250.12",
      quantity: "0.015",
      side: "sell" as const,
      timestamp,
    };

    expect(
      marketTradesSnapshotSchema.parse({
        symbol: "BTC/USD",
        assetClass: "crypto",
        trades: [trade],
        timestamp,
        sequence: 1,
      }).trades,
    ).toHaveLength(1);

    expect(
      marketTradeUpdateSchema.parse({
        symbol: "BTC/USD",
        assetClass: "crypto",
        trades: [trade],
        timestamp: nextTimestamp,
        previousSequence: 1,
        sequence: 2,
      }).trades,
    ).toHaveLength(1);
  });
});
