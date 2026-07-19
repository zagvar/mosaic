import { I18nProvider } from "react-aria-components";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrderIntent, OrderSummary } from "@zagvar/mosaic-core";
import { OrderReview } from "../src/order-review";

const limitOrder: OrderIntent = {
  symbol: "AAPL",
  assetClass: "equity",
  side: "buy",
  type: "limit",
  tif: "day",
  quantity: "1.25",
  limitPrice: "100.1",
};

const limitSummary: OrderSummary = {
  order: limitOrder,
  estimatedNotional: "125.125",
  estimateBasis: "limit_price",
  warnings: [{ code: "estimated_notional" }],
};

function isoTimestamp(milliseconds: number): string {
  return new Date(milliseconds).toISOString();
}

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
        quantity: "2",
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

  it("renders a backend estimated fill price for market orders", () => {
    renderOrderReview({
      order: {
        symbol: "AAPL",
        assetClass: "equity",
        side: "buy",
        type: "market",
        tif: "day",
        quantity: "2",
      },
      quotePreview: {
        previewId: "preview-123",
        estimatedFillPrice: "195.82",
        createdAt: isoTimestamp(1000),
      },
      warnings: [{ code: "market_price_not_guaranteed" }],
    });

    expect(screen.getByText("Estimated fill price")).toBeInTheDocument();
    expect(screen.getByText("195.82 USD")).toBeInTheDocument();
  });

  it("does not render an estimated fill price for limit orders", () => {
    renderOrderReview({
      ...limitSummary,
      quotePreview: {
        previewId: "preview-123",
        estimatedFillPrice: "100",
        createdAt: isoTimestamp(1000),
      },
    });

    expect(screen.queryByText("Estimated fill price")).not.toBeInTheDocument();
  });

  it("renders high slippage as a localized percentage", () => {
    renderOrderReview(
      {
        order: {
          symbol: "AAPL",
          assetClass: "equity",
          side: "buy",
          type: "market",
          tif: "day",
          quantity: "2",
        },
        quotePreview: {
          previewId: "preview-123",
          slippageBps: "65",
          createdAt: isoTimestamp(1000),
        },
        warnings: [{ code: "slippage_high" }],
      },
      {},
      "de-DE",
    );

    const formattedPercent = new Intl.NumberFormat("de-DE", {
      maximumFractionDigits: 2,
      style: "percent",
    }).format(0.0065);

    expect(
      screen.getByText((content) => {
        return (
          content.startsWith("Estimated price movement is ") &&
          content
            .replace(/\s/g, "")
            .includes(formattedPercent.replace(/\s/g, ""))
        );
      }),
    ).toBeInTheDocument();
  });

  it("hides market reference details by default", () => {
    renderOrderReview({
      ...limitSummary,
      marketReference: {
        symbol: "AAPL",
        assetClass: "equity",
        price: "100.25",
        kind: "ask",
        timestamp: isoTimestamp(1000),
        mode: "real_time",
        displaySource: "SIP",
      },
    });

    expect(screen.queryByText("Ask reference price")).not.toBeInTheDocument();
    expect(screen.queryByText("SIP")).not.toBeInTheDocument();
  });

  it("can render only the market reference price", () => {
    renderOrderReview(
      {
        ...limitSummary,
        marketReference: {
          symbol: "AAPL",
          assetClass: "equity",
          price: "100.25",
          kind: "ask",
          timestamp: isoTimestamp(1000),
          mode: "real_time",
          displaySource: "SIP",
        },
      },
      {
        marketReferenceDisplay: "price",
      },
    );

    expect(screen.getByText("Ask reference price")).toBeInTheDocument();
    expect(screen.getByText("100.25 USD")).toBeInTheDocument();
    expect(screen.queryByText("Real-time")).not.toBeInTheDocument();
    expect(screen.queryByText("SIP")).not.toBeInTheDocument();
  });

  it("can render full market reference details and freshness warnings", () => {
    const timestamp = new Date(Date.UTC(2026, 5, 25, 10, 30, 0)).toISOString();
    const formattedTimestamp = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(new Date(timestamp));

    renderOrderReview(
      {
        ...limitSummary,
        marketReference: {
          symbol: "AAPL",
          assetClass: "equity",
          price: "100.25",
          kind: "ask",
          timestamp,
          mode: "delayed",
          displaySource: "SIP",
        },
        warnings: [
          { code: "market_data_delayed" },
          { code: "market_data_stale" },
        ],
      },
      {
        marketReferenceDisplay: "full",
      },
    );

    expect(screen.getByText("Ask reference price")).toBeInTheDocument();
    expect(screen.getByText("100.25 USD")).toBeInTheDocument();
    expect(screen.getByText("Delayed")).toBeInTheDocument();
    expect(screen.getByText("SIP")).toBeInTheDocument();
    expect(screen.getByText(formattedTimestamp)).toBeInTheDocument();
    expect(
      screen.getByText("The market price used for this review is delayed."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The market price used for this review may be out of date.",
      ),
    ).toBeInTheDocument();
  });

  it("renders host-provided estimated fees", () => {
    renderOrderReview({
      ...limitSummary,
      fees: [
        {
          type: "commission",
          amount: "0.25",
          currency: "USD",
        },
        {
          type: "regulatory",
          amount: "0.01",
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
          amount: "0.000001",
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
            amount: "0.25",
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

  it("supports localized market reference labels", () => {
    renderOrderReview(
      {
        ...limitSummary,
        marketReference: {
          symbol: "AAPL",
          assetClass: "equity",
          price: "100.25",
          kind: "ask",
          timestamp: isoTimestamp(1000),
          mode: "real_time",
        },
      },
      {
        marketReferenceDisplay: "full",
        messages: {
          marketReference: (priceKind) => `${priceKind}の参考価格`,
          marketPriceKind: {
            ask: "売気配",
          },
          marketDataMode: "市場データ",
          marketDataModeValue: {
            real_time: "リアルタイム",
          },
        },
      },
    );

    expect(screen.getByText("売気配の参考価格")).toBeInTheDocument();
    expect(screen.getByText("市場データ")).toBeInTheDocument();
    expect(screen.getByText("リアルタイム")).toBeInTheDocument();
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

  it("disables confirmation and allows refresh when the preview expires", async () => {
    const user = userEvent.setup();
    const handleRefresh = vi.fn();

    renderOrderReview(
      {
        ...limitSummary,
        quotePreview: {
          previewId: "preview-expired",
          createdAt: isoTimestamp(1000),
          expiresAt: isoTimestamp(2000),
        },
        warnings: [{ code: "estimated_notional" }, { code: "preview_expired" }],
      },
      {
        onRefreshPreview: handleRefresh,
      },
    );

    expect(
      screen.getByRole("button", { name: "Confirm order" }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        "This order preview has expired. Refresh it before confirming.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Refresh preview" }));

    expect(handleRefresh).toHaveBeenCalledWith(limitOrder);
  });

  it("exposes preview refresh busy state", () => {
    const { container } = renderOrderReview(
      {
        ...limitSummary,
        quotePreview: {
          previewId: "preview-expired",
          createdAt: isoTimestamp(1000),
          expiresAt: isoTimestamp(2000),
        },
        warnings: [{ code: "preview_expired" }],
      },
      {
        isRefreshingPreview: true,
        onRefreshPreview: () => {},
      },
    );

    expect(container.querySelector("section")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Refreshing..." }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
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
