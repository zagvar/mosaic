import type { OrderBookSnapshot, OrderBookUpdate } from "@mosaic/core";

export const bitcoinBookSnapshot: OrderBookSnapshot = {
  symbol: "BTC/USDT",
  assetClass: "crypto",
  bids: createLevels("bid", 65000, 20),
  asks: createLevels("ask", 65000.5, 20),
  observedAt: 0,
  sequence: 1,
  displaySource: "Demo exchange",
};

export const bitcoinBookUpdateTemplates: Array<
  Omit<OrderBookUpdate, "observedAt" | "previousSequence" | "sequence">
> = [
  {
    symbol: "BTC/USDT",
    assetClass: "crypto",
    bids: [
      { px: 65000, qty: 0.6 },
      { px: 64999.5, qty: 0 },
    ],
    asks: [{ px: 65000.5, qty: 0.5 }],
    reset: false,
  },
  {
    symbol: "BTC/USDT",
    assetClass: "crypto",
    bids: [{ px: 65000.25, qty: 0.3 }],
    asks: [
      { px: 65000.5, qty: 0 },
      { px: 65000.75, qty: 0.4 },
    ],
    reset: false,
  },
  {
    symbol: "BTC/USDT",
    assetClass: "crypto",
    bids: [
      { px: 65000.25, qty: 0 },
      { px: 65000, qty: 0.4 },
      { px: 64999.75, qty: 0.55 },
    ],
    asks: [
      { px: 65000.5, qty: 0.25 },
      { px: 65000.75, qty: 0 },
    ],
    reset: false,
  },
];

/**
 * Creates an isolated snapshot with a fresh observation timestamp.
 *
 * Cloning each level prevents one mocked request from mutating fixture state
 * observed by later requests.
 */
export function createBitcoinBookSnapshot(): OrderBookSnapshot {
  return {
    ...bitcoinBookSnapshot,
    bids: bitcoinBookSnapshot.bids.map((level) => ({ ...level })),
    asks: bitcoinBookSnapshot.asks.map((level) => ({ ...level })),
    observedAt: Date.now(),
  };
}

function createLevels(
  side: "bid" | "ask",
  bestPrice: number,
  count: number,
) {
  return Array.from({ length: count }, (_, index) => {
    const direction = side === "bid" ? -1 : 1;
    const qty = 0.35 + ((index * 7) % 11) * 0.13 + index * 0.08;

    return {
      px: bestPrice + direction * index * 0.5,
      qty: Number(qty.toFixed(6)),
      orderCount: 2 + ((index * 3) % 9),
    };
  });
}
