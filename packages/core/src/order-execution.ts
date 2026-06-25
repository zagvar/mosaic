import { z } from "zod";

/**
 * Broker-neutral execution failures that host adapters can map from their
 * provider-specific responses.
 */
export const orderExecutionErrorCodeSchema = z.enum([
  "unknown",
  "network_error",
  "broker_rejected",
  "insufficient_buying_power",
  "insufficient_asset_qty",
  "market_closed",
  "price_changed",
  "quote_expired",
  "order_not_allowed",
  "rate_limited",
]);

export const orderExecutionErrorSchema = z.object({
  code: orderExecutionErrorCodeSchema,
});

export type OrderExecutionErrorCode = z.infer<
  typeof orderExecutionErrorCodeSchema
>;

export type OrderExecutionError = z.infer<typeof orderExecutionErrorSchema>;
