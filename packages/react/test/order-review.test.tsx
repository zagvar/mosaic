import { I18nProvider } from "react-aria-components";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrderSummary, PreparedOrder } from "@mosaic/core";
import { OrderReview } from "../src/order-review";

const limitOrder: PreparedOrder = {
  symbol: "AAPL",
  assetClass: "equity",
  side: "buy",
  type: "limit",
  tif: "day",
  qty: 1.25,
  limitPx: 100.1,
};

const limitSummary: OrderSummary = {
  order: limitOrder,
  estimatedNotional: 125.125,
  estimateBasis: "limit_px",
  warnings: [{ code: "estimated_notional" }],
};

describe("OrderReview", () => {
  it("renders the exact order and its derived estimate", () => {
    renderOrderReview(limitSummary);

    expect(
      screen.getByRole("heading", { name: "Review order" }),
    ).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("Buy")).toBeInTheDocument();
    expect(screen.getByText("Limit")).toBeInTheDocument();
    expect(screen.getByText("Day")).toBeInTheDocument();
    expect(screen.getByText("1.25 AAPL")).toBeInTheDocument();
    expect(screen.getByText("100.1 USD")).toBeInTheDocument();
    expect(screen.getByText("125.13 USD")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The displayed total is an estimate and may differ from execution.",
      ),
    ).toBeInTheDocument();
  });

  it("renders market and extended-hours warnings", () => {
    renderOrderReview({
      order: {
        symbol: "AAPL",
        assetClass: "equity",
        side: "sell",
        type: "market",
        tif: "day",
        qty: 2,
        extendedHours: true,
      },
      warnings: [
        { code: "market_price_not_guaranteed" },
        { code: "extended_hours" },
      ],
    });

    expect(
      screen.getByText("A market order's execution price is not guaranteed."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Extended-hours orders may have lower liquidity and wider spreads.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("reports cancel and confirm actions", async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();
    const handleConfirm = vi.fn();

    renderOrderReview(limitSummary, {
      onCancel: handleCancel,
      onConfirm: handleConfirm,
    });

    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Confirm order" }));

    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(handleConfirm).toHaveBeenCalledWith(limitOrder);
  });

  it("supports localized messages and locale-aware formatting", () => {
    renderOrderReview(
      limitSummary,
      {
        messages: {
          title: "注文内容",
          confirm: "注文を確定",
          warning: {
            estimated_notional: "表示された合計は見積もりです。",
          },
        },
      },
      "de-DE",
    );

    expect(
      screen.getByRole("heading", { name: "注文内容" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1,25 AAPL")).toBeInTheDocument();
    expect(screen.getByText("125,13 USD")).toBeInTheDocument();
    expect(screen.getByText("表示された合計は見積もりです。")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "注文を確定" }),
    ).toBeInTheDocument();
  });

  it("disables actions and exposes busy state while confirming", () => {
    const { container } = renderOrderReview(limitSummary, {
      isConfirming: true,
    });

    expect(container.querySelector("section")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Confirming..." }),
    ).toBeDisabled();
  });
});

function renderOrderReview(
  summary: OrderSummary,
  overrides: Partial<React.ComponentProps<typeof OrderReview>> = {},
  locale?: string,
) {
  const review = (
    <OrderReview
      summary={summary}
      quoteCurrency="USD"
      onCancel={() => {}}
      onConfirm={() => {}}
      {...overrides}
    />
  );

  return render(
    locale === undefined ? (
      review
    ) : (
      <I18nProvider locale={locale}>{review}</I18nProvider>
    ),
  );
}
