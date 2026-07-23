import { positiveDecimalStringSchema } from "@zagvar/decimal";
import { z } from "zod";
import { orderIdentifierSchema } from "./order-identity.js";
import { isoTimestampSchema } from "./timestamp.js";

export const orderLiquiditySchema = z.enum(["maker", "taker", "unknown"]);

/**
 * One completed execution against an order.
 *
 * `fillId` must be stable so hosts can reconcile repeated REST or WebSocket
 * delivery without counting the same execution more than once.
 */
export const orderFillSchema = z.object({
  fillId: orderIdentifierSchema,
  orderId: orderIdentifierSchema,

  price: positiveDecimalStringSchema,
  quantity: positiveDecimalStringSchema,

  /**
   * Executed quote-currency value when supplied by the backend.
   *
   * This is optional because contract multipliers and settlement conventions
   * mean it cannot always be derived by multiplying price and quantity.
   */
  notional: positiveDecimalStringSchema.optional(),

  liquidity: orderLiquiditySchema.default("unknown"),

  venue: z.string().trim().min(1).max(64).optional(),
  timestamp: isoTimestampSchema,
  sequence: z.number().int().nonnegative().optional(),
});

export type OrderLiquidity = z.infer<typeof orderLiquiditySchema>;
export type OrderFill = z.infer<typeof orderFillSchema>;
