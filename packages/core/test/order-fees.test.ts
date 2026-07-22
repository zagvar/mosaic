import { describe, expect, it } from "vitest";
import { orderFeeEstimateSchema, orderFeeSchema } from "../src/order";

describe("orderFeeSchema", () => {
  it("parses an actual execution fee", () => {
    const result = orderFeeSchema.safeParse({
      feeId: "fee-1",
      orderId: "order-1",
      fillId: "fill-1",
      type: "commission",
      amount: "0.25",
      currency: "USD",
      fractionDigits: 2,
      timestamp: "2026-07-22T04:00:00Z",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a canonical negative maker rebate", () => {
    const result = orderFeeSchema.safeParse({
      feeId: "fee-2",
      orderId: "order-2",
      fillId: "fill-2",
      type: "commission",
      amount: "-0.000004",
      currency: "BTC",
      timestamp: "2026-07-22T04:01:00Z",
    });

    expect(result.success).toBe(true);
  });

  it("keeps estimated fees nonnegative", () => {
    expect(
      orderFeeEstimateSchema.safeParse({
        type: "commission",
        amount: "-0.25",
        currency: "USD",
      }).success,
    ).toBe(false);
  });

  it("rejects numeric and noncanonical fee amounts", () => {
    expect(
      orderFeeSchema.safeParse({
        feeId: "fee-3",
        orderId: "order-3",
        type: "commission",
        amount: 0.25,
        currency: "USD",
      }).success,
    ).toBe(false);

    expect(
      orderFeeSchema.safeParse({
        feeId: "fee-3",
        orderId: "order-3",
        type: "commission",
        amount: "0.250",
        currency: "USD",
      }).success,
    ).toBe(false);

    expect(
      orderFeeSchema.safeParse({
        feeId: "fee-3",
        orderId: "order-3",
        type: "commission",
        amount: "-0",
        currency: "USD",
      }).success,
    ).toBe(false);
  });
});
