import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

  it("shows a total field error for market buys below the minimum notional", async () => {
    const user = userEvent.setup();

    renderTradeTicket();

    await user.click(screen.getByRole("radio", { name: "Market" }));
    await user.type(screen.getByRole("textbox", { name: "Total" }), "0.5");
    await user.click(screen.getByRole("button", { name: "Preview order" }));

    expect(screen.getByText("Total is below the minimum.")).toBeInTheDocument();
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

    expect(screen.getByRole("alert")).toHaveTextContent("asset_rules_mismatch");
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
      type: "limit",
    });
  });
});

function renderTradeTicket(
  overrides: Partial<React.ComponentProps<typeof TradeTicket>> = {},
) {
  return render(
    <TradeTicket
      symbol="AAPL"
      assetClass="equity"
      assetRules={equityRules}
      cashAvailable={1000}
      assetQtyAvailable={10}
      {...overrides}
    />,
  );
}
