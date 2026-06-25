import { describe, expect, it } from "vitest";
import type {
  OrderBookSnapshot,
  OrderBookUpdate,
} from "../src/order";
import { applyOrderBookUpdate } from "../src/order";

const snapshot: OrderBookSnapshot = {
  symbol: "BTC/USD",
  assetClass: "crypto",
  bids: [
    { px: 100, qty: 2 },
    { px: 99, qty: 3 },
  ],
  asks: [
    { px: 101, qty: 1 },
    { px: 102, qty: 4 },
  ],
  observedAt: 1000,
  sequence: 10,
  displaySource: "Demo exchange",
};

describe("applyOrderBookUpdate", () => {
  it("inserts, replaces, and removes price levels", () => {
    const result = applyOrderBookUpdate(
      snapshot,
      createUpdate({
        bids: [
          { px: 100.25, qty: 1 },
          { px: 100, qty: 5 },
          { px: 99, qty: 0 },
        ],
        asks: [
          { px: 100.5, qty: 2 },
          { px: 102, qty: 0 },
        ],
      }),
    );

    expect(result).toEqual({
      applied: true,
      snapshot: {
        symbol: "BTC/USD",
        assetClass: "crypto",
        bids: [
          { px: 100.25, qty: 1 },
          { px: 100, qty: 5 },
        ],
        asks: [
          { px: 100.5, qty: 2 },
          { px: 101, qty: 1 },
        ],
        observedAt: 2000,
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
          { px: 98, qty: 1 },
          { px: 100.25, qty: 1 },
        ],
        asks: [
          { px: 103, qty: 1 },
          { px: 100.5, qty: 1 },
        ],
      }),
    );

    expectApplied(result);
    expect(result.snapshot.bids.map((level) => level.px)).toEqual([
      100.25, 100, 99, 98,
    ]);
    expect(result.snapshot.asks.map((level) => level.px)).toEqual([
      100.5, 101, 102, 103,
    ]);
  });

  it("replaces both sides for reset updates", () => {
    const result = applyOrderBookUpdate(
      snapshot,
      createUpdate({
        reset: true,
        bids: [{ px: 95, qty: 10 }],
        asks: [{ px: 105, qty: 12 }],
      }),
    );

    expectApplied(result);
    expect(result.snapshot.bids).toEqual([{ px: 95, qty: 10 }]);
    expect(result.snapshot.asks).toEqual([{ px: 105, qty: 12 }]);
  });

  it("caps visible depth after reconciliation", () => {
    const result = applyOrderBookUpdate(
      snapshot,
      createUpdate({
        bids: [{ px: 100.25, qty: 1 }],
        asks: [{ px: 100.5, qty: 1 }],
      }),
      { depth: 2 },
    );

    expectApplied(result);
    expect(result.snapshot.bids).toEqual([
      { px: 100.25, qty: 1 },
      { px: 100, qty: 2 },
    ]);
    expect(result.snapshot.asks).toEqual([
      { px: 100.5, qty: 1 },
      { px: 101, qty: 1 },
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
    bids: [],
    asks: [],
    observedAt: 2000,
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
