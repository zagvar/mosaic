import type { DecimalString } from "@zagvar/decimal";
import type { MarketTrade, TradeSide } from "@zagvar/mosaic-core";
import { useLocale } from "react-aria-components";
import { classNameProps } from "./internal/class-name.js";
import { formatDecimal } from "./internal/format.js";

export interface RecentTradesClassNames {
  root?: string;
  header?: string;
  title?: string;
  table?: string;
  columns?: string;
  column?: string;
  rows?: string;
  row?: string;
  buyRow?: string;
  sellRow?: string;
  unknownRow?: string;
  price?: string;
  quantity?: string;
  time?: string;
  empty?: string;
}

export interface RecentTradesMessages {
  title: string;
  price: string;
  quantity: string;
  time: string;
  empty: string;
  selectPrice: (formattedPrice: string) => string;
}

export interface RecentTradesProps {
  trades: MarketTrade[];
  quoteCurrency: string;

  depth?: number;
  priceFractionDigits?: number;
  quantityFractionDigits?: number;

  isDisabled?: boolean;
  messages?: Partial<RecentTradesMessages>;
  classNames?: RecentTradesClassNames;

  onSelectPrice?: (price: DecimalString, trade: MarketTrade) => void;
}

export const defaultRecentTradesMessages: RecentTradesMessages = {
  title: "Recent trades",
  price: "Price",
  quantity: "Quantity",
  time: "Timestamp",
  empty: "No recent trades.",
  selectPrice: (formattedPrice) => `Use trade price ${formattedPrice}`,
};

export function RecentTrades({
  trades,
  quoteCurrency,
  depth = 20,
  priceFractionDigits = 2,
  quantityFractionDigits = 8,
  isDisabled = false,
  messages,
  classNames,
  onSelectPrice,
}: RecentTradesProps) {
  const { locale } = useLocale();
  const text = {
    ...defaultRecentTradesMessages,
    ...messages,
  };

  const visibleTrades = trades.slice(0, depth);

  return (
    <section aria-label={text.title} {...classNameProps(classNames?.root)}>
      <header {...classNameProps(classNames?.header)}>
        <h2 {...classNameProps(classNames?.title)}>{text.title}</h2>
      </header>

      {visibleTrades.length === 0 ? (
        <p {...classNameProps(classNames?.empty)}>{text.empty}</p>
      ) : (
        <div {...classNameProps(classNames?.table)}>
          <div aria-hidden="true" {...classNameProps(classNames?.columns)}>
            <span {...classNameProps(classNames?.column)}>{text.price}</span>
            <span {...classNameProps(classNames?.column)}>{text.quantity}</span>
            <span {...classNameProps(classNames?.column)}>{text.time}</span>
          </div>

          <div {...classNameProps(classNames?.rows)}>
            {visibleTrades.map((trade, index) => (
              <RecentTradeRow
                key={
                  trade.tradeId ?? `${trade.timestamp}-${trade.price}-${index}`
                }
                trade={trade}
                quoteCurrency={quoteCurrency}
                locale={locale}
                priceFractionDigits={priceFractionDigits}
                quantityFractionDigits={quantityFractionDigits}
                isDisabled={isDisabled}
                messages={text}
                classNames={classNames}
                onSelectPrice={onSelectPrice}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function RecentTradeRow({
  trade,
  quoteCurrency,
  locale,
  priceFractionDigits,
  quantityFractionDigits,
  isDisabled,
  messages,
  classNames,
  onSelectPrice,
}: {
  trade: MarketTrade;
  quoteCurrency: string;
  locale: string;
  priceFractionDigits: number;
  quantityFractionDigits: number;
  isDisabled: boolean;
  messages: RecentTradesMessages;
  classNames: RecentTradesClassNames | undefined;
  onSelectPrice:
    | ((price: DecimalString, trade: MarketTrade) => void)
    | undefined;
}) {
  const formattedPrice = `${formatDecimal(
    trade.price,
    locale,
    priceFractionDigits,
  )} ${quoteCurrency}`;
  const formattedQuantity = formatDecimal(
    trade.quantity,
    locale,
    quantityFractionDigits,
  );
  const formattedTime = new Intl.DateTimeFormat(locale, {
    hour12: false,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(trade.timestamp));

  const content = (
    <>
      <span {...classNameProps(classNames?.price)}>{formattedPrice}</span>
      <span {...classNameProps(classNames?.quantity)}>{formattedQuantity}</span>
      <span {...classNameProps(classNames?.time)}>{formattedTime}</span>
    </>
  );

  const rowClassName = getRowClassName(trade.side, classNames);

  return onSelectPrice === undefined ? (
    <div data-side={trade.side} {...classNameProps(rowClassName)}>
      {content}
    </div>
  ) : (
    <button
      type="button"
      data-side={trade.side}
      aria-label={messages.selectPrice(formattedPrice)}
      disabled={isDisabled}
      onClick={() => onSelectPrice(trade.price, trade)}
      {...classNameProps(rowClassName)}
    >
      {content}
    </button>
  );
}

function getRowClassName(
  side: TradeSide,
  classNames: RecentTradesClassNames | undefined,
) {
  const sideClassName =
    side === "buy"
      ? classNames?.buyRow
      : side === "sell"
        ? classNames?.sellRow
        : classNames?.unknownRow;

  return [classNames?.row, sideClassName].filter(Boolean).join(" ");
}
