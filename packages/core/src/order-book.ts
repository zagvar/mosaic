import { z } from "zod";
import { marketIdentitySchema } from "./market-identity";

/**
 * Validates one aggregated price level in a complete order-book snapshot.
 *
 * `qty` is the total resting quantity at `px`, not an individual order.
 */
export const orderBookLevelSchema = z.object({
  px: z.number().positive(),
  qty: z.number().positive(),
  orderCount: z.number().int().nonnegative().optional(),
});

/**
 * Validates one changed price level in an incremental update.
 *
 * A zero quantity removes the level from the locally maintained book.
 */
export const orderBookUpdateLevelSchema = orderBookLevelSchema.extend({
  qty: z.number().nonnegative(),
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
    observedAt: z.number().int().nonnegative(),
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
  observedAt: z.number().int().nonnegative(),
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

  const bestBid = book.bids[0]?.px;
  const bestAsk = book.asks[0]?.px;

  if (bestBid !== undefined && bestAsk !== undefined && bestBid > bestAsk) {
    context.addIssue({
      code: "custom",
      message: "best bid must not exceed best ask",
      path: ["bids", 0, "px"],
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

    const correctlySorted =
      direction === "ascending"
        ? previous.px < current.px
        : previous.px > current.px;

    if (!correctlySorted) {
      context.addIssue({
        code: "custom",
        message: `${side} must have unique, sorted prices`,
        path: [side, index, "px"],
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
