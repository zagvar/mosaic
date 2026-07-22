import { z } from "zod";
import { assetClassSchema } from "./order-schemas.js";

const instrumentIdentifierSchema = z.string().trim().min(1).max(64);

/**
 * Provider-neutral identity shared by Mosaic market-data contracts.
 *
 * `assetClass` describes the instrument's economic exposure.
 * `venue` identifies where its market data or trading activity originates.
 * Pair-based instruments may also provide `baseAsset` and `quoteAsset`.
 */
export const marketIdentitySchema = z.object({
  symbol: instrumentIdentifierSchema,
  assetClass: assetClassSchema,
  venue: instrumentIdentifierSchema.optional(),
  baseAsset: instrumentIdentifierSchema.optional(),
  quoteAsset: instrumentIdentifierSchema.optional(),
});

export type MarketIdentity = z.infer<typeof marketIdentitySchema>;
