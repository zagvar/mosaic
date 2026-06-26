import type { MarketTrade, MarketTradeUpdate } from "@zagvar/mosaic-core";

const symbol = "BTC/USDT";
const assetClass = "crypto";

export function createBitcoinTradesSnapshot(): MarketTrade[] {
  const now = Date.now();

  return Array.from({ length: 24 }, (_, index) => {
    const side = index % 3 === 0 ? "sell" : "buy";
    const px = side === "buy" ? 67250.5 + index * 0.4 : 67249.8 - index * 0.35;

    return {
      symbol,
      assetClass,
      tradeId: `snapshot-${index}`,
      px,
      qty: 0.0025 + index * 0.0007,
      side,
      executedAt: now - index * 1_300,
      sequence: 100 - index,
    };
  });
}

export function createBitcoinTradeUpdate(sequence: number): MarketTradeUpdate {
  const side = sequence % 3 === 0 ? "sell" : "buy";
  const px =
    side === "buy" ? 67250 + Math.random() * 6 : 67250 - Math.random() * 6;

  const trade: MarketTrade = {
    symbol,
    assetClass,
    tradeId: `live-${sequence}`,
    px: Number(px.toFixed(2)),
    qty: Number((0.001 + Math.random() * 0.04).toFixed(6)),
    side,
    executedAt: Date.now(),
    sequence,
  };

  return {
    symbol,
    assetClass,
    trades: [trade],
    observedAt: Date.now(),
    previousSequence: sequence - 1,
    sequence,
  };
}
