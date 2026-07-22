import { z } from "zod";
import { positiveDecimalStringSchema } from "./decimal-string.js";
import { marketIdentitySchema } from "./market-identity.js";
import { isoTimestampSchema } from "./timestamp.js";

export const tradeSideSchema = z.enum(["buy", "sell", "unknown"]);

/**
 * Validates one executed market trade.
 *
 * `side` represents the aggressor side when the provider exposes it:
 * buy means the taker bought into resting asks; sell means the taker sold
 * into resting bids. Some providers omit this, so use "unknown".
 */
export const marketTradeSchema = marketIdentitySchema.extend({
  tradeId: z.string().min(1).max(128).optional(),
  price: positiveDecimalStringSchema,
  quantity: positiveDecimalStringSchema,
  side: tradeSideSchema.default("unknown"),
  timestamp: isoTimestampSchema,
  sequence: z.number().int().nonnegative().optional(),
});

export const marketTradesSnapshotSchema = marketIdentitySchema.extend({
  trades: z.array(marketTradeSchema).max(5_000),
  timestamp: isoTimestampSchema,
  sequence: z.number().int().nonnegative().optional(),
  displaySource: z.string().trim().min(1).max(64).optional(),
});

export const marketTradeUpdateSchema = marketIdentitySchema.extend({
  trades: z.array(marketTradeSchema).min(1).max(5_000),
  timestamp: isoTimestampSchema,
  sequence: z.number().int().nonnegative().optional(),
  previousSequence: z.number().int().nonnegative().optional(),
});

export type TradeSide = z.infer<typeof tradeSideSchema>;
export type MarketTrade = z.infer<typeof marketTradeSchema>;
export type MarketTradesSnapshot = z.infer<typeof marketTradesSnapshotSchema>;
export type MarketTradeUpdate = z.infer<typeof marketTradeUpdateSchema>;
