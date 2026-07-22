import type { OrderListItem, OrderListScope } from "@zagvar/mosaic-core";
import { classNameProps, joinClassNames } from "./class-name.js";
import { formatDateTime, formatDecimal, formatQuoteAmount } from "./format.js";
import type { OrdersPanelClassNames } from "../orders-panel.js";
import type { OrderNumberFormat } from "../order-number-format.js";
import type { OrdersPanelMessages } from "../orders-panel-messages.js";

export function OrderRow({
  order,
  scope,
  locale,
  isDisabled,
  numberFormat,
  messages,
  classNames,
  showActions,
  onSelectOrder,
  onCancelOrder,
  onReplaceOrder,
  isCancelingOrder,
  isReplacingOrder,
}: {
  order: OrderListItem;
  scope: OrderListScope;
  locale: string;
  isDisabled: boolean;
  numberFormat: OrderNumberFormat;
  messages: OrdersPanelMessages;
  classNames: OrdersPanelClassNames | undefined;
  showActions: boolean;
  onSelectOrder: ((order: OrderListItem) => void) | undefined;
  onCancelOrder: ((order: OrderListItem) => void) | undefined;
  onReplaceOrder: ((order: OrderListItem) => void) | undefined;
  isCancelingOrder: ((order: OrderListItem) => boolean) | undefined;
  isReplacingOrder: ((order: OrderListItem) => boolean) | undefined;
}) {
  const quantityUnit = order.baseAsset ?? order.symbol;

  let requestedAmount: string;

  if (order.quantity !== undefined) {
    requestedAmount = `${formatDecimal(
      order.quantity,
      locale,
      numberFormat.quantityFractionDigits,
    )} ${quantityUnit}`;
  } else if (order.notional !== undefined) {
    requestedAmount = formatQuoteAmount(
      order.notional,
      order.quoteCurrency,
      locale,
      numberFormat.notionalFractionDigits,
    );
  } else {
    requestedAmount = messages.unavailable;
  }

  const formattedFilled = `${formatDecimal(
    order.filledQuantity,
    locale,
    numberFormat.quantityFractionDigits,
  )} ${quantityUnit}`;

  const handleSelect =
    onSelectOrder === undefined ? undefined : () => onSelectOrder(order);

  const cancelOrder = onCancelOrder;
  const replaceOrder = onReplaceOrder;

  const handleCancel =
    cancelOrder === undefined || !order.capabilities.cancel
      ? undefined
      : () => cancelOrder(order);

  const handleReplace =
    replaceOrder === undefined || !order.capabilities.replace
      ? undefined
      : () => replaceOrder(order);

  const canceling =
    handleCancel !== undefined && (isCancelingOrder?.(order) ?? false);

  const replacing =
    handleReplace !== undefined && (isReplacingOrder?.(order) ?? false);

  const mutationPending = canceling || replacing;

  const hasRowActions =
    handleSelect !== undefined ||
    handleCancel !== undefined ||
    handleReplace !== undefined;

  return (
    <tr
      data-asset-class={order.assetClass}
      data-side={order.side}
      data-status={order.status}
      {...classNameProps(
        joinClassNames(
          classNames?.row,
          order.side === "buy" ? classNames?.buyRow : classNames?.sellRow,
        ),
      )}
    >
      <td
        data-label={messages.instrument}
        {...classNameProps(classNames?.instrumentCell)}
      >
        <strong {...classNameProps(classNames?.symbol)}>{order.symbol}</strong>
        <span {...classNameProps(classNames?.instrumentMeta)}>
          {[messages.assetClassValue[order.assetClass], order.venue]
            .filter((value) => value !== undefined)
            .join(" · ")}
        </span>
      </td>

      <td
        data-label={messages.order}
        {...classNameProps(classNames?.orderCell)}
      >
        <strong {...classNameProps(classNames?.primary)}>
          {messages.sideValue[order.side]} · {messages.typeValue[order.type]}
        </strong>

        {order.tif === undefined ? null : (
          <span {...classNameProps(classNames?.secondary)}>
            {messages.tifValue[order.tif]}
          </span>
        )}

        {order.extendedHours ? (
          <span {...classNameProps(classNames?.secondary)}>
            {messages.extendedHours}
          </span>
        ) : null}
      </td>

      <td
        data-label={messages.amount}
        {...classNameProps(classNames?.amountCell)}
      >
        <Metric
          label={messages.requested}
          value={requestedAmount}
          classNames={classNames}
        />
        <Metric
          label={messages.filled}
          value={formattedFilled}
          classNames={classNames}
        />

        {order.remainingQuantity === undefined ? null : (
          <Metric
            label={messages.remaining}
            value={`${formatDecimal(
              order.remainingQuantity,
              locale,
              numberFormat.quantityFractionDigits,
            )} ${quantityUnit}`}
            classNames={classNames}
          />
        )}
      </td>

      <td
        data-label={messages.price}
        {...classNameProps(classNames?.priceCell)}
      >
        <PriceMetrics
          order={order}
          locale={locale}
          numberFormat={numberFormat}
          messages={messages}
          classNames={classNames}
        />
      </td>

      <td
        data-label={messages.status}
        {...classNameProps(classNames?.statusCell)}
      >
        <span {...classNameProps(classNames?.statusBadge)}>
          {messages.statusValue[order.status]}
        </span>
      </td>

      <td data-label={messages.time} {...classNameProps(classNames?.timeCell)}>
        <OrderTimes
          order={order}
          scope={scope}
          locale={locale}
          messages={messages}
          classNames={classNames}
        />
      </td>

      {!showActions ? null : (
        <td
          data-label={messages.actions}
          {...classNameProps(classNames?.actionsCell)}
        >
          {!hasRowActions ? (
            <span {...classNameProps(classNames?.secondary)}>
              {messages.unavailable}
            </span>
          ) : (
            <>
              {handleSelect === undefined ? null : (
                <button
                  type="button"
                  aria-label={messages.viewDetailsLabel(order.symbol)}
                  disabled={isDisabled}
                  onClick={handleSelect}
                  {...classNameProps(classNames?.detailsButton)}
                >
                  {messages.viewDetails}
                </button>
              )}

              {handleCancel === undefined ? null : (
                <button
                  type="button"
                  aria-label={
                    canceling
                      ? messages.cancelingLabel(order.symbol)
                      : messages.cancelLabel(order.symbol)
                  }
                  aria-busy={canceling}
                  disabled={isDisabled || mutationPending}
                  onClick={handleCancel}
                  {...classNameProps(classNames?.cancelButton)}
                >
                  {canceling ? messages.canceling : messages.cancel}
                </button>
              )}

              {handleReplace === undefined ? null : (
                <button
                  type="button"
                  aria-label={
                    replacing
                      ? messages.replacingLabel(order.symbol)
                      : messages.replaceLabel(order.symbol)
                  }
                  aria-busy={replacing}
                  disabled={isDisabled || mutationPending}
                  onClick={handleReplace}
                  {...classNameProps(classNames?.replaceButton)}
                >
                  {replacing ? messages.replacing : messages.replace}
                </button>
              )}
            </>
          )}
        </td>
      )}
    </tr>
  );
}

function PriceMetrics({
  order,
  locale,
  numberFormat,
  messages,
  classNames,
}: {
  order: OrderListItem;
  locale: string;
  numberFormat: OrderNumberFormat;
  messages: OrdersPanelMessages;
  classNames: OrdersPanelClassNames | undefined;
}) {
  const prices = [
    order.limitPrice === undefined
      ? undefined
      : {
          label: messages.limitPrice,
          value: formatQuoteAmount(
            order.limitPrice,
            order.quoteCurrency,
            locale,
            numberFormat.priceFractionDigits,
          ),
        },

    order.stopPrice === undefined
      ? undefined
      : {
          label: messages.stopPrice,
          value: formatQuoteAmount(
            order.stopPrice,
            order.quoteCurrency,
            locale,
            numberFormat.priceFractionDigits,
          ),
        },

    order.averageFillPrice === undefined
      ? undefined
      : {
          label: messages.averageFillPrice,
          value: formatQuoteAmount(
            order.averageFillPrice,
            order.quoteCurrency,
            locale,
            numberFormat.priceFractionDigits,
          ),
        },
  ].filter((price) => price !== undefined);

  if (prices.length === 0) {
    return (
      <span {...classNameProps(classNames?.primary)}>
        {order.type === "market" ? messages.marketPrice : messages.unavailable}
      </span>
    );
  }

  return prices.map((price) => (
    <Metric
      key={price.label}
      label={price.label}
      value={price.value}
      classNames={classNames}
    />
  ));
}

function OrderTimes({
  order,
  scope,
  locale,
  messages,
  classNames,
}: {
  order: OrderListItem;
  scope: OrderListScope;
  locale: string;
  messages: OrdersPanelMessages;
  classNames: OrdersPanelClassNames | undefined;
}) {
  const primaryTimestamp =
    scope === "history"
      ? (order.completedAt ?? order.updatedAt)
      : order.updatedAt;

  const primaryLabel =
    scope === "history" && order.completedAt !== undefined
      ? messages.completed
      : messages.updated;

  return (
    <>
      <Timestamp
        label={primaryLabel}
        value={primaryTimestamp}
        locale={locale}
        classNames={classNames}
      />

      {order.submittedAt === primaryTimestamp ? null : (
        <Timestamp
          label={messages.submitted}
          value={order.submittedAt}
          locale={locale}
          classNames={classNames}
        />
      )}
    </>
  );
}

function Timestamp({
  label,
  value,
  locale,
  classNames,
}: {
  label: string;
  value: string;
  locale: string;
  classNames: OrdersPanelClassNames | undefined;
}) {
  const formatted = formatDateTime(value, locale);

  return (
    <span {...classNameProps(classNames?.timestamp)}>
      <span {...classNameProps(classNames?.metricLabel)}>{label}</span>
      <time dateTime={value}>{formatted}</time>
    </span>
  );
}

function Metric({
  label,
  value,
  classNames,
}: {
  label: string;
  value: string;
  classNames: OrdersPanelClassNames | undefined;
}) {
  return (
    <span {...classNameProps(classNames?.metric)}>
      <span {...classNameProps(classNames?.metricLabel)}>{label}</span>
      <span {...classNameProps(classNames?.metricValue)}>{value}</span>
    </span>
  );
}
