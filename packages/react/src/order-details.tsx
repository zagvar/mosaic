import { useId } from "react";
import type { OrderDetailsRecord } from "@zagvar/mosaic-core";
import { useLocale } from "react-aria-components";
import { classNameProps } from "./internal/class-name.js";
import { OrderDetailsSummary } from "./internal/order-details-summary.js";
import { OrderDetailsFills } from "./internal/order-details-fills.js";
import { OrderDetailsFees } from "./internal/order-details-fees.js";
import { OrderDetailsTimeline } from "./internal/order-details-timeline.js";
import {
  mergeOrderDetailsMessages,
  type OrderDetailsMessagesInput,
} from "./order-details-messages.js";
import {
  resolveOrderNumberFormat,
  type OrderNumberFormat,
} from "./order-number-format.js";

export interface OrderDetailsClassNames {
  root?: string;
  header?: string;
  title?: string;
  statusBadge?: string;
  closeButton?: string;

  statusReason?: string;
  statusReasonLabel?: string;
  statusReasonValue?: string;

  summary?: string;
  sectionTitle?: string;
  detailsList?: string;
  detailRow?: string;
  term?: string;
  value?: string;
  identifier?: string;
  timestamp?: string;
  relatedOrderButton?: string;

  fills?: string;
  activityTable?: string;
  activityTableHead?: string;
  activityTableBody?: string;
  activityRow?: string;
  activityHeader?: string;
  activityCell?: string;
  emptyState?: string;

  fees?: string;

  timeline?: string;
  timelineList?: string;
  timelineItem?: string;
  timelineHeader?: string;
  eventStatus?: string;

  actions?: string;
  cancelButton?: string;
  replaceButton?: string;
}

export interface OrderDetailsProps {
  details: OrderDetailsRecord;

  numberFormat?: Partial<OrderNumberFormat>;
  isDisabled?: boolean;

  messages?: OrderDetailsMessagesInput;
  classNames?: OrderDetailsClassNames;

  onCancelOrder?: (order: OrderDetailsRecord["order"]) => void;
  onReplaceOrder?: (order: OrderDetailsRecord["order"]) => void;

  isCanceling?: boolean;
  isReplacing?: boolean;

  onClose?: () => void;
  onSelectRelatedOrder?: (orderId: string) => void;
}

export function OrderDetails({
  details,
  numberFormat,
  isDisabled = false,
  messages,
  classNames,
  onCancelOrder,
  onReplaceOrder,
  isCanceling = false,
  isReplacing = false,
  onClose,
  onSelectRelatedOrder,
}: OrderDetailsProps) {
  const titleId = useId();
  const { locale } = useLocale();
  const text = mergeOrderDetailsMessages(messages);
  const { order } = details;

  const resolvedNumberFormat = resolveOrderNumberFormat(
    order,
    numberFormat,
    undefined,
  );

  const statusReason =
    details.statusReason === undefined
      ? undefined
      : (details.statusReason.message ??
        text.reasonValue[details.statusReason.code]);

  const handleCancel =
    onCancelOrder === undefined || !order.capabilities.cancel
      ? undefined
      : () => onCancelOrder(order);

  const handleReplace =
    onReplaceOrder === undefined || !order.capabilities.replace
      ? undefined
      : () => onReplaceOrder(order);

  const canceling = handleCancel !== undefined && isCanceling;
  const replacing = handleReplace !== undefined && isReplacing;
  const mutationPending = canceling || replacing;
  const hasActions = handleCancel !== undefined || handleReplace !== undefined;

  return (
    <section
      aria-labelledby={titleId}
      data-status={order.status}
      {...classNameProps(classNames?.root)}
    >
      <header {...classNameProps(classNames?.header)}>
        <h2 id={titleId} {...classNameProps(classNames?.title)}>
          {text.title(order.symbol)}
        </h2>

        <span
          data-status={order.status}
          {...classNameProps(classNames?.statusBadge)}
        >
          {text.statusValue[order.status]}
        </span>

        {onClose === undefined ? null : (
          <button
            type="button"
            aria-label={text.closeLabel(order.symbol)}
            disabled={isDisabled}
            onClick={onClose}
            {...classNameProps(classNames?.closeButton)}
          >
            {text.close}
          </button>
        )}
      </header>

      {statusReason === undefined ? null : (
        <p {...classNameProps(classNames?.statusReason)}>
          <strong {...classNameProps(classNames?.statusReasonLabel)}>
            {text.statusReason}
          </strong>{" "}
          <span {...classNameProps(classNames?.statusReasonValue)}>
            {statusReason}
          </span>
        </p>
      )}

      {!hasActions ? null : (
        <div
          role="group"
          aria-label={text.actions}
          {...classNameProps(classNames?.actions)}
        >
          {handleCancel === undefined ? null : (
            <button
              type="button"
              aria-label={
                canceling
                  ? text.cancelingLabel(order.symbol)
                  : text.cancelLabel(order.symbol)
              }
              aria-busy={canceling}
              disabled={isDisabled || mutationPending}
              onClick={handleCancel}
              {...classNameProps(classNames?.cancelButton)}
            >
              {canceling ? text.canceling : text.cancel}
            </button>
          )}

          {handleReplace === undefined ? null : (
            <button
              type="button"
              aria-label={
                replacing
                  ? text.replacingLabel(order.symbol)
                  : text.replaceLabel(order.symbol)
              }
              aria-busy={replacing}
              disabled={isDisabled || mutationPending}
              onClick={handleReplace}
              {...classNameProps(classNames?.replaceButton)}
            >
              {replacing ? text.replacing : text.replace}
            </button>
          )}
        </div>
      )}

      <OrderDetailsSummary
        order={order}
        locale={locale}
        numberFormat={resolvedNumberFormat}
        isDisabled={isDisabled}
        messages={text}
        classNames={classNames}
        onSelectRelatedOrder={onSelectRelatedOrder}
      />

      <OrderDetailsFills
        fills={details.fills}
        order={order}
        locale={locale}
        numberFormat={resolvedNumberFormat}
        messages={text}
        classNames={classNames}
      />

      <OrderDetailsFees
        fees={details.fees}
        locale={locale}
        defaultFractionDigits={resolvedNumberFormat.notionalFractionDigits}
        messages={text}
        classNames={classNames}
      />

      <OrderDetailsTimeline
        events={details.events}
        locale={locale}
        messages={text}
        classNames={classNames}
      />
    </section>
  );
}
