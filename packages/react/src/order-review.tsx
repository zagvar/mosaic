import { useId } from "react";
import type {
  OrderExecutionError,
  OrderIntent,
  OrderSummary,
} from "@zagvar/mosaic-core";
import { useLocale } from "react-aria-components";
import { classNameProps } from "./internal/class-name.js";
import {
  formatDateTime,
  formatNumber,
  formatQuoteAmount,
  getConfirmationErrorMessage,
  getWarningMessage,
  hasWarning,
} from "./order-review-format.js";
import {
  mergeOrderReviewMessages,
  type OrderReviewMessagesInput,
} from "./order-review-messages.js";

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
  const controlsDisabled = isDisabled || isConfirming || isRefreshingPreview;
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

        {order.quantity === undefined ? null : (
          <ReviewRow
            label={text.quantity}
            value={`${formatNumber(order.quantity, locale, quantityFractionDigits)} ${order.symbol}`}
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

        {order.limitPrice === undefined ? null : (
          <ReviewRow
            label={text.limitPrice}
            value={formatQuoteAmount(
              order.limitPrice,
              quoteCurrency,
              locale,
              priceFractionDigits,
            )}
            classNames={classNames}
          />
        )}

        {order.type !== "market" ||
        summary.quotePreview?.estimatedFillPrice === undefined ? null : (
          <ReviewRow
            label={text.estimatedFillPrice}
            value={formatQuoteAmount(
              summary.quotePreview.estimatedFillPrice,
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
                summary.marketReference.price,
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
                  new Date(summary.marketReference.timestamp),
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
            {isRefreshingPreview ? text.refreshingPreview : text.refreshPreview}
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
