import { z } from "zod";

/**
 * Provider-neutral identifier used for orders, fills, and lifecycle events.
 *
 * Adapters may preserve provider-generated identifiers or generate a stable
 * canonical identifier when the provider does not expose one.
 */
export const orderIdentifierSchema = z.string().trim().min(1).max(128);

export type OrderIdentifier = z.infer<typeof orderIdentifierSchema>;
