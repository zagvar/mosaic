import type { OrderSide } from "@zagvar/mosaic-core";
import { classNameProps } from "./class-name";
import { formatCurrencyOrQuoteAmount, formatDecimal } from "./format";

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
  locale: string;
  messages: AvailableBalanceMessages;
  classNames?: AvailableBalanceClassNames;
}

export function AvailableBalance({
  side,
  quoteAvailable,
  baseAvailable,
  quoteCurrency,
  baseSymbol,
  locale,
  messages,
  classNames,
}: AvailableBalanceProps) {
  const value =
    side === "buy"
      ? formatCurrencyOrQuoteAmount({
          value: quoteAvailable,
          currency: quoteCurrency,
          locale,
        })
      : `${formatDecimal(baseAvailable, locale, 8)} ${baseSymbol}`;

  return (
    <div {...classNameProps(classNames?.root)}>
      <span {...classNameProps(classNames?.label)}>{messages.label}</span>
      <span {...classNameProps(classNames?.value)}>{value}</span>
    </div>
  );
}
