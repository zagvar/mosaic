import { z } from "zod";
import { multiplyDecimal } from "./decimal";
import type { OrderIntent } from "./order-intent";

export type OrderEstimateBasis = "limit_px" | "reference_px";

export const orderFeeTypeSchema = z.enum([
  "commission",
  "regulatory",
  "clearing",
  "tax",
  "other",
]);

export const orderFeeEstimateSchema = z.object({
  type: orderFeeTypeSchema,
  amount: z.number().nonnegative(),
  currency: z.string().trim().min(1),
  fractionDigits: z.number().int().min(0).max(18).optional(),
});

export type OrderFeeType = z.infer<typeof orderFeeTypeSchema>;
export type OrderFeeEstimate = z.infer<typeof orderFeeEstimateSchema>;

export type OrderWarningCode =
  | "estimated_notional"
  | "extended_hours"
  | "market_price_not_guaranteed";

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
  fees?: OrderFeeEstimate[];
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

  /**
   * Estimated fees supplied by a broker preview or host backend.
   * Mosaic does not calculate these values.
   */
  fees?: readonly OrderFeeEstimate[];
}

/**
 * Builds broker-neutral review metadata for an order intent.
 *
 * Limit-order estimates use the submitted limit price. Market-order quantity
 * estimates require a positive finite reference price supplied by the host.
 * Fee estimates are copied from host-provided preview data. Slippage and other
 * broker-specific adjustments remain outside this helper.
 */
export function createOrderSummary(
  order: OrderIntent,
  options: CreateOrderSummaryOptions = {},
): OrderSummary {
  const estimate = getEstimatedNotional(order, options.referencePx);
  const fees =
    options.fees === undefined
      ? undefined
      : z.array(orderFeeEstimateSchema).parse(options.fees);
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
    ...(fees === undefined ? {} : { fees }),
    warnings,
  };
}

function getEstimatedNotional(
  order: OrderIntent,
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
