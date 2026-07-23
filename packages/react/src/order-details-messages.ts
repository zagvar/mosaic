import type {
  AssetClass,
  OrderFeeType,
  OrderLiquidity,
  OrderRecordTif,
  OrderRecordType,
  OrderSide,
  OrderStatus,
  OrderStatusReasonCode,
} from "@zagvar/mosaic-core";
import { defaultOrdersPanelMessages } from "./orders-panel-messages.js";

export interface OrderDetailsMessages {
  title: (symbol: string) => string;
  close: string;
  closeLabel: (symbol: string) => string;

  summary: string;
  fills: string;
  fees: string;
  timeline: string;

  noFills: string;
  noFees: string;
  noEvents: string;

  instrument: string;
  assetClass: string;
  venue: string;
  accountId: string;
  orderId: string;
  clientOrderId: string;

  side: string;
  orderType: string;
  tif: string;
  status: string;
  statusReason: string;
  quoteCurrency: string;

  requested: string;
  filledQuantity: string;
  remainingQuantity: string;
  filledNotional: string;

  limitPrice: string;
  stopPrice: string;
  averageFillPrice: string;

  extendedHours: string;
  submittedAt: string;
  updatedAt: string;
  completedAt: string;
  expiresAt: string;

  replacesOrder: string;
  replacedByOrder: string;
  viewRelatedOrderLabel: (orderId: string) => string;

  fillId: string;
  feeId: string;
  eventId: string;
  timestamp: string;
  quantity: string;
  price: string;
  notional: string;
  liquidity: string;
  feeType: string;
  amount: string;
  relatedFill: string;
  reason: string;

  yes: string;
  no: string;
  unavailable: string;

  actions: string;
  cancel: string;
  canceling: string;
  replace: string;
  replacing: string;
  cancelLabel: (symbol: string) => string;
  cancelingLabel: (symbol: string) => string;
  replaceLabel: (symbol: string) => string;
  replacingLabel: (symbol: string) => string;

  sideValue: Record<OrderSide, string>;
  typeValue: Record<OrderRecordType, string>;
  tifValue: Record<OrderRecordTif, string>;
  statusValue: Record<OrderStatus, string>;
  assetClassValue: Record<AssetClass, string>;
  liquidityValue: Record<OrderLiquidity, string>;
  feeTypeValue: Record<OrderFeeType, string>;
  reasonValue: Record<OrderStatusReasonCode, string>;
}

type NestedMessageKey =
  | "sideValue"
  | "typeValue"
  | "tifValue"
  | "statusValue"
  | "assetClassValue"
  | "liquidityValue"
  | "feeTypeValue"
  | "reasonValue";

export type OrderDetailsMessagesInput = Partial<
  Omit<OrderDetailsMessages, NestedMessageKey>
> & {
  sideValue?: Partial<OrderDetailsMessages["sideValue"]>;
  typeValue?: Partial<OrderDetailsMessages["typeValue"]>;
  tifValue?: Partial<OrderDetailsMessages["tifValue"]>;
  statusValue?: Partial<OrderDetailsMessages["statusValue"]>;
  assetClassValue?: Partial<OrderDetailsMessages["assetClassValue"]>;
  liquidityValue?: Partial<OrderDetailsMessages["liquidityValue"]>;
  feeTypeValue?: Partial<OrderDetailsMessages["feeTypeValue"]>;
  reasonValue?: Partial<OrderDetailsMessages["reasonValue"]>;
};

export const defaultOrderDetailsMessages: OrderDetailsMessages = {
  title: (symbol) => `${symbol} order details`,
  close: "Close",
  closeLabel: (symbol) => `Close ${symbol} order details`,

  summary: "Order summary",
  fills: "Fills",
  fees: "Fees",
  timeline: "Order timeline",

  noFills: "No fills have been reported.",
  noFees: "No fees have been reported.",
  noEvents: "No lifecycle events have been reported.",

  instrument: "Instrument",
  assetClass: "Asset class",
  venue: "Venue",
  accountId: "Account",
  orderId: "Order ID",
  clientOrderId: "Client order ID",

  side: "Side",
  orderType: "Order type",
  tif: "Time in force",
  status: "Status",
  statusReason: "Status reason",
  quoteCurrency: "Quote currency",

  requested: "Requested",
  filledQuantity: "Filled quantity",
  remainingQuantity: "Remaining quantity",
  filledNotional: "Filled total",

  limitPrice: "Limit price",
  stopPrice: "Stop price",
  averageFillPrice: "Average fill price",

  extendedHours: "Extended hours",
  submittedAt: "Submitted",
  updatedAt: "Updated",
  completedAt: "Completed",
  expiresAt: "Expires",

  replacesOrder: "Replaces order",
  replacedByOrder: "Replaced by order",
  viewRelatedOrderLabel: (orderId) => `View related order ${orderId}`,

  fillId: "Fill ID",
  feeId: "Fee ID",
  eventId: "Event ID",
  timestamp: "Timestamp",
  quantity: "Quantity",
  price: "Price",
  notional: "Total",
  liquidity: "Liquidity",
  feeType: "Fee type",
  amount: "Amount",
  relatedFill: "Related fill",
  reason: "Reason",

  yes: "Yes",
  no: "No",
  unavailable: "—",

  actions: "Order actions",
  cancel: "Cancel order",
  canceling: "Canceling...",
  replace: "Replace order",
  replacing: "Replacing...",
  cancelLabel: (symbol) => `Cancel ${symbol} order`,
  cancelingLabel: (symbol) => `Canceling ${symbol} order`,
  replaceLabel: (symbol) => `Replace ${symbol} order`,
  replacingLabel: (symbol) => `Replacing ${symbol} order`,

  sideValue: defaultOrdersPanelMessages.sideValue,
  typeValue: defaultOrdersPanelMessages.typeValue,
  tifValue: defaultOrdersPanelMessages.tifValue,
  statusValue: defaultOrdersPanelMessages.statusValue,
  assetClassValue: defaultOrdersPanelMessages.assetClassValue,

  liquidityValue: {
    maker: "Maker",
    taker: "Taker",
    unknown: "Unknown",
  },

  feeTypeValue: {
    commission: "Commission",
    regulatory: "Regulatory fee",
    clearing: "Clearing fee",
    tax: "Tax",
    other: "Other fee",
  },

  reasonValue: {
    user_requested: "User requested",
    time_in_force: "Time in force",
    insufficient_buying_power: "Insufficient buying power",
    insufficient_asset_quantity: "Insufficient asset quantity",
    market_closed: "Market closed",
    risk_rejected: "Risk rejected",
    self_trade_prevention: "Self-trade prevention",
    corporate_action: "Corporate action",
    broker: "Broker",
    venue: "Venue",
    other: "Other",
    unknown: "Unknown",
  },
};

export function mergeOrderDetailsMessages(
  messages: OrderDetailsMessagesInput | undefined,
): OrderDetailsMessages {
  return {
    ...defaultOrderDetailsMessages,
    ...messages,

    sideValue: {
      ...defaultOrderDetailsMessages.sideValue,
      ...messages?.sideValue,
    },

    typeValue: {
      ...defaultOrderDetailsMessages.typeValue,
      ...messages?.typeValue,
    },

    tifValue: {
      ...defaultOrderDetailsMessages.tifValue,
      ...messages?.tifValue,
    },

    statusValue: {
      ...defaultOrderDetailsMessages.statusValue,
      ...messages?.statusValue,
    },

    assetClassValue: {
      ...defaultOrderDetailsMessages.assetClassValue,
      ...messages?.assetClassValue,
    },

    liquidityValue: {
      ...defaultOrderDetailsMessages.liquidityValue,
      ...messages?.liquidityValue,
    },

    feeTypeValue: {
      ...defaultOrderDetailsMessages.feeTypeValue,
      ...messages?.feeTypeValue,
    },

    reasonValue: {
      ...defaultOrderDetailsMessages.reasonValue,
      ...messages?.reasonValue,
    },
  };
}
