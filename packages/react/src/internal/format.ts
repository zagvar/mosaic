export function formatDecimal(
  value: number,
  locale: string,
  maximumFractionDigits: number,
) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    useGrouping: true,
  }).format(value);
}

export function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    style: "percent",
  }).format(value / 100);
}

export function formatBasisPoints(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    style: "percent",
  }).format(value / 10_000);
}

export function formatQuoteAmount(
  value: number,
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
  value: number;
  currency: string;
  locale: string;
  currencyFractionDigits?: number;
  fallbackFractionDigits?: number;
}) {
  try {
    return new Intl.NumberFormat(locale, {
      currency,
      maximumFractionDigits: currencyFractionDigits,
      minimumFractionDigits: currencyFractionDigits,
      style: "currency",
    }).format(value);
  } catch (error) {
    if (!(error instanceof RangeError)) {
      throw error;
    }

    return formatQuoteAmount(value, currency, locale, fallbackFractionDigits);
  }
}
