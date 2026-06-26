import type { MarketCandle } from "@zagvar/mosaic-core";

export function createBitcoinCandles(): MarketCandle[] {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const start = nowSeconds - 80 * 60;

  let close = 65000;

  return Array.from({ length: 80 }, (_, index) => {
    const time = start + index * 60;
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
      time,
      open,
      high,
      low,
      close,
      volume: Number((0.8 + Math.random() * 8).toFixed(3)),
    };
  });
}
