import type {
  AssetRules,
  OrderValidationCode,
  OrderValidationIssue,
} from "@mosaic/core";

export interface TradeTicketValidationMessageContext {
  issue: OrderValidationIssue;
  symbol: string;
  quoteCurrency: string;
  locale: string;
  assetRules: AssetRules;
}

export type TradeTicketValidationMessageBaseContext = Omit<
  TradeTicketValidationMessageContext,
  "issue"
>;

export type TradeTicketValidationMessage =
  | string
  | ((context: TradeTicketValidationMessageContext) => string);

export type TradeTicketValidationMessages = Partial<
  Record<OrderValidationCode, TradeTicketValidationMessage>
>;

export interface TradeTicketMessages {
  submit: string;
  qty: string;
  limitPx: string;
  notional: string;
  available: string;
  validation: TradeTicketValidationMessages;
}

export type TradeTicketMessagesInput = Partial<
  Omit<TradeTicketMessages, "validation">
> & {
  validation?: TradeTicketValidationMessages;
};

export const defaultTradeTicketMessages: TradeTicketMessages = {
  submit: "Preview order",
  qty: "Quantity",
  limitPx: "Limit price",
  notional: "Total",
  available: "Available",
  validation: {
    invalid_order: "Order details are invalid.",
    invalid_context: "Trading context is invalid.",
    asset_rules_mismatch: "Asset rules do not match this order.",
    qty_or_notional_required: "Enter a quantity or total.",
    qty_and_notional_conflict: "Use either quantity or total, not both.",
    limit_px_required: "Enter a limit price.",
    unsupported_order_type: "This order type is not supported.",
    unsupported_tif: "This time in force is not supported.",
    notional_not_supported:
      "Value-based orders are not supported for this asset.",
    notional_not_supported_for_order_type:
      "Total is not supported for this order type.",
    extended_hours_not_supported:
      "Extended-hours trading is not supported for this asset.",
    extended_hours_unsupported_order_type:
      "Extended-hours trading is not supported for this order type.",
    extended_hours_unsupported_tif:
      "Extended-hours trading is not supported for this time in force.",
    qty_below_min: ({ assetRules, symbol, locale }) =>
      assetRules.minQty === undefined
        ? "Quantity is below the minimum."
        : `Minimum quantity is ${formatRuleNumber(assetRules.minQty, {
            locale,
            maximumFractionDigits: assetRules.qtyPrecision,
          })} ${symbol}.`,
    qty_above_max: ({ assetRules, symbol, locale }) =>
      assetRules.maxQty === undefined
        ? "Quantity is above the maximum."
        : `Maximum quantity is ${formatRuleNumber(assetRules.maxQty, {
            locale,
            maximumFractionDigits: assetRules.qtyPrecision,
          })} ${symbol}.`,
    notional_below_min: ({ assetRules, quoteCurrency, locale }) =>
      assetRules.minNotional === undefined
        ? "Total is below the minimum."
        : `Minimum total is ${formatRuleNumber(assetRules.minNotional, {
            locale,
            maximumFractionDigits: assetRules.notionalPrecision,
          })} ${quoteCurrency}.`,
    notional_above_max: ({ assetRules, quoteCurrency, locale }) =>
      assetRules.maxNotional === undefined
        ? "Total is above the maximum."
        : `Maximum total is ${formatRuleNumber(assetRules.maxNotional, {
            locale,
            maximumFractionDigits: assetRules.notionalPrecision,
          })} ${quoteCurrency}.`,
    qty_precision_exceeded: "Quantity has too many decimal places.",
    limit_px_precision_exceeded: "Limit price has too many decimal places.",
    notional_precision_exceeded: "Total has too many decimal places.",
    qty_lot_size_mismatch: ({ assetRules, symbol, locale }) =>
      assetRules.lotSize === undefined
        ? "Quantity must align with the lot size."
        : `Quantity must align with lot size ${formatRuleNumber(
            assetRules.lotSize,
            {
              locale,
              maximumFractionDigits: assetRules.qtyPrecision,
            },
          )} ${symbol}.`,
    limit_px_tick_size_mismatch: ({ assetRules, quoteCurrency, locale }) =>
      assetRules.tickSize === undefined
        ? "Limit price must align with the tick size."
        : `Limit price must align with tick size ${formatRuleNumber(
            assetRules.tickSize,
            {
              locale,
              maximumFractionDigits: assetRules.pricePrecision,
            },
          )} ${quoteCurrency}.`,
    notional_quote_increment_mismatch: ({
      assetRules,
      quoteCurrency,
      locale,
    }) =>
      assetRules.quoteIncrement === undefined
        ? "Total must align with the quote increment."
        : `Total must align with quote increment ${formatRuleNumber(
            assetRules.quoteIncrement,
            {
              locale,
              maximumFractionDigits: assetRules.notionalPrecision,
            },
          )} ${quoteCurrency}.`,
    insufficient_cash: "Buying power is not enough for this order.",
    insufficient_asset_qty: "Available quantity is not enough for this order.",
  },
};

export function mergeTradeTicketMessages(
  messages: TradeTicketMessagesInput | undefined,
): TradeTicketMessages {
  return {
    ...defaultTradeTicketMessages,
    ...messages,
    validation: {
      ...defaultTradeTicketMessages.validation,
      ...messages?.validation,
    },
  };
}

export function getValidationMessage(
  issue: OrderValidationIssue | undefined,
  messages: TradeTicketValidationMessages,
  context: TradeTicketValidationMessageBaseContext,
) {
  if (issue === undefined) return undefined;

  const message = messages[issue.code];

  if (message === undefined) return undefined;

  return typeof message === "function" ? message({ ...context, issue }) : message;
}

export function getErrorMessageProps(
  issue: OrderValidationIssue | undefined,
  messages: TradeTicketValidationMessages,
  context: TradeTicketValidationMessageBaseContext,
) {
  const errorMessage = getValidationMessage(issue, messages, context);

  return errorMessage === undefined ? {} : { errorMessage };
}

export function formatMinimum(
  value: number | undefined,
  fallback: string,
  options: { locale: string; maximumFractionDigits: number },
) {
  return value === undefined ? fallback : `Min ${formatRuleNumber(value, options)}`;
}

export function formatRuleNumber(
  value: number,
  {
    locale,
    maximumFractionDigits,
  }: { locale: string; maximumFractionDigits: number },
) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(value);
}
