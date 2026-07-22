import { useId } from "react";
import type { OrderFill, OrderListItem } from "@zagvar/mosaic-core";
import { classNameProps } from "./class-name.js";
import { formatDateTime, formatDecimal, formatQuoteAmount } from "./format.js";
import type { OrderDetailsClassNames } from "../order-details.js";
import type { OrderDetailsMessages } from "../order-details-messages.js";
import type { OrderNumberFormat } from "../order-number-format.js";

export function OrderDetailsFills({
  fills,
  order,
  locale,
  numberFormat,
  messages,
  classNames,
}: {
  fills: readonly OrderFill[];
  order: OrderListItem;
  locale: string;
  numberFormat: OrderNumberFormat;
  messages: OrderDetailsMessages;
  classNames: OrderDetailsClassNames | undefined;
}) {
  const titleId = useId();
  const quantityUnit = order.baseAsset ?? order.symbol;

  return (
    <section aria-labelledby={titleId} {...classNameProps(classNames?.fills)}>
      <h3 id={titleId} {...classNameProps(classNames?.sectionTitle)}>
        {messages.fills}
      </h3>

      {fills.length === 0 ? (
        <p {...classNameProps(classNames?.emptyState)}>{messages.noFills}</p>
      ) : (
        <table
          aria-labelledby={titleId}
          {...classNameProps(classNames?.activityTable)}
        >
          <thead {...classNameProps(classNames?.activityTableHead)}>
            <tr {...classNameProps(classNames?.activityRow)}>
              <th scope="col" {...classNameProps(classNames?.activityHeader)}>
                {messages.timestamp}
              </th>
              <th scope="col" {...classNameProps(classNames?.activityHeader)}>
                {messages.quantity}
              </th>
              <th scope="col" {...classNameProps(classNames?.activityHeader)}>
                {messages.price}
              </th>
              <th scope="col" {...classNameProps(classNames?.activityHeader)}>
                {messages.notional}
              </th>
              <th scope="col" {...classNameProps(classNames?.activityHeader)}>
                {messages.liquidity}
              </th>
              <th scope="col" {...classNameProps(classNames?.activityHeader)}>
                {messages.venue}
              </th>
              <th scope="col" {...classNameProps(classNames?.activityHeader)}>
                {messages.fillId}
              </th>
            </tr>
          </thead>

          <tbody {...classNameProps(classNames?.activityTableBody)}>
            {fills.map((fill) => (
              <tr
                key={fill.fillId}
                {...classNameProps(classNames?.activityRow)}
              >
                <td
                  data-label={messages.timestamp}
                  {...classNameProps(classNames?.activityCell)}
                >
                  <time dateTime={fill.timestamp}>
                    {formatDateTime(fill.timestamp, locale)}
                  </time>
                </td>

                <td
                  data-label={messages.quantity}
                  {...classNameProps(classNames?.activityCell)}
                >
                  {formatDecimal(
                    fill.quantity,
                    locale,
                    numberFormat.quantityFractionDigits,
                  )}{" "}
                  {quantityUnit}
                </td>

                <td
                  data-label={messages.price}
                  {...classNameProps(classNames?.activityCell)}
                >
                  {formatQuoteAmount(
                    fill.price,
                    order.quoteCurrency,
                    locale,
                    numberFormat.priceFractionDigits,
                  )}
                </td>

                <td
                  data-label={messages.notional}
                  {...classNameProps(classNames?.activityCell)}
                >
                  {fill.notional === undefined
                    ? messages.unavailable
                    : formatQuoteAmount(
                        fill.notional,
                        order.quoteCurrency,
                        locale,
                        numberFormat.notionalFractionDigits,
                      )}
                </td>

                <td
                  data-label={messages.liquidity}
                  {...classNameProps(classNames?.activityCell)}
                >
                  {messages.liquidityValue[fill.liquidity]}
                </td>

                <td
                  data-label={messages.venue}
                  {...classNameProps(classNames?.activityCell)}
                >
                  {fill.venue ?? messages.unavailable}
                </td>

                <td
                  data-label={messages.fillId}
                  {...classNameProps(classNames?.activityCell)}
                >
                  <code {...classNameProps(classNames?.identifier)}>
                    {fill.fillId}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
