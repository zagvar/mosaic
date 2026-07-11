import { describe, expect, it } from "vitest";
import { orderBookSnapshotSchema, orderBookUpdateSchema } from "../src/order";

const snapshotTimestamp = "2026-01-01T14:30:00.000Z";
const updateTimestamp = "2026-01-01T14:30:01.000Z";

const validSnapshot = {
  symbol: "BTC/USD",
  assetClass: "crypto" as const,
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
};

describe("orderBookSnapshotSchema", () => {
  it("parses a sorted, uncrossed snapshot", () => {
    expect(orderBookSnapshotSchema.parse(validSnapshot)).toEqual(validSnapshot);
  });

  it("allows a locked best bid and ask", () => {
    expect(
      orderBookSnapshotSchema.safeParse({
        ...validSnapshot,
        bids: [{ price: 100, quantity: 2 }],
        asks: [{ price: 100, quantity: 1 }],
      }).success,
    ).toBe(true);
  });

  it.each([
    {
      name: "unsorted bids",
      snapshot: {
        ...validSnapshot,
        bids: [
          { price: 99, quantity: 3 },
          { price: 100, quantity: 2 },
        ],
      },
    },
    {
      name: "unsorted asks",
      snapshot: {
        ...validSnapshot,
        asks: [
          { price: 102, quantity: 4 },
          { price: 101, quantity: 1 },
        ],
      },
    },
    {
      name: "duplicate bid prices",
      snapshot: {
        ...validSnapshot,
        bids: [
          { price: 100, quantity: 2 },
          { price: 100, quantity: 3 },
        ],
      },
    },
    {
      name: "crossed best prices",
      snapshot: {
        ...validSnapshot,
        bids: [{ price: 102, quantity: 2 }],
        asks: [{ price: 101, quantity: 1 }],
      },
    },
    {
      name: "zero snapshot quantity",
      snapshot: {
        ...validSnapshot,
        bids: [{ price: 100, quantity: 0 }],
      },
    },
    {
      name: "invalid timestamp",
      snapshot: {
        ...validSnapshot,
        timestamp: "not-a-date",
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
        bids: [{ price: 100, quantity: 0 }],
        timestamp: updateTimestamp,
      }),
    ).toEqual({
      symbol: "BTC/USD",
      assetClass: "crypto",
      bids: [{ price: 100, quantity: 0 }],
      asks: [],
      timestamp: updateTimestamp,
      reset: false,
    });
  });

  it("rejects negative update quantities", () => {
    expect(
      orderBookUpdateSchema.safeParse({
        symbol: "BTC/USD",
        assetClass: "crypto",
        bids: [{ price: 100, quantity: -1 }],
        timestamp: updateTimestamp,
      }).success,
    ).toBe(false);
  });
});
