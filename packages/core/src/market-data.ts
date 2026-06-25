import { z } from "zod";
import { assetClassSchema } from "./order-schemas";

export const marketPriceKindSchema = z.enum([
  "bid",
  "ask",
  "last",
  "mid",
  "mark",
]);

export const marketDataModeSchema = z.enum([
  "real_time",
  "delayed",
  "indicative",
]);

/**
 * A sanitized, display-safe market price selected by the host application.
 *
 * This object must not contain credentials, endpoints, internal service names,
 * account identifiers, or routing details.
 */
export const marketReferenceSchema = z.object({
  symbol: z.string().min(1).max(32),
  assetClass: assetClassSchema,
  px: z.number().positive(),
  kind: marketPriceKindSchema,
  observedAt: z.number().int().nonnegative(),
  receivedAt: z.number().int().nonnegative().optional(),
  mode: marketDataModeSchema.optional(),

  /**
   * Optional public attribution suitable for display to end users.
   */
  displaySource: z.string().trim().min(1).max(64).optional(),
});

export type MarketPriceKind = z.infer<typeof marketPriceKindSchema>;
export type MarketDataMode = z.infer<typeof marketDataModeSchema>;
export type MarketReference = z.infer<typeof marketReferenceSchema>;
