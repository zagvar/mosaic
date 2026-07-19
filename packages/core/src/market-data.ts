import { z } from "zod";
import { compareDecimals, positiveDecimalStringSchema } from "./decimal-string";
import { assetClassSchema } from "./order-schemas";
import { isoTimestampSchema } from "./timestamp";

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
  price: positiveDecimalStringSchema,
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
    bidPrice: positiveDecimalStringSchema,
    bidQuantity: positiveDecimalStringSchema.optional(),
    askPrice: positiveDecimalStringSchema,
    askQuantity: positiveDecimalStringSchema.optional(),
    lastPrice: positiveDecimalStringSchema.optional(),
    timestamp: isoTimestampSchema,
    receivedAt: isoTimestampSchema.optional(),
    mode: marketDataModeSchema.optional(),
    displaySource: z.string().trim().min(1).max(64).optional(),
  })
  .superRefine((quote, context) => {
    if (compareDecimals(quote.bidPrice, quote.askPrice) > 0) {
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
