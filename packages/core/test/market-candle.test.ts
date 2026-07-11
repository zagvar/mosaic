import { describe, expect, it } from "vitest";
import { marketCandleSchema, marketCandlesSnapshotSchema } from "../src/order";

const candle = {
  timestamp: "2026-01-01T14:30:00.000Z",
  open: 100,
  high: 105,
  low: 99,
  close: 103,
  volume: 1_000,
};

describe("marketCandleSchema", () => {
  it("parses an OHLCV candle with an ISO timestamp", () => {
    expect(marketCandleSchema.parse(candle)).toEqual(candle);
  });

  it("rejects an invalid timestamp", () => {
    expect(
      marketCandleSchema.safeParse({
        ...candle,
        timestamp: "not-a-date",
      }).success,
    ).toBe(false);
  });

  it("rejects a high below the candle body", () => {
    expect(
      marketCandleSchema.safeParse({
        ...candle,
        high: 102,
      }).success,
    ).toBe(false);
  });

  it("rejects a low above the candle body", () => {
    expect(
      marketCandleSchema.safeParse({
        ...candle,
        low: 101,
      }).success,
    ).toBe(false);
  });
});

describe("marketCandlesSnapshotSchema", () => {
  it("parses a provider-neutral candle snapshot", () => {
    const snapshot = {
      symbol: "BTC/USDT",
      assetClass: "crypto" as const,
      baseAsset: "BTC",
      quoteAsset: "USDT",
      interval: "1m" as const,
      candles: [candle],
      timestamp: "2026-01-01T14:31:00.000Z",
    };

    expect(marketCandlesSnapshotSchema.parse(snapshot)).toEqual(snapshot);
  });
});
