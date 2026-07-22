import { z } from "zod";

/**
 * Provider-neutral order lifecycle statuses.
 *
 * Broker and exchange adapters must map their provider-specific values into
 * this canonical set before orders enter Mosaic application state.
 */
export const orderStatusSchema = z.enum([
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

/**
 * Broad lifecycle category used for open-order and order-history views.
 *
 * `unknown` is deliberately separate so an unmapped status is not silently
 * treated as either active or terminal.
 */
export const orderStatusCategorySchema = z.enum([
  "working",
  "terminal",
  "unknown",
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type OrderStatusCategory = z.infer<typeof orderStatusCategorySchema>;

const orderStatusCategoryByStatus = {
  pending: "working",
  open: "working",
  partially_filled: "working",
  held: "working",
  pending_cancel: "working",
  pending_replace: "working",

  filled: "terminal",
  canceled: "terminal",
  expired: "terminal",
  rejected: "terminal",
  replaced: "terminal",

  unknown: "unknown",
} as const satisfies Record<OrderStatus, OrderStatusCategory>;

export function getOrderStatusCategory(
  status: OrderStatus,
): OrderStatusCategory {
  return orderStatusCategoryByStatus[status];
}

/**
 * Whether the order belongs in an open-orders view.
 *
 * This does not mean that the order is currently executable or cancelable.
 * Action capabilities must be supplied separately by the backend.
 */
export function isOpenOrderStatus(status: OrderStatus): boolean {
  return getOrderStatusCategory(status) === "working";
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return getOrderStatusCategory(status) === "terminal";
}
