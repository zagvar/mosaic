import { z } from "zod";
import {
  nonNegativeDecimalStringSchema,
  signedDecimalStringSchema,
} from "@zagvar/decimal";
import { orderIdentifierSchema } from "./order-identity.js";
import { isoTimestampSchema } from "./timestamp.js";

export const orderFeeTypeSchema = z.enum([
  "commission",
  "regulatory",
  "clearing",
  "tax",
  "other",
]);

export const orderFeeEstimateSchema = z.object({
  type: orderFeeTypeSchema,
  amount: nonNegativeDecimalStringSchema,
  currency: z.string().trim().min(1),
  fractionDigits: z.number().int().min(0).max(18).optional(),
});

/**
 * An actual fee, charge, tax, or rebate associated with an order.
 *
 * Unlike estimates, actual fee amounts may be negative when a venue provides a
 * maker rebate or another execution credit.
 */
export const orderFeeSchema = z.object({
  feeId: orderIdentifierSchema,
  orderId: orderIdentifierSchema,
  fillId: orderIdentifierSchema.optional(),

  type: orderFeeTypeSchema,
  amount: signedDecimalStringSchema,
  currency: z.string().trim().min(1).max(16),
  fractionDigits: z.number().int().min(0).max(18).optional(),

  timestamp: isoTimestampSchema.optional(),
});

export type OrderFeeType = z.infer<typeof orderFeeTypeSchema>;
export type OrderFeeEstimate = z.infer<typeof orderFeeEstimateSchema>;
export type OrderFee = z.infer<typeof orderFeeSchema>;
