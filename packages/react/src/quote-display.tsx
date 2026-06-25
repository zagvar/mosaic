import type { MarketPriceKind, MarketQuote } from "@mosaic/core";
import { useLocale } from "react-aria-components";
import { classNameProps } from "./internal/class-name";

export interface QuoteDisplayClassNames {
  root?: string;
  symbol?: string;
  quotes?: string;
  quote?: string;
  label?: string;
  price?: string;
  quantity?: string;
  spread?: string;
}

export interface QuoteDisplayMessages {
  bid: string;
  ask: string;
  last: string;
  spread: string;
  selectPrice: (label: string, formattedPrice: string) => string;
}

export interface QuoteDisplayProps {
  quote: MarketQuote;
  quoteCurrency: string;
  priceFractionDigits?: number;
  quantityFractionDigits?: number;
  messages?: Partial<QuoteDisplayMessages>;
  classNames?: QuoteDisplayClassNames;
  isDisabled?: boolean;
  onSelectPrice?: (
    px: number,
    kind: Extract<MarketPriceKind, "bid" | "ask" | "last">,
  ) => void;
}

export const defaultQuoteDisplayMessages: QuoteDisplayMessages = {
  bid: "Bid",
  ask: "Ask",
  last: "Last",
  spread: "Spread",
  selectPrice: (label, formattedPrice) => `Use ${label} price ${formattedPrice}`,
};

export function QuoteDisplay({
  quote,
  quoteCurrency,
  priceFractionDigits = 2,
  quantityFractionDigits = 8,
  messages,
  classNames,
  isDisabled = false,
  onSelectPrice,
}: QuoteDisplayProps) {
  const { locale } = useLocale();
  const text = {
    ...defaultQuoteDisplayMessages,
    ...messages,
  };

  const bid = formatNumber(quote.bidPx, locale, priceFractionDigits);
  const ask = formatNumber(quote.askPx, locale, priceFractionDigits);
  const last =
    quote.lastPx === undefined
      ? undefined
      : formatNumber(quote.lastPx, locale, priceFractionDigits);
  const spread = formatNumber(
    quote.askPx - quote.bidPx,
    locale,
    priceFractionDigits,
  );

  return (
    <section
      aria-label={quote.symbol}
      {...classNameProps(classNames?.root)}
    >
      <strong {...classNameProps(classNames?.symbol)}>{quote.symbol}</strong>

      <div {...classNameProps(classNames?.quotes)}>
        <QuoteItem
          label={text.bid}
          formattedPrice={`${bid} ${quoteCurrency}`}
          formattedQuantity={formatQuantity(
            quote.bidQty,
            quote.symbol,
            locale,
            quantityFractionDigits,
          )}
          isDisabled={isDisabled}
          classNames={classNames}
          onSelect={
            onSelectPrice === undefined
              ? undefined
              : () => onSelectPrice(quote.bidPx, "bid")
          }
          selectLabel={text.selectPrice(text.bid, `${bid} ${quoteCurrency}`)}
        />

        <QuoteItem
          label={text.ask}
          formattedPrice={`${ask} ${quoteCurrency}`}
          formattedQuantity={formatQuantity(
            quote.askQty,
            quote.symbol,
            locale,
            quantityFractionDigits,
          )}
          isDisabled={isDisabled}
          classNames={classNames}
          onSelect={
            onSelectPrice === undefined
              ? undefined
              : () => onSelectPrice(quote.askPx, "ask")
          }
          selectLabel={text.selectPrice(text.ask, `${ask} ${quoteCurrency}`)}
        />

        {last === undefined ? null : (
          <QuoteItem
            label={text.last}
            formattedPrice={`${last} ${quoteCurrency}`}
            isDisabled={isDisabled}
            classNames={classNames}
            onSelect={
              onSelectPrice === undefined
                ? undefined
                : () => onSelectPrice(quote.lastPx!, "last")
            }
            selectLabel={text.selectPrice(
              text.last,
              `${last} ${quoteCurrency}`,
            )}
          />
        )}
      </div>

      <div {...classNameProps(classNames?.spread)}>
        {text.spread}: {spread} {quoteCurrency}
      </div>
    </section>
  );
}

function QuoteItem({
  label,
  formattedPrice,
  formattedQuantity,
  isDisabled,
  selectLabel,
  classNames,
  onSelect,
}: {
  label: string;
  formattedPrice: string;
  formattedQuantity?: string | undefined;
  isDisabled: boolean;
  selectLabel: string;
  classNames: QuoteDisplayClassNames | undefined;
  onSelect?: (() => void) | undefined;
}) {
  const content = (
    <>
      <span {...classNameProps(classNames?.label)}>{label}</span>
      <span {...classNameProps(classNames?.price)}>{formattedPrice}</span>
      {formattedQuantity === undefined ? null : (
        <span {...classNameProps(classNames?.quantity)}>
          {formattedQuantity}
        </span>
      )}
    </>
  );

  return onSelect === undefined ? (
    <div {...classNameProps(classNames?.quote)}>{content}</div>
  ) : (
    <button
      type="button"
      aria-label={selectLabel}
      disabled={isDisabled}
      onClick={onSelect}
      {...classNameProps(classNames?.quote)}
    >
      {content}
    </button>
  );
}

function formatQuantity(
  value: number | undefined,
  symbol: string,
  locale: string,
  maximumFractionDigits: number,
) {
  return value === undefined
    ? undefined
    : `${formatNumber(value, locale, maximumFractionDigits)} ${symbol}`;
}

function formatNumber(
  value: number,
  locale: string,
  maximumFractionDigits: number,
) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    useGrouping: true,
  }).format(value);
}
