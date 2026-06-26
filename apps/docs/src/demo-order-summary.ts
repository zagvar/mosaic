import type {
  OrderBookSnapshot,
  OrderIntent,
  OrderSummary,
} from "@zagvar/mosaic-core";
import { createOrderSummary } from "@zagvar/mosaic-core";
import { askPrice, bidPrice } from "./demo-config";

export function createDemoOrderSummary(
  order: OrderIntent,
  bitcoinBook: OrderBookSnapshot,
): OrderSummary {
  const now = Date.now();
  const isCrypto = order.assetClass === "crypto";
  const cryptoReference =
    order.side === "buy" ? bitcoinBook.asks[0]!.px : bitcoinBook.bids[0]!.px;
  const referencePx = isCrypto
    ? cryptoReference
    : order.side === "buy"
      ? askPrice
      : bidPrice;
  const referenceKind = order.side === "buy" ? "ask" : "bid";
  const slippageOffset = isCrypto ? 1.25 : 0.02;
  const estimatedFillPx =
    order.type === "market"
      ? referencePx + (order.side === "buy" ? slippageOffset : -slippageOffset)
      : undefined;
  const estimatedNotional =
    order.notional ??
    (order.qty === undefined
      ? undefined
      : order.qty * (estimatedFillPx ?? order.limitPx ?? referencePx));

  return createOrderSummary(order, {
    marketReference: {
      symbol: order.symbol,
      assetClass: order.assetClass,
      px: referencePx,
      kind: referenceKind,
      observedAt: now,
      mode: "real_time",
      displaySource: isCrypto ? "Demo exchange" : "Demo feed",
    },
    staleAfterMs: 15_000,
    quotePreview: {
      previewId: `demo-${now}`,
      ...(estimatedFillPx === undefined ? {} : { estimatedFillPx }),
      ...(estimatedNotional === undefined ? {} : { estimatedNotional }),
      slippageBps: order.type === "market" ? (isCrypto ? 18 : 10) : 0,
      fees: [
        {
          type: "commission",
          amount: 0.25,
          currency: isCrypto ? "USDT" : "USD",
        },
      ],
      observedAt: now,
      expiresAt: now + 30_000,
    },
    highSlippageBps: 50,
    now,
  });
}
