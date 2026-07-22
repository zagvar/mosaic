import type {
  OrderBookSnapshot,
  OrderIntent,
  OrderSummary,
} from "@zagvar/mosaic-core";
import { addDecimals, multiplyDecimals, subtractDecimals } from "@zagvar/decimal";
import { createOrderSummary } from "@zagvar/mosaic-core";
import { askPrice, bidPrice } from "./demo-config";

export function createDemoOrderSummary(
  order: OrderIntent,
  bitcoinBook: OrderBookSnapshot,
): OrderSummary {
  const now = Date.now();
  const isCrypto = order.assetClass === "crypto";
  const cryptoReference =
    order.side === "buy"
      ? bitcoinBook.asks[0]!.price
      : bitcoinBook.bids[0]!.price;
  const referencePrice = isCrypto
    ? cryptoReference
    : order.side === "buy"
      ? askPrice
      : bidPrice;
  const referenceKind = order.side === "buy" ? "ask" : "bid";
  const slippageOffset = isCrypto ? "1.25" : "0.02";

  const estimatedFillPrice =
    order.type !== "market"
      ? undefined
      : order.side === "buy"
        ? addDecimals(referencePrice, slippageOffset)
        : subtractDecimals(referencePrice, slippageOffset);

  const estimatedNotional =
    order.notional ??
    (order.quantity === undefined
      ? undefined
      : multiplyDecimals(
          order.quantity,
          estimatedFillPrice ?? order.limitPrice ?? referencePrice,
        ));

  return createOrderSummary(order, {
    marketReference: {
      symbol: order.symbol,
      assetClass: order.assetClass,
      price: referencePrice,
      kind: referenceKind,
      timestamp: new Date(now).toISOString(),
      mode: "real_time",
      displaySource: isCrypto ? "Demo exchange" : "Demo feed",
    },
    staleAfterMs: 15_000,
    quotePreview: {
      previewId: `demo-${now}`,
      ...(estimatedFillPrice === undefined ? {} : { estimatedFillPrice }),
      ...(estimatedNotional === undefined ? {} : { estimatedNotional }),
      slippageBps: order.type === "market" ? (isCrypto ? "18" : "10") : "0",
      fees: [
        {
          type: "commission",
          amount: "0.25",
          currency: isCrypto ? "USDT" : "USD",
        },
      ],
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 30_000).toISOString(),
    },
    highSlippageBps: "50",
    now,
  });
}
