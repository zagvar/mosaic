import type { MarketTrade, MarketTradeUpdate } from "@zagvar/mosaic-core";

const symbol = "BTC/USDT";
const assetClass = "crypto";

export function createBitcoinTradesSnapshot(): MarketTrade[] {
  const now = Date.now();

  return Array.from({ length: 24 }, (_, index) => {
    const side = index % 3 === 0 ? "sell" : "buy";
    const price =
      side === "buy" ? 67250.5 + index * 0.4 : 67249.8 - index * 0.35;

    return {
      symbol,
      assetClass,
      tradeId: `snapshot-${index}`,
      price,
      quantity: 0.0025 + index * 0.0007,
      side,
      timestamp: new Date(now - index * 1_300).toISOString(),
      sequence: 100 - index,
    };
  });
}

export function createBitcoinTradeUpdate(sequence: number): MarketTradeUpdate {
  const side = sequence % 3 === 0 ? "sell" : "buy";
  const price =
    side === "buy" ? 67250 + Math.random() * 6 : 67250 - Math.random() * 6;

  const trade: MarketTrade = {
    symbol,
    assetClass,
    tradeId: `live-${sequence}`,
    price: Number(price.toFixed(2)),
    quantity: Number((0.001 + Math.random() * 0.04).toFixed(6)),
    side,
    timestamp: new Date().toISOString(),
    sequence,
  };

  return {
    symbol,
    assetClass,
    trades: [trade],
    timestamp: new Date().toISOString(),
    previousSequence: sequence - 1,
    sequence,
  };
}
