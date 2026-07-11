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

  const hasQuantity = order.quantity !== undefined;
  const hasNotional = order.notional !== undefined;

  if (!hasQuantity && !hasNotional) {
    addIssue(issues, "quantity_or_notional_required", ["quantity"]);
  }

  if (hasQuantity && hasNotional) {
    addIssue(issues, "quantity_and_notional_conflict", [
      "quantity",
      "notional",
    ]);
  }

  if (order.type === "limit" && order.limitPrice === undefined) {
    addIssue(issues, "limit_price_required", ["limitPrice"]);
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

  if (order.quantity !== undefined) {
    if (
      rules.minQuantity !== undefined &&
      isLessThan(order.quantity, rules.minQuantity)
    ) {
      addIssue(issues, "quantity_below_min", ["quantity"]);
    }

    if (
      rules.maxQuantity !== undefined &&
      isGreaterThan(order.quantity, rules.maxQuantity)
    ) {
      addIssue(issues, "quantity_above_max", ["quantity"]);
    }

    if (hasMoreDecimals(order.quantity, rules.quantityPrecision)) {
      addIssue(issues, "quantity_precision_exceeded", ["quantity"]);
    }

    if (
      rules.lotSize !== undefined &&
      !isMultipleOfIncrement(order.quantity, rules.lotSize)
    ) {
      addIssue(issues, "quantity_lot_size_mismatch", ["quantity"]);
    }

    if (
      order.side === "sell" &&
      isGreaterThan(order.quantity, validatedContext.assetQuantityAvailable)
    ) {
      addIssue(issues, "insufficient_asset_quantity", ["quantity", "account"]);
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
    order.limitPrice !== undefined &&
    hasMoreDecimals(order.limitPrice, rules.pricePrecision)
  ) {
    addIssue(issues, "limit_price_precision_exceeded", ["limitPrice"]);
  }

  if (
    order.limitPrice !== undefined &&
    rules.tickSize !== undefined &&
    !isMultipleOfIncrement(order.limitPrice, rules.tickSize)
  ) {
    addIssue(issues, "limit_price_tick_size_mismatch", ["limitPrice"]);
  }

  if (
    order.limitPrice !== undefined &&
    rules.minPrice !== undefined &&
    isLessThan(order.limitPrice, rules.minPrice)
  ) {
    addIssue(issues, "limit_price_below_min", ["limitPrice"]);
  }

  if (
    order.limitPrice !== undefined &&
    rules.maxPrice !== undefined &&
    isGreaterThan(order.limitPrice, rules.maxPrice)
  ) {
    addIssue(issues, "limit_price_above_max", ["limitPrice"]);
  }

  if (
    order.side === "buy" &&
    order.type === "limit" &&
    order.quantity !== undefined &&
    order.limitPrice !== undefined
  ) {
    const estimatedCost = multiplyDecimal(order.quantity, order.limitPrice);

    if (isGreaterThan(estimatedCost, validatedContext.cashAvailable)) {
      addIssue(issues, "insufficient_cash", [
        "quantity",
        "limitPrice",
        "account",
      ]);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
