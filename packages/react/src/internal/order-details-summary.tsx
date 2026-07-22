import { useId, type ReactNode } from "react";
import type { OrderListItem } from "@zagvar/mosaic-core";
import { classNameProps } from "./class-name.js";
import { formatDateTime, formatDecimal, formatQuoteAmount } from "./format.js";
import type { OrderDetailsClassNames } from "../order-details.js";
import type { OrderDetailsMessages } from "../order-details-messages.js";
import type { OrderNumberFormat } from "../order-number-format.js";

export function OrderDetailsSummary({
  order,
  locale,
  numberFormat,
  isDisabled,
  messages,
  classNames,
  onSelectRelatedOrder,
}: {
  order: OrderListItem;
  locale: string;
  numberFormat: OrderNumberFormat;
  isDisabled: boolean;
  messages: OrderDetailsMessages;
  classNames: OrderDetailsClassNames | undefined;
  onSelectRelatedOrder: ((orderId: string) => void) | undefined;
}) {
  const titleId = useId();
  const quantityUnit = order.baseAsset ?? order.symbol;
  const requested = getRequestedAmount(
    order,
    quantityUnit,
    locale,
    numberFormat,
    messages,
  );

  return (
    <section aria-labelledby={titleId} {...classNameProps(classNames?.summary)}>
      <h3 id={titleId} {...classNameProps(classNames?.sectionTitle)}>
        {messages.summary}
      </h3>

      <dl {...classNameProps(classNames?.detailsList)}>
        <DetailRow
          label={messages.instrument}
          value={order.symbol}
          classNames={classNames}
        />

        <DetailRow
          label={messages.assetClass}
          value={messages.assetClassValue[order.assetClass]}
          classNames={classNames}
        />

        {order.venue === undefined ? null : (
          <DetailRow
            label={messages.venue}
            value={order.venue}
            classNames={classNames}
          />
        )}

        {order.accountId === undefined ? null : (
          <DetailRow
            label={messages.accountId}
            value={
              <IdentifierValue
                value={order.accountId}
                classNames={classNames}
              />
            }
            classNames={classNames}
          />
        )}

        <DetailRow
          label={messages.orderId}
          value={
            <IdentifierValue value={order.orderId} classNames={classNames} />
          }
          classNames={classNames}
        />

        {order.clientOrderId === undefined ? null : (
          <DetailRow
            label={messages.clientOrderId}
            value={
              <IdentifierValue
                value={order.clientOrderId}
                classNames={classNames}
              />
            }
            classNames={classNames}
          />
        )}

        <DetailRow
          label={messages.side}
          value={messages.sideValue[order.side]}
          classNames={classNames}
        />

        <DetailRow
          label={messages.orderType}
          value={messages.typeValue[order.type]}
          classNames={classNames}
        />

        {order.tif === undefined ? null : (
          <DetailRow
            label={messages.tif}
            value={messages.tifValue[order.tif]}
            classNames={classNames}
          />
        )}

        <DetailRow
          label={messages.status}
          value={messages.statusValue[order.status]}
          classNames={classNames}
        />

        <DetailRow
          label={messages.quoteCurrency}
          value={order.quoteCurrency}
          classNames={classNames}
        />

        <DetailRow
          label={messages.requested}
          value={requested}
          classNames={classNames}
        />

        <DetailRow
          label={messages.filledQuantity}
          value={`${formatDecimal(
            order.filledQuantity,
            locale,
            numberFormat.quantityFractionDigits,
          )} ${quantityUnit}`}
          classNames={classNames}
        />

        {order.remainingQuantity === undefined ? null : (
          <DetailRow
            label={messages.remainingQuantity}
            value={`${formatDecimal(
              order.remainingQuantity,
              locale,
              numberFormat.quantityFractionDigits,
            )} ${quantityUnit}`}
            classNames={classNames}
          />
        )}

        {order.filledNotional === undefined ? null : (
          <DetailRow
            label={messages.filledNotional}
            value={formatQuoteAmount(
              order.filledNotional,
              order.quoteCurrency,
              locale,
              numberFormat.notionalFractionDigits,
            )}
            classNames={classNames}
          />
        )}

        {order.limitPrice === undefined ? null : (
          <DetailRow
            label={messages.limitPrice}
            value={formatQuoteAmount(
              order.limitPrice,
              order.quoteCurrency,
              locale,
              numberFormat.priceFractionDigits,
            )}
            classNames={classNames}
          />
        )}

        {order.stopPrice === undefined ? null : (
          <DetailRow
            label={messages.stopPrice}
            value={formatQuoteAmount(
              order.stopPrice,
              order.quoteCurrency,
              locale,
              numberFormat.priceFractionDigits,
            )}
            classNames={classNames}
          />
        )}

        {order.averageFillPrice === undefined ? null : (
          <DetailRow
            label={messages.averageFillPrice}
            value={formatQuoteAmount(
              order.averageFillPrice,
              order.quoteCurrency,
              locale,
              numberFormat.priceFractionDigits,
            )}
            classNames={classNames}
          />
        )}

        <DetailRow
          label={messages.extendedHours}
          value={
            order.extendedHours === undefined
              ? messages.unavailable
              : order.extendedHours
                ? messages.yes
                : messages.no
          }
          classNames={classNames}
        />

        <DetailRow
          label={messages.submittedAt}
          value={
            <TimestampValue
              value={order.submittedAt}
              locale={locale}
              classNames={classNames}
            />
          }
          classNames={classNames}
        />

        <DetailRow
          label={messages.updatedAt}
          value={
            <TimestampValue
              value={order.updatedAt}
              locale={locale}
              classNames={classNames}
            />
          }
          classNames={classNames}
        />

        {order.completedAt === undefined ? null : (
          <DetailRow
            label={messages.completedAt}
            value={
              <TimestampValue
                value={order.completedAt}
                locale={locale}
                classNames={classNames}
              />
            }
            classNames={classNames}
          />
        )}

        {order.expiresAt === undefined ? null : (
          <DetailRow
            label={messages.expiresAt}
            value={
              <TimestampValue
                value={order.expiresAt}
                locale={locale}
                classNames={classNames}
              />
            }
            classNames={classNames}
          />
        )}

        {order.replacesOrderId === undefined ? null : (
          <DetailRow
            label={messages.replacesOrder}
            value={
              <RelatedOrderValue
                orderId={order.replacesOrderId}
                isDisabled={isDisabled}
                messages={messages}
                classNames={classNames}
                onSelect={onSelectRelatedOrder}
              />
            }
            classNames={classNames}
          />
        )}

        {order.replacedByOrderId === undefined ? null : (
          <DetailRow
            label={messages.replacedByOrder}
            value={
              <RelatedOrderValue
                orderId={order.replacedByOrderId}
                isDisabled={isDisabled}
                messages={messages}
                classNames={classNames}
                onSelect={onSelectRelatedOrder}
              />
            }
            classNames={classNames}
          />
        )}
      </dl>
    </section>
  );
}

function DetailRow({
  label,
  value,
  classNames,
}: {
  label: string;
  value: ReactNode;
  classNames: OrderDetailsClassNames | undefined;
}) {
  return (
    <div {...classNameProps(classNames?.detailRow)}>
      <dt {...classNameProps(classNames?.term)}>{label}</dt>
      <dd {...classNameProps(classNames?.value)}>{value}</dd>
    </div>
  );
}

function IdentifierValue({
  value,
  classNames,
}: {
  value: string;
  classNames: OrderDetailsClassNames | undefined;
}) {
  return <code {...classNameProps(classNames?.identifier)}>{value}</code>;
}

function TimestampValue({
  value,
  locale,
  classNames,
}: {
  value: string;
  locale: string;
  classNames: OrderDetailsClassNames | undefined;
}) {
  const formatted = formatDateTime(value, locale);

  return (
    <time dateTime={value} {...classNameProps(classNames?.timestamp)}>
      {formatted}
    </time>
  );
}

function RelatedOrderValue({
  orderId,
  isDisabled,
  messages,
  classNames,
  onSelect,
}: {
  orderId: string;
  isDisabled: boolean;
  messages: OrderDetailsMessages;
  classNames: OrderDetailsClassNames | undefined;
  onSelect: ((orderId: string) => void) | undefined;
}) {
  if (onSelect === undefined) {
    return <IdentifierValue value={orderId} classNames={classNames} />;
  }

  return (
    <button
      type="button"
      aria-label={messages.viewRelatedOrderLabel(orderId)}
      disabled={isDisabled}
      onClick={() => onSelect(orderId)}
      {...classNameProps(classNames?.relatedOrderButton)}
    >
      <IdentifierValue value={orderId} classNames={classNames} />
    </button>
  );
}

function getRequestedAmount(
  order: OrderListItem,
  quantityUnit: string,
  locale: string,
  numberFormat: OrderNumberFormat,
  messages: OrderDetailsMessages,
): string {
  if (order.quantity !== undefined) {
    return `${formatDecimal(
      order.quantity,
      locale,
      numberFormat.quantityFractionDigits,
    )} ${quantityUnit}`;
  }

  if (order.notional !== undefined) {
    return formatQuoteAmount(
      order.notional,
      order.quoteCurrency,
      locale,
      numberFormat.notionalFractionDigits,
    );
  }

  return messages.unavailable;
}
