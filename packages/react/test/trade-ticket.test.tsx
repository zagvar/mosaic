import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "react-aria-components";
import type { AssetRules } from "@mosaic/core";
import { TradeTicket } from "../src/trade-ticket";

const equityRules: AssetRules = {
  assetClass: "equity",
  symbol: "AAPL",
  allowedOrderTypes: ["market", "limit"],
  allowedTifs: ["day", "gtc", "opg", "cls", "ioc", "fok"],
  supportsNotional: true,
  notionalOrderTypes: ["market"],
  minQty: 0.000001,
  minNotional: 1,
  minPrice: 0.01,
  maxPrice: 1000,
  qtyPrecision: 6,
  pricePrecision: 2,
  notionalPrecision: 2,
  lotSize: 0.000001,
  tickSize: 0.01,
  quoteIncrement: 0.01,
};

describe("TradeTicket", () => {
  it("shows a quantity field error after submitting an empty limit order", async () => {
    const user = userEvent.setup();

    renderTradeTicket();

    await user.click(screen.getByRole("button", { name: "Preview order" }));

    expect(screen.getByText("Enter a quantity or total.")).toBeInTheDocument();
  });

  it("shows a limit price field error when a limit order has quantity but no price", async () => {
    const user = userEvent.setup();

    renderTradeTicket();

    await user.type(screen.getByRole("textbox", { name: "Quantity" }), "1");
    await user.click(screen.getByRole("button", { name: "Preview order" }));

    expect(screen.getByText("Enter a limit price.")).toBeInTheDocument();
  });

  it("shows a limit price field error when price exceeds the maximum", async () => {
    const user = userEvent.setup();

    renderTradeTicket();

    await user.type(screen.getByRole("textbox", { name: "Quantity" }), "1");
    await user.type(
      screen.getByRole("textbox", { name: "Limit price" }),
      "1001",
    );
    await user.click(screen.getByRole("button", { name: "Preview order" }));

    expect(
      screen.getByText("Maximum limit price is 1000 USD."),
    ).toBeInTheDocument();
  });

  it("shows a total field error for market buys below the minimum notional", async () => {
    const user = userEvent.setup();

    renderTradeTicket();

    await user.click(screen.getByRole("radio", { name: "Market" }));
    await user.type(screen.getByRole("textbox", { name: "Total" }), "0.5");
    await user.click(screen.getByRole("button", { name: "Preview order" }));

    expect(screen.getByText("Minimum total is 1 USD.")).toBeInTheDocument();
  });

  it("shows global validation issues in the alert region", async () => {
    const user = userEvent.setup();

    renderTradeTicket({
      assetRules: {
        ...equityRules,
        symbol: "MSFT",
      },
    });

    await user.type(screen.getByRole("textbox", { name: "Quantity" }), "1");
    await user.type(screen.getByRole("textbox", { name: "Limit price" }), "10");
    await user.click(screen.getByRole("button", { name: "Preview order" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Asset rules do not match this order.",
    );
  });

  it("submits a valid limit order draft", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    renderTradeTicket({ onSubmitDraft: handleSubmit });

    await user.type(screen.getByRole("textbox", { name: "Quantity" }), "1");
    await user.type(screen.getByRole("textbox", { name: "Limit price" }), "10");
    await user.click(screen.getByRole("button", { name: "Preview order" }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({
      assetClass: "equity",
      limitPx: 10,
      qty: 1,
      side: "buy",
      symbol: "AAPL",
      tif: "day",
      type: "limit",
    });
  });

  it("supports custom translated labels and validation messages", async () => {
    const user = userEvent.setup();

    renderTradeTicket({
      messages: {
        submit: "Review trade",
        qty: "Amount",
        validation: {
          qty_or_notional_required: "Please enter an amount.",
        },
      },
    });

    await user.click(screen.getByRole("button", { name: "Review trade" }));

    expect(screen.getByRole("textbox", { name: "Amount" })).toBeInTheDocument();
    expect(screen.getByText("Please enter an amount.")).toBeInTheDocument();
  });

  it("supports replacing the full visible message set with non-English copy", async () => {
    const user = userEvent.setup();

    renderTradeTicket({
      messages: {
        submit: "注文を確認",
        qty: "数量",
        limitPx: "指値価格",
        notional: "合計",
        available: "利用可能",
        validation: {
          qty_or_notional_required: "数量または合計を入力してください。",
          limit_px_required: "指値価格を入力してください。",
          notional_below_min: ({ assetRules, quoteCurrency }) =>
            `最小合計は ${assetRules.minNotional} ${quoteCurrency} です。`,
        },
      },
    });

    await user.click(screen.getByRole("button", { name: "注文を確認" }));

    expect(screen.getByText("利用可能")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "数量" })).toBeInTheDocument();
    expect(
      screen.getByText("数量または合計を入力してください。"),
    ).toBeInTheDocument();
  });

  it("supports custom validation message functions", async () => {
    const user = userEvent.setup();

    renderTradeTicket({
      messages: {
        validation: {
          notional_below_min: ({ assetRules, quoteCurrency }) =>
            `Min total: ${assetRules.minNotional} ${quoteCurrency}`,
        },
      },
    });

    await user.click(screen.getByRole("radio", { name: "Market" }));
    await user.type(screen.getByRole("textbox", { name: "Total" }), "0.5");
    await user.click(screen.getByRole("button", { name: "Preview order" }));

    expect(screen.getByText("Min total: 1 USD")).toBeInTheDocument();
  });

  it("formats default dynamic validation numbers using the React Aria locale", async () => {
    const user = userEvent.setup();

    renderTradeTicket(
      {
        assetRules: {
          ...equityRules,
          minNotional: 1000.5,
        },
      },
      { locale: "de-DE" },
    );

    await user.click(screen.getByRole("radio", { name: "Market" }));
    await user.type(screen.getByRole("textbox", { name: "Total" }), "1000");
    await user.click(screen.getByRole("button", { name: "Preview order" }));

    expect(
      screen.getByText("Minimum total is 1000,5 USD."),
    ).toBeInTheDocument();
  });

  it("hides submitted validation errors after changing order type", async () => {
    const user = userEvent.setup();

    renderTradeTicket();

    await user.click(screen.getByRole("button", { name: "Preview order" }));

    expect(screen.getByText("Enter a quantity or total.")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Market" }));

    expect(
      screen.queryByText("Enter a quantity or total."),
    ).not.toBeInTheDocument();
  });

  it("hides submitted validation errors after changing side", async () => {
    const user = userEvent.setup();

    renderTradeTicket();

    await user.click(screen.getByRole("button", { name: "Preview order" }));

    expect(screen.getByText("Enter a quantity or total.")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Sell" }));

    expect(
      screen.queryByText("Enter a quantity or total."),
    ).not.toBeInTheDocument();
  });

  it("prefills the limit price from the host", () => {
    renderTradeTicket({
      defaultLimitPx: 195.5,
    });

    expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
      "195.5",
    );
  });

  it("allows selecting a time in force", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    renderTradeTicket({ onSubmitDraft: handleSubmit });

    await user.click(screen.getByRole("button", { name: /Time in force/i }));

    await user.click(
      screen.getByRole("option", {
        name: "Good 'til canceled",
      }),
    );

    await user.type(screen.getByRole("textbox", { name: "Quantity" }), "1");

    await user.type(screen.getByRole("textbox", { name: "Limit price" }), "10");

    await user.click(screen.getByRole("button", { name: "Preview order" }));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        tif: "gtc",
      }),
    );
  });
});

function renderTradeTicket(
  overrides: Partial<React.ComponentProps<typeof TradeTicket>> = {},
  options: { locale?: string } = {},
) {
  const ticket = (
    <TradeTicket
      symbol="AAPL"
      assetClass="equity"
      assetRules={equityRules}
      cashAvailable={1000}
      assetQtyAvailable={10}
      {...overrides}
    />
  );

  return render(
    options.locale === undefined ? (
      ticket
    ) : (
      <I18nProvider locale={options.locale}>{ticket}</I18nProvider>
    ),
  );
}
