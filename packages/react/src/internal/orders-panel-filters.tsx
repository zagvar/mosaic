import { useEffect, useId, useState } from "react";
import {
  isOpenOrderStatus,
  isTerminalOrderStatus,
  orderFiltersSchema,
  orderRecordTypeSchema,
  orderSideSchema,
  orderStatusSchema,
} from "@zagvar/mosaic-core";
import type {
  OrderFilters,
  OrderListScope,
  OrderRecordType,
  OrderSide,
  OrderStatus,
} from "@zagvar/mosaic-core";
import { classNameProps } from "./class-name.js";
import type { OrdersPanelClassNames } from "../orders-panel.js";
import type { OrdersPanelMessages } from "../orders-panel-messages.js";

const orderSides = orderSideSchema.options;
const orderTypes = orderRecordTypeSchema.options;

const openOrderStatuses = orderStatusSchema.options.filter(isOpenOrderStatus);
const historyOrderStatuses = orderStatusSchema.options.filter(
  isTerminalOrderStatus,
);

export function OrdersPanelFilters({
  scope,
  filters,
  isDisabled,
  messages,
  classNames,
  onChange,
  onClear,
}: {
  scope: OrderListScope;
  filters: OrderFilters;
  isDisabled: boolean;
  messages: OrdersPanelMessages;
  classNames: OrdersPanelClassNames | undefined;
  onChange: (filters: OrderFilters) => void;
  onClear: () => void;
}) {
  const statusOptions =
    scope === "open" ? openOrderStatuses : historyOrderStatuses;

  const visibleStatusOptions = includeSelectedOptions(
    statusOptions,
    filters.statuses ?? [],
  );

  const hasFilters = Object.keys(filters).length > 0;

  const serializedSymbols = (filters.symbols ?? []).join(", ");
  const [symbolDraft, setSymbolDraft] = useState(serializedSymbols);
  const [hasSymbolError, setHasSymbolError] = useState(false);
  const symbolHintId = useId();
  const symbolErrorId = useId();

  useEffect(() => {
    setSymbolDraft(serializedSymbols);
    setHasSymbolError(false);
  }, [serializedSymbols]);

  function applySymbolFilter() {
    const symbols = [
      ...new Set(
        symbolDraft
          .split(",")
          .map((symbol) => symbol.trim())
          .filter((symbol) => symbol.length > 0),
      ),
    ];

    const next = {
      ...filters,
    };

    delete next.symbols;

    if (symbols.length > 0) {
      next.symbols = symbols;
    }

    const parsed = orderFiltersSchema.safeParse(next);

    if (!parsed.success) {
      setHasSymbolError(true);
      return;
    }

    setHasSymbolError(false);

    if (haveSameValues(filters.symbols ?? [], parsed.data.symbols ?? [])) {
      return;
    }

    onChange(parsed.data);
  }

  function setSides(sides: OrderSide[]) {
    const next = { ...filters };

    if (sides.length === 0) {
      delete next.sides;
    } else {
      next.sides = sides;
    }

    onChange(next);
  }

  function setTypes(types: OrderRecordType[]) {
    const next = { ...filters };

    if (types.length === 0) {
      delete next.types;
    } else {
      next.types = types;
    }

    onChange(next);
  }

  function setStatuses(statuses: OrderStatus[]) {
    const next = { ...filters };

    if (statuses.length === 0) {
      delete next.statuses;
    } else {
      next.statuses = statuses;
    }

    onChange(next);
  }

  return (
    <section
      aria-label={messages.filters}
      {...classNameProps(classNames?.filters)}
    >
      <form
        {...classNameProps(classNames?.symbolFilterForm)}
        onSubmit={(event) => {
          event.preventDefault();
          applySymbolFilter();
        }}
      >
        <label {...classNameProps(classNames?.symbolFilterField)}>
          <span {...classNameProps(classNames?.filterLabel)}>
            {messages.symbolFilter}
          </span>

          <input
            type="search"
            value={symbolDraft}
            placeholder={messages.symbolFilterPlaceholder}
            aria-invalid={hasSymbolError}
            aria-describedby={
              hasSymbolError ? `${symbolHintId} ${symbolErrorId}` : symbolHintId
            }
            disabled={isDisabled}
            onChange={(event) => {
              setSymbolDraft(event.currentTarget.value);
              setHasSymbolError(false);
            }}
            {...classNameProps(classNames?.symbolFilterInput)}
          />
        </label>

        <p id={symbolHintId} {...classNameProps(classNames?.filterHint)}>
          {messages.symbolFilterHint}
        </p>

        {hasSymbolError ? (
          <p
            id={symbolErrorId}
            role="alert"
            {...classNameProps(classNames?.filterError)}
          >
            {messages.invalidSymbolFilter}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isDisabled}
          {...classNameProps(classNames?.applyFilterButton)}
        >
          {messages.applySymbolFilter}
        </button>
      </form>

      <MultiValueFilter
        label={messages.sideFilter}
        emptyLabel={messages.allSides}
        options={orderSides}
        selectedValues={filters.sides ?? []}
        getOptionLabel={(side) => messages.sideValue[side]}
        isDisabled={isDisabled}
        messages={messages}
        classNames={classNames}
        onChange={setSides}
      />

      <MultiValueFilter
        label={messages.typeFilter}
        emptyLabel={messages.allTypes}
        options={orderTypes}
        selectedValues={filters.types ?? []}
        getOptionLabel={(type) => messages.typeValue[type]}
        isDisabled={isDisabled}
        messages={messages}
        classNames={classNames}
        onChange={setTypes}
      />

      <MultiValueFilter
        label={messages.statusFilter}
        emptyLabel={messages.allStatuses}
        options={visibleStatusOptions}
        selectedValues={filters.statuses ?? []}
        getOptionLabel={(status) => messages.statusValue[status]}
        isDisabled={isDisabled}
        messages={messages}
        classNames={classNames}
        onChange={setStatuses}
      />

      <button
        type="button"
        disabled={isDisabled || !hasFilters}
        onClick={onClear}
        {...classNameProps(classNames?.clearFiltersButton)}
      >
        {messages.clearFilters}
      </button>
    </section>
  );
}

function MultiValueFilter<T extends string>({
  label,
  emptyLabel,
  options,
  selectedValues,
  getOptionLabel,
  isDisabled,
  messages,
  classNames,
  onChange,
}: {
  label: string;
  emptyLabel: string;
  options: readonly T[];
  selectedValues: readonly T[];
  getOptionLabel: (value: T) => string;
  isDisabled: boolean;
  messages: OrdersPanelMessages;
  classNames: OrdersPanelClassNames | undefined;
  onChange: (values: T[]) => void;
}) {
  const summary =
    selectedValues.length === 0
      ? emptyLabel
      : messages.selectedFilterCount(label, selectedValues.length);

  return (
    <details {...classNameProps(classNames?.filterGroup)}>
      <summary {...classNameProps(classNames?.filterSummary)}>
        {summary}
      </summary>

      <div
        role="group"
        aria-label={label}
        {...classNameProps(classNames?.filterOptions)}
      >
        {options.map((option) => {
          const checked = selectedValues.includes(option);

          return (
            <label key={option} {...classNameProps(classNames?.filterOption)}>
              <input
                type="checkbox"
                value={option}
                checked={checked}
                disabled={isDisabled}
                onChange={(event) => {
                  onChange(
                    toggleSelectedValue(
                      selectedValues,
                      option,
                      event.currentTarget.checked,
                    ),
                  );
                }}
                {...classNameProps(classNames?.filterCheckbox)}
              />

              <span>{getOptionLabel(option)}</span>
            </label>
          );
        })}
      </div>
    </details>
  );
}

function toggleSelectedValue<T extends string>(
  selectedValues: readonly T[],
  value: T,
  selected: boolean,
): T[] {
  if (selected) {
    return selectedValues.includes(value)
      ? [...selectedValues]
      : [...selectedValues, value];
  }

  return selectedValues.filter((selectedValue) => selectedValue !== value);
}

function includeSelectedOptions<T extends string>(
  options: readonly T[],
  selectedValues: readonly T[],
): T[] {
  return [...new Set([...options, ...selectedValues])];
}

function haveSameValues(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
