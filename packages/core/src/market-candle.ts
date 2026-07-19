import { z } from "zod";
import {
  compareDecimals,
  nonNegativeDecimalStringSchema,
  positiveDecimalStringSchema,
} from "./decimal-string";
import { marketIdentitySchema } from "./market-identity";
import { isoTimestampSchema } from "./timestamp";

export const candleIntervalSchema = z.enum(["1m", "5m", "15m", "1h", "1d"]);

export const marketCandleSchema = z
  .object({
    timestamp: isoTimestampSchema,
    open: positiveDecimalStringSchema,
    high: positiveDecimalStringSchema,
    low: positiveDecimalStringSchema,
    close: positiveDecimalStringSchema,
    volume: nonNegativeDecimalStringSchema.optional(),
  })
  .superRefine((candle, context) => {
    const highBelowBody =
      compareDecimals(candle.high, candle.open) < 0 ||
      compareDecimals(candle.high, candle.close) < 0;

    if (highBelowBody) {
      context.addIssue({
        code: "custom",
        message: "high must be greater than or equal to open and close",
        path: ["high"],
      });
    }

    const lowAboveBody =
      compareDecimals(candle.low, candle.open) > 0 ||
      compareDecimals(candle.low, candle.close) > 0;

    if (lowAboveBody) {
      context.addIssue({
        code: "custom",
        message: "low must be less than or equal to open and close",
        path: ["low"],
      });
    }
  });

export const marketCandlesSnapshotSchema = marketIdentitySchema.extend({
  interval: candleIntervalSchema,
  candles: z.array(marketCandleSchema).max(10_000),
  timestamp: isoTimestampSchema,
});

export type CandleInterval = z.infer<typeof candleIntervalSchema>;
export type MarketCandle = z.infer<typeof marketCandleSchema>;
export type MarketCandlesSnapshot = z.infer<typeof marketCandlesSnapshotSchema>;
