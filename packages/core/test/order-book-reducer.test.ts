import { describe, expect, it } from "vitest";
import type { OrderBookSnapshot, OrderBookUpdate } from "../src/order";
import { applyOrderBookUpdate } from "../src/order";

const snapshotTimestamp = "2026-01-01T14:30:00.000Z";
const updateTimestamp = "2026-01-01T14:30:01.000Z";

const snapshot: OrderBookSnapshot = {
  symbol: "BTC/USD",
  assetClass: "crypto",
  venue: "COINBASE",
  baseAsset: "BTC",
  quoteAsset: "USD",
  bids: [
    { price: 100, quantity: 2 },
    { price: 99, quantity: 3 },
  ],
  asks: [
    { price: 101, quantity: 1 },
    { price: 102, quantity: 4 },
  ],
  timestamp: snapshotTimestamp,
  sequence: 10,
  displaySource: "Demo exchange",
};

describe("applyOrderBookUpdate", () => {
  it("inserts, replaces, and removes price levels", () => {
    const result = applyOrderBookUpdate(
      snapshot,
      createUpdate({
        bids: [
          { price: 100.25, quantity: 1 },
          { price: 100, quantity: 5 },
          { price: 99, quantity: 0 },
        ],
        asks: [
          { price: 100.5, quantity: 2 },
          { price: 102, quantity: 0 },
        ],
      }),
    );

    expect(result).toEqual({
      applied: true,
      snapshot: {
        symbol: "BTC/USD",
        assetClass: "crypto",
        venue: "COINBASE",
        baseAsset: "BTC",
        quoteAsset: "USD",
        bids: [
          { price: 100.25, quantity: 1 },
          { price: 100, quantity: 5 },
        ],
        asks: [
          { price: 100.5, quantity: 2 },
          { price: 101, quantity: 1 },
        ],
        timestamp: updateTimestamp,
        sequence: 11,
        displaySource: "Demo exchange",
      },
    });
  });

  it("sorts bids descending and asks ascending", () => {
    const result = applyOrderBookUpdate(
      snapshot,
      createUpdate({
        bids: [
          { price: 98, quantity: 1 },
          { price: 100.25, quantity: 1 },
        ],
        asks: [
          { price: 103, quantity: 1 },
          { price: 100.5, quantity: 1 },
        ],
      }),
    );

    expectApplied(result);
    expect(result.snapshot.bids.map((level) => level.price)).toEqual([
      100.25, 100, 99, 98,
    ]);
    expect(result.snapshot.asks.map((level) => level.price)).toEqual([
      100.5, 101, 102, 103,
    ]);
  });

  it("replaces both sides for reset updates", () => {
    const result = applyOrderBookUpdate(
      snapshot,
      createUpdate({
        reset: true,
        bids: [{ price: 95, quantity: 10 }],
        asks: [{ price: 105, quantity: 12 }],
      }),
    );

    expectApplied(result);
    expect(result.snapshot.bids).toEqual([{ price: 95, quantity: 10 }]);
    expect(result.snapshot.asks).toEqual([{ price: 105, quantity: 12 }]);
  });

  it("caps visible depth after reconciliation", () => {
    const result = applyOrderBookUpdate(
      snapshot,
      createUpdate({
        bids: [{ price: 100.25, quantity: 1 }],
        asks: [{ price: 100.5, quantity: 1 }],
      }),
      { depth: 2 },
    );

    expectApplied(result);
    expect(result.snapshot.bids).toEqual([
      { price: 100.25, quantity: 1 },
      { price: 100, quantity: 2 },
    ]);
    expect(result.snapshot.asks).toEqual([
      { price: 100.5, quantity: 1 },
      { price: 101, quantity: 1 },
    ]);
  });

  it("rejects an instrument mismatch", () => {
    expect(
      applyOrderBookUpdate(
        snapshot,
        createUpdate({
          symbol: "ETH/USD",
        }),
      ),
    ).toEqual({
      applied: false,
      reason: "instrument_mismatch",
    });
  });

  it.each([
    ["venue", { venue: "KRAKEN" }],
    ["base asset", { baseAsset: "WBTC" }],
    ["quote asset", { quoteAsset: "USDT" }],
  ] as const)("rejects a %s mismatch", (_label, overrides) => {
    expect(applyOrderBookUpdate(snapshot, createUpdate(overrides))).toEqual({
      applied: false,
      reason: "instrument_mismatch",
    });
  });

  it("rejects a stale sequence", () => {
    expect(
      applyOrderBookUpdate(
        snapshot,
        createUpdate({
          sequence: 10,
        }),
      ),
    ).toEqual({
      applied: false,
      reason: "stale_sequence",
    });
  });

  it("rejects a sequence gap", () => {
    expect(
      applyOrderBookUpdate(
        snapshot,
        createUpdate({
          previousSequence: 9,
        }),
      ),
    ).toEqual({
      applied: false,
      reason: "sequence_gap",
    });
  });

  it("preserves the current sequence when an update omits one", () => {
    const result = applyOrderBookUpdate(snapshot, {
      ...createUpdate(),
      sequence: undefined,
    });

    expectApplied(result);
    expect(result.snapshot.sequence).toBe(10);
  });
});

function createUpdate(
  overrides: Partial<OrderBookUpdate> = {},
): OrderBookUpdate {
  return {
    symbol: "BTC/USD",
    assetClass: "crypto",
    venue: "COINBASE",
    baseAsset: "BTC",
    quoteAsset: "USD",
    bids: [],
    asks: [],
    timestamp: updateTimestamp,
    sequence: 11,
    previousSequence: 10,
    reset: false,
    ...overrides,
  };
}

function expectApplied(
  result: ReturnType<typeof applyOrderBookUpdate>,
): asserts result is Extract<typeof result, { applied: true }> {
  expect(result.applied).toBe(true);
}
