import { z } from "zod";
import {
  compareDecimals,
  nonNegativeDecimalStringSchema,
  positiveDecimalStringSchema,
} from "@zagvar/decimal";
import { marketIdentitySchema } from "./market-identity.js";
import { isoTimestampSchema } from "./timestamp.js";

/**
 * Validates one aggregated price level in a complete order-book snapshot.
 *
 * `quantity` is the total resting quantity at `price`, not an individual order.
 */
export const orderBookLevelSchema = z.object({
  price: positiveDecimalStringSchema,
  quantity: positiveDecimalStringSchema,
  orderCount: z.number().int().nonnegative().optional(),
});

/**
 * Validates one changed price level in an incremental update.
 *
 * A zero quantity removes the level from the locally maintained book.
 */
export const orderBookUpdateLevelSchema = orderBookLevelSchema.extend({
  quantity: nonNegativeDecimalStringSchema,
});

/**
 * Validates a complete, sorted view of an order book at one point in time.
 *
 * Snapshots establish or replace local state. Providers commonly deliver them
 * over HTTP before incremental WebSocket updates are applied.
 */
export const orderBookSnapshotSchema = marketIdentitySchema
  .extend({
    bids: z.array(orderBookLevelSchema).max(5_000),
    asks: z.array(orderBookLevelSchema).max(5_000),
    timestamp: isoTimestampSchema,
    sequence: z.number().int().nonnegative().optional(),
    displaySource: z.string().trim().min(1).max(64).optional(),
  })
  .superRefine(validateSnapshot);

/**
 * Validates a provider-neutral batch of changed bid and ask levels.
 *
 * The arrays contain only levels changed by the event unless `reset` is true.
 * One event may contain zero, one, or many changes on either side.
 */
export const orderBookUpdateSchema = marketIdentitySchema.extend({
  bids: z.array(orderBookUpdateLevelSchema).max(5_000).default([]),
  asks: z.array(orderBookUpdateLevelSchema).max(5_000).default([]),
  timestamp: isoTimestampSchema,
  sequence: z.number().int().nonnegative().optional(),

  /**
   * Expected sequence of the snapshot this update follows.
   * Providers without sequence continuity may omit it.
   */
  previousSequence: z.number().int().nonnegative().optional(),

  /**
   * Treat update levels as a full replacement.
   */
  reset: z.boolean().default(false),
});

function validateSnapshot(
  book: z.infer<typeof orderBookSnapshotSchema>,
  context: z.RefinementCtx,
) {
  validateLevels(book.bids, "bids", "descending", context);
  validateLevels(book.asks, "asks", "ascending", context);

  const bestBid = book.bids[0]?.price;
  const bestAsk = book.asks[0]?.price;

  if (
    bestBid !== undefined &&
    bestAsk !== undefined &&
    compareDecimals(bestBid, bestAsk) > 0
  ) {
    context.addIssue({
      code: "custom",
      message: "best bid must not exceed best ask",
      path: ["bids", 0, "price"],
    });
  }
}

function validateLevels(
  levels: OrderBookLevel[],
  side: "bids" | "asks",
  direction: "ascending" | "descending",
  context: z.RefinementCtx,
) {
  for (let index = 1; index < levels.length; index += 1) {
    const previous = levels[index - 1]!;
    const current = levels[index]!;
    const comparison = compareDecimals(previous.price, current.price);

    const correctlySorted =
      direction === "ascending" ? comparison < 0 : comparison > 0;

    if (!correctlySorted) {
      context.addIssue({
        code: "custom",
        message: `${side} must have unique, sorted prices`,
        path: [side, index, "price"],
      });
    }
  }
}

/** One aggregated price level in a complete order-book snapshot. */
export type OrderBookLevel = z.infer<typeof orderBookLevelSchema>;

/** A complete local order-book state, ordered best price first on each side. */
export type OrderBookSnapshot = z.infer<typeof orderBookSnapshotSchema>;

/** A provider-neutral incremental or resetting order-book event. */
export type OrderBookUpdate = z.infer<typeof orderBookUpdateSchema>;
