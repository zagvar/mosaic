import type {
  AssetClass,
  OrderListScope,
  OrderRecordTif,
  OrderRecordType,
  OrderSide,
  OrderSortDirection,
  OrderSortField,
  OrderStatus,
} from "@zagvar/mosaic-core";

export interface OrdersPanelMessages {
  title: string;

  scopeValue: Record<OrderListScope, string>;
  sideValue: Record<OrderSide, string>;
  typeValue: Record<OrderRecordType, string>;
  tifValue: Record<OrderRecordTif, string>;
  statusValue: Record<OrderStatus, string>;
  assetClassValue: Record<AssetClass, string>;
  sortFieldValue: Record<OrderSortField, string>;
  sortDirectionValue: Record<OrderSortDirection, string>;

  instrument: string;
  order: string;
  amount: string;
  price: string;
  status: string;
  time: string;
  submitted: string;
  updated: string;
  completed: string;
  actions: string;

  requested: string;
  filled: string;
  remaining: string;
  limitPrice: string;
  stopPrice: string;
  averageFillPrice: string;
  marketPrice: string;
  extendedHours: string;
  unavailable: string;

  filters: string;
  symbolFilter: string;
  symbolFilterPlaceholder: string;
  symbolFilterHint: string;
  applySymbolFilter: string;
  invalidSymbolFilter: string;
  sideFilter: string;
  typeFilter: string;
  statusFilter: string;
  allSides: string;
  allTypes: string;
  allStatuses: string;
  clearFilters: string;
  selectedFilterCount: (label: string, count: number) => string;

  sortBy: string;
  sortDirection: string;
  pageSize: string;

  loading: string;
  loadError: string;
  retry: string;
  emptyOpen: string;
  emptyHistory: string;
  noMatches: string;

  pagination: string;
  previousPage: string;
  nextPage: string;
  resultCount: (count: number) => string;

  viewDetails: string;
  cancel: string;
  canceling: string;
  replace: string;
  replacing: string;

  viewDetailsLabel: (symbol: string) => string;
  cancelLabel: (symbol: string) => string;
  replaceLabel: (symbol: string) => string;
  cancelingLabel: (symbol: string) => string;
  replacingLabel: (symbol: string) => string;
}

type NestedMessageKey =
  | "scopeValue"
  | "sideValue"
  | "typeValue"
  | "tifValue"
  | "statusValue"
  | "assetClassValue"
  | "sortFieldValue"
  | "sortDirectionValue";

export type OrdersPanelMessagesInput = Partial<
  Omit<OrdersPanelMessages, NestedMessageKey>
> & {
  scopeValue?: Partial<OrdersPanelMessages["scopeValue"]>;
  sideValue?: Partial<OrdersPanelMessages["sideValue"]>;
  typeValue?: Partial<OrdersPanelMessages["typeValue"]>;
  tifValue?: Partial<OrdersPanelMessages["tifValue"]>;
  statusValue?: Partial<OrdersPanelMessages["statusValue"]>;
  assetClassValue?: Partial<OrdersPanelMessages["assetClassValue"]>;
  sortFieldValue?: Partial<OrdersPanelMessages["sortFieldValue"]>;
  sortDirectionValue?: Partial<OrdersPanelMessages["sortDirectionValue"]>;
};

export const defaultOrdersPanelMessages: OrdersPanelMessages = {
  title: "Orders",

  scopeValue: {
    open: "Open orders",
    history: "Order history",
  },

  sideValue: {
    buy: "Buy",
    sell: "Sell",
  },

  typeValue: {
    market: "Market",
    limit: "Limit",
    stop: "Stop",
    stop_limit: "Stop limit",
    trailing_stop: "Trailing stop",
    trailing_stop_limit: "Trailing stop limit",
    other: "Other",
  },

  tifValue: {
    day: "Day",
    gtc: "Good 'til canceled",
    gtd: "Good 'til date",
    opg: "At the open",
    cls: "At the close",
    ioc: "Immediate or cancel",
    fok: "Fill or kill",
    other: "Other",
  },

  statusValue: {
    pending: "Pending",
    open: "Open",
    partially_filled: "Partially filled",
    held: "Held",
    pending_cancel: "Cancel pending",
    pending_replace: "Replace pending",
    filled: "Filled",
    canceled: "Canceled",
    expired: "Expired",
    rejected: "Rejected",
    replaced: "Replaced",
    unknown: "Unknown",
  },

  assetClassValue: {
    equity: "Equity",
    crypto: "Crypto",
    fx: "Foreign exchange",
    commodity: "Commodity",
    index: "Index",
    fund: "Fund",
    option: "Option",
    future: "Future",
    other: "Other",
  },

  sortFieldValue: {
    submittedAt: "Submitted",
    updatedAt: "Updated",
    completedAt: "Completed",
    symbol: "Symbol",
    status: "Status",
    side: "Side",
    type: "Order type",
    filledQuantity: "Filled quantity",
  },

  sortDirectionValue: {
    asc: "Ascending",
    desc: "Descending",
  },

  instrument: "Instrument",
  order: "Order",
  amount: "Amount",
  price: "Price",
  status: "Status",
  time: "Time",
  submitted: "Submitted",
  updated: "Updated",
  completed: "Completed",
  actions: "Actions",

  requested: "Requested",
  filled: "Filled",
  remaining: "Remaining",
  limitPrice: "Limit",
  stopPrice: "Stop",
  averageFillPrice: "Average fill",
  marketPrice: "Market",
  extendedHours: "Extended hours",
  unavailable: "—",

  filters: "Filters",
  symbolFilter: "Symbol",
  symbolFilterPlaceholder: "AAPL, BTC/USD",
  symbolFilterHint: "Separate multiple exact symbols with commas.",
  applySymbolFilter: "Apply symbol filter",
  invalidSymbolFilter:
    "Enter no more than 100 symbols, with at most 64 characters each.",
  sideFilter: "Side",
  typeFilter: "Order type",
  statusFilter: "Status",
  allSides: "All sides",
  allTypes: "All order types",
  allStatuses: "All statuses",
  clearFilters: "Clear filters",
  selectedFilterCount: (label, count) => `${label} (${count})`,

  sortBy: "Sort by",
  sortDirection: "Sort direction",
  pageSize: "Rows per page",

  loading: "Loading orders...",
  loadError: "We couldn't load orders.",
  retry: "Try again",
  emptyOpen: "No open orders.",
  emptyHistory: "No order history.",
  noMatches: "No orders match the selected filters.",

  pagination: "Order pages",
  previousPage: "Previous page",
  nextPage: "Next page",
  resultCount: (count) => `${count} ${count === 1 ? "order" : "orders"}`,

  viewDetails: "Details",
  cancel: "Cancel",
  canceling: "Canceling...",
  replace: "Replace",
  replacing: "Replacing...",

  viewDetailsLabel: (symbol) => `View ${symbol} order details`,
  cancelLabel: (symbol) => `Cancel ${symbol} order`,
  replaceLabel: (symbol) => `Replace ${symbol} order`,
  cancelingLabel: (symbol) => `Canceling ${symbol} order`,
  replacingLabel: (symbol) => `Replacing ${symbol} order`,
};

export function mergeOrdersPanelMessages(
  messages: OrdersPanelMessagesInput | undefined,
): OrdersPanelMessages {
  return {
    ...defaultOrdersPanelMessages,
    ...messages,
    scopeValue: {
      ...defaultOrdersPanelMessages.scopeValue,
      ...messages?.scopeValue,
    },
    sideValue: {
      ...defaultOrdersPanelMessages.sideValue,
      ...messages?.sideValue,
    },
    typeValue: {
      ...defaultOrdersPanelMessages.typeValue,
      ...messages?.typeValue,
    },
    tifValue: {
      ...defaultOrdersPanelMessages.tifValue,
      ...messages?.tifValue,
    },
    statusValue: {
      ...defaultOrdersPanelMessages.statusValue,
      ...messages?.statusValue,
    },
    assetClassValue: {
      ...defaultOrdersPanelMessages.assetClassValue,
      ...messages?.assetClassValue,
    },
    sortFieldValue: {
      ...defaultOrdersPanelMessages.sortFieldValue,
      ...messages?.sortFieldValue,
    },
    sortDirectionValue: {
      ...defaultOrdersPanelMessages.sortDirectionValue,
      ...messages?.sortDirectionValue,
    },
  };
}
