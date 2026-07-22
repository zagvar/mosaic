import { compareDecimals } from "./decimal-string.js";
import type {
  OrderBookLevel,
  OrderBookSnapshot,
  OrderBookUpdate,
} from "./order-book.js";

/** Reasons an update cannot be safely applied to the current snapshot. */
export type OrderBookUpdateFailure =
  | "instrument_mismatch"
  | "stale_sequence"
  | "sequence_gap";

/** Result of reconciling an order-book update with a local snapshot. */
export type OrderBookUpdateResult =
  | { applied: true; snapshot: OrderBookSnapshot }
  | { applied: false; reason: OrderBookUpdateFailure };

/**
 * Reconciles an incremental or resetting update with a local order book.
 *
 * The reducer rejects stale, discontinuous, and cross-instrument events rather
 * than risking a silently inaccurate book. Callers should fetch a fresh
 * snapshot after `sequence_gap`.
 *
 * Update semantics:
 *
 * - A positive quantity inserts or replaces a price level.
 * - A zero quantity removes a price level.
 * - `reset: true` replaces both sides using only levels in the update.
 * - Bids remain descending and asks remain ascending.
 */
export function applyOrderBookUpdate(
  snapshot: OrderBookSnapshot,
  update: OrderBookUpdate,
  options: { depth?: number } = {},
): OrderBookUpdateResult {
  if (!hasMatchingIdentity(snapshot, update)) {
    return { applied: false, reason: "instrument_mismatch" };
  }

  if (
    snapshot.sequence !== undefined &&
    update.sequence !== undefined &&
    update.sequence <= snapshot.sequence
  ) {
    return { applied: false, reason: "stale_sequence" };
  }

  if (
    update.previousSequence !== undefined &&
    snapshot.sequence !== update.previousSequence
  ) {
    return { applied: false, reason: "sequence_gap" };
  }

  const depth = options.depth ?? Number.POSITIVE_INFINITY;
  const bids = reconcileSide(
    update.reset ? [] : snapshot.bids,
    update.bids,
    "descending",
  ).slice(0, depth);

  const asks = reconcileSide(
    update.reset ? [] : snapshot.asks,
    update.asks,
    "ascending",
  ).slice(0, depth);

  return {
    applied: true,
    snapshot: {
      ...snapshot,
      bids,
      asks,
      timestamp: update.timestamp,
      ...(update.sequence === undefined ? {} : { sequence: update.sequence }),
    },
  };
}

function hasMatchingIdentity(
  snapshot: OrderBookSnapshot,
  update: OrderBookUpdate,
): boolean {
  return (
    snapshot.symbol === update.symbol &&
    snapshot.assetClass === update.assetClass &&
    snapshot.venue === update.venue &&
    snapshot.baseAsset === update.baseAsset &&
    snapshot.quoteAsset === update.quoteAsset
  );
}

function reconcileSide(
  current: OrderBookLevel[],
  updates: OrderBookUpdate["bids"],
  direction: "ascending" | "descending",
) {
  const levels = new Map(current.map((level) => [level.price, level]));

  for (const update of updates) {
    if (update.quantity === "0") {
      levels.delete(update.price);
    } else {
      levels.set(update.price, update);
    }
  }

  return [...levels.values()].sort((left, right) => {
    const comparison = compareDecimals(left.price, right.price);

    return direction === "ascending" ? comparison : -comparison;
  });
}
