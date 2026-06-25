import { describe, expect, it } from "vitest";
import {
  orderBookSnapshotSchema,
  orderBookUpdateSchema,
} from "../src/order";

const validSnapshot = {
  symbol: "BTC/USD",
  assetClass: "crypto" as const,
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
};

describe("orderBookSnapshotSchema", () => {
  it("parses a sorted, uncrossed snapshot", () => {
    expect(orderBookSnapshotSchema.parse(validSnapshot)).toEqual(validSnapshot);
  });

  it("allows a locked best bid and ask", () => {
    expect(
      orderBookSnapshotSchema.safeParse({
        ...validSnapshot,
        bids: [{ px: 100, qty: 2 }],
        asks: [{ px: 100, qty: 1 }],
      }).success,
    ).toBe(true);
  });

  it.each([
    {
      name: "unsorted bids",
      snapshot: {
        ...validSnapshot,
        bids: [
          { px: 99, qty: 3 },
          { px: 100, qty: 2 },
        ],
      },
    },
    {
      name: "unsorted asks",
      snapshot: {
        ...validSnapshot,
        asks: [
          { px: 102, qty: 4 },
          { px: 101, qty: 1 },
        ],
      },
    },
    {
      name: "duplicate bid prices",
      snapshot: {
        ...validSnapshot,
        bids: [
          { px: 100, qty: 2 },
          { px: 100, qty: 3 },
        ],
      },
    },
    {
      name: "crossed best prices",
      snapshot: {
        ...validSnapshot,
        bids: [{ px: 102, qty: 2 }],
        asks: [{ px: 101, qty: 1 }],
      },
    },
    {
      name: "zero snapshot quantity",
      snapshot: {
        ...validSnapshot,
        bids: [{ px: 100, qty: 0 }],
      },
    },
  ])("rejects $name", ({ snapshot }) => {
    expect(orderBookSnapshotSchema.safeParse(snapshot).success).toBe(false);
  });
});

describe("orderBookUpdateSchema", () => {
  it("applies defaults and accepts zero quantities as removals", () => {
    expect(
      orderBookUpdateSchema.parse({
        symbol: "BTC/USD",
        assetClass: "crypto",
        bids: [{ px: 100, qty: 0 }],
        observedAt: 2000,
      }),
    ).toEqual({
      symbol: "BTC/USD",
      assetClass: "crypto",
      bids: [{ px: 100, qty: 0 }],
      asks: [],
      observedAt: 2000,
      reset: false,
    });
  });

  it("rejects negative update quantities", () => {
    expect(
      orderBookUpdateSchema.safeParse({
        symbol: "BTC/USD",
        assetClass: "crypto",
        bids: [{ px: 100, qty: -1 }],
        observedAt: 2000,
      }).success,
    ).toBe(false);
  });
});
