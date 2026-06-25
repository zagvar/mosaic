import { z } from "zod";
import { orderFeeEstimateSchema } from "./order-fees";

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
    estimatedFillPx: z.number().positive().optional(),

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
     * When the preview was produced, in Unix milliseconds.
     */
    observedAt: z.number().int().nonnegative(),

    /**
     * When the preview becomes invalid, in Unix milliseconds.
     *
     * Equality with `observedAt` is valid but means the preview expires
     * immediately.
     */
    expiresAt: z.number().int().nonnegative().optional(),
  })
  .superRefine((preview, context) => {
    if (
      preview.expiresAt !== undefined &&
      preview.expiresAt < preview.observedAt
    ) {
      context.addIssue({
        code: "custom",
        message: "expiresAt must not be earlier than observedAt",
        path: ["expiresAt"],
      });
    }
  });

export type OrderQuotePreview = z.infer<typeof orderQuotePreviewSchema>;
