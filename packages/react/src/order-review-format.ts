import type {
  OrderExecutionError,
  OrderExecutionErrorCode,
  OrderSummary,
  OrderWarningCode,
} from "@zagvar/mosaic-core";
import type { DecimalString } from "@zagvar/decimal";
import { formatBasisPoints, formatDecimal } from "./internal/format.js";
import type { OrderReviewMessages } from "./order-review-messages.js";

export function getConfirmationErrorMessage(
  error: string | OrderExecutionError | null | undefined,
  messages: Record<OrderExecutionErrorCode, string>,
) {
  if (error === null || error === undefined) return undefined;

  return typeof error === "string" ? error : messages[error.code];
}

export function getWarningMessage(
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

export function hasWarning(summary: OrderSummary, code: OrderWarningCode) {
  return summary.warnings.some((warning) => warning.code === code);
}

export function formatNumber(
  value: DecimalString,
  locale: string,
  maximumFractionDigits: number,
) {
  return formatDecimal(value, locale, maximumFractionDigits);
}

export function formatQuoteAmount(
  value: DecimalString,
  quoteCurrency: string,
  locale: string,
  maximumFractionDigits: number,
) {
  return `${formatNumber(value, locale, maximumFractionDigits)} ${quoteCurrency}`;
}

export function formatDateTime(value: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(value);
}
