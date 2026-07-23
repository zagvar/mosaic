import { useRef, useState } from "react";
import { ordersQuerySchema } from "@zagvar/mosaic-core";
import type {
  OrderCursor,
  OrderFilters,
  OrderListScope,
  OrdersQuery,
  OrderSort,
} from "@zagvar/mosaic-core";

export interface UseOrdersQueryOptions {
  /**
   * Controlled query value.
   */
  value?: OrdersQuery;

  /**
   * Initial value when the hook owns its state.
   */
  defaultValue?: Partial<OrdersQuery>;

  /**
   * Receives the complete next backend query after any change.
   */
  onChange?: (query: OrdersQuery) => void;
}

export interface UseOrdersQueryResult {
  query: OrdersQuery;

  scope: OrderListScope;
  filters: OrderFilters;
  sort: OrderSort;
  cursor: OrderCursor | undefined;
  pageSize: number;

  setScope: (scope: OrderListScope) => void;
  setFilters: (filters: OrderFilters) => void;
  setSort: (sort: OrderSort) => void;
  setCursor: (cursor: OrderCursor | undefined) => void;
  setPageSize: (pageSize: number) => void;

  resetFilters: () => void;
  reset: () => void;
}

type OrdersQueryUpdater = (current: OrdersQuery) => OrdersQuery;

export function useOrdersQuery({
  value: controlledValue,
  defaultValue,
  onChange,
}: UseOrdersQueryOptions = {}): UseOrdersQueryResult {
  const isControlled = controlledValue !== undefined;

  const [initialValue] = useState<OrdersQuery>(() =>
    ordersQuerySchema.parse({
      scope: "open",
      ...defaultValue,
    }),
  );

  const [internalValue, setInternalValue] = useState<OrdersQuery>(initialValue);

  const query = controlledValue ?? internalValue;
  const queryRef = useRef(query);
  queryRef.current = query;

  function updateQuery(updater: OrdersQueryUpdater) {
    const current = queryRef.current;
    const next = updater(current);

    if (next === current) {
      return;
    }

    queryRef.current = next;

    if (!isControlled) {
      setInternalValue(next);
    }

    onChange?.(next);
  }

  function setScope(scope: OrderListScope) {
    updateQuery((current) => {
      if (current.scope === scope) {
        return current;
      }

      const filters = {
        ...current.filters,
      };

      delete filters.statuses;

      return resetCursor({
        ...current,
        scope,
        filters,
      });
    });
  }

  function setFilters(filters: OrderFilters) {
    updateQuery((current) => {
      if (current.filters === filters) {
        return current;
      }

      return resetCursor({
        ...current,
        filters,
      });
    });
  }

  function setSort(sort: OrderSort) {
    updateQuery((current) => {
      if (
        current.sort.field === sort.field &&
        current.sort.direction === sort.direction
      ) {
        return current;
      }

      return resetCursor({
        ...current,
        sort,
      });
    });
  }

  function setCursor(cursor: OrderCursor | undefined) {
    updateQuery((current) => {
      if (current.pagination.cursor === cursor) {
        return current;
      }

      return {
        ...current,
        pagination: {
          limit: current.pagination.limit,
          ...(cursor === undefined ? {} : { cursor }),
        },
      };
    });
  }

  function setPageSize(pageSize: number) {
    updateQuery((current) => {
      if (current.pagination.limit === pageSize) {
        return current;
      }

      return {
        ...current,
        pagination: {
          limit: pageSize,
        },
      };
    });
  }

  function resetFilters() {
    updateQuery((current) => {
      if (
        Object.keys(current.filters).length === 0 &&
        current.pagination.cursor === undefined
      ) {
        return current;
      }

      return {
        ...current,
        filters: {},
        pagination: {
          limit: current.pagination.limit,
        },
      };
    });
  }

  function reset() {
    updateQuery((current) => {
      return current === initialValue ? current : initialValue;
    });
  }

  return {
    query,
    scope: query.scope,
    filters: query.filters,
    sort: query.sort,
    cursor: query.pagination.cursor,
    pageSize: query.pagination.limit,
    setScope,
    setFilters,
    setSort,
    setCursor,
    setPageSize,
    resetFilters,
    reset,
  };
}

function resetCursor(query: OrdersQuery): OrdersQuery {
  return {
    ...query,
    pagination: {
      limit: query.pagination.limit,
    },
  };
}
