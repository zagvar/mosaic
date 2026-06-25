import type { OrderBookSnapshot } from "@mosaic/core";
import { useLocale } from "react-aria-components";
import { classNameProps } from "./internal/class-name";

export type OrderBookSide = "bid" | "ask";
export type OrderBookLayout = "stacked" | "split";

export interface OrderBookClassNames {
  root?: string;
  header?: string;
  title?: string;
  table?: string;
  side?: string;
  sideTitle?: string;
  columnHeaders?: string;
  columnHeader?: string;
  levels?: string;
  level?: string;
  bidLevel?: string;
  askLevel?: string;
  price?: string;
  quantity?: string;
  total?: string;
  spread?: string;
  empty?: string;
}

export interface OrderBookMessages {
  title: string;
  bids: string;
  asks: string;
  price: string;
  quantity: string;
  total: string;
  spread: string;
  empty: string;
  selectPrice: (side: string, formattedPrice: string) => string;
}

export interface OrderBookProps {
  snapshot: OrderBookSnapshot;
  quoteCurrency: string;

  layout?: OrderBookLayout;
  depth?: number;

  priceFractionDigits?: number;
  quantityFractionDigits?: number;

  showTotals?: boolean;
  isDisabled?: boolean;

  messages?: Partial<OrderBookMessages>;
  classNames?: OrderBookClassNames;

  onSelectPrice?: (px: number, side: OrderBookSide) => void;
}

interface DisplayLevel {
  px: number;
  qty: number;
  total: number;
}

export const defaultOrderBookMessages: OrderBookMessages = {
  title: "Order book",
  bids: "Bids",
  asks: "Asks",
  price: "Price",
  quantity: "Quantity",
  total: "Total",
  spread: "Spread",
  empty: "No order-book levels available.",
  selectPrice: (side, formattedPrice) => `Use ${side} price ${formattedPrice}`,
};

export function OrderBook({
  snapshot,
  quoteCurrency,
  layout = "stacked",
  depth = 15,
  priceFractionDigits = 2,
  quantityFractionDigits = 8,
  showTotals = true,
  isDisabled = false,
  messages,
  classNames,
  onSelectPrice,
}: OrderBookProps) {
  const { locale } = useLocale();

  const text = {
    ...defaultOrderBookMessages,
    ...messages,
  };

  const bids = addCumulativeTotals(snapshot.bids.slice(0, depth));
  const asks = addCumulativeTotals(snapshot.asks.slice(0, depth));

  const bestBid = bids[0]?.px;
  const bestAsk = asks[0]?.px;

  const spread =
    bestBid === undefined || bestAsk === undefined
      ? undefined
      : bestAsk - bestBid;

  const empty = bids.length === 0 && asks.length === 0;

  return (
    <section
      aria-label={text.title}
      data-layout={layout}
      {...classNameProps(classNames?.root)}
    >
      <header {...classNameProps(classNames?.header)}>
        <h2 {...classNameProps(classNames?.title)}>{text.title}</h2>

        {spread === undefined ? null : (
          <span {...classNameProps(classNames?.spread)}>
            {text.spread}: {formatNumber(spread, locale, priceFractionDigits)}{" "}
            {quoteCurrency}
          </span>
        )}
      </header>

      {empty ? (
        <p {...classNameProps(classNames?.empty)}>{text.empty}</p>
      ) : (
        <div {...classNameProps(classNames?.table)}>
          <BookSide
            side="ask"
            title={text.asks}
            levels={asks}
            quoteCurrency={quoteCurrency}
            locale={locale}
            priceFractionDigits={priceFractionDigits}
            quantityFractionDigits={quantityFractionDigits}
            showTotals={showTotals}
            isDisabled={isDisabled}
            messages={text}
            classNames={classNames}
            onSelectPrice={onSelectPrice}
          />

          <BookSide
            side="bid"
            title={text.bids}
            levels={bids}
            quoteCurrency={quoteCurrency}
            locale={locale}
            priceFractionDigits={priceFractionDigits}
            quantityFractionDigits={quantityFractionDigits}
            showTotals={showTotals}
            isDisabled={isDisabled}
            messages={text}
            classNames={classNames}
            onSelectPrice={onSelectPrice}
          />
        </div>
      )}
    </section>
  );
}

function addCumulativeTotals(
  levels: OrderBookSnapshot["bids"],
): DisplayLevel[] {
  let total = 0;

  return levels.map((level) => {
    total += level.qty;

    return {
      px: level.px,
      qty: level.qty,
      total,
    };
  });
}

function BookSide({
  side,
  title,
  levels,
  quoteCurrency,
  locale,
  priceFractionDigits,
  quantityFractionDigits,
  showTotals,
  isDisabled,
  messages,
  classNames,
  onSelectPrice,
}: {
  side: OrderBookSide;
  title: string;
  levels: DisplayLevel[];
  quoteCurrency: string;
  locale: string;
  priceFractionDigits: number;
  quantityFractionDigits: number;
  showTotals: boolean;
  isDisabled: boolean;
  messages: OrderBookMessages;
  classNames: OrderBookClassNames | undefined;
  onSelectPrice: ((px: number, side: OrderBookSide) => void) | undefined;
}) {
  return (
    <section {...classNameProps(classNames?.side)}>
      <h3 {...classNameProps(classNames?.sideTitle)}>{title}</h3>

      <div aria-hidden="true" {...classNameProps(classNames?.columnHeaders)}>
        <span {...classNameProps(classNames?.columnHeader)}>
          {messages.price} ({quoteCurrency})
        </span>
        <span {...classNameProps(classNames?.columnHeader)}>
          {messages.quantity}
        </span>
        {showTotals ? (
          <span {...classNameProps(classNames?.columnHeader)}>
            {messages.total}
          </span>
        ) : null}
      </div>

      <div {...classNameProps(classNames?.levels)}>
        {levels.map((level) => (
          <BookLevel
            key={level.px}
            side={side}
            level={level}
            locale={locale}
            priceFractionDigits={priceFractionDigits}
            quantityFractionDigits={quantityFractionDigits}
            showTotal={showTotals}
            isDisabled={isDisabled}
            messages={messages}
            classNames={classNames}
            onSelectPrice={onSelectPrice}
          />
        ))}
      </div>
    </section>
  );
}

function BookLevel({
  side,
  level,
  locale,
  priceFractionDigits,
  quantityFractionDigits,
  showTotal,
  isDisabled,
  messages,
  classNames,
  onSelectPrice,
}: {
  side: OrderBookSide;
  level: DisplayLevel;
  locale: string;
  priceFractionDigits: number;
  quantityFractionDigits: number;
  showTotal: boolean;
  isDisabled: boolean;
  messages: OrderBookMessages;
  classNames: OrderBookClassNames | undefined;
  onSelectPrice: ((px: number, side: OrderBookSide) => void) | undefined;
}) {
  const formattedPrice = formatNumber(level.px, locale, priceFractionDigits);

  const content = (
    <>
      <span {...classNameProps(classNames?.price)}>{formattedPrice}</span>

      <span {...classNameProps(classNames?.quantity)}>
        {formatNumber(level.qty, locale, quantityFractionDigits)}
      </span>

      {showTotal ? (
        <span {...classNameProps(classNames?.total)}>
          {formatNumber(level.total, locale, quantityFractionDigits)}
        </span>
      ) : null}
    </>
  );

  const levelClassName =
    side === "bid" ? classNames?.bidLevel : classNames?.askLevel;

  if (onSelectPrice === undefined) {
    return (
      <div
        {...classNameProps(joinClassNames(classNames?.level, levelClassName))}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={messages.selectPrice(side, formattedPrice)}
      disabled={isDisabled}
      onClick={() => onSelectPrice(level.px, side)}
      {...classNameProps(joinClassNames(classNames?.level, levelClassName))}
    >
      {content}
    </button>
  );
}

function joinClassNames(...values: Array<string | undefined>) {
  const className = values.filter(Boolean).join(" ");

  return className === "" ? undefined : className;
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
