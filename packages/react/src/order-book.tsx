import {
  addDecimals,
  compareDecimals,
  subtractDecimals,
  type DecimalString,
} from "@zagvar/decimal";
import type { OrderBookSnapshot } from "@zagvar/mosaic-core";
import type { CSSProperties } from "react";
import { useLocale } from "react-aria-components";
import { classNameProps } from "./internal/class-name.js";
import { formatDecimal } from "./internal/format.js";

export type OrderBookSide = "bid" | "ask";
export type OrderBookLayout = "stacked" | "split";

export interface OrderBookClassNames {
  root?: string;
  header?: string;
  title?: string;
  table?: string;
  side?: string;
  columnHeaders?: string;
  columnHeader?: string;
  levels?: string;
  level?: string;
  bidLevel?: string;
  askLevel?: string;
  depthBar?: string;
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
  onSelectPrice?: (price: DecimalString, side: OrderBookSide) => void;
}

interface DisplayLevel {
  price: DecimalString;
  quantity: DecimalString;
  total: DecimalString;
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
  const text = { ...defaultOrderBookMessages, ...messages };

  const bids = addCumulativeTotals(snapshot.bids.slice(0, depth));
  const asks = addCumulativeTotals(snapshot.asks.slice(0, depth));
  const maxTotal = getMaximumTotal(bids.at(-1)?.total, asks.at(-1)?.total);

  const bestBid = bids[0]?.price;
  const bestAsk = asks[0]?.price;

  const spread =
    bestBid === undefined || bestAsk === undefined
      ? undefined
      : subtractDecimals(bestAsk, bestBid);

  const empty = bids.length === 0 && asks.length === 0;

  return (
    <section
      aria-label={text.title}
      data-layout={layout}
      {...classNameProps(classNames?.root)}
    >
      <header {...classNameProps(classNames?.header)}>
        <h2 {...classNameProps(classNames?.title)}>{text.title}</h2>
      </header>

      {empty ? (
        <p {...classNameProps(classNames?.empty)}>{text.empty}</p>
      ) : (
        <div {...classNameProps(classNames?.table)}>
          <ColumnHeaders
            quoteCurrency={quoteCurrency}
            showTotals={showTotals}
            messages={text}
            classNames={classNames}
          />

          <BookSide
            side="ask"
            title={text.asks}
            levels={[...asks].reverse()}
            locale={locale}
            priceFractionDigits={priceFractionDigits}
            quantityFractionDigits={quantityFractionDigits}
            showTotals={showTotals}
            maxTotal={maxTotal}
            isDisabled={isDisabled}
            messages={text}
            classNames={classNames}
            onSelectPrice={onSelectPrice}
          />

          {spread === undefined ? null : (
            <div {...classNameProps(classNames?.spread)}>
              <span>{text.spread}</span>
              <strong>
                {formatDecimal(spread, locale, priceFractionDigits)}{" "}
                {quoteCurrency}
              </strong>
            </div>
          )}

          <BookSide
            side="bid"
            title={text.bids}
            levels={bids}
            locale={locale}
            priceFractionDigits={priceFractionDigits}
            quantityFractionDigits={quantityFractionDigits}
            showTotals={showTotals}
            maxTotal={maxTotal}
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

function ColumnHeaders({
  quoteCurrency,
  showTotals,
  messages,
  classNames,
}: {
  quoteCurrency: string;
  showTotals: boolean;
  messages: OrderBookMessages;
  classNames: OrderBookClassNames | undefined;
}) {
  return (
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
  );
}

function addCumulativeTotals(
  levels: OrderBookSnapshot["bids"],
): DisplayLevel[] {
  let total: DecimalString = "0";

  return levels.map((level) => {
    total = addDecimals(total, level.quantity);

    return {
      price: level.price,
      quantity: level.quantity,
      total,
    };
  });
}

function getMaximumTotal(
  ...values: Array<DecimalString | undefined>
): DecimalString {
  return values.reduce<DecimalString>((maximum, value) => {
    if (value === undefined || compareDecimals(value, maximum) <= 0) {
      return maximum;
    }

    return value;
  }, "0");
}

function BookSide({
  side,
  title,
  levels,
  locale,
  priceFractionDigits,
  quantityFractionDigits,
  showTotals,
  maxTotal,
  isDisabled,
  messages,
  classNames,
  onSelectPrice,
}: {
  side: OrderBookSide;
  title: string;
  levels: DisplayLevel[];
  locale: string;
  priceFractionDigits: number;
  quantityFractionDigits: number;
  showTotals: boolean;
  maxTotal: DecimalString;
  isDisabled: boolean;
  messages: OrderBookMessages;
  classNames: OrderBookClassNames | undefined;
  onSelectPrice:
    | ((price: DecimalString, side: OrderBookSide) => void)
    | undefined;
}) {
  return (
    <section aria-label={title} {...classNameProps(classNames?.side)}>
      <div {...classNameProps(classNames?.levels)}>
        {levels.map((level) => (
          <BookLevel
            key={level.price}
            side={side}
            level={level}
            locale={locale}
            priceFractionDigits={priceFractionDigits}
            quantityFractionDigits={quantityFractionDigits}
            showTotal={showTotals}
            maxTotal={maxTotal}
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
  maxTotal,
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
  maxTotal: DecimalString;
  isDisabled: boolean;
  messages: OrderBookMessages;
  classNames: OrderBookClassNames | undefined;
  onSelectPrice:
    | ((price: DecimalString, side: OrderBookSide) => void)
    | undefined;
}) {
  const formattedPrice = formatDecimal(
    level.price,
    locale,
    priceFractionDigits,
  );
  const depthPercent = getDepthPercent(level.total, maxTotal);

  const content = (
    <>
      <span
        aria-hidden="true"
        style={{ width: `${depthPercent}%` } satisfies CSSProperties}
        {...classNameProps(classNames?.depthBar)}
      />
      <span {...classNameProps(classNames?.price)}>{formattedPrice}</span>

      <span {...classNameProps(classNames?.quantity)}>
        {formatDecimal(level.quantity, locale, quantityFractionDigits)}
      </span>

      {showTotal ? (
        <span {...classNameProps(classNames?.total)}>
          {formatDecimal(level.total, locale, quantityFractionDigits)}
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
      onClick={() => onSelectPrice(level.price, side)}
      {...classNameProps(joinClassNames(classNames?.level, levelClassName))}
    >
      {content}
    </button>
  );
}

/**
 * CSS widths are visual-only. Decimal contract values never leave their
 * string form except at this browser-rendering boundary.
 */
function getDepthPercent(total: DecimalString, maximum: DecimalString): number {
  if (compareDecimals(maximum, "0") === 0) {
    return 0;
  }

  const totalNumber = Number(total);
  const maximumNumber = Number(maximum);

  if (
    !Number.isFinite(totalNumber) ||
    !Number.isFinite(maximumNumber) ||
    maximumNumber <= 0
  ) {
    return 0;
  }

  return Math.min(100, Math.max(0, (totalNumber / maximumNumber) * 100));
}

function joinClassNames(...values: Array<string | undefined>) {
  const className = values.filter(Boolean).join(" ");

  return className === "" ? undefined : className;
}
