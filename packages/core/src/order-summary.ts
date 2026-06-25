import { z } from "zod";
import { multiplyDecimal } from "./decimal";
import { marketReferenceSchema, type MarketReference } from "./market-data";
import {
  orderFeeEstimateSchema,
  type OrderFeeEstimate,
} from "./order-fees";
import type { OrderIntent } from "./order-intent";
import {
  orderQuotePreviewSchema,
  type OrderQuotePreview,
} from "./order-quote-preview";

export type OrderEstimateBasis = "limit_px" | "reference_px" | "quote_preview";

export type OrderWarningCode =
  | "estimated_notional"
  | "extended_hours"
  | "market_price_not_guaranteed"
  | "market_data_stale"
  | "market_data_delayed"
  | "market_data_indicative"
  | "slippage_high"
  | "preview_expired";

export interface OrderWarning {
  code: OrderWarningCode;
}

/**
 * Review-ready information derived from an exact order intent.
 *
 * The order remains the source of truth. Estimated values are supplementary
 * and must not be used as the broker submission payload.
 */
export interface OrderSummary {
  order: OrderIntent;
  estimatedNotional?: number;
  estimateBasis?: OrderEstimateBasis;
  marketReference?: MarketReference;
  quotePreview?: OrderQuotePreview;
  fees?: OrderFeeEstimate[];
  warnings: OrderWarning[];
}

export interface CreateOrderSummaryOptions {
  /**
   * Validated public market data selected by the host for this order.
   */
  marketReference?: MarketReference;

  /**
   * Maximum acceptable age before `market_data_stale` is emitted.
   */
  staleAfterMs?: number;

  /**
   * Current Unix time in milliseconds. Primarily useful for deterministic
   * tests; defaults to `Date.now()`.
   */
  now?: number;

  /**
   * Estimated fees supplied by a broker preview or host backend.
   * Mosaic does not calculate these values.
   */
  fees?: readonly OrderFeeEstimate[];

  /**
   * Short-lived economic estimate supplied by the host backend.
   */
  quotePreview?: OrderQuotePreview;

  /**
   * Slippage threshold that emits `slippage_high`.
   */
  highSlippageBps?: number;
}

/**
 * Builds broker-neutral review metadata for an order intent.
 *
 * Limit-order estimates use the submitted limit price. Market-order quantity
 * estimates require a positive finite reference price supplied by the host.
 * Fee and execution estimates are copied from host-provided preview data.
 * Mosaic may derive warnings from that data but never modifies the order
 * intent or submits it to a broker.
 */
export function createOrderSummary(
  order: OrderIntent,
  options: CreateOrderSummaryOptions = {},
): OrderSummary {
  const marketReference =
    options.marketReference === undefined
      ? undefined
      : marketReferenceSchema.parse(options.marketReference);

  const staleAfterMs =
    options.staleAfterMs === undefined
      ? undefined
      : z.number().int().positive().parse(options.staleAfterMs);

  const now = z
    .number()
    .int()
    .nonnegative()
    .parse(options.now ?? Date.now());

  const quotePreview =
    options.quotePreview === undefined
      ? undefined
      : orderQuotePreviewSchema.parse(options.quotePreview);

  const highSlippageBps =
    options.highSlippageBps === undefined
      ? undefined
      : z.number().nonnegative().parse(options.highSlippageBps);

  if (
    marketReference !== undefined &&
    (marketReference.symbol !== order.symbol ||
      marketReference.assetClass !== order.assetClass)
  ) {
    throw new Error("Market reference does not match the order instrument.");
  }

  const marketEstimate = getEstimatedNotional(order, marketReference?.px);

  const estimatedNotional =
    quotePreview?.estimatedNotional ?? marketEstimate?.value;

  const estimateBasis =
    quotePreview?.estimatedNotional !== undefined
      ? "quote_preview"
      : marketEstimate?.basis;

  const usesMarketReference = estimateBasis === "reference_px";

  const optionFees =
    options.fees === undefined
      ? undefined
      : z.array(orderFeeEstimateSchema).parse(options.fees);

  const fees = quotePreview?.fees ?? optionFees;

  const warnings: OrderWarning[] = [];

  if (order.type === "market") {
    warnings.push({ code: "market_price_not_guaranteed" });
  }

  if (usesMarketReference && marketReference?.mode === "delayed") {
    warnings.push({ code: "market_data_delayed" });
  }

  if (usesMarketReference && marketReference?.mode === "indicative") {
    warnings.push({ code: "market_data_indicative" });
  }

  if (
    usesMarketReference &&
    marketReference !== undefined &&
    staleAfterMs !== undefined &&
    isMarketReferenceStale(marketReference, staleAfterMs, now)
  ) {
    warnings.push({ code: "market_data_stale" });
  }

  if (estimatedNotional !== undefined) {
    warnings.push({ code: "estimated_notional" });
  }

  if (order.extendedHours) {
    warnings.push({ code: "extended_hours" });
  }

  if (
    quotePreview?.slippageBps !== undefined &&
    highSlippageBps !== undefined &&
    quotePreview.slippageBps > highSlippageBps
  ) {
    warnings.push({ code: "slippage_high" });
  }

  if (quotePreview?.expiresAt !== undefined && now >= quotePreview.expiresAt) {
    warnings.push({ code: "preview_expired" });
  }

  const estimateProps =
    estimatedNotional === undefined || estimateBasis === undefined
      ? {}
      : {
          estimatedNotional,
          estimateBasis,
        };

  return {
    order,
    ...estimateProps,
    ...(marketReference === undefined ? {} : { marketReference }),
    ...(quotePreview === undefined ? {} : { quotePreview }),
    ...(fees === undefined ? {} : { fees }),
    warnings,
  };
}

function isMarketReferenceStale(
  reference: MarketReference,
  staleAfterMs: number,
  now: number,
) {
  const timestamp = reference.receivedAt ?? reference.observedAt;

  return now >= timestamp && now - timestamp > staleAfterMs;
}

function getEstimatedNotional(
  order: OrderIntent,
  marketPx: number | undefined,
):
  | {
      value: number;
      basis: OrderEstimateBasis;
    }
  | undefined {
  if (order.qty === undefined) {
    return undefined;
  }

  if (order.type === "limit" && order.limitPx !== undefined) {
    return {
      value: multiplyDecimal(order.qty, order.limitPx),
      basis: "limit_px",
    };
  }

  if (
    order.type === "market" &&
    marketPx !== undefined &&
    Number.isFinite(marketPx) &&
    marketPx > 0
  ) {
    return {
      value: multiplyDecimal(order.qty, marketPx),
      basis: "reference_px",
    };
  }

  return undefined;
}
