import type { OrderSide } from "@mosaic/core";
import { classNameProps } from "./class-name";

export interface AvailableBalanceClassNames {
  root?: string;
  label?: string;
  value?: string;
}

export interface AvailableBalanceMessages {
  label: string;
}

export interface AvailableBalanceProps {
  side: OrderSide;
  quoteAvailable: number;
  baseAvailable: number;
  quoteCurrency: string;
  baseSymbol: string;
  messages: AvailableBalanceMessages;
  classNames?: AvailableBalanceClassNames;
}

export function AvailableBalance({
  side,
  quoteAvailable,
  baseAvailable,
  quoteCurrency,
  baseSymbol,
  messages,
  classNames,
}: AvailableBalanceProps) {
  const value =
    side === "buy"
      ? formatCurrency(quoteAvailable, quoteCurrency)
      : `${formatDecimal(baseAvailable)} ${baseSymbol}`;

  return (
    <div {...classNameProps(classNames?.root)}>
      <span {...classNameProps(classNames?.label)}>{messages.label}</span>
      <span {...classNameProps(classNames?.value)}>{value}</span>
    </div>
  );
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 8,
  }).format(value);
}
