import { z } from "zod";
import { orderFeeEstimateSchema } from "./order-fees";
import { isoTimestampSchema } from "./timestamp";

export const orderQuotePreviewSchema = z
  .object({
    /**
     * Opaque public identifier returned by the backend.
     * The backend should bind this identifier to the reviewed order intent.
     */
    previewId: z.string().trim().min(1).max(128),

    /**
     * Estimated average execution price.
     */
    estimatedFillPrice: z.number().positive().optional(),

    /**
     * Estimated value of the execution, excluding fees unless the backend
     * explicitly defines otherwise.
     */
    estimatedNotional: z.number().nonnegative().optional(),

    /**
     * Estimated difference from the comparison price, in basis points.
     *
     * 25 bps = 0.25%.
     */
    slippageBps: z.number().nonnegative().optional(),

    /**
     * Broker or backend-provided fee estimates.
     */
    fees: z.array(orderFeeEstimateSchema).optional(),

    /**
     * When the preview was produced.
     */
    createdAt: isoTimestampSchema,

    /**
     * When the preview becomes invalid.
     *
     * Equality with `createdAt` is valid but means the preview expires
     * immediately.
     */
    expiresAt: isoTimestampSchema.optional(),
  })
  .superRefine((preview, context) => {
    if (
      preview.expiresAt !== undefined &&
      Date.parse(preview.expiresAt) < Date.parse(preview.createdAt)
    ) {
      context.addIssue({
        code: "custom",
        message: "expiresAt must not be earlier than createdAt",
        path: ["expiresAt"],
      });
    }
  });

export type OrderQuotePreview = z.infer<typeof orderQuotePreviewSchema>;
