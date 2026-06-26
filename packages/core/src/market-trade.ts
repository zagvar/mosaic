import { z } from "zod";
import { assetClassSchema } from "./order-schemas";

export const tradeSideSchema = z.enum(["buy", "sell", "unknown"]);

const identitySchema = z.object({
  symbol: z.string().min(1).max(32),
  assetClass: assetClassSchema,
});

/**
 * Validates one executed market trade.
 *
 * `side` represents the aggressor side when the provider exposes it:
 * buy means the taker bought into resting asks; sell means the taker sold
 * into resting bids. Some providers omit this, so use "unknown".
 */
export const marketTradeSchema = identitySchema.extend({
  tradeId: z.string().min(1).max(128).optional(),
  px: z.number().positive(),
  qty: z.number().positive(),
  side: tradeSideSchema.default("unknown"),
  executedAt: z.number().int().nonnegative(),
  sequence: z.number().int().nonnegative().optional(),
});

export const marketTradesSnapshotSchema = identitySchema.extend({
  trades: z.array(marketTradeSchema).max(5_000),
  observedAt: z.number().int().nonnegative(),
  sequence: z.number().int().nonnegative().optional(),
  displaySource: z.string().trim().min(1).max(64).optional(),
});

export const marketTradeUpdateSchema = identitySchema.extend({
  trades: z.array(marketTradeSchema).min(1).max(5_000),
  observedAt: z.number().int().nonnegative(),
  sequence: z.number().int().nonnegative().optional(),
  previousSequence: z.number().int().nonnegative().optional(),
});

export type TradeSide = z.infer<typeof tradeSideSchema>;
export type MarketTrade = z.infer<typeof marketTradeSchema>;
export type MarketTradesSnapshot = z.infer<typeof marketTradesSnapshotSchema>;
export type MarketTradeUpdate = z.infer<typeof marketTradeUpdateSchema>;
