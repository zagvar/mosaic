import { z } from "zod";
import { orderIdentifierSchema } from "./order-identity.js";
import { orderStatusSchema } from "./order-status.js";
import { isoTimestampSchema } from "./timestamp.js";

export const orderStatusReasonCodeSchema = z.enum([
  "user_requested",
  "time_in_force",
  "insufficient_buying_power",
  "insufficient_asset_quantity",
  "market_closed",
  "risk_rejected",
  "self_trade_prevention",
  "corporate_action",
  "broker",
  "venue",
  "other",
  "unknown",
]);

/**
 * Provider-neutral reason associated with an order lifecycle transition.
 *
 * `message`, when present, must already be safe for end-user display. Provider
 * diagnostics, credentials, request bodies, and internal service details must
 * not be exposed through this field.
 */
export const orderStatusReasonSchema = z.object({
  code: orderStatusReasonCodeSchema,
  message: z.string().trim().min(1).max(500).optional(),
});

/**
 * One immutable transition in an order's lifecycle.
 *
 * Stable event identifiers allow repeated REST or streaming deliveries to be
 * reconciled idempotently.
 */
export const orderLifecycleEventSchema = z.object({
  eventId: orderIdentifierSchema,
  orderId: orderIdentifierSchema,
  status: orderStatusSchema,
  timestamp: isoTimestampSchema,
  sequence: z.number().int().nonnegative().optional(),
  reason: orderStatusReasonSchema.optional(),
});

export type OrderStatusReasonCode = z.infer<typeof orderStatusReasonCodeSchema>;
export type OrderStatusReason = z.infer<typeof orderStatusReasonSchema>;
export type OrderLifecycleEvent = z.infer<typeof orderLifecycleEventSchema>;
