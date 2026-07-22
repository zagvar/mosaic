import { act, renderHook } from "@testing-library/react";
import { ordersQuerySchema } from "@zagvar/mosaic-core";
import { describe, expect, it, vi } from "vitest";
import { useOrdersQuery } from "../src/use-orders-query";

describe("useOrdersQuery", () => {
  it("creates the default open-orders query", () => {
    const { result } = renderHook(() => useOrdersQuery());

    expect(result.current.query).toEqual({
      scope: "open",
      filters: {},
      sort: {
        field: "updatedAt",
        direction: "desc",
      },
      pagination: {
        limit: 50,
      },
    });
  });

  it("resets the cursor when filters change", () => {
    const { result } = renderHook(() =>
      useOrdersQuery({
        defaultValue: {
          scope: "open",
          filters: {
            symbols: ["AAPL"],
          },
          pagination: {
            cursor: "page-2",
            limit: 25,
          },
        },
      }),
    );

    act(() => {
      result.current.setFilters({
        symbols: ["MSFT"],
        statuses: ["open"],
      });
    });

    expect(result.current.filters).toEqual({
      symbols: ["MSFT"],
      statuses: ["open"],
    });
    expect(result.current.query.pagination).toEqual({
      limit: 25,
    });
  });

  it("resets the cursor when scope or sorting changes", () => {
    const { result } = renderHook(() =>
      useOrdersQuery({
        defaultValue: {
          scope: "open",
          pagination: {
            cursor: "page-2",
            limit: 25,
          },
        },
      }),
    );

    act(() => {
      result.current.setScope("history");
    });

    expect(result.current.scope).toBe("history");
    expect(result.current.cursor).toBeUndefined();

    act(() => {
      result.current.setCursor("history-page-2");
      result.current.setSort({
        field: "submittedAt",
        direction: "asc",
      });
    });

    expect(result.current.sort).toEqual({
      field: "submittedAt",
      direction: "asc",
    });
    expect(result.current.cursor).toBeUndefined();
  });

  it("preserves page size while navigating and resets pagination when it changes", () => {
    const { result } = renderHook(() =>
      useOrdersQuery({
        defaultValue: {
          scope: "open",
          pagination: {
            limit: 25,
          },
        },
      }),
    );

    act(() => {
      result.current.setCursor("page-2");
    });

    expect(result.current.query.pagination).toEqual({
      cursor: "page-2",
      limit: 25,
    });

    act(() => {
      result.current.setPageSize(100);
    });

    expect(result.current.query.pagination).toEqual({
      limit: 100,
    });
  });

  it("emits a complete controlled query", () => {
    const handleChange = vi.fn();
    const value = ordersQuerySchema.parse({
      scope: "open",
      filters: {
        symbols: ["AAPL"],
      },
      pagination: {
        cursor: "page-2",
        limit: 50,
      },
    });

    const { result } = renderHook(() =>
      useOrdersQuery({
        value,
        onChange: handleChange,
      }),
    );

    act(() => {
      result.current.setSort({
        field: "submittedAt",
        direction: "asc",
      });
    });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      scope: "open",
      filters: {
        symbols: ["AAPL"],
      },
      sort: {
        field: "submittedAt",
        direction: "asc",
      },
      pagination: {
        limit: 50,
      },
    });
  });

  it("clears filters and returns to the first page", () => {
    const { result } = renderHook(() =>
      useOrdersQuery({
        defaultValue: {
          scope: "history",
          filters: {
            sides: ["sell"],
          },
          pagination: {
            cursor: "page-3",
            limit: 25,
          },
        },
      }),
    );

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters).toEqual({});
    expect(result.current.query.pagination).toEqual({
      limit: 25,
    });
  });

  it("clears incompatible status filters when scope changes", () => {
    const { result } = renderHook(() =>
      useOrdersQuery({
        defaultValue: {
          scope: "open",
          filters: {
            symbols: ["AAPL"],
            statuses: ["open", "partially_filled"],
          },
          pagination: {
            cursor: "open-page-2",
            limit: 25,
          },
        },
      }),
    );

    act(() => {
      result.current.setScope("history");
    });

    expect(result.current.query).toEqual({
      scope: "history",
      filters: {
        symbols: ["AAPL"],
      },
      sort: {
        field: "updatedAt",
        direction: "desc",
      },
      pagination: {
        limit: 25,
      },
    });
  });
});
