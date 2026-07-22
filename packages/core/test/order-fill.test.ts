import { describe, expect, it } from "vitest";
import { orderFillSchema } from "../src/order";

describe("orderFillSchema", () => {
  it("parses a canonical equity fill", () => {
    const result = orderFillSchema.safeParse({
      fillId: "fill-1",
      orderId: "order-1",
      price: "430.25",
      quantity: "0.5",
      notional: "215.125",
      liquidity: "taker",
      venue: "NASDAQ",
      timestamp: "2026-07-22T03:00:00Z",
      sequence: 1,
    });

    expect(result.success).toBe(true);
  });

  it("supports very small crypto fills without precision loss", () => {
    const result = orderFillSchema.safeParse({
      fillId: "fill-2",
      orderId: "order-2",
      price: "62450.125",
      quantity: "0.00000001",
      liquidity: "maker",
      venue: "COINBASE",
      timestamp: "2026-07-22T03:01:00Z",
    });

    expect(result.success).toBe(true);
  });

  it("defaults missing liquidity information to unknown", () => {
    const result = orderFillSchema.safeParse({
      fillId: "fill-3",
      orderId: "order-3",
      price: "195.75",
      quantity: "1",
      timestamp: "2026-07-22T03:02:00Z",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.liquidity).toBe("unknown");
    }
  });

  it("rejects numbers and noncanonical decimals", () => {
    expect(
      orderFillSchema.safeParse({
        fillId: "fill-4",
        orderId: "order-4",
        price: 195.75,
        quantity: "1",
        timestamp: "2026-07-22T03:03:00Z",
      }).success,
    ).toBe(false);

    expect(
      orderFillSchema.safeParse({
        fillId: "fill-4",
        orderId: "order-4",
        price: "195.750",
        quantity: "1",
        timestamp: "2026-07-22T03:03:00Z",
      }).success,
    ).toBe(false);
  });

  it("requires stable fill and order identifiers", () => {
    expect(
      orderFillSchema.safeParse({
        fillId: "",
        orderId: "order-5",
        price: "195.75",
        quantity: "1",
        timestamp: "2026-07-22T03:04:00Z",
      }).success,
    ).toBe(false);

    expect(
      orderFillSchema.safeParse({
        fillId: "fill-5",
        orderId: "",
        price: "195.75",
        quantity: "1",
        timestamp: "2026-07-22T03:04:00Z",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid sequence numbers", () => {
    expect(
      orderFillSchema.safeParse({
        fillId: "fill-6",
        orderId: "order-6",
        price: "195.75",
        quantity: "1",
        timestamp: "2026-07-22T03:05:00Z",
        sequence: -1,
      }).success,
    ).toBe(false);
  });
});
