import { I18nProvider } from "react-aria-components";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MarketQuote } from "@zagvar/mosaic-core";
import { QuoteDisplay } from "../src/quote-display";

const quote: MarketQuote = {
  symbol: "AAPL",
  assetClass: "equity",
  bidPrice: "195.7",
  bidQuantity: "120",
  askPrice: "195.8",
  askQuantity: "95",
  lastPrice: "195.75",
  timestamp: "2026-01-01T14:30:00.000Z",
};

describe("QuoteDisplay", () => {
  it("renders top-of-book prices, sizes, last price, and spread", () => {
    renderQuoteDisplay();

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("195.7 USD")).toBeInTheDocument();
    expect(screen.getByText("120 AAPL")).toBeInTheDocument();
    expect(screen.getByText("195.8 USD")).toBeInTheDocument();
    expect(screen.getByText("95 AAPL")).toBeInTheDocument();
    expect(screen.getByText("195.75 USD")).toBeInTheDocument();
    expect(screen.getByText("Spread: 0.1 USD")).toBeInTheDocument();
  });

  it("reports selected prices with their market kind", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    renderQuoteDisplay({ onSelectPrice: handleSelect });

    await user.click(
      screen.getByRole("button", { name: "Use Ask price 195.8 USD" }),
    );

    expect(handleSelect).toHaveBeenCalledWith("195.8", "ask");
  });

  it("supports localized labels and number formatting", () => {
    renderQuoteDisplay(
      {
        messages: {
          bid: "Kauf",
          ask: "Verkauf",
          spread: "Spanne",
        },
      },
      "de-DE",
    );

    expect(screen.getByText("Kauf")).toBeInTheDocument();
    expect(screen.getByText("195,7 USD")).toBeInTheDocument();
    expect(screen.getByText("Spanne: 0,1 USD")).toBeInTheDocument();
  });

  it("disables selectable prices when requested", () => {
    renderQuoteDisplay({
      isDisabled: true,
      onSelectPrice: () => {},
    });

    expect(
      screen.getByRole("button", { name: "Use Bid price 195.7 USD" }),
    ).toBeDisabled();
  });
});

function renderQuoteDisplay(
  overrides: Partial<React.ComponentProps<typeof QuoteDisplay>> = {},
  locale?: string,
) {
  const display = (
    <QuoteDisplay quote={quote} quoteCurrency="USD" {...overrides} />
  );

  return render(
    locale === undefined ? (
      display
    ) : (
      <I18nProvider locale={locale}>{display}</I18nProvider>
    ),
  );
}
