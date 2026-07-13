import type { OrderBookSnapshot, OrderBookUpdate } from "@zagvar/mosaic-core";

export const bitcoinBookSnapshot: OrderBookSnapshot = {
  symbol: "BTC/USDT",
  assetClass: "crypto",
  bids: createLevels("bid", 65000, 20),
  asks: createLevels("ask", 65000.5, 20),
  timestamp: new Date(0).toISOString(),
  sequence: 1,
  displaySource: "Demo exchange",
};

export const bitcoinBookUpdateTemplates: Array<
  Omit<OrderBookUpdate, "timestamp" | "previousSequence" | "sequence">
> = [
  {
    symbol: "BTC/USDT",
    assetClass: "crypto",
    bids: [
      { price: 65000, quantity: 0.6 },
      { price: 64999.5, quantity: 0 },
    ],
    asks: [{ price: 65000.5, quantity: 0.5 }],
    reset: false,
  },
  {
    symbol: "BTC/USDT",
    assetClass: "crypto",
    bids: [{ price: 65000.25, quantity: 0.3 }],
    asks: [
      { price: 65000.5, quantity: 0 },
      { price: 65000.75, quantity: 0.4 },
    ],
    reset: false,
  },
  {
    symbol: "BTC/USDT",
    assetClass: "crypto",
    bids: [
      { price: 65000.25, quantity: 0 },
      { price: 65000, quantity: 0.4 },
      { price: 64999.75, quantity: 0.55 },
    ],
    asks: [
      { price: 65000.5, quantity: 0.25 },
      { price: 65000.75, quantity: 0 },
    ],
    reset: false,
  },
];

/**
 * Creates an isolated snapshot with a fresh timestamp.
 *
 * Cloning each level prevents one mocked request from mutating fixture state
 * observed by later requests.
 */
export function createBitcoinBookSnapshot(): OrderBookSnapshot {
  return {
    ...bitcoinBookSnapshot,
    bids: bitcoinBookSnapshot.bids.map((level) => ({ ...level })),
    asks: bitcoinBookSnapshot.asks.map((level) => ({ ...level })),
    timestamp: new Date().toISOString(),
  };
}

function createLevels(side: "bid" | "ask", bestPrice: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const direction = side === "bid" ? -1 : 1;
    const quantity = 0.35 + ((index * 7) % 11) * 0.13 + index * 0.08;

    return {
      price: bestPrice + direction * index * 0.5,
      quantity: Number(quantity.toFixed(6)),
      orderCount: 2 + ((index * 3) % 9),
    };
  });
}
