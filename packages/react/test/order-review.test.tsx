import { I18nProvider } from "react-aria-components";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrderIntent, OrderSummary } from "@mosaic/core";
import { OrderReview } from "../src/order-review";

const limitOrder: OrderIntent = {
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

  it("renders host-provided estimated fees", () => {
    renderOrderReview({
      ...limitSummary,
      fees: [
        {
          type: "commission",
          amount: 0.25,
          currency: "USD",
        },
        {
          type: "regulatory",
          amount: 0.01,
          currency: "USD",
        },
      ],
    });

    expect(screen.getByText("Estimated fee: Commission")).toBeInTheDocument();
    expect(
      screen.getByText("Estimated fee: Regulatory fee"),
    ).toBeInTheDocument();
    expect(screen.getByText("0.25 USD")).toBeInTheDocument();
    expect(screen.getByText("0.01 USD")).toBeInTheDocument();
  });

  it("uses per-fee precision for non-quote currencies", () => {
    renderOrderReview({
      ...limitSummary,
      fees: [
        {
          type: "commission",
          amount: 0.000001,
          currency: "BTC",
          fractionDigits: 8,
        },
      ],
    });

    expect(screen.getByText("0.000001 BTC")).toBeInTheDocument();
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
    expect(
      screen.getByText("表示された合計は見積もりです。"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "注文を確定" }),
    ).toBeInTheDocument();
  });

  it("supports localized fee labels", () => {
    renderOrderReview(
      {
        ...limitSummary,
        fees: [
          {
            type: "commission",
            amount: 0.25,
            currency: "USD",
          },
        ],
      },
      {
        messages: {
          estimatedFee: (feeType) => `${feeType}の概算`,
          feeType: {
            commission: "取引手数料",
          },
        },
      },
    );

    expect(screen.getByText("取引手数料の概算")).toBeInTheDocument();
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

  it("displays a controlled confirmation error without hiding the order", () => {
    renderOrderReview(limitSummary, {
      confirmationError: "The broker rejected this order.",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The broker rejected this order.",
    );
    expect(screen.getByText("1.25 AAPL")).toBeInTheDocument();
    expect(screen.getByText("100.1 USD")).toBeInTheDocument();
  });

  it("maps a structured execution error to a default message", () => {
    renderOrderReview(limitSummary, {
      confirmationError: {
        code: "market_closed",
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The market is closed for this order.",
    );
  });

  it("supports localized structured execution errors", () => {
    renderOrderReview(limitSummary, {
      confirmationError: {
        code: "broker_rejected",
      },
      messages: {
        confirmationError: {
          broker_rejected: "ブローカーが注文を拒否しました。",
        },
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "ブローカーが注文を拒否しました。",
    );
  });

  it("allows confirmation to be retried after an error", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();

    renderOrderReview(limitSummary, {
      confirmationError: "The broker rejected this order.",
      onConfirm: handleConfirm,
    });

    await user.click(screen.getByRole("button", { name: "Confirm order" }));

    expect(handleConfirm).toHaveBeenCalledWith(limitOrder);
  });

  it("removes a controlled confirmation error when the host clears it", () => {
    const { rerender } = renderOrderReview(limitSummary, {
      confirmationError: "The broker rejected this order.",
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(
      <OrderReview
        summary={limitSummary}
        quoteCurrency="USD"
        confirmationError={null}
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
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
