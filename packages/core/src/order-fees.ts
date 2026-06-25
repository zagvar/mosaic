import { z } from "zod";

export const orderFeeTypeSchema = z.enum([
  "commission",
  "regulatory",
  "clearing",
  "tax",
  "other",
]);

export const orderFeeEstimateSchema = z.object({
  type: orderFeeTypeSchema,
  amount: z.number().nonnegative(),
  currency: z.string().trim().min(1),
  fractionDigits: z.number().int().min(0).max(18).optional(),
});

export type OrderFeeType = z.infer<typeof orderFeeTypeSchema>;
export type OrderFeeEstimate = z.infer<typeof orderFeeEstimateSchema>;
