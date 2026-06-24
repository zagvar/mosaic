import {
  hasMoreDecimals,
  isGreaterThan,
  isLessThan,
  isMultipleOfIncrement,
  multiplyDecimal,
} from "./decimal";
import type { OrderDraft, OrderValidationCode } from "./order-schemas";
import {
  orderDraftSchema,
  orderValidationContextSchema,
} from "./order-schemas";

export interface OrderValidationIssue {
  code: OrderValidationCode;
  path?: Array<keyof OrderDraft | "assetRules" | "account" | "context">;
}

export interface OrderValidationResult {
  valid: boolean;
  issues: OrderValidationIssue[];
}

function addIssue(
  issues: OrderValidationIssue[],
  code: OrderValidationCode,
  path?: OrderValidationIssue["path"],
): void {
  if (path === undefined) {
    issues.push({ code });
    return;
  }

  issues.push({ code, path });
}

/**
 * Validates a draft order using broker-style trading constraints.
 *
 * This function intentionally returns stable error codes instead of user-facing
 * strings. UI packages should translate these codes into localized messages.
 */
export function validateOrderDraft(
  draft: OrderDraft,
  context: unknown,
): OrderValidationResult {
  const issues: OrderValidationIssue[] = [];

  const parsedDraft = orderDraftSchema.safeParse(draft);
  const parsedContext = orderValidationContextSchema.safeParse(context);

  if (!parsedDraft.success) {
    addIssue(issues, "invalid_order");
    return { valid: false, issues };
  }

  if (!parsedContext.success) {
    addIssue(issues, "invalid_context", ["context"]);
    return { valid: false, issues };
  }

  const order = parsedDraft.data;
  const validatedContext = parsedContext.data;
  const rules = validatedContext.assetRules;

  if (order.symbol !== rules.symbol || order.assetClass !== rules.assetClass) {
    addIssue(issues, "asset_rules_mismatch", ["assetRules"]);
  }

  if (!rules.allowedOrderTypes.includes(order.type)) {
    addIssue(issues, "unsupported_order_type", ["type"]);
  }

  if (
    order.tif !== undefined &&
    rules.allowedTifs !== undefined &&
    !rules.allowedTifs.includes(order.tif)
  ) {
    addIssue(issues, "unsupported_tif", ["tif"]);
  }

  const hasQty = order.qty !== undefined;
  const hasNotional = order.notional !== undefined;

  if (!hasQty && !hasNotional) {
    addIssue(issues, "qty_or_notional_required", ["qty"]);
  }

  if (hasQty && hasNotional) {
    addIssue(issues, "qty_and_notional_conflict", ["qty", "notional"]);
  }

  if (order.type === "limit" && order.limitPx === undefined) {
    addIssue(issues, "limit_px_required", ["limitPx"]);
  }

  if (order.notional !== undefined) {
    if (!rules.supportsNotional) {
      addIssue(issues, "notional_not_supported", ["notional"]);
    }

    if (!rules.notionalOrderTypes.includes(order.type)) {
      addIssue(issues, "notional_not_supported_for_order_type", [
        "notional",
        "type",
      ]);
    }
  }

  if (order.extendedHours) {
    const extendedHoursRules = rules.extendedHours;

    if (!extendedHoursRules?.allowed) {
      addIssue(issues, "extended_hours_not_supported", ["extendedHours"]);
    }

    if (!extendedHoursRules?.allowedOrderTypes.includes(order.type)) {
      addIssue(issues, "extended_hours_unsupported_order_type", [
        "extendedHours",
      ]);
    }

    if (
      order.tif === undefined ||
      !extendedHoursRules?.allowedTifs.includes(order.tif)
    ) {
      addIssue(issues, "extended_hours_unsupported_tif", ["tif"]);
    }
  }

  if (order.qty !== undefined) {
    if (rules.minQty !== undefined && isLessThan(order.qty, rules.minQty)) {
      addIssue(issues, "qty_below_min", ["qty"]);
    }

    if (rules.maxQty !== undefined && isGreaterThan(order.qty, rules.maxQty)) {
      addIssue(issues, "qty_above_max", ["qty"]);
    }

    if (hasMoreDecimals(order.qty, rules.qtyPrecision)) {
      addIssue(issues, "qty_precision_exceeded", ["qty"]);
    }

    if (
      rules.lotSize !== undefined &&
      !isMultipleOfIncrement(order.qty, rules.lotSize)
    ) {
      addIssue(issues, "qty_lot_size_mismatch", ["qty"]);
    }

    if (
      order.side === "sell" &&
      isGreaterThan(order.qty, validatedContext.assetQtyAvailable)
    ) {
      addIssue(issues, "insufficient_asset_qty", ["qty", "account"]);
    }
  }

  if (order.notional !== undefined) {
    if (
      rules.minNotional !== undefined &&
      isLessThan(order.notional, rules.minNotional)
    ) {
      addIssue(issues, "notional_below_min", ["notional"]);
    }

    if (
      rules.maxNotional !== undefined &&
      isGreaterThan(order.notional, rules.maxNotional)
    ) {
      addIssue(issues, "notional_above_max", ["notional"]);
    }

    if (hasMoreDecimals(order.notional, rules.notionalPrecision)) {
      addIssue(issues, "notional_precision_exceeded", ["notional"]);
    }

    if (
      rules.quoteIncrement !== undefined &&
      !isMultipleOfIncrement(order.notional, rules.quoteIncrement)
    ) {
      addIssue(issues, "notional_quote_increment_mismatch", ["notional"]);
    }

    if (
      order.side === "buy" &&
      isGreaterThan(order.notional, validatedContext.cashAvailable)
    ) {
      addIssue(issues, "insufficient_cash", ["notional", "account"]);
    }
  }

  if (
    order.limitPx !== undefined &&
    hasMoreDecimals(order.limitPx, rules.pricePrecision)
  ) {
    addIssue(issues, "limit_px_precision_exceeded", ["limitPx"]);
  }

  if (
    order.limitPx !== undefined &&
    rules.tickSize !== undefined &&
    !isMultipleOfIncrement(order.limitPx, rules.tickSize)
  ) {
    addIssue(issues, "limit_px_tick_size_mismatch", ["limitPx"]);
  }

  if (
    order.limitPx !== undefined &&
    rules.minPrice !== undefined &&
    isLessThan(order.limitPx, rules.minPrice)
  ) {
    addIssue(issues, "limit_px_below_min", ["limitPx"]);
  }

  if (
    order.limitPx !== undefined &&
    rules.maxPrice !== undefined &&
    isGreaterThan(order.limitPx, rules.maxPrice)
  ) {
    addIssue(issues, "limit_px_above_max", ["limitPx"]);
  }

  if (
    order.side === "buy" &&
    order.type === "limit" &&
    order.qty !== undefined &&
    order.limitPx !== undefined
  ) {
    const estimatedCost = multiplyDecimal(order.qty, order.limitPx);

    if (isGreaterThan(estimatedCost, validatedContext.cashAvailable)) {
      addIssue(issues, "insufficient_cash", ["qty", "limitPx", "account"]);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
