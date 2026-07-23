import { describe, expect, it } from "vitest";
import {
  getOrderStatusCategory,
  isOpenOrderStatus,
  isTerminalOrderStatus,
  orderStatusSchema,
  type OrderStatus,
} from "../src/order";

const workingStatuses = [
  "pending",
  "open",
  "partially_filled",
  "held",
  "pending_cancel",
  "pending_replace",
] as const satisfies readonly OrderStatus[];

const terminalStatuses = [
  "filled",
  "canceled",
  "expired",
  "rejected",
  "replaced",
] as const satisfies readonly OrderStatus[];

describe("orderStatusSchema", () => {
  it("accepts the canonical order lifecycle statuses", () => {
    expect(orderStatusSchema.options).toEqual([
      "pending",
      "open",
      "partially_filled",
      "held",
      "pending_cancel",
      "pending_replace",
      "filled",
      "canceled",
      "expired",
      "rejected",
      "replaced",
      "unknown",
    ]);
  });

  it.each([
    "new",
    "submitted",
    "pending_new",
    "cancel_queued",
    "cancelled",
    "failed",
    "",
  ])("rejects provider-specific or invalid status %j", (status) => {
    expect(orderStatusSchema.safeParse(status).success).toBe(false);
  });
});

describe("order status classification", () => {
  it.each(workingStatuses)(
    "classifies %s as an open working status",
    (status) => {
      expect(getOrderStatusCategory(status)).toBe("working");
      expect(isOpenOrderStatus(status)).toBe(true);
      expect(isTerminalOrderStatus(status)).toBe(false);
    },
  );

  it.each(terminalStatuses)("classifies %s as a terminal status", (status) => {
    expect(getOrderStatusCategory(status)).toBe("terminal");
    expect(isOpenOrderStatus(status)).toBe(false);
    expect(isTerminalOrderStatus(status)).toBe(true);
  });

  it("keeps an unknown status out of both lifecycle groups", () => {
    expect(getOrderStatusCategory("unknown")).toBe("unknown");
    expect(isOpenOrderStatus("unknown")).toBe(false);
    expect(isTerminalOrderStatus("unknown")).toBe(false);
  });
});
