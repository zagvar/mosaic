import { describe, expect, it } from "vitest";
import {
  applyOrderUpdate,
  orderUpdateSchema,
  type OrderListItem,
  type OrderUpdate,
} from "../src/order";

const currentOrder: OrderListItem = {
  symbol: "AAPL",
  assetClass: "equity",
  venue: "NASDAQ",
  orderId: "order-1",
  accountId: "account-1",
  side: "buy",
  type: "limit",
  tif: "day",
  status: "open",
  version: 4,
  quoteCurrency: "USD",
  quantity: "2",
  filledQuantity: "0",
  remainingQuantity: "2",
  limitPrice: "195.75",
  submittedAt: "2026-07-22T07:00:00Z",
  updatedAt: "2026-07-22T07:00:01Z",
  capabilities: {
    cancel: true,
    replace: true,
  },
};

describe("orderUpdateSchema", () => {
  it("parses a complete canonical update", () => {
    expect(orderUpdateSchema.safeParse(createUpdate()).success).toBe(true);
  });

  it("rejects invalid versions", () => {
    expect(
      orderUpdateSchema.safeParse(
        createUpdate({
          version: -1,
        }),
      ).success,
    ).toBe(false);

    expect(
      orderUpdateSchema.safeParse(
        createUpdate({
          version: 1.5,
        }),
      ).success,
    ).toBe(false);
  });

  it("retains complete order-record validation", () => {
    expect(
      orderUpdateSchema.safeParse(
        createUpdate({
          quantity: "2.0",
        }),
      ).success,
    ).toBe(false);
  });
});

describe("applyOrderUpdate", () => {
  it("applies a newer versioned order", () => {
    const update = createUpdate({
      status: "partially_filled",
      version: 5,
      filledQuantity: "0.5",
      remainingQuantity: "1.5",
    });

    expect(applyOrderUpdate(currentOrder, update)).toEqual({
      applied: true,
      order: update.order,
    });
  });

  it.each([
    ["order ID", { orderId: "order-2" }],
    ["account ID", { accountId: "account-2" }],
  ] as const)("rejects an %s mismatch", (_label, overrides) => {
    expect(applyOrderUpdate(currentOrder, createUpdate(overrides))).toEqual({
      applied: false,
      reason: "order_mismatch",
    });
  });

  it.each([
    ["symbol", { symbol: "MSFT" }],
    ["asset class", { assetClass: "crypto" }],
    ["venue", { venue: "NYSE" }],
    ["quote currency", { quoteCurrency: "EUR" }],
  ] as const)("rejects an instrument %s mismatch", (_label, overrides) => {
    expect(
      applyOrderUpdate(
        currentOrder,
        createUpdate(overrides as Partial<OrderListItem>),
      ),
    ).toEqual({
      applied: false,
      reason: "instrument_mismatch",
    });
  });

  it.each([
    ["side", { side: "sell" }],
    ["type", { type: "market" }],
    ["submission time", { submittedAt: "2026-07-22T06:00:00Z" }],
  ] as const)("rejects an immutable %s change", (_label, overrides) => {
    expect(
      applyOrderUpdate(
        currentOrder,
        createUpdate(overrides as Partial<OrderListItem>),
      ),
    ).toEqual({
      applied: false,
      reason: "immutable_field_mismatch",
    });
  });

  it("rejects stale and repeated versions", () => {
    expect(
      applyOrderUpdate(
        currentOrder,
        createUpdate({
          version: 4,
        }),
      ),
    ).toEqual({
      applied: false,
      reason: "stale_version",
    });

    expect(
      applyOrderUpdate(
        currentOrder,
        createUpdate({
          version: 3,
        }),
      ),
    ).toEqual({
      applied: false,
      reason: "stale_version",
    });
  });

  it("does not allow a versioned record to lose version ordering", () => {
    const update = createUpdate();
    const { version: _, ...orderWithoutVersion } = update.order;

    expect(
      applyOrderUpdate(currentOrder, {
        ...update,
        order: orderWithoutVersion,
      }),
    ).toEqual({
      applied: false,
      reason: "version_missing",
    });
  });

  it("uses timestamps when the current order is unversioned", () => {
    const { version: _, ...unversionedCurrent } = currentOrder;

    const update = createUpdate({
      version: 1,
      updatedAt: "2026-07-22T07:00:02Z",
    });

    expect(applyOrderUpdate(unversionedCurrent, update)).toEqual({
      applied: true,
      order: update.order,
    });
  });

  it("rejects a stale timestamp for an unversioned order", () => {
    const { version: _, ...unversionedCurrent } = currentOrder;

    const update = createUpdate({
      version: undefined,
      updatedAt: currentOrder.updatedAt,
    });

    expect(applyOrderUpdate(unversionedCurrent, update)).toEqual({
      applied: false,
      reason: "stale_timestamp",
    });
  });

  it("prefers a newer version over provider clock ordering", () => {
    const update = createUpdate({
      version: 5,
      updatedAt: "2026-07-22T06:59:59Z",
    });

    expect(applyOrderUpdate(currentOrder, update)).toEqual({
      applied: true,
      order: update.order,
    });
  });
});

function createUpdate(overrides: Partial<OrderListItem> = {}): OrderUpdate {
  return {
    order: {
      ...currentOrder,
      version: 5,
      updatedAt: "2026-07-22T07:00:02Z",
      ...overrides,
    },
    receivedAt: "2026-07-22T07:00:03Z",
  };
}
