import { I18nProvider } from "react-aria-components";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OrderDetailsRecord } from "@zagvar/mosaic-core";
import { describe, expect, it, vi } from "vitest";
import { OrderDetails, type OrderDetailsProps } from "../src/order-details";

const details: OrderDetailsRecord = {
  order: {
    symbol: "AAPL",
    assetClass: "equity",
    venue: "NASDAQ",
    orderId: "order-2",
    clientOrderId: "client-order-2",
    accountId: "account-1",
    replacesOrderId: "order-1",
    side: "buy",
    type: "limit",
    tif: "day",
    extendedHours: false,
    status: "partially_filled",
    version: 2,
    quoteCurrency: "USD",
    quantity: "1.25",
    filledQuantity: "0.25",
    remainingQuantity: "1",
    filledNotional: "107.53125",
    limitPrice: "430.125",
    averageFillPrice: "430.125",
    submittedAt: "2026-07-22T01:00:00Z",
    updatedAt: "2026-07-22T01:01:00Z",
    capabilities: {
      cancel: true,
      replace: true,
    },
  },
  fills: [],
  fees: [],
  events: [],
  statusReason: {
    code: "broker",
    message: "Awaiting the remaining shares.",
  },
};

const detailsWithFill: OrderDetailsRecord = {
  ...details,
  fills: [
    {
      fillId: "fill-1",
      orderId: "order-2",
      price: "430.125",
      quantity: "0.25",
      notional: "107.53125",
      liquidity: "maker",
      venue: "NASDAQ",
      timestamp: "2026-07-22T01:01:00Z",
      sequence: 1,
    },
  ],
};

const detailsWithFees: OrderDetailsRecord = {
  ...details,
  fills: [
    {
      fillId: "fill-1",
      orderId: "order-2",
      price: "430.125",
      quantity: "0.25",
      liquidity: "maker",
      timestamp: "2026-07-22T01:01:00Z",
    },
  ],
  fees: [
    {
      feeId: "fee-1",
      orderId: "order-2",
      fillId: "fill-1",
      type: "commission",
      amount: "0.125",
      currency: "USD",
      fractionDigits: 3,
      timestamp: "2026-07-22T01:01:01Z",
    },
    {
      feeId: "fee-2",
      orderId: "order-2",
      fillId: "fill-1",
      type: "other",
      amount: "-0.005",
      currency: "USD",
      fractionDigits: 3,
    },
  ],
};

const detailsWithEvents: OrderDetailsRecord = {
  ...details,
  events: [
    {
      eventId: "event-1",
      orderId: "order-2",
      status: "pending",
      timestamp: "2026-07-22T01:00:00Z",
      sequence: 1,
    },
    {
      eventId: "event-2",
      orderId: "order-2",
      status: "open",
      timestamp: "2026-07-22T01:00:01Z",
      sequence: 2,
      reason: {
        code: "broker",
        message: "Accepted by the broker.",
      },
    },
    {
      eventId: "event-3",
      orderId: "order-2",
      status: "partially_filled",
      timestamp: "2026-07-22T01:01:00Z",
      sequence: 3,
    },
  ],
};

function renderOrderDetails(props?: Partial<OrderDetailsProps>) {
  return render(
    <I18nProvider locale="en-US">
      <OrderDetails
        details={details}
        numberFormat={{
          quantityFractionDigits: 2,
          priceFractionDigits: 2,
          notionalFractionDigits: 2,
        }}
        {...props}
      />
    </I18nProvider>,
  );
}

describe("OrderDetails", () => {
  it("renders the order summary with instrument-specific precision", () => {
    renderOrderDetails();

    expect(
      screen.getByRole("heading", {
        name: "AAPL order details",
      }),
    ).toBeInTheDocument();

    const summary = screen.getByRole("region", {
      name: "Order summary",
    });

    expect(within(summary).getByText("AAPL")).toBeInTheDocument();
    expect(within(summary).getByText("NASDAQ")).toBeInTheDocument();
    expect(within(summary).getByText("Buy")).toBeInTheDocument();
    expect(within(summary).getByText("Limit")).toBeInTheDocument();
    expect(within(summary).getByText("1.25 AAPL")).toBeInTheDocument();
    expect(within(summary).getByText("0.25 AAPL")).toBeInTheDocument();
    expect(within(summary).getByText("1 AAPL")).toBeInTheDocument();
    const limitPriceRow =
      within(summary).getByText("Limit price").parentElement;
    const averageFillPriceRow =
      within(summary).getByText("Average fill price").parentElement;

    expect(limitPriceRow).not.toBeNull();
    expect(averageFillPriceRow).not.toBeNull();

    expect(within(limitPriceRow!).getByText("430.13 USD")).toBeInTheDocument();
    expect(
      within(averageFillPriceRow!).getByText("430.13 USD"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Awaiting the remaining shares."),
    ).toBeInTheDocument();
  });

  it("allows the host to close the details view", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    renderOrderDetails({
      onClose: handleClose,
    });

    await user.click(
      screen.getByRole("button", {
        name: "Close AAPL order details",
      }),
    );

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("reports selection of a related order", async () => {
    const user = userEvent.setup();
    const handleSelectRelatedOrder = vi.fn();

    renderOrderDetails({
      onSelectRelatedOrder: handleSelectRelatedOrder,
    });

    await user.click(
      screen.getByRole("button", {
        name: "View related order order-1",
      }),
    );

    expect(handleSelectRelatedOrder).toHaveBeenCalledTimes(1);
    expect(handleSelectRelatedOrder).toHaveBeenCalledWith("order-1");
  });

  it("merges nested message overrides without losing defaults", () => {
    renderOrderDetails({
      messages: {
        summary: "Overview",
        statusValue: {
          partially_filled: "Working",
        },
      },
    });

    const summary = screen.getByRole("region", {
      name: "Overview",
    });

    expect(within(summary).getByText("Working")).toBeInTheDocument();
    expect(within(summary).getByText("Buy")).toBeInTheDocument();
  });

  it("disables interactive controls when disabled", () => {
    renderOrderDetails({
      isDisabled: true,
      onClose: vi.fn(),
      onSelectRelatedOrder: vi.fn(),
    });

    expect(
      screen.getByRole("button", {
        name: "Close AAPL order details",
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: "View related order order-1",
      }),
    ).toBeDisabled();
  });

  it("renders an empty fills state", () => {
    renderOrderDetails();

    const fills = screen.getByRole("region", {
      name: "Fills",
    });

    expect(
      within(fills).getByText("No fills have been reported."),
    ).toBeInTheDocument();

    expect(within(fills).queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders reported fills without deriving missing execution values", () => {
    renderOrderDetails({
      details: detailsWithFill,
    });

    const fills = screen.getByRole("region", {
      name: "Fills",
    });

    const table = within(fills).getByRole("table", {
      name: "Fills",
    });

    expect(within(table).getByText("0.25 AAPL")).toBeInTheDocument();
    expect(within(table).getByText("430.13 USD")).toBeInTheDocument();
    expect(within(table).getByText("107.53 USD")).toBeInTheDocument();
    expect(within(table).getByText("Maker")).toBeInTheDocument();
    expect(within(table).getByText("NASDAQ")).toBeInTheDocument();
    expect(within(table).getByText("fill-1")).toBeInTheDocument();
  });

  it("renders an empty fees state", () => {
    renderOrderDetails();

    const fees = screen.getByRole("region", {
      name: "Fees",
    });

    expect(
      within(fees).getByText("No fees have been reported."),
    ).toBeInTheDocument();

    expect(within(fees).queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders charges and rebates using each fee's precision", () => {
    renderOrderDetails({
      details: detailsWithFees,
    });

    const fees = screen.getByRole("region", {
      name: "Fees",
    });

    const table = within(fees).getByRole("table", {
      name: "Fees",
    });

    expect(within(table).getByText("Commission")).toBeInTheDocument();
    expect(within(table).getByText("0.125 USD")).toBeInTheDocument();
    expect(within(table).getByText("Other fee")).toBeInTheDocument();
    expect(within(table).getByText("-0.005 USD")).toBeInTheDocument();
    expect(within(table).getAllByText("fill-1")).toHaveLength(2);
    expect(within(table).getByText("fee-1")).toBeInTheDocument();
    expect(within(table).getByText("fee-2")).toBeInTheDocument();
  });

  it("renders an empty timeline state", () => {
    renderOrderDetails();

    const timeline = screen.getByRole("region", {
      name: "Order timeline",
    });

    expect(
      within(timeline).getByText("No lifecycle events have been reported."),
    ).toBeInTheDocument();

    expect(within(timeline).queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders lifecycle events in backend-provided order", () => {
    renderOrderDetails({
      details: detailsWithEvents,
    });

    const timeline = screen.getByRole("region", {
      name: "Order timeline",
    });

    const items = within(timeline).getAllByRole("listitem");

    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Pending"),
      expect.stringContaining("Open"),
      expect.stringContaining("Partially filled"),
    ]);

    expect(
      within(timeline).getByText("Accepted by the broker."),
    ).toBeInTheDocument();

    expect(within(timeline).getByText("event-1")).toBeInTheDocument();
    expect(within(timeline).getByText("event-2")).toBeInTheDocument();
    expect(within(timeline).getByText("event-3")).toBeInTheDocument();
  });

  it("reports cancel and replace actions to the host", async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();
    const handleReplace = vi.fn();

    renderOrderDetails({
      onCancelOrder: handleCancel,
      onReplaceOrder: handleReplace,
    });

    const actions = screen.getByRole("group", {
      name: "Order actions",
    });

    await user.click(
      within(actions).getByRole("button", {
        name: "Cancel AAPL order",
      }),
    );

    await user.click(
      within(actions).getByRole("button", {
        name: "Replace AAPL order",
      }),
    );

    expect(handleCancel).toHaveBeenCalledWith(details.order);
    expect(handleReplace).toHaveBeenCalledWith(details.order);
  });

  it("hides actions that the backend does not allow", () => {
    const cancelOnlyDetails: OrderDetailsRecord = {
      ...details,
      order: {
        ...details.order,
        capabilities: {
          cancel: true,
          replace: false,
        },
      },
    };

    renderOrderDetails({
      details: cancelOnlyDetails,
      onCancelOrder: vi.fn(),
      onReplaceOrder: vi.fn(),
    });

    expect(
      screen.getByRole("button", {
        name: "Cancel AAPL order",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Replace AAPL order",
      }),
    ).not.toBeInTheDocument();
  });

  it("reflects host-controlled pending action state", () => {
    renderOrderDetails({
      onCancelOrder: vi.fn(),
      onReplaceOrder: vi.fn(),
      isCanceling: true,
    });

    const cancelButton = screen.getByRole("button", {
      name: "Canceling AAPL order",
    });

    expect(cancelButton).toBeDisabled();
    expect(cancelButton).toHaveAttribute("aria-busy", "true");
    expect(cancelButton).toHaveTextContent("Canceling...");

    expect(
      screen.getByRole("button", {
        name: "Replace AAPL order",
      }),
    ).toBeDisabled();
  });
});
