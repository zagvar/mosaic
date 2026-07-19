import { z } from "zod";
import {
  compareDecimals,
  multiplyDecimals,
  nonNegativeDecimalStringSchema,
  type DecimalString,
} from "./decimal-string";
import { marketReferenceSchema, type MarketReference } from "./market-data";
import { orderFeeEstimateSchema, type OrderFeeEstimate } from "./order-fees";
import type { OrderIntent } from "./order-intent";
import {
  orderQuotePreviewSchema,
  type OrderQuotePreview,
} from "./order-quote-preview";

export type OrderEstimateBasis =
  | "limit_price"
  | "reference_price"
  | "quote_preview";

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
  estimatedNotional?: DecimalString;
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
  highSlippageBps?: DecimalString;
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
      : nonNegativeDecimalStringSchema.parse(options.highSlippageBps);

  if (
    marketReference !== undefined &&
    (marketReference.symbol !== order.symbol ||
      marketReference.assetClass !== order.assetClass)
  ) {
    throw new Error("Market reference does not match the order instrument.");
  }

  const marketEstimate = getEstimatedNotional(order, marketReference?.price);

  const estimatedNotional =
    quotePreview?.estimatedNotional ?? marketEstimate?.value;

  const estimateBasis =
    quotePreview?.estimatedNotional !== undefined
      ? "quote_preview"
      : marketEstimate?.basis;

  const usesMarketReference = estimateBasis === "reference_price";

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
    compareDecimals(quotePreview.slippageBps, highSlippageBps) > 0
  ) {
    warnings.push({ code: "slippage_high" });
  }

  if (
    quotePreview?.expiresAt !== undefined &&
    now >= Date.parse(quotePreview.expiresAt)
  ) {
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
  const timestamp = reference.receivedAt ?? reference.timestamp;
  const timestampMs = Date.parse(timestamp);

  return now >= timestampMs && now - timestampMs > staleAfterMs;
}

function getEstimatedNotional(
  order: OrderIntent,
  marketPrice: DecimalString | undefined,
):
  | {
      value: DecimalString;
      basis: OrderEstimateBasis;
    }
  | undefined {
  if (order.quantity === undefined) {
    return undefined;
  }

  if (order.type === "limit" && order.limitPrice !== undefined) {
    return {
      value: multiplyDecimals(order.quantity, order.limitPrice),
      basis: "limit_price",
    };
  }

  if (order.type === "market" && marketPrice !== undefined) {
    return {
      value: multiplyDecimals(order.quantity, marketPrice),
      basis: "reference_price",
    };
  }

  return undefined;
}
