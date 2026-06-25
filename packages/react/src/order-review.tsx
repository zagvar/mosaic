import { useId } from "react";
import type {
  MarketDataMode,
  MarketPriceKind,
  OrderExecutionError,
  OrderExecutionErrorCode,
  OrderFeeType,
  OrderIntent,
  OrderSummary,
  OrderWarningCode,
  Tif,
} from "@mosaic/core";
import { useLocale } from "react-aria-components";
import { classNameProps } from "./internal/class-name";

export interface OrderReviewClassNames {
  root?: string;
  title?: string;
  details?: string;
  row?: string;
  term?: string;
  value?: string;
  warnings?: string;
  warningsTitle?: string;
  warningList?: string;
  warning?: string;
  actions?: string;
  cancelButton?: string;
  refreshButton?: string;
  confirmButton?: string;
  confirmationError?: string;
}

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
  qty: string;
  notional: string;
  limitPx: string;
  estimatedFillPx: string;
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

export interface OrderReviewProps {
  summary: OrderSummary;
  quoteCurrency: string;
  marketReferenceDisplay?: "hidden" | "price" | "full";
  messages?: OrderReviewMessagesInput;
  classNames?: OrderReviewClassNames;
  quantityFractionDigits?: number;
  priceFractionDigits?: number;
  notionalFractionDigits?: number;
  isDisabled?: boolean;
  isConfirming?: boolean;
  isRefreshingPreview?: boolean;
  confirmationError?: string | OrderExecutionError | null;
  onCancel: () => void;
  onRefreshPreview?: (order: OrderIntent) => void;
  onConfirm: (order: OrderIntent) => void;
}

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
  qty: "Quantity",
  notional: "Total",
  limitPx: "Limit price",
  estimatedFillPx: "Estimated fill price",
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
    insufficient_asset_qty:
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

export function OrderReview({
  summary,
  quoteCurrency,
  marketReferenceDisplay = "hidden",
  messages,
  classNames,
  quantityFractionDigits = 8,
  priceFractionDigits = 8,
  notionalFractionDigits = 2,
  isDisabled = false,
  isConfirming = false,
  isRefreshingPreview = false,
  confirmationError,
  onCancel,
  onRefreshPreview,
  onConfirm,
}: OrderReviewProps) {
  const { locale } = useLocale();
  const titleId = useId();
  const text = mergeOrderReviewMessages(messages);
  const { order } = summary;
  const previewExpired = hasWarning(summary, "preview_expired");
  const controlsDisabled =
    isDisabled || isConfirming || isRefreshingPreview;
  const confirmDisabled = controlsDisabled || previewExpired;
  const confirmationErrorMessage = getConfirmationErrorMessage(
    confirmationError,
    text.confirmationError,
  );

  return (
    <section
      aria-busy={isConfirming || isRefreshingPreview}
      aria-labelledby={titleId}
      {...classNameProps(classNames?.root)}
    >
      <h2 id={titleId} {...classNameProps(classNames?.title)}>
        {text.title}
      </h2>

      <dl {...classNameProps(classNames?.details)}>
        <ReviewRow
          label={text.symbol}
          value={order.symbol}
          classNames={classNames}
        />
        <ReviewRow
          label={text.side}
          value={text[order.side]}
          classNames={classNames}
        />
        <ReviewRow
          label={text.orderType}
          value={text[order.type]}
          classNames={classNames}
        />

        {order.tif === undefined ? null : (
          <ReviewRow
            label={text.tif}
            value={text.tifValue[order.tif]}
            classNames={classNames}
          />
        )}

        {order.qty === undefined ? null : (
          <ReviewRow
            label={text.qty}
            value={`${formatNumber(order.qty, locale, quantityFractionDigits)} ${order.symbol}`}
            classNames={classNames}
          />
        )}

        {order.notional === undefined ? null : (
          <ReviewRow
            label={text.notional}
            value={formatQuoteAmount(
              order.notional,
              quoteCurrency,
              locale,
              notionalFractionDigits,
            )}
            classNames={classNames}
          />
        )}

        {order.limitPx === undefined ? null : (
          <ReviewRow
            label={text.limitPx}
            value={formatQuoteAmount(
              order.limitPx,
              quoteCurrency,
              locale,
              priceFractionDigits,
            )}
            classNames={classNames}
          />
        )}

        {order.type !== "market" ||
        summary.quotePreview?.estimatedFillPx === undefined ? null : (
          <ReviewRow
            label={text.estimatedFillPx}
            value={formatQuoteAmount(
              summary.quotePreview.estimatedFillPx,
              quoteCurrency,
              locale,
              priceFractionDigits,
            )}
            classNames={classNames}
          />
        )}

        {summary.estimatedNotional === undefined ? null : (
          <ReviewRow
            label={text.estimatedNotional}
            value={formatQuoteAmount(
              summary.estimatedNotional,
              quoteCurrency,
              locale,
              notionalFractionDigits,
            )}
            classNames={classNames}
          />
        )}

        {summary.marketReference === undefined ||
        marketReferenceDisplay === "hidden" ? null : (
          <>
            <ReviewRow
              label={text.marketReference(
                text.marketPriceKind[summary.marketReference.kind],
              )}
              value={formatQuoteAmount(
                summary.marketReference.px,
                quoteCurrency,
                locale,
                priceFractionDigits,
              )}
              classNames={classNames}
            />

            {marketReferenceDisplay !== "full" ||
            summary.marketReference.mode === undefined ? null : (
              <ReviewRow
                label={text.marketDataMode}
                value={text.marketDataModeValue[summary.marketReference.mode]}
                classNames={classNames}
              />
            )}

            {marketReferenceDisplay !== "full" ||
            summary.marketReference.displaySource === undefined ? null : (
              <ReviewRow
                label={text.marketDataSource}
                value={summary.marketReference.displaySource}
                classNames={classNames}
              />
            )}

            {marketReferenceDisplay === "full" ? (
              <ReviewRow
                label={text.marketObservedAt}
                value={formatDateTime(
                  summary.marketReference.observedAt,
                  locale,
                )}
                classNames={classNames}
              />
            ) : null}
          </>
        )}

        {summary.fees?.map((fee, index) => (
          <ReviewRow
            key={`${fee.type}:${fee.currency}:${index}`}
            label={text.estimatedFee(text.feeType[fee.type])}
            value={formatQuoteAmount(
              fee.amount,
              fee.currency,
              locale,
              fee.fractionDigits ?? notionalFractionDigits,
            )}
            classNames={classNames}
          />
        ))}

        {order.extendedHours ? (
          <ReviewRow
            label={text.extendedHours}
            value={text.yes}
            classNames={classNames}
          />
        ) : null}
      </dl>

      {summary.warnings.length === 0 ? null : (
        <div {...classNameProps(classNames?.warnings)}>
          <h3 {...classNameProps(classNames?.warningsTitle)}>
            {text.warnings}
          </h3>
          <ul {...classNameProps(classNames?.warningList)}>
            {summary.warnings.map((warning) => (
              <li key={warning.code} {...classNameProps(classNames?.warning)}>
                {getWarningMessage(warning.code, summary, text, locale)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmationErrorMessage ? (
        <p role="alert" {...classNameProps(classNames?.confirmationError)}>
          {confirmationErrorMessage}
        </p>
      ) : null}

      <div {...classNameProps(classNames?.actions)}>
        <button
          type="button"
          disabled={controlsDisabled}
          onClick={onCancel}
          {...classNameProps(classNames?.cancelButton)}
        >
          {text.cancel}
        </button>

        {previewExpired && onRefreshPreview !== undefined ? (
          <button
            type="button"
            disabled={controlsDisabled}
            onClick={() => onRefreshPreview(order)}
            {...classNameProps(classNames?.refreshButton)}
          >
            {isRefreshingPreview
              ? text.refreshingPreview
              : text.refreshPreview}
          </button>
        ) : null}

        <button
          type="button"
          disabled={confirmDisabled}
          onClick={() => onConfirm(order)}
          {...classNameProps(classNames?.confirmButton)}
        >
          {isConfirming ? text.confirming : text.confirm}
        </button>
      </div>
    </section>
  );
}

function ReviewRow({
  label,
  value,
  classNames,
}: {
  label: string;
  value: string;
  classNames: OrderReviewClassNames | undefined;
}) {
  return (
    <div {...classNameProps(classNames?.row)}>
      <dt {...classNameProps(classNames?.term)}>{label}</dt>
      <dd {...classNameProps(classNames?.value)}>{value}</dd>
    </div>
  );
}

function mergeOrderReviewMessages(
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

function getConfirmationErrorMessage(
  error: string | OrderExecutionError | null | undefined,
  messages: Record<OrderExecutionErrorCode, string>,
) {
  if (error === null || error === undefined) return undefined;

  return typeof error === "string" ? error : messages[error.code];
}

function getWarningMessage(
  code: OrderWarningCode,
  summary: OrderSummary,
  messages: OrderReviewMessages,
  locale: string,
) {
  if (
    code === "slippage_high" &&
    summary.quotePreview?.slippageBps !== undefined
  ) {
    return messages.highSlippage(
      formatBasisPoints(summary.quotePreview.slippageBps, locale),
    );
  }

  return messages.warning[code];
}

function hasWarning(summary: OrderSummary, code: OrderWarningCode) {
  return summary.warnings.some((warning) => warning.code === code);
}

function formatNumber(
  value: number,
  locale: string,
  maximumFractionDigits: number,
) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    useGrouping: true,
  }).format(value);
}

function formatQuoteAmount(
  value: number,
  quoteCurrency: string,
  locale: string,
  maximumFractionDigits: number,
) {
  return `${formatNumber(value, locale, maximumFractionDigits)} ${quoteCurrency}`;
}

function formatDateTime(value: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(value);
}

function formatBasisPoints(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    style: "percent",
  }).format(value / 10_000);
}
