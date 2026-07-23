import { useId } from "react";
import type { OrderFee } from "@zagvar/mosaic-core";
import { classNameProps } from "./class-name.js";
import { formatDateTime, formatQuoteAmount } from "./format.js";
import type { OrderDetailsClassNames } from "../order-details.js";
import type { OrderDetailsMessages } from "../order-details-messages.js";

export function OrderDetailsFees({
  fees,
  locale,
  defaultFractionDigits,
  messages,
  classNames,
}: {
  fees: readonly OrderFee[];
  locale: string;
  defaultFractionDigits: number;
  messages: OrderDetailsMessages;
  classNames: OrderDetailsClassNames | undefined;
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} {...classNameProps(classNames?.fees)}>
      <h3 id={titleId} {...classNameProps(classNames?.sectionTitle)}>
        {messages.fees}
      </h3>

      {fees.length === 0 ? (
        <p {...classNameProps(classNames?.emptyState)}>{messages.noFees}</p>
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
                {messages.feeType}
              </th>
              <th scope="col" {...classNameProps(classNames?.activityHeader)}>
                {messages.amount}
              </th>
              <th scope="col" {...classNameProps(classNames?.activityHeader)}>
                {messages.relatedFill}
              </th>
              <th scope="col" {...classNameProps(classNames?.activityHeader)}>
                {messages.feeId}
              </th>
            </tr>
          </thead>

          <tbody {...classNameProps(classNames?.activityTableBody)}>
            {fees.map((fee) => (
              <tr key={fee.feeId} {...classNameProps(classNames?.activityRow)}>
                <td
                  data-label={messages.timestamp}
                  {...classNameProps(classNames?.activityCell)}
                >
                  {fee.timestamp === undefined ? (
                    messages.unavailable
                  ) : (
                    <time dateTime={fee.timestamp}>
                      {formatDateTime(fee.timestamp, locale)}
                    </time>
                  )}
                </td>

                <td
                  data-label={messages.feeType}
                  {...classNameProps(classNames?.activityCell)}
                >
                  {messages.feeTypeValue[fee.type]}
                </td>

                <td
                  data-label={messages.amount}
                  {...classNameProps(classNames?.activityCell)}
                >
                  {formatQuoteAmount(
                    fee.amount,
                    fee.currency,
                    locale,
                    fee.fractionDigits ?? defaultFractionDigits,
                  )}
                </td>

                <td
                  data-label={messages.relatedFill}
                  {...classNameProps(classNames?.activityCell)}
                >
                  {fee.fillId === undefined ? (
                    messages.unavailable
                  ) : (
                    <code {...classNameProps(classNames?.identifier)}>
                      {fee.fillId}
                    </code>
                  )}
                </td>

                <td
                  data-label={messages.feeId}
                  {...classNameProps(classNames?.activityCell)}
                >
                  <code {...classNameProps(classNames?.identifier)}>
                    {fee.feeId}
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
