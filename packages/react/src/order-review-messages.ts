import type {
  MarketDataMode,
  MarketPriceKind,
  OrderExecutionErrorCode,
  OrderFeeType,
  OrderWarningCode,
  Tif,
} from "@zagvar/mosaic-core";

export interface OrderReviewMessages {
  title: string;
  symbol: string;
  side: string;
  buy: string;
  sell: string;
  orderType: string;
  market: string;
  limit: string;
  tif: string;
  quantity: string;
  notional: string;
  limitPrice: string;
  estimatedFillPrice: string;
  estimatedNotional: string;
  marketReference: (priceKind: string) => string;
  marketPriceKind: Record<MarketPriceKind, string>;
  marketDataMode: string;
  marketDataModeValue: Record<MarketDataMode, string>;
  marketDataSource: string;
  marketObservedAt: string;
  estimatedFee: (feeType: string) => string;
  highSlippage: (formattedPercent: string) => string;
  feeType: Record<OrderFeeType, string>;
  extendedHours: string;
  yes: string;
  warnings: string;
  warning: Record<OrderWarningCode, string>;
  confirmationError: Record<OrderExecutionErrorCode, string>;
  tifValue: Record<Tif, string>;
  cancel: string;
  refreshPreview: string;
  refreshingPreview: string;
  confirm: string;
  confirming: string;
}

export type OrderReviewMessagesInput = Partial<
  Omit<
    OrderReviewMessages,
    | "warning"
    | "confirmationError"
    | "feeType"
    | "marketPriceKind"
    | "marketDataModeValue"
    | "tifValue"
  >
> & {
  warning?: Partial<OrderReviewMessages["warning"]>;
  confirmationError?: Partial<OrderReviewMessages["confirmationError"]>;
  feeType?: Partial<OrderReviewMessages["feeType"]>;
  marketPriceKind?: Partial<OrderReviewMessages["marketPriceKind"]>;
  marketDataModeValue?: Partial<OrderReviewMessages["marketDataModeValue"]>;
  tifValue?: Partial<OrderReviewMessages["tifValue"]>;
};

export const defaultOrderReviewMessages: OrderReviewMessages = {
  title: "Review order",
  symbol: "Symbol",
  side: "Side",
  buy: "Buy",
  sell: "Sell",
  orderType: "Order type",
  market: "Market",
  limit: "Limit",
  tif: "Time in force",
  quantity: "Quantity",
  notional: "Total",
  limitPrice: "Limit price",
  estimatedFillPrice: "Estimated fill price",
  estimatedNotional: "Estimated total",
  marketReference: (priceKind) => `${priceKind} reference price`,
  marketPriceKind: {
    bid: "Bid",
    ask: "Ask",
    last: "Last",
    mid: "Mid",
    mark: "Mark",
  },
  marketDataMode: "Market data",
  marketDataModeValue: {
    real_time: "Real-time",
    delayed: "Delayed",
    indicative: "Indicative",
  },
  marketDataSource: "Data source",
  marketObservedAt: "Price observed",
  estimatedFee: (feeType) => `Estimated fee: ${feeType}`,
  highSlippage: (formattedPercent) =>
    `Estimated price movement is ${formattedPercent}.`,
  feeType: {
    commission: "Commission",
    regulatory: "Regulatory fee",
    clearing: "Clearing fee",
    tax: "Tax",
    other: "Other fee",
  },
  extendedHours: "Extended hours",
  yes: "Yes",
  warnings: "Important information",
  warning: {
    estimated_notional:
      "The displayed total is an estimate and may differ from execution.",
    extended_hours:
      "Extended-hours orders may have lower liquidity and wider spreads.",
    market_price_not_guaranteed:
      "A market order's execution price is not guaranteed.",
    market_data_stale:
      "The market price used for this review may be out of date.",
    market_data_delayed: "The market price used for this review is delayed.",
    market_data_indicative:
      "The market price used for this review is indicative.",
    slippage_high:
      "Estimated slippage is above the configured review threshold.",
    preview_expired:
      "This order preview has expired. Refresh it before confirming.",
  },
  confirmationError: {
    unknown: "We couldn't confirm this order. Please try again.",
    network_error: "The broker could not be reached. Please try again.",
    broker_rejected: "The broker rejected this order.",
    insufficient_buying_power:
      "Buying power is no longer sufficient for this order.",
    insufficient_asset_quantity:
      "Available quantity is no longer sufficient for this order.",
    market_closed: "The market is closed for this order.",
    price_changed: "The price changed. Review the order before trying again.",
    quote_expired: "The quote expired. Return to the ticket and review it.",
    order_not_allowed: "This order is not allowed by the broker.",
    rate_limited: "Too many requests were made. Please wait and try again.",
  },
  tifValue: {
    day: "Day",
    gtc: "Good 'til canceled",
    opg: "At the open",
    cls: "At the close",
    ioc: "Immediate or cancel",
    fok: "Fill or kill",
  },
  cancel: "Back",
  refreshPreview: "Refresh preview",
  refreshingPreview: "Refreshing...",
  confirm: "Confirm order",
  confirming: "Confirming...",
};

export function mergeOrderReviewMessages(
  messages: OrderReviewMessagesInput | undefined,
): OrderReviewMessages {
  return {
    ...defaultOrderReviewMessages,
    ...messages,
    warning: {
      ...defaultOrderReviewMessages.warning,
      ...messages?.warning,
    },
    confirmationError: {
      ...defaultOrderReviewMessages.confirmationError,
      ...messages?.confirmationError,
    },
    feeType: {
      ...defaultOrderReviewMessages.feeType,
      ...messages?.feeType,
    },
    marketPriceKind: {
      ...defaultOrderReviewMessages.marketPriceKind,
      ...messages?.marketPriceKind,
    },
    marketDataModeValue: {
      ...defaultOrderReviewMessages.marketDataModeValue,
      ...messages?.marketDataModeValue,
    },
    tifValue: {
      ...defaultOrderReviewMessages.tifValue,
      ...messages?.tifValue,
    },
  };
}
