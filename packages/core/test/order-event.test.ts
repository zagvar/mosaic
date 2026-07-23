import { describe, expect, it } from "vitest";
import { orderLifecycleEventSchema } from "../src/order";

describe("orderLifecycleEventSchema", () => {
  it("parses a cancellation event with a safe reason", () => {
    const result = orderLifecycleEventSchema.safeParse({
      eventId: "event-1",
      orderId: "order-1",
      status: "canceled",
      timestamp: "2026-07-22T04:10:00Z",
      sequence: 4,
      reason: {
        code: "user_requested",
        message: "Canceled at your request.",
      },
    });

    expect(result.success).toBe(true);
  });

  it("parses a partial-fill transition without a reason", () => {
    const result = orderLifecycleEventSchema.safeParse({
      eventId: "event-2",
      orderId: "order-2",
      status: "partially_filled",
      timestamp: "2026-07-22T04:11:00Z",
    });

    expect(result.success).toBe(true);
  });

  it("rejects provider-specific statuses before adaptation", () => {
    expect(
      orderLifecycleEventSchema.safeParse({
        eventId: "event-3",
        orderId: "order-3",
        status: "cancel_queued",
        timestamp: "2026-07-22T04:12:00Z",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid timestamps and sequences", () => {
    expect(
      orderLifecycleEventSchema.safeParse({
        eventId: "event-4",
        orderId: "order-4",
        status: "open",
        timestamp: "2026-07-22 04:13:00",
      }).success,
    ).toBe(false);

    expect(
      orderLifecycleEventSchema.safeParse({
        eventId: "event-4",
        orderId: "order-4",
        status: "open",
        timestamp: "2026-07-22T04:13:00Z",
        sequence: -1,
      }).success,
    ).toBe(false);
  });

  it("rejects empty and oversized display messages", () => {
    expect(
      orderLifecycleEventSchema.safeParse({
        eventId: "event-5",
        orderId: "order-5",
        status: "rejected",
        timestamp: "2026-07-22T04:14:00Z",
        reason: {
          code: "risk_rejected",
          message: "",
        },
      }).success,
    ).toBe(false);

    expect(
      orderLifecycleEventSchema.safeParse({
        eventId: "event-5",
        orderId: "order-5",
        status: "rejected",
        timestamp: "2026-07-22T04:14:00Z",
        reason: {
          code: "risk_rejected",
          message: "x".repeat(501),
        },
      }).success,
    ).toBe(false);
  });
});
