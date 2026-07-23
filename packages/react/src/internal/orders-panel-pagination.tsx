import type { OrderCursor, OrdersPage } from "@zagvar/mosaic-core";
import { classNameProps } from "./class-name.js";
import type { OrdersPanelClassNames } from "../orders-panel.js";
import type { OrdersPanelMessages } from "../orders-panel-messages.js";

export function OrdersPanelPagination({
  page,
  pageSize,
  pageSizeOptions,
  isDisabled,
  messages,
  classNames,
  onCursorChange,
  onPageSizeChange,
}: {
  page: OrdersPage;
  pageSize: number;
  pageSizeOptions: readonly number[];
  isDisabled: boolean;
  messages: OrdersPanelMessages;
  classNames: OrdersPanelClassNames | undefined;
  onCursorChange: (cursor: OrderCursor | undefined) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const options = getPageSizeOptions(pageSizeOptions, pageSize);

  return (
    <footer {...classNameProps(classNames?.footer)}>
      <p {...classNameProps(classNames?.resultCount)}>
        {messages.resultCount(page.totalCount ?? page.items.length)}
      </p>

      <div {...classNameProps(classNames?.pagination)}>
        <label {...classNameProps(classNames?.pageSizeField)}>
          <span {...classNameProps(classNames?.pageSizeLabel)}>
            {messages.pageSize}
          </span>

          <select
            value={pageSize}
            disabled={isDisabled}
            onChange={(event) => {
              onPageSizeChange(Number(event.currentTarget.value));
            }}
            {...classNameProps(classNames?.pageSizeSelect)}
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div
          role="group"
          aria-label={messages.pagination}
          {...classNameProps(classNames?.pageActions)}
        >
          <button
            type="button"
            disabled={isDisabled || page.previousCursor === undefined}
            onClick={() => onCursorChange(page.previousCursor)}
            {...classNameProps(classNames?.paginationButton)}
          >
            {messages.previousPage}
          </button>

          <button
            type="button"
            disabled={isDisabled || page.nextCursor === undefined}
            onClick={() => onCursorChange(page.nextCursor)}
            {...classNameProps(classNames?.paginationButton)}
          >
            {messages.nextPage}
          </button>
        </div>
      </div>
    </footer>
  );
}

function getPageSizeOptions(
  configuredOptions: readonly number[],
  currentPageSize: number,
): number[] {
  return [...new Set([...configuredOptions, currentPageSize])]
    .filter(
      (value) => Number.isSafeInteger(value) && value >= 1 && value <= 200,
    )
    .sort((left, right) => left - right);
}
