import { z } from "zod";
import { assetClassSchema } from "./order-schemas";

/**
 * Shared identity fields for provider-neutral market-data payloads.
 *
 * Broker and exchange adapters should normalize their native identifiers into
 * this shape before passing data into Mosaic schemas.
 */
export const marketIdentitySchema = z.object({
  symbol: z.string().min(1).max(32),
  assetClass: assetClassSchema,
});

