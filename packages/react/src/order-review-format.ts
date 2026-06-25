import type {
  OrderExecutionError,
  OrderExecutionErrorCode,
  OrderSummary,
  OrderWarningCode,
} from "@mosaic/core";
import type { OrderReviewMessages } from "./order-review-messages";

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
  value: number,
  locale: string,
  maximumFractionDigits: number,
) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    useGrouping: true,
  }).format(value);
}

export function formatQuoteAmount(
  value: number,
  quoteCurrency: string,
  locale: string,
  maximumFractionDigits: number,
) {
  return `${formatNumber(value, locale, maximumFractionDigits)} ${quoteCurrency}`;
}

export function formatDateTime(value: number, locale: string) {
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
