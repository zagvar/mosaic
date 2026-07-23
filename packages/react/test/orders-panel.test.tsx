import { I18nProvider } from "react-aria-components";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  OrderListItem,
  OrdersPage,
  OrdersQuery,
} from "@zagvar/mosaic-core";
import { ordersQuerySchema } from "@zagvar/mosaic-core";
import { describe, expect, it, vi } from "vitest";
import { OrdersPanel, type OrdersPanelProps } from "../src/orders-panel";

const equityOrder: OrderListItem = {
  symbol: "AAPL",
  assetClass: "equity",
  venue: "NASDAQ",
  orderId: "order-1",
  accountId: "account-1",
  side: "buy",
  type: "limit",
  tif: "day",
  status: "partially_filled",
  version: 2,
  quoteCurrency: "USD",
  quantity: "1.25",
  filledQuantity: "0.25",
  remainingQuantity: "1",
  limitPrice: "430.125",
  submittedAt: "2026-07-22T01:00:00Z",
  updatedAt: "2026-07-22T01:01:00Z",
  capabilities: {
    cancel: true,
    replace: true,
  },
};

const cryptoOrder: OrderListItem = {
  symbol: "BTC/USD",
  assetClass: "crypto",
  venue: "COINBASE",
  baseAsset: "BTC",
  quoteAsset: "USD",
  orderId: "order-2",
  accountId: "account-1",
  side: "sell",
  type: "market",
  tif: "ioc",
  status: "open",
  version: 1,
  quoteCurrency: "USD",
  notional: "25",
  filledQuantity: "0.00000013",
  submittedAt: "2026-07-22T02:00:00Z",
  updatedAt: "2026-07-22T02:00:01Z",
  capabilities: {
    cancel: true,
    replace: false,
  },
};

const page: OrdersPage = {
  items: [equityOrder, cryptoOrder],
  totalCount: 2,
  asOf: "2026-07-22T02:00:01Z",
};

const emptyPage: OrdersPage = {
  items: [],
  totalCount: 0,
  asOf: "2026-07-22T02:00:01Z",
};

function renderOrdersPanel(props: Omit<OrdersPanelProps, "onQueryChange">) {
  const onQueryChange = vi.fn<(query: OrdersQuery) => void>();

  const result = render(
    <I18nProvider locale="en-US">
      <OrdersPanel {...props} onQueryChange={onQueryChange} />
    </I18nProvider>,
  );

  return {
    ...result,
    onQueryChange,
  };
}

describe("OrdersPanel", () => {
  it("renders mixed-instrument orders in grouped columns", () => {
    renderOrdersPanel({
      page,
      numberFormat: {
        quantityFractionDigits: 2,
        priceFractionDigits: 2,
        notionalFractionDigits: 2,
      },
      getNumberFormat: (order) =>
        order.assetClass === "crypto"
          ? {
              quantityFractionDigits: 8,
            }
          : {},
    });

    expect(screen.getByRole("table", { name: "Orders" })).toBeInTheDocument();

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("Equity · NASDAQ")).toBeInTheDocument();
    expect(screen.getByText("Buy · Limit")).toBeInTheDocument();
    expect(screen.getByText("1.25 AAPL")).toBeInTheDocument();
    expect(screen.getByText("0.25 AAPL")).toBeInTheDocument();
    expect(screen.getByText("430.13 USD")).toBeInTheDocument();

    expect(screen.getByText("BTC/USD")).toBeInTheDocument();
    expect(screen.getByText("Crypto · COINBASE")).toBeInTheDocument();
    expect(screen.getByText("Sell · Market")).toBeInTheDocument();
    expect(screen.getByText("25 USD")).toBeInTheDocument();
    expect(screen.getByText("0.00000013 BTC")).toBeInTheDocument();

    expect(screen.getByText("2 orders")).toBeInTheDocument();
  });

  it("emits a complete first-page query when scope changes", async () => {
    const user = userEvent.setup();

    const query = ordersQuerySchema.parse({
      scope: "open",
      filters: {
        symbols: ["AAPL"],
      },
      pagination: {
        cursor: "open-page-2",
        limit: 25,
      },
    });

    const { onQueryChange } = renderOrdersPanel({
      page,
      query,
    });

    await user.click(screen.getByRole("button", { name: "Order history" }));

    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith({
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

  it("reports the selected order for details", async () => {
    const user = userEvent.setup();
    const handleSelectOrder = vi.fn();

    renderOrdersPanel({
      page,
      onSelectOrder: handleSelectOrder,
    });

    await user.click(
      screen.getByRole("button", {
        name: "View AAPL order details",
      }),
    );

    expect(handleSelectOrder).toHaveBeenCalledTimes(1);
    expect(handleSelectOrder).toHaveBeenCalledWith(equityOrder);
  });

  it("renders the initial loading state", () => {
    renderOrdersPanel({
      isLoading: true,
    });

    expect(screen.getByRole("status")).toHaveTextContent("Loading orders...");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders an error and allows the host to retry", async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();

    renderOrdersPanel({
      errorMessage: "Orders are temporarily unavailable.",
      onRetry: handleRetry,
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Orders are temporarily unavailable.",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Try again",
      }),
    );

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("renders the empty message for the active scope", () => {
    renderOrdersPanel({
      page: emptyPage,
      defaultQuery: {
        scope: "open",
      },
    });

    expect(screen.getByText("No open orders.")).toBeInTheDocument();
  });

  it("distinguishes filtered-out results from an empty account", () => {
    renderOrdersPanel({
      page: emptyPage,
      defaultQuery: {
        scope: "open",
        filters: {
          symbols: ["AAPL"],
        },
      },
    });

    expect(
      screen.getByText("No orders match the selected filters."),
    ).toBeInTheDocument();
  });

  it("merges nested message overrides without losing defaults", () => {
    renderOrdersPanel({
      page,
      messages: {
        title: "My orders",
        statusValue: {
          open: "Working",
        },
      },
    });

    const table = screen.getByRole("table", {
      name: "My orders",
    });

    expect(within(table).getByText("Working")).toBeInTheDocument();
    expect(within(table).getByText("Partially filled")).toBeInTheDocument();
  });

  it("emits the next opaque cursor without constructing it locally", async () => {
    const user = userEvent.setup();

    const { onQueryChange } = renderOrdersPanel({
      page: {
        ...page,
        nextCursor: "next-page",
      },
    });

    await user.click(
      screen.getByRole("button", {
        name: "Next page",
      }),
    );

    expect(onQueryChange).toHaveBeenCalledWith({
      scope: "open",
      filters: {},
      sort: {
        field: "updatedAt",
        direction: "desc",
      },
      pagination: {
        cursor: "next-page",
        limit: 50,
      },
    });
  });

  it("resets the cursor when page size changes", async () => {
    const user = userEvent.setup();

    const query = ordersQuerySchema.parse({
      scope: "open",
      pagination: {
        cursor: "current-page",
        limit: 25,
      },
    });

    const { onQueryChange } = renderOrdersPanel({
      page,
      query,
      pageSizeOptions: [10, 25, 100],
    });

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: "Rows per page",
      }),
      "100",
    );

    expect(onQueryChange).toHaveBeenCalledWith({
      scope: "open",
      filters: {},
      sort: {
        field: "updatedAt",
        direction: "desc",
      },
      pagination: {
        limit: 100,
      },
    });
  });

  it("disables unavailable pagination directions", () => {
    renderOrdersPanel({
      page,
    });

    expect(
      screen.getByRole("button", {
        name: "Previous page",
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: "Next page",
      }),
    ).toBeDisabled();
  });

  it("emits multi-value side and status filters", async () => {
    const user = userEvent.setup();
    const { onQueryChange } = renderOrdersPanel({
      page,
    });

    await user.click(screen.getByText("All sides"));
    await user.click(
      screen.getByRole("checkbox", {
        name: "Buy",
      }),
    );

    await user.click(screen.getByText("All statuses"));
    await user.click(
      screen.getByRole("checkbox", {
        name: "Open",
      }),
    );

    expect(onQueryChange).toHaveBeenCalledTimes(2);
    expect(onQueryChange).toHaveBeenLastCalledWith({
      scope: "open",
      filters: {
        sides: ["buy"],
        statuses: ["open"],
      },
      sort: {
        field: "updatedAt",
        direction: "desc",
      },
      pagination: {
        limit: 50,
      },
    });
  });

  it("emits canonical comma-separated symbol filters on submission", async () => {
    const user = userEvent.setup();
    const { onQueryChange } = renderOrdersPanel({
      page,
      defaultQuery: {
        scope: "open",
        pagination: {
          cursor: "current-page",
          limit: 25,
        },
      },
    });

    const input = screen.getByRole("searchbox", {
      name: "Symbol",
    });

    await user.type(input, " AAPL, BTC/USD, AAPL ");
    await user.click(
      screen.getByRole("button", {
        name: "Apply symbol filter",
      }),
    );

    expect(onQueryChange).toHaveBeenCalledWith({
      scope: "open",
      filters: {
        symbols: ["AAPL", "BTC/USD"],
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

  it("does not emit an invalid symbol filter", async () => {
    const user = userEvent.setup();
    const { onQueryChange } = renderOrdersPanel({
      page,
    });

    await user.type(
      screen.getByRole("searchbox", {
        name: "Symbol",
      }),
      "A".repeat(65),
    );

    await user.click(
      screen.getByRole("button", {
        name: "Apply symbol filter",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter no more than 100 symbols, with at most 64 characters each.",
    );
    expect(onQueryChange).not.toHaveBeenCalled();
  });

  it("clears all backend filters and resets the cursor", async () => {
    const user = userEvent.setup();

    const query = ordersQuerySchema.parse({
      scope: "open",
      filters: {
        symbols: ["AAPL"],
        sides: ["buy"],
      },
      pagination: {
        cursor: "filtered-page-2",
        limit: 25,
      },
    });

    const { onQueryChange } = renderOrdersPanel({
      page,
      query,
    });

    await user.click(
      screen.getByRole("button", {
        name: "Clear filters",
      }),
    );

    expect(onQueryChange).toHaveBeenCalledWith({
      scope: "open",
      filters: {},
      sort: {
        field: "updatedAt",
        direction: "desc",
      },
      pagination: {
        limit: 25,
      },
    });
  });

  it("emits backend sorting and resets the cursor", async () => {
    const user = userEvent.setup();

    const { onQueryChange } = renderOrdersPanel({
      page,
      defaultQuery: {
        scope: "open",
        pagination: {
          cursor: "current-page",
          limit: 25,
        },
      },
    });

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: "Sort by",
      }),
      "submittedAt",
    );

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: "Sort direction",
      }),
      "asc",
    );

    expect(onQueryChange).toHaveBeenCalledTimes(2);
    expect(onQueryChange).toHaveBeenLastCalledWith({
      scope: "open",
      filters: {},
      sort: {
        field: "submittedAt",
        direction: "asc",
      },
      pagination: {
        limit: 25,
      },
    });
  });

  it("renders actions according to backend capabilities", async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();
    const handleReplace = vi.fn();

    renderOrdersPanel({
      page,
      onCancelOrder: handleCancel,
      onReplaceOrder: handleReplace,
    });

    expect(
      screen.getByRole("button", {
        name: "Cancel AAPL order",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Cancel BTC/USD order",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Replace AAPL order",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Replace BTC/USD order",
      }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Cancel BTC/USD order",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "Replace AAPL order",
      }),
    );

    expect(handleCancel).toHaveBeenCalledWith(cryptoOrder);
    expect(handleReplace).toHaveBeenCalledWith(equityOrder);
  });

  it("reflects host-controlled pending action state", () => {
    renderOrdersPanel({
      page,
      onCancelOrder: vi.fn(),
      onReplaceOrder: vi.fn(),
      isCancelingOrder: (order) => order.orderId === equityOrder.orderId,
    });

    const cancelingButton = screen.getByRole("button", {
      name: "Canceling AAPL order",
    });

    expect(cancelingButton).toBeDisabled();
    expect(cancelingButton).toHaveTextContent("Canceling...");

    expect(
      screen.getByRole("button", {
        name: "Replace AAPL order",
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: "Cancel BTC/USD order",
      }),
    ).toBeEnabled();
  });
});
