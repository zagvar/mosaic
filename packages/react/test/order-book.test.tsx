import { I18nProvider } from "react-aria-components";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrderBookSnapshot } from "@zagvar/mosaic-core";
import { OrderBook } from "../src/order-book";

const snapshot: OrderBookSnapshot = {
  symbol: "BTC/USD",
  assetClass: "crypto",
  asks: [
    { price: 101, quantity: 1 },
    { price: 102, quantity: 2 },
    { price: 103, quantity: 4 },
  ],
  bids: [
    { price: 100, quantity: 1.5 },
    { price: 99, quantity: 2.5 },
    { price: 98, quantity: 5 },
  ],
  timestamp: "2026-01-01T14:30:00.000Z",
};

const classNames = {
  side: "book-side",
  columnHeaders: "book-column-headers",
  columnHeader: "book-column-header",
  levels: "book-levels",
  level: "book-level",
  bidLevel: "book-bid-level",
  askLevel: "book-ask-level",
  depthBar: "book-depth-bar",
  price: "book-price",
  quantity: "book-quantity",
  total: "book-total",
};

describe("OrderBook", () => {
  it("renders a shared header, asks, spread, and bids", () => {
    const { container } = renderOrderBook();

    expect(
      screen.getByRole("heading", { name: "Order book" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Asks" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Bids" })).toBeInTheDocument();
    expect(screen.getByText("Spread")).toBeInTheDocument();
    expect(screen.getByText("1 USD")).toBeInTheDocument();
    expect(container.querySelectorAll(".book-column-headers")).toHaveLength(1);

    const askRows = container.querySelectorAll<HTMLElement>(".book-ask-level");
    const bidRows = container.querySelectorAll<HTMLElement>(".book-bid-level");

    expect(askRows).toHaveLength(3);
    expect(bidRows).toHaveLength(3);
    expect(within(askRows[0]!).getByText("103")).toBeInTheDocument();
    expect(within(askRows[2]!).getByText("101")).toBeInTheDocument();
    expect(within(bidRows[0]!).getByText("100")).toBeInTheDocument();
  });

  it("computes cumulative quantity totals independently for each side", () => {
    const { container } = renderOrderBook();

    const askRows = container.querySelectorAll<HTMLElement>(".book-ask-level");
    const bidRows = container.querySelectorAll<HTMLElement>(".book-bid-level");

    expect(askRows[0]!.querySelector(".book-total")).toHaveTextContent("7");
    expect(askRows[1]!.querySelector(".book-total")).toHaveTextContent("3");
    expect(askRows[2]!.querySelector(".book-total")).toHaveTextContent("1");

    expect(bidRows[0]!.querySelector(".book-total")).toHaveTextContent("1.5");
    expect(bidRows[1]!.querySelector(".book-total")).toHaveTextContent("4");
    expect(bidRows[2]!.querySelector(".book-total")).toHaveTextContent("9");
  });

  it("limits each side to the requested depth", () => {
    const { container } = renderOrderBook({ depth: 2 });

    expect(container.querySelectorAll(".book-ask-level")).toHaveLength(2);
    expect(container.querySelectorAll(".book-bid-level")).toHaveLength(2);
    expect(screen.queryByText("103")).not.toBeInTheDocument();
    expect(screen.queryByText("98")).not.toBeInTheDocument();
  });

  it("reports selected prices and sides", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    renderOrderBook({ onSelectPrice: handleSelect });

    await user.click(screen.getByRole("button", { name: "Use ask price 101" }));
    await user.click(screen.getByRole("button", { name: "Use bid price 100" }));

    expect(handleSelect).toHaveBeenNthCalledWith(1, 101, "ask");
    expect(handleSelect).toHaveBeenNthCalledWith(2, 100, "bid");
  });

  it("disables selectable levels when requested", () => {
    renderOrderBook({
      isDisabled: true,
      onSelectPrice: () => {},
    });

    expect(
      screen.getByRole("button", { name: "Use ask price 101" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Use bid price 100" }),
    ).toBeDisabled();
  });

  it("renders non-interactive rows when no selection callback is provided", () => {
    const { container } = renderOrderBook();

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(container.querySelectorAll(".book-level")).toHaveLength(6);
  });

  it("renders an empty state when both sides are empty", () => {
    renderOrderBook({
      snapshot: {
        ...snapshot,
        asks: [],
        bids: [],
      },
    });

    expect(
      screen.getByText("No order-book levels available."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Asks" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Spread")).not.toBeInTheDocument();
  });

  it("hides cumulative totals when requested", () => {
    const { container } = renderOrderBook({ showTotals: false });

    expect(screen.queryByText("Total")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".book-total")).toHaveLength(0);
  });

  it("supports localized labels and number formatting", () => {
    renderOrderBook(
      {
        messages: {
          title: "Orderbuch",
          bids: "Kauf",
          asks: "Verkauf",
          spread: "Spanne",
        },
      },
      "de-DE",
    );

    expect(
      screen.getByRole("heading", { name: "Orderbuch" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Kauf" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Verkauf" })).toBeInTheDocument();
    expect(screen.getByText("Spanne")).toBeInTheDocument();
    expect(screen.getByText("1 USD")).toBeInTheDocument();
    expect(screen.getAllByText("1,5")).toHaveLength(2);
  });

  it("exposes proportional cumulative depth bars", () => {
    const { container } = renderOrderBook();
    const askRows = container.querySelectorAll<HTMLElement>(".book-ask-level");
    const bidRows = container.querySelectorAll<HTMLElement>(".book-bid-level");

    expect(
      askRows[0]!.querySelector<HTMLElement>(".book-depth-bar"),
    ).toHaveStyle({ width: "77.77777777777779%" });
    expect(
      askRows[2]!.querySelector<HTMLElement>(".book-depth-bar"),
    ).toHaveStyle({ width: "11.11111111111111%" });
    expect(
      bidRows[2]!.querySelector<HTMLElement>(".book-depth-bar"),
    ).toHaveStyle({ width: "100%" });
  });

  it("exposes the selected layout as a styling hook", () => {
    const { container } = renderOrderBook({ layout: "split" });

    expect(container.querySelector("section")).toHaveAttribute(
      "data-layout",
      "split",
    );
  });
});

function renderOrderBook(
  overrides: Partial<React.ComponentProps<typeof OrderBook>> = {},
  locale?: string,
) {
  const book = (
    <OrderBook
      snapshot={snapshot}
      quoteCurrency="USD"
      classNames={classNames}
      {...overrides}
    />
  );

  return render(
    locale === undefined ? (
      book
    ) : (
      <I18nProvider locale={locale}>{book}</I18nProvider>
    ),
  );
}
