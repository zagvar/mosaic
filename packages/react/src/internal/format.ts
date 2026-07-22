import {
  roundDecimalForDisplay,
  type DecimalString,
} from "@zagvar/decimal";

export function formatDecimal(
  value: DecimalString | number,
  locale: string,
  maximumFractionDigits: number,
  useGrouping = true,
) {
  if (typeof value === "number") {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits,
      useGrouping,
    }).format(value);
  }

  const rounded = roundDecimalForDisplay(value, maximumFractionDigits);
  const [integer = "0", fraction] = rounded.split(".");

  const formattedInteger = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    useGrouping,
  }).format(BigInt(integer));

  if (fraction === undefined) {
    return formattedInteger;
  }

  return `${formattedInteger}${getDecimalSeparator(locale)}${localizeDigits(
    fraction,
    locale,
  )}`;
}

export function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    style: "percent",
  }).format(value / 100);
}

export function formatBasisPoints(
  value: DecimalString | number,
  locale: string,
) {
  const displayValue =
    typeof value === "number" ? value : toDisplayNumber(value);

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    style: "percent",
  }).format(displayValue / 10_000);
}

function toDisplayNumber(value: DecimalString) {
  const displayValue = Number(value);

  if (!Number.isFinite(displayValue)) {
    throw new RangeError(
      "Decimal value cannot be represented for display formatting.",
    );
  }

  return displayValue;
}

export function formatQuoteAmount(
  value: DecimalString | number,
  quoteCurrency: string,
  locale: string,
  maximumFractionDigits: number,
) {
  return `${formatDecimal(value, locale, maximumFractionDigits)} ${quoteCurrency}`;
}

export function formatCurrencyOrQuoteAmount({
  value,
  currency,
  locale,
  currencyFractionDigits = 2,
  fallbackFractionDigits = 8,
}: {
  value: DecimalString | number;
  currency: string;
  locale: string;
  currencyFractionDigits?: number;
  fallbackFractionDigits?: number;
}) {
  const displayValue =
    typeof value === "number" ? value : toDisplayNumber(value);

  try {
    return new Intl.NumberFormat(locale, {
      currency,
      maximumFractionDigits: currencyFractionDigits,
      minimumFractionDigits: currencyFractionDigits,
      style: "currency",
    }).format(displayValue);
  } catch (error) {
    if (!(error instanceof RangeError)) {
      throw error;
    }

    return formatQuoteAmount(value, currency, locale, fallbackFractionDigits);
  }
}

function getDecimalSeparator(locale: string) {
  return (
    new Intl.NumberFormat(locale)
      .formatToParts(1.1)
      .find((part) => part.type === "decimal")?.value ?? "."
  );
}

function localizeDigits(value: string, locale: string) {
  const digits = new Intl.NumberFormat(locale, {
    useGrouping: false,
  })
    .format(9876543210n)
    .split("")
    .reverse();

  return value.replace(/\d/g, (digit) => digits[Number(digit)]!);
}
