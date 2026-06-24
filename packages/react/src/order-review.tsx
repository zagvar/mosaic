import { useId } from "react";
import type {
  OrderSummary,
  OrderWarningCode,
  PreparedOrder,
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
  confirmButton?: string;
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
  estimatedNotional: string;
  extendedHours: string;
  yes: string;
  warnings: string;
  warning: Record<OrderWarningCode, string>;
  tifValue: Record<Tif, string>;
  cancel: string;
  confirm: string;
  confirming: string;
}

export type OrderReviewMessagesInput = Partial<
  Omit<OrderReviewMessages, "warning" | "tifValue">
> & {
  warning?: Partial<OrderReviewMessages["warning"]>;
  tifValue?: Partial<OrderReviewMessages["tifValue"]>;
};

export interface OrderReviewProps {
  summary: OrderSummary;
  quoteCurrency: string;
  messages?: OrderReviewMessagesInput;
  classNames?: OrderReviewClassNames;
  quantityFractionDigits?: number;
  priceFractionDigits?: number;
  notionalFractionDigits?: number;
  isDisabled?: boolean;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: (order: PreparedOrder) => void;
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
  estimatedNotional: "Estimated total",
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
  confirm: "Confirm order",
  confirming: "Confirming...",
};

export function OrderReview({
  summary,
  quoteCurrency,
  messages,
  classNames,
  quantityFractionDigits = 8,
  priceFractionDigits = 8,
  notionalFractionDigits = 2,
  isDisabled = false,
  isConfirming = false,
  onCancel,
  onConfirm,
}: OrderReviewProps) {
  const { locale } = useLocale();
  const titleId = useId();
  const text = mergeOrderReviewMessages(messages);
  const { order } = summary;
  const controlsDisabled = isDisabled || isConfirming;

  return (
    <section
      aria-busy={isConfirming}
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
              <li
                key={warning.code}
                {...classNameProps(classNames?.warning)}
              >
                {text.warning[warning.code]}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div {...classNameProps(classNames?.actions)}>
        <button
          type="button"
          disabled={controlsDisabled}
          onClick={onCancel}
          {...classNameProps(classNames?.cancelButton)}
        >
          {text.cancel}
        </button>
        <button
          type="button"
          disabled={controlsDisabled}
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
    tifValue: {
      ...defaultOrderReviewMessages.tifValue,
      ...messages?.tifValue,
    },
  };
}

function formatNumber(value: number, locale: string, maximumFractionDigits: number) {
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
