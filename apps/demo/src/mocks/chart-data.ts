import type { MarketCandle } from "@zagvar/mosaic-core";

export function createBitcoinCandles(): MarketCandle[] {
  const now = Date.now();
  const start = now - 80 * 60_000;

  let close = 65000;

  return Array.from({ length: 80 }, (_, index) => {
    const timestamp = new Date(start + index * 60_000).toISOString();
    const open = close;
    const drift = Math.sin(index / 5) * 18 + (Math.random() - 0.45) * 40;
    close = Number((open + drift).toFixed(2));

    const high = Number(
      (Math.max(open, close) + 15 + Math.random() * 35).toFixed(2),
    );
    const low = Number(
      (Math.min(open, close) - 15 - Math.random() * 35).toFixed(2),
    );

    return {
      timestamp,
      open,
      high,
      low,
      close,
      volume: Number((0.8 + Math.random() * 8).toFixed(3)),
    };
  });
}
