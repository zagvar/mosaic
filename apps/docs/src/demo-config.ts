import type { AssetRules, MarketQuote } from "@mosaic/core";
import type {
  OrderBookClassNames,
  OrderReviewClassNames,
  QuoteDisplayClassNames,
  RecentTradesClassNames,
  TradeTicketClassNames,
} from "@mosaic/react";

export const appleRules: AssetRules = {
  assetClass: "equity",
  symbol: "AAPL",
  allowedOrderTypes: ["market", "limit"],
  allowedTifs: ["day", "gtc", "opg", "cls", "ioc", "fok"],
  supportsNotional: true,
  notionalOrderTypes: ["market"],
  minQty: 0.000001,
  minNotional: 1,
  minPrice: 0.01,
  maxPrice: 1000,
  qtyPrecision: 6,
  pricePrecision: 2,
  notionalPrecision: 2,
  lotSize: 0.000001,
  tickSize: 0.01,
  quoteIncrement: 0.01,
  extendedHours: {
    allowed: true,
    allowedOrderTypes: ["limit"],
    allowedTifs: ["day", "gtc"],
  },
};

export const bitcoinRules: AssetRules = {
  assetClass: "crypto",
  symbol: "BTC/USD",
  allowedOrderTypes: ["market", "limit"],
  allowedTifs: ["gtc", "ioc"],
  supportsNotional: true,
  notionalOrderTypes: ["market"],
  minQty: 0.000001,
  minNotional: 1,
  minPrice: 0.01,
  qtyPrecision: 6,
  pricePrecision: 2,
  notionalPrecision: 2,
  lotSize: 0.000001,
  tickSize: 0.01,
  quoteIncrement: 0.01,
};

export const latestPrice = 195.75;
export const bidPrice = 195.7;
export const askPrice = 195.8;

export const appleQuote: MarketQuote = {
  symbol: "AAPL",
  assetClass: "equity",
  bidPx: bidPrice,
  bidQty: 120,
  askPx: askPrice,
  askQty: 95,
  lastPx: latestPrice,
  observedAt: Date.now(),
  mode: "real_time",
  displaySource: "Demo feed",
};

const sideToggleClassNames = {
  root: "demo-segmented-radio",
  label: "demo-field-label",
  options: "demo-segmented-radio-options",
  field: "demo-segmented-radio-field demo-side-toggle-field",
  button: "demo-segmented-radio-button",
};

const orderTypeToggleClassNames = {
  root: "demo-segmented-radio",
  label: "demo-field-label",
  options: "demo-segmented-radio-options",
  field: "demo-segmented-radio-field",
  button: "demo-segmented-radio-button",
};

export const tradeTicketClassNames: TradeTicketClassNames = {
  root: "demo-trade-ticket",
  availableBalance: {
    root: "demo-available-balance",
    label: "demo-available-balance-label",
    value: "demo-available-balance-value",
  },
  sideToggle: sideToggleClassNames,
  typeToggle: orderTypeToggleClassNames,
  tifSelect: {
    root: "demo-tif-select",
    label: "demo-field-label",
    trigger: "demo-tif-select-trigger",
    value: "demo-tif-select-value",
    indicator: "demo-tif-select-indicator",
    popover: "demo-tif-select-popover",
    listBox: "demo-tif-select-listbox",
    item: "demo-tif-select-item",
  },
  numberField: {
    root: "demo-number-field",
    label: "demo-field-label",
    control: "demo-number-field-control",
    input: "demo-number-field-input",
    suffix: "demo-number-field-suffix",
    description: "demo-field-description",
    error: "demo-field-error",
  },
  amountPresets: {
    root: "demo-amount-presets",
    button: "demo-amount-preset-button",
  },
  alert: "demo-alert",
  submitButton: "demo-submit-button",
};

export const quoteDisplayClassNames: QuoteDisplayClassNames = {
  root: "demo-quote-display",
  symbol: "demo-quote-symbol",
  quotes: "demo-quote-grid",
  quote: "demo-quote",
  label: "demo-quote-label",
  price: "demo-quote-price",
  quantity: "demo-quote-quantity",
  spread: "demo-quote-spread",
};

export const orderBookClassNames: OrderBookClassNames = {
  root: "demo-order-book",
  header: "demo-order-book-header",
  title: "demo-order-book-title",
  table: "demo-order-book-table",
  side: "demo-order-book-side",
  columnHeaders: "demo-order-book-columns",
  columnHeader: "demo-order-book-column",
  levels: "demo-order-book-levels",
  level: "demo-order-book-level",
  bidLevel: "demo-order-book-bid",
  askLevel: "demo-order-book-ask",
  depthBar: "demo-order-book-depth",
  price: "demo-order-book-price",
  quantity: "demo-order-book-quantity",
  total: "demo-order-book-total",
  spread: "demo-order-book-spread",
  empty: "demo-order-book-empty",
};

export const orderReviewClassNames: OrderReviewClassNames = {
  root: "demo-order-review",
  title: "demo-order-review-title",
  details: "demo-order-review-details",
  row: "demo-order-review-row",
  term: "demo-order-review-term",
  value: "demo-order-review-value",
  warnings: "demo-order-review-warnings",
  warningsTitle: "demo-order-review-warnings-title",
  warningList: "demo-order-review-warning-list",
  warning: "demo-order-review-warning",
  actions: "demo-order-review-actions",
  cancelButton: "demo-order-review-cancel",
  refreshButton: "demo-order-review-refresh",
  confirmButton: "demo-order-review-confirm",
  confirmationError: "demo-order-review-error",
};

export const recentTradesClassNames: RecentTradesClassNames = {
  root: "demo-recent-trades",
  header: "demo-recent-trades-header",
  title: "demo-recent-trades-title",
  table: "demo-recent-trades-table",
  columns: "demo-recent-trades-columns",
  column: "demo-recent-trades-column",
  rows: "demo-recent-trades-rows",
  row: "demo-recent-trades-row",
  buyRow: "demo-recent-trades-buy",
  sellRow: "demo-recent-trades-sell",
  unknownRow: "demo-recent-trades-unknown",
  price: "demo-recent-trades-price",
  quantity: "demo-recent-trades-quantity",
  time: "demo-recent-trades-time",
  empty: "demo-recent-trades-empty",
};
