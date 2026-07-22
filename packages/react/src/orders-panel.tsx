import { useId } from "react";
import type {
  OrderListItem,
  OrderListScope,
  OrdersPage,
  OrdersQuery,
} from "@zagvar/mosaic-core";
import { useLocale } from "react-aria-components";
import { classNameProps, joinClassNames } from "./internal/class-name.js";
import { OrderRow } from "./internal/orders-panel-row.js";
import { OrdersPanelPagination } from "./internal/orders-panel-pagination.js";
import { OrdersPanelFilters } from "./internal/orders-panel-filters.js";
import { OrdersPanelSort } from "./internal/orders-panel-sort.js";
import {
  mergeOrdersPanelMessages,
  type OrdersPanelMessages,
  type OrdersPanelMessagesInput,
} from "./orders-panel-messages.js";
import { useOrdersQuery } from "./use-orders-query.js";
import { resolveOrderNumberFormat } from "./order-number-format.js";
import type {
  GetOrderNumberFormat,
  OrderNumberFormat,
} from "./order-number-format.js";

export interface OrdersPanelClassNames {
  root?: string;
  header?: string;
  title?: string;
  scopes?: string;
  scopeButton?: string;
  activeScopeButton?: string;

  filters?: string;
  symbolFilterForm?: string;
  symbolFilterField?: string;
  symbolFilterInput?: string;
  filterLabel?: string;
  filterHint?: string;
  filterError?: string;
  applyFilterButton?: string;
  filterGroup?: string;
  filterSummary?: string;
  filterOptions?: string;
  filterOption?: string;
  filterCheckbox?: string;
  clearFiltersButton?: string;

  sortControls?: string;
  sortField?: string;
  sortLabel?: string;
  sortSelect?: string;

  state?: string;
  loading?: string;
  error?: string;
  empty?: string;
  retryButton?: string;

  tableContainer?: string;
  table?: string;
  tableHeader?: string;
  headerRow?: string;
  columnHeader?: string;
  body?: string;
  row?: string;
  buyRow?: string;
  sellRow?: string;

  instrumentCell?: string;
  symbol?: string;
  instrumentMeta?: string;

  orderCell?: string;
  primary?: string;
  secondary?: string;

  amountCell?: string;
  priceCell?: string;
  metric?: string;
  metricLabel?: string;
  metricValue?: string;

  statusCell?: string;
  statusBadge?: string;

  timeCell?: string;
  timestamp?: string;

  actionsCell?: string;
  detailsButton?: string;
  cancelButton?: string;
  replaceButton?: string;
  footer?: string;
  pagination?: string;
  pageSizeField?: string;
  pageSizeLabel?: string;
  pageSizeSelect?: string;
  pageActions?: string;
  paginationButton?: string;

  resultCount?: string;
}

export interface OrdersPanelProps {
  page?: OrdersPage;

  /**
   * Controlled query. Omit this when OrdersPanel should own query state.
   */
  query?: OrdersQuery;

  /**
   * Initial query used only when query is uncontrolled.
   */
  defaultQuery?: Partial<OrdersQuery>;

  /**
   * Called with the complete backend request whenever query state changes.
   */
  onQueryChange: (query: OrdersQuery) => void;

  isLoading?: boolean;
  errorMessage?: string | null;
  isDisabled?: boolean;

  numberFormat?: Partial<OrderNumberFormat>;
  getNumberFormat?: GetOrderNumberFormat;
  pageSizeOptions?: readonly number[];

  messages?: OrdersPanelMessagesInput;
  classNames?: OrdersPanelClassNames;

  onRetry?: () => void;
  onSelectOrder?: (order: OrderListItem) => void;
  onCancelOrder?: (order: OrderListItem) => void;
  onReplaceOrder?: (order: OrderListItem) => void;

  isCancelingOrder?: (order: OrderListItem) => boolean;
  isReplacingOrder?: (order: OrderListItem) => boolean;
}

const defaultPageSizeOptions = [25, 50, 100] as const;

export function OrdersPanel({
  page,
  query,
  defaultQuery,
  onQueryChange,
  isLoading = false,
  errorMessage,
  isDisabled = false,
  numberFormat,
  getNumberFormat,
  pageSizeOptions = defaultPageSizeOptions,
  messages,
  classNames,
  onRetry,
  onSelectOrder,
  onCancelOrder,
  onReplaceOrder,
  isCancelingOrder,
  isReplacingOrder,
}: OrdersPanelProps) {
  const titleId = useId();
  const { locale } = useLocale();
  const text = mergeOrdersPanelMessages(messages);

  const controlledQueryProps = query === undefined ? {} : { value: query };
  const defaultQueryProps =
    defaultQuery === undefined ? {} : { defaultValue: defaultQuery };

  const ordersQuery = useOrdersQuery({
    onChange: onQueryChange,
    ...controlledQueryProps,
    ...defaultQueryProps,
  });

  const currentPage: OrdersPage = page ?? {
    items: [],
    asOf: new Date(0).toISOString(),
  };

  const items = currentPage.items;
  const hasRows = items.length > 0;
  const hasError = errorMessage !== undefined && errorMessage !== null;
  const hasFilters = Object.keys(ordersQuery.filters).length > 0;
  const hasOrderActions =
    onSelectOrder !== undefined ||
    onCancelOrder !== undefined ||
    onReplaceOrder !== undefined;

  return (
    <section
      aria-busy={isLoading}
      aria-labelledby={titleId}
      data-scope={ordersQuery.scope}
      {...classNameProps(classNames?.root)}
    >
      <header {...classNameProps(classNames?.header)}>
        <h2 id={titleId} {...classNameProps(classNames?.title)}>
          {text.title}
        </h2>

        <ScopeSelector
          scope={ordersQuery.scope}
          isDisabled={isDisabled}
          messages={text}
          classNames={classNames}
          onChange={ordersQuery.setScope}
        />
      </header>

      <OrdersPanelFilters
        scope={ordersQuery.scope}
        filters={ordersQuery.filters}
        isDisabled={isDisabled}
        messages={text}
        classNames={classNames}
        onChange={ordersQuery.setFilters}
        onClear={ordersQuery.resetFilters}
      />

      <OrdersPanelSort
        sort={ordersQuery.sort}
        isDisabled={isDisabled}
        messages={text}
        classNames={classNames}
        onChange={ordersQuery.setSort}
      />

      {!hasRows && isLoading ? (
        <p
          role="status"
          {...classNameProps(
            joinClassNames(classNames?.state, classNames?.loading),
          )}
        >
          {text.loading}
        </p>
      ) : !hasRows && hasError ? (
        <ErrorState
          message={errorMessage || text.loadError}
          isDisabled={isDisabled}
          messages={text}
          classNames={classNames}
          onRetry={onRetry}
        />
      ) : !hasRows ? (
        <p
          {...classNameProps(
            joinClassNames(classNames?.state, classNames?.empty),
          )}
        >
          {hasFilters
            ? text.noMatches
            : ordersQuery.scope === "open"
              ? text.emptyOpen
              : text.emptyHistory}
        </p>
      ) : (
        <>
          <div {...classNameProps(classNames?.tableContainer)}>
            <table
              aria-labelledby={titleId}
              {...classNameProps(classNames?.table)}
            >
              <thead {...classNameProps(classNames?.tableHeader)}>
                <tr {...classNameProps(classNames?.headerRow)}>
                  <th scope="col" {...classNameProps(classNames?.columnHeader)}>
                    {text.instrument}
                  </th>
                  <th scope="col" {...classNameProps(classNames?.columnHeader)}>
                    {text.order}
                  </th>
                  <th scope="col" {...classNameProps(classNames?.columnHeader)}>
                    {text.amount}
                  </th>
                  <th scope="col" {...classNameProps(classNames?.columnHeader)}>
                    {text.price}
                  </th>
                  <th scope="col" {...classNameProps(classNames?.columnHeader)}>
                    {text.status}
                  </th>
                  <th scope="col" {...classNameProps(classNames?.columnHeader)}>
                    {text.time}
                  </th>

                  {!hasOrderActions ? null : (
                    <th
                      scope="col"
                      {...classNameProps(classNames?.columnHeader)}
                    >
                      {text.actions}
                    </th>
                  )}
                </tr>
              </thead>

              <tbody {...classNameProps(classNames?.body)}>
                {items.map((order) => (
                  <OrderRow
                    key={getOrderKey(order)}
                    order={order}
                    scope={ordersQuery.scope}
                    locale={locale}
                    isDisabled={isDisabled}
                    numberFormat={resolveOrderNumberFormat(
                      order,
                      numberFormat,
                      getNumberFormat,
                    )}
                    messages={text}
                    classNames={classNames}
                    showActions={hasOrderActions}
                    onSelectOrder={onSelectOrder}
                    onCancelOrder={onCancelOrder}
                    onReplaceOrder={onReplaceOrder}
                    isCancelingOrder={isCancelingOrder}
                    isReplacingOrder={isReplacingOrder}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <OrdersPanelPagination
            page={currentPage}
            pageSize={ordersQuery.pageSize}
            pageSizeOptions={pageSizeOptions}
            isDisabled={isDisabled || isLoading}
            messages={text}
            classNames={classNames}
            onCursorChange={ordersQuery.setCursor}
            onPageSizeChange={ordersQuery.setPageSize}
          />

          {isLoading ? (
            <p
              role="status"
              {...classNameProps(
                joinClassNames(classNames?.state, classNames?.loading),
              )}
            >
              {text.loading}
            </p>
          ) : null}

          {hasError ? (
            <ErrorState
              message={errorMessage || text.loadError}
              isDisabled={isDisabled}
              messages={text}
              classNames={classNames}
              onRetry={onRetry}
            />
          ) : null}
        </>
      )}
    </section>
  );
}

function ScopeSelector({
  scope,
  isDisabled,
  messages,
  classNames,
  onChange,
}: {
  scope: OrderListScope;
  isDisabled: boolean;
  messages: OrdersPanelMessages;
  classNames: OrdersPanelClassNames | undefined;
  onChange: (scope: OrderListScope) => void;
}) {
  return (
    <div
      role="group"
      aria-label={messages.title}
      {...classNameProps(classNames?.scopes)}
    >
      {(["open", "history"] as const).map((value) => {
        const active = value === scope;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            disabled={isDisabled}
            onClick={() => onChange(value)}
            {...classNameProps(
              joinClassNames(
                classNames?.scopeButton,
                active ? classNames?.activeScopeButton : undefined,
              ),
            )}
          >
            {messages.scopeValue[value]}
          </button>
        );
      })}
    </div>
  );
}

function ErrorState({
  message,
  isDisabled,
  messages,
  classNames,
  onRetry,
}: {
  message: string;
  isDisabled: boolean;
  messages: OrdersPanelMessages;
  classNames: OrdersPanelClassNames | undefined;
  onRetry: (() => void) | undefined;
}) {
  return (
    <div
      role="alert"
      {...classNameProps(joinClassNames(classNames?.state, classNames?.error))}
    >
      <p>{message}</p>

      {onRetry === undefined ? null : (
        <button
          type="button"
          disabled={isDisabled}
          onClick={onRetry}
          {...classNameProps(classNames?.retryButton)}
        >
          {messages.retry}
        </button>
      )}
    </div>
  );
}

function getOrderKey(order: OrderListItem): string {
  return JSON.stringify([order.accountId ?? null, order.orderId]);
}
