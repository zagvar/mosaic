import type {
  OrderSort,
  OrderSortDirection,
  OrderSortField,
} from "@zagvar/mosaic-core";
import { classNameProps } from "./class-name.js";
import type { OrdersPanelClassNames } from "../orders-panel.js";
import type { OrdersPanelMessages } from "../orders-panel-messages.js";

const sortFields = [
  "submittedAt",
  "updatedAt",
  "completedAt",
  "symbol",
  "status",
  "side",
  "type",
  "filledQuantity",
] as const satisfies readonly OrderSortField[];

const sortDirections = [
  "asc",
  "desc",
] as const satisfies readonly OrderSortDirection[];

export function OrdersPanelSort({
  sort,
  isDisabled,
  messages,
  classNames,
  onChange,
}: {
  sort: OrderSort;
  isDisabled: boolean;
  messages: OrdersPanelMessages;
  classNames: OrdersPanelClassNames | undefined;
  onChange: (sort: OrderSort) => void;
}) {
  return (
    <div {...classNameProps(classNames?.sortControls)}>
      <label {...classNameProps(classNames?.sortField)}>
        <span {...classNameProps(classNames?.sortLabel)}>
          {messages.sortBy}
        </span>

        <select
          value={sort.field}
          disabled={isDisabled}
          onChange={(event) => {
            onChange({
              ...sort,
              field: event.currentTarget.value as OrderSortField,
            });
          }}
          {...classNameProps(classNames?.sortSelect)}
        >
          {sortFields.map((field) => (
            <option key={field} value={field}>
              {messages.sortFieldValue[field]}
            </option>
          ))}
        </select>
      </label>

      <label {...classNameProps(classNames?.sortField)}>
        <span {...classNameProps(classNames?.sortLabel)}>
          {messages.sortDirection}
        </span>

        <select
          value={sort.direction}
          disabled={isDisabled}
          onChange={(event) => {
            onChange({
              ...sort,
              direction: event.currentTarget.value as OrderSortDirection,
            });
          }}
          {...classNameProps(classNames?.sortSelect)}
        >
          {sortDirections.map((direction) => (
            <option key={direction} value={direction}>
              {messages.sortDirectionValue[direction]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
