import { z } from "zod";
import { assetClassSchema } from "./order-schemas";

const identitySchema = z.object({
  symbol: z.string().min(1).max(32),
  assetClass: assetClassSchema,
});

export const orderBookLevelSchema = z.object({
  px: z.number().positive(),
  qty: z.number().positive(),
  orderCount: z.number().int().nonnegative().optional(),
});

export const orderBookUpdateLevelSchema = orderBookLevelSchema.extend({
  // Zero removes this price level.
  qty: z.number().nonnegative(),
});

export const orderBookSnapshotSchema = identitySchema
  .extend({
    bids: z.array(orderBookLevelSchema).max(5_000),
    asks: z.array(orderBookLevelSchema).max(5_000),
    observedAt: z.number().int().nonnegative(),
    sequence: z.number().int().nonnegative().optional(),
    displaySource: z.string().trim().min(1).max(64).optional(),
  })
  .superRefine(validateSnapshot);

export const orderBookUpdateSchema = identitySchema.extend({
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

export type OrderBookLevel = z.infer<typeof orderBookLevelSchema>;
export type OrderBookSnapshot = z.infer<typeof orderBookSnapshotSchema>;
export type OrderBookUpdate = z.infer<typeof orderBookUpdateSchema>;
