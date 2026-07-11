import { z } from "zod";
import { isoTimestampSchema } from "./timestamp";
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
  price: z.number().positive(),
  kind: marketPriceKindSchema,
  timestamp: isoTimestampSchema,
  receivedAt: isoTimestampSchema.optional(),
  mode: marketDataModeSchema.optional(),

  /**
   * Optional public attribution suitable for display to end users.
   */
  displaySource: z.string().trim().min(1).max(64).optional(),
});

/**
 * Sanitized top-of-book data suitable for quote displays and ticket helpers.
 */
export const marketQuoteSchema = z
  .object({
    symbol: z.string().min(1).max(32),
    assetClass: assetClassSchema,
    bidPrice: z.number().positive(),
    bidQuantity: z.number().positive().optional(),
    askPrice: z.number().positive(),
    askQuantity: z.number().positive().optional(),
    lastPrice: z.number().positive().optional(),
    timestamp: isoTimestampSchema,
    receivedAt: isoTimestampSchema.optional(),
    mode: marketDataModeSchema.optional(),
    displaySource: z.string().trim().min(1).max(64).optional(),
  })
  .superRefine((quote, context) => {
    if (quote.bidPrice > quote.askPrice) {
      context.addIssue({
        code: "custom",
        message: "bidPrice must not be greater than askPrice",
        path: ["bidPrice"],
      });
    }
  });

export type MarketPriceKind = z.infer<typeof marketPriceKindSchema>;
export type MarketDataMode = z.infer<typeof marketDataModeSchema>;
export type MarketReference = z.infer<typeof marketReferenceSchema>;
export type MarketQuote = z.infer<typeof marketQuoteSchema>;
