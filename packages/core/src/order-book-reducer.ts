import type {
  OrderBookLevel,
  OrderBookSnapshot,
  OrderBookUpdate,
} from "./order-book";

export type OrderBookUpdateFailure =
  | "instrument_mismatch"
  | "stale_sequence"
  | "sequence_gap";

export type OrderBookUpdateResult =
  | { applied: true; snapshot: OrderBookSnapshot }
  | { applied: false; reason: OrderBookUpdateFailure };

export function applyOrderBookUpdate(
  snapshot: OrderBookSnapshot,
  update: OrderBookUpdate,
  options: { depth?: number } = {},
): OrderBookUpdateResult {
  if (
    snapshot.symbol !== update.symbol ||
    snapshot.assetClass !== update.assetClass
  ) {
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
      symbol: snapshot.symbol,
      assetClass: snapshot.assetClass,
      bids,
      asks,
      observedAt: update.observedAt,
      ...(update.sequence === undefined
        ? snapshot.sequence === undefined
          ? {}
          : { sequence: snapshot.sequence }
        : { sequence: update.sequence }),
      ...(snapshot.displaySource === undefined
        ? {}
        : { displaySource: snapshot.displaySource }),
    },
  };
}

function reconcileSide(
  current: OrderBookLevel[],
  updates: OrderBookUpdate["bids"],
  direction: "ascending" | "descending",
) {
  const levels = new Map(current.map((level) => [level.px, level]));

  for (const update of updates) {
    if (update.qty === 0) {
      levels.delete(update.px);
    } else {
      levels.set(update.px, update);
    }
  }

  return [...levels.values()].sort((a, b) =>
    direction === "ascending" ? a.px - b.px : b.px - a.px,
  );
}
