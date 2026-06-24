import { multiplyDecimal } from "./decimal";
import type { PreparedOrder } from "./order-preparation";

export type OrderEstimateBasis = "limit_px" | "reference_px";

export type OrderWarningCode =
  | "estimated_notional"
  | "extended_hours"
  | "market_price_not_guaranteed";

export interface OrderWarning {
  code: OrderWarningCode;
}

/**
 * Review-ready information derived from an exact prepared order.
 *
 * The order remains the source of truth. Estimated values are supplementary
 * and must not be used as the broker submission payload.
 */
export interface OrderSummary {
  order: PreparedOrder;
  estimatedNotional?: number;
  estimateBasis?: OrderEstimateBasis;
  warnings: OrderWarning[];
}

export interface CreateOrderSummaryOptions {
  /**
   * Host-supplied current, mark, bid, ask, or other reference price.
   *
   * Mosaic does not choose the market-data source. The host should select a
   * price appropriate to its venue and clearly communicate its meaning.
   */
  referencePx?: number;
}

/**
 * Builds broker-neutral review metadata for a prepared order.
 *
 * Limit-order estimates use the submitted limit price. Market-order quantity
 * estimates require a positive finite reference price supplied by the host.
 * Fees, slippage, and broker-specific adjustments are intentionally excluded.
 */
export function createOrderSummary(
  order: PreparedOrder,
  options: CreateOrderSummaryOptions = {},
): OrderSummary {
  const estimate = getEstimatedNotional(order, options.referencePx);
  const warnings: OrderWarning[] = [];

  if (order.type === "market") {
    warnings.push({ code: "market_price_not_guaranteed" });
  }

  if (estimate !== undefined) {
    warnings.push({ code: "estimated_notional" });
  }

  if (order.extendedHours) {
    warnings.push({ code: "extended_hours" });
  }

  return {
    order,
    ...(estimate === undefined
      ? {}
      : {
          estimatedNotional: estimate.value,
          estimateBasis: estimate.basis,
        }),
    warnings,
  };
}

function getEstimatedNotional(
  order: PreparedOrder,
  referencePx: number | undefined,
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
    referencePx !== undefined &&
    Number.isFinite(referencePx) &&
    referencePx > 0
  ) {
    return {
      value: multiplyDecimal(order.qty, referencePx),
      basis: "reference_px",
    };
  }

  return undefined;
}
