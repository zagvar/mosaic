import { useId } from "react";
import type { OrderLifecycleEvent } from "@zagvar/mosaic-core";
import { classNameProps } from "./class-name.js";
import { formatDateTime } from "./format.js";
import type { OrderDetailsClassNames } from "../order-details.js";
import type { OrderDetailsMessages } from "../order-details-messages.js";

export function OrderDetailsTimeline({
  events,
  locale,
  messages,
  classNames,
}: {
  events: readonly OrderLifecycleEvent[];
  locale: string;
  messages: OrderDetailsMessages;
  classNames: OrderDetailsClassNames | undefined;
}) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      {...classNameProps(classNames?.timeline)}
    >
      <h3 id={titleId} {...classNameProps(classNames?.sectionTitle)}>
        {messages.timeline}
      </h3>

      {events.length === 0 ? (
        <p {...classNameProps(classNames?.emptyState)}>{messages.noEvents}</p>
      ) : (
        <ol
          aria-labelledby={titleId}
          {...classNameProps(classNames?.timelineList)}
        >
          {events.map((event) => {
            const reason =
              event.reason === undefined
                ? undefined
                : (event.reason.message ??
                  messages.reasonValue[event.reason.code]);

            return (
              <li
                key={event.eventId}
                data-status={event.status}
                {...classNameProps(classNames?.timelineItem)}
              >
                <div {...classNameProps(classNames?.timelineHeader)}>
                  <span
                    data-status={event.status}
                    {...classNameProps(classNames?.eventStatus)}
                  >
                    {messages.statusValue[event.status]}
                  </span>

                  <time
                    dateTime={event.timestamp}
                    {...classNameProps(classNames?.timestamp)}
                  >
                    {formatDateTime(event.timestamp, locale)}
                  </time>
                </div>

                <dl {...classNameProps(classNames?.detailsList)}>
                  {reason === undefined ? null : (
                    <div {...classNameProps(classNames?.detailRow)}>
                      <dt {...classNameProps(classNames?.term)}>
                        {messages.reason}
                      </dt>
                      <dd {...classNameProps(classNames?.value)}>{reason}</dd>
                    </div>
                  )}

                  <div {...classNameProps(classNames?.detailRow)}>
                    <dt {...classNameProps(classNames?.term)}>
                      {messages.eventId}
                    </dt>
                    <dd {...classNameProps(classNames?.value)}>
                      <code {...classNameProps(classNames?.identifier)}>
                        {event.eventId}
                      </code>
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
