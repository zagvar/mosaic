import { z } from "zod";
import { marketIdentitySchema } from "./market-identity";
import { isoTimestampSchema } from "./timestamp";

export const candleIntervalSchema = z.enum(["1m", "5m", "15m", "1h", "1d"]);

export const marketCandleSchema = z
  .object({
    timestamp: isoTimestampSchema,
    open: z.number().positive(),
    high: z.number().positive(),
    low: z.number().positive(),
    close: z.number().positive(),
    volume: z.number().nonnegative().optional(),
  })
  .superRefine((candle, context) => {
    const maxBody = Math.max(candle.open, candle.close);
    const minBody = Math.min(candle.open, candle.close);

    if (candle.high < maxBody) {
      context.addIssue({
        code: "custom",
        message: "high must be greater than or equal to open and close",
        path: ["high"],
      });
    }

    if (candle.low > minBody) {
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
