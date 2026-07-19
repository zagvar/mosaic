import { useState } from "react";
import type { AssetRules, DecimalString } from "@zagvar/mosaic-core";
import { I18nProvider } from "react-aria-components";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TradeTicket } from "../src/trade-ticket";
import type { TradeDraftValue } from "../src/use-trade-draft";

const equityRules: AssetRules = {
  assetClass: "equity",
  symbol: "AAPL",
  allowedOrderTypes: ["market", "limit"],
  allowedTifs: ["day", "gtc", "opg", "cls", "ioc", "fok"],
  supportsNotional: true,
  notionalOrderTypes: ["market"],
  minQuantity: "0.000001",
  minNotional: "1",
  minPrice: "0.01",
  maxPrice: "1000",
  quantityPrecision: 6,
  pricePrecision: 2,
  notionalPrecision: 2,
  lotSize: "0.000001",
  tickSize: "0.01",
  quoteIncrement: "0.01",
};

describe("TradeTicket", () => {
  it("shows a quantity field error after submitting an empty limit order", async () => {
    const user = userEvent.setup();

    renderTradeTicket();

    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(screen.getByText("Enter a quantity or total.")).toBeInTheDocument();
  });

  it("shows a limit price field error when a limit order has quantity but no price", async () => {
    const user = userEvent.setup();

    renderTradeTicket();

    await user.type(screen.getByRole("textbox", { name: "Quantity" }), "1");
    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(screen.getByText("Enter a limit price.")).toBeInTheDocument();
  });

  it("formats non-ISO crypto quote balances without crashing", () => {
    renderTradeTicket({
      assetRules: {
        ...equityRules,
        assetClass: "crypto",
        allowedTifs: ["gtc", "ioc"],
        symbol: "BTC/USDT",
      },
      assetClass: "crypto",
      quoteCurrency: "USDT",
      symbol: "BTC/USDT",
    });

    expect(screen.getByText("1,000 USDT")).toBeInTheDocument();
  });

  it("shows a limit price field error when price exceeds the maximum", async () => {
    const user = userEvent.setup();

    renderTradeTicket();

    await user.type(screen.getByRole("textbox", { name: "Quantity" }), "1");
    await user.type(
      screen.getByRole("textbox", { name: "Limit price" }),
      "1001",
    );
    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(
      screen.getByText("Maximum limit price is 1000 USD."),
    ).toBeInTheDocument();
  });

  it("shows a total field error for market buys below the minimum notional", async () => {
    const user = userEvent.setup();

    renderTradeTicket();

    await user.click(screen.getByRole("radio", { name: "Market" }));
    await user.type(screen.getByRole("textbox", { name: "Total" }), "0.5");
    await user.click(screen.getByRole("button", { name: "Review order" }));

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
    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Asset rules do not match this order.",
    );
  });

  it("supports custom translated labels and validation messages", async () => {
    const user = userEvent.setup();

    renderTradeTicket({
      messages: {
        submit: "Review trade",
        quantity: "Amount",
        validation: {
          quantity_or_notional_required: "Please enter an amount.",
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
        quantity: "数量",
        limitPrice: "指値価格",
        notional: "合計",
        available: "利用可能",
        minimum: (formattedValue) => `最小 ${formattedValue}`,
        validation: {
          quantity_or_notional_required: "数量または合計を入力してください。",
          limit_price_required: "指値価格を入力してください。",
          notional_below_min: ({ assetRules, quoteCurrency }) =>
            `最小合計は ${assetRules.minNotional} ${quoteCurrency} です。`,
        },
      },
    });

    await user.click(screen.getByRole("button", { name: "注文を確認" }));

    expect(screen.getByText("利用可能")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "数量" })).toHaveAttribute(
      "placeholder",
      "最小 0.000001",
    );
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
    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(screen.getByText("Min total: 1 USD")).toBeInTheDocument();
  });

  it("formats default dynamic validation numbers using the React Aria locale", async () => {
    const user = userEvent.setup();

    renderTradeTicket(
      {
        assetRules: {
          ...equityRules,
          minNotional: "1000.5",
        },
      },
      { locale: "de-DE" },
    );

    await user.click(screen.getByRole("radio", { name: "Market" }));
    await user.type(screen.getByRole("textbox", { name: "Total" }), "1000");
    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(
      screen.getByText("Minimum total is 1000,5 USD."),
    ).toBeInTheDocument();
  });

  it("formats amount presets using the React Aria locale", () => {
    const formattedPercent = new Intl.NumberFormat("de-DE", {
      maximumFractionDigits: 2,
      style: "percent",
    }).format(0.25);

    renderTradeTicket({}, { locale: "de-DE" });

    expect(
      screen.getByRole("button", { name: formattedPercent }),
    ).toBeInTheDocument();
  });

  it("hides submitted validation errors after changing order type", async () => {
    const user = userEvent.setup();

    renderTradeTicket();

    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(screen.getByText("Enter a quantity or total.")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Market" }));

    expect(
      screen.queryByText("Enter a quantity or total."),
    ).not.toBeInTheDocument();
  });

  it("hides submitted validation errors after changing side", async () => {
    const user = userEvent.setup();

    renderTradeTicket();

    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(screen.getByText("Enter a quantity or total.")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Sell" }));

    expect(
      screen.queryByText("Enter a quantity or total."),
    ).not.toBeInTheDocument();
  });

  it("prefills the limit price from the host", () => {
    renderTradeTicket({
      defaultLimitPrice: "195.5",
    });

    expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
      "195.5",
    );
  });

  it("allows selecting a time in force", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    renderTradeTicket({ onSubmit: handleSubmit });

    await user.click(screen.getByRole("button", { name: /Time in force/i }));

    await user.click(
      screen.getByRole("option", {
        name: "Good 'til canceled",
      }),
    );

    await user.type(screen.getByRole("textbox", { name: "Quantity" }), "1");

    await user.type(screen.getByRole("textbox", { name: "Limit price" }), "10");

    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        tif: "gtc",
      }),
    );
  });

  it("initializes an uncontrolled ticket from defaultValue", () => {
    renderTradeTicket({
      defaultValue: {
        side: "sell",
        type: "limit",
        tif: "gtc",
        quantity: "2",
        limitPrice: "100",
      },
    });

    expect(screen.getByRole("radio", { name: "Sell" })).toBeChecked();

    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("2");

    expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
      "100",
    );

    expect(
      screen.getByRole("button", { name: /Time in force/i }),
    ).toHaveTextContent("Good 'til canceled");
  });

  it("supports externally controlled ticket state", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<ControlledTradeTicket onChange={handleChange} />);

    expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
      "100",
    );

    await user.click(screen.getByRole("radio", { name: "Market" }));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith({
      side: "buy",
      type: "market",
      tif: "day",
    });

    expect(
      screen.queryByRole("textbox", { name: "Limit price" }),
    ).not.toBeInTheDocument();

    expect(screen.getByRole("textbox", { name: "Total" })).toBeInTheDocument();
  });

  it("reflects an externally controlled limit price", () => {
    const { rerender } = render(<ControlledPriceTicket limitPrice="100" />);

    expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
      "100",
    );

    rerender(<ControlledPriceTicket limitPrice="101.25" />);

    expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
      "101.25",
    );
  });

  it("submits a valid limit order draft", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    renderTradeTicket({ onSubmit: handleSubmit });

    await user.type(screen.getByRole("textbox", { name: "Quantity" }), "1");
    await user.type(screen.getByRole("textbox", { name: "Limit price" }), "10");
    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({
      assetClass: "equity",
      limitPrice: "10",
      quantity: "1",
      side: "buy",
      symbol: "AAPL",
      tif: "day",
      type: "limit",
    });
  });

  it("submits a normalized order candidate for review", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    renderTradeTicket({
      defaultValue: {
        side: "buy",
        type: "market",
        tif: "day",
        notional: "100",
        limitPrice: "95",
      },
      onSubmit: handleSubmit,
    });

    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(handleSubmit).toHaveBeenCalledWith({
      symbol: "AAPL",
      assetClass: "equity",
      side: "buy",
      type: "market",
      tif: "day",
      notional: "100",
    });
  });

  it("reports successful submission and preserves values by default", async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();

    renderTradeTicket({
      defaultValue: {
        side: "buy",
        type: "limit",
        tif: "day",
        quantity: "2",
        limitPrice: "125",
      },
      onSubmit: vi.fn(),
      onSubmitSuccess: handleSuccess,
    });

    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(handleSuccess).toHaveBeenCalledTimes(1);
    expect(handleSuccess).toHaveBeenCalledWith({
      symbol: "AAPL",
      assetClass: "equity",
      side: "buy",
      type: "limit",
      tif: "day",
      quantity: "2",
      limitPrice: "125",
    });

    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("2");
    expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
      "125",
    );
  });

  it("resets transactional values after success when requested", async () => {
    const user = userEvent.setup();

    renderTradeTicket({
      defaultValue: {
        side: "sell",
        type: "limit",
        tif: "gtc",
        quantity: "2",
        limitPrice: "125",
      },
      defaultLimitPrice: "100",
      resetOnSubmitSuccess: true,
      onSubmit: vi.fn(),
    });

    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(screen.getByRole("radio", { name: "Sell" })).toBeChecked();

    expect(
      screen.getByRole("button", { name: /Time in force/i }),
    ).toHaveTextContent("Good 'til canceled");

    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("");

    expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
      "100",
    );
  });

  it("does not reset a newer controlled draft after a stale submission succeeds", async () => {
    const user = userEvent.setup();
    const deferred = createDeferredPromise();
    const handleChange = vi.fn();
    const handleSuccess = vi.fn();
    const initialValue: TradeDraftValue = {
      side: "buy",
      type: "limit",
      tif: "day",
      quantity: "1",
      limitPrice: "10",
    };

    const { rerender } = render(
      <TradeTicket
        symbol="AAPL"
        assetClass="equity"
        assetRules={equityRules}
        cashAvailable="1000"
        assetQuantityAvailable="10"
        value={initialValue}
        onChange={handleChange}
        onSubmit={() => deferred.promise}
        onSubmitSuccess={handleSuccess}
        resetOnSubmitSuccess
      />,
    );

    await user.click(screen.getByRole("button", { name: "Review order" }));

    rerender(
      <TradeTicket
        symbol="AAPL"
        assetClass="equity"
        assetRules={equityRules}
        cashAvailable="1000"
        assetQuantityAvailable="10"
        value={{
          ...initialValue,
          quantity: "2",
          limitPrice: "11",
        }}
        onChange={handleChange}
        onSubmit={() => deferred.promise}
        onSubmitSuccess={handleSuccess}
        resetOnSubmitSuccess
      />,
    );

    deferred.resolve();

    expect(
      await screen.findByRole("button", { name: "Review order" }),
    ).toBeEnabled();
    expect(handleSuccess).toHaveBeenCalledWith({
      symbol: "AAPL",
      assetClass: "equity",
      ...initialValue,
    });
    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("2");
    expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
      "11",
    );
  });

  it("reflects externally controlled pending state", () => {
    const { container } = renderTradeTicket({
      defaultValue: {
        side: "buy",
        type: "limit",
        tif: "day",
        quantity: "1",
        limitPrice: "10",
      },
      isSubmitting: true,
    });

    expect(container.querySelector("form")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Buy" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Quantity" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Submitting..." }),
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Submitting...");
  });

  it("disables controls and prevents duplicate submissions while pending", async () => {
    const user = userEvent.setup();
    const deferred = createDeferredPromise();
    const handleSubmit = vi.fn(() => deferred.promise);

    renderTradeTicket({
      defaultValue: {
        side: "buy",
        type: "limit",
        tif: "day",
        quantity: "1",
        limitPrice: "10",
      },
      onSubmit: handleSubmit,
    });

    const submit = screen.getByRole("button", {
      name: "Review order",
    });

    await user.click(submit);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Submitting..." }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Submitting..." }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);

    expect(screen.getByRole("status")).toHaveTextContent("Submitting...");

    deferred.resolve();

    expect(
      await screen.findByRole("button", { name: "Review order" }),
    ).toBeEnabled();

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("reports submission errors and restores the controls", async () => {
    const user = userEvent.setup();
    const error = new Error("Order rejected");
    const handleError = vi.fn();

    renderTradeTicket({
      defaultValue: {
        side: "buy",
        type: "limit",
        tif: "day",
        quantity: "1",
        limitPrice: "10",
      },
      onSubmit: async () => {
        throw error;
      },
      onSubmitError: handleError,
    });

    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(handleError).toHaveBeenCalledWith(error);

    expect(screen.getByRole("button", { name: "Review order" })).toBeEnabled();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't submit your order. Please try again.",
    );
  });

  it("does not display an internal error for a stale submission", async () => {
    const user = userEvent.setup();
    const deferred = createDeferredPromise();
    const error = new Error("Order rejected");
    const handleError = vi.fn();
    const initialValue: TradeDraftValue = {
      side: "buy",
      type: "limit",
      tif: "day",
      quantity: "1",
      limitPrice: "10",
    };

    const { rerender } = render(
      <TradeTicket
        symbol="AAPL"
        assetClass="equity"
        assetRules={equityRules}
        cashAvailable="1000"
        assetQuantityAvailable="10"
        value={initialValue}
        onChange={() => {}}
        onSubmit={() => deferred.promise}
        onSubmitError={handleError}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Review order" }));

    rerender(
      <TradeTicket
        symbol="AAPL"
        assetClass="equity"
        assetRules={equityRules}
        cashAvailable="1000"
        assetQuantityAvailable="10"
        value={{
          ...initialValue,
          limitPrice: "11",
        }}
        onChange={() => {}}
        onSubmit={() => deferred.promise}
        onSubmitError={handleError}
      />,
    );

    deferred.reject(error);

    expect(
      await screen.findByRole("button", { name: "Review order" }),
    ).toBeEnabled();
    expect(handleError).toHaveBeenCalledWith(error);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("supports a localized submission error message", async () => {
    const user = userEvent.setup();

    renderTradeTicket({
      defaultValue: {
        side: "buy",
        type: "limit",
        tif: "day",
        quantity: "1",
        limitPrice: "10",
      },
      messages: {
        submissionError: "注文を送信できませんでした。",
      },
      onSubmit: async () => {
        throw new Error("Rejected");
      },
    });

    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "注文を送信できませんでした。",
    );
  });

  it("clears a submission error when the draft changes", async () => {
    const user = userEvent.setup();

    renderTradeTicket({
      defaultValue: {
        side: "buy",
        type: "limit",
        tif: "day",
        quantity: "1",
        limitPrice: "10",
      },
      onSubmit: async () => {
        throw new Error("Rejected");
      },
    });

    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();

    const quantity = screen.getByRole("textbox", {
      name: "Quantity",
    });

    await user.clear(quantity);
    await user.type(quantity, "2");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears a submission error when a controlled value changes externally", async () => {
    const user = userEvent.setup();
    const initialValue: TradeDraftValue = {
      side: "buy",
      type: "limit",
      tif: "day",
      quantity: "1",
      limitPrice: "10",
    };

    const { rerender } = render(
      <TradeTicket
        symbol="AAPL"
        assetClass="equity"
        assetRules={equityRules}
        cashAvailable="1000"
        assetQuantityAvailable="10"
        value={initialValue}
        onChange={() => {}}
        onSubmit={async () => {
          throw new Error("Rejected");
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Review order" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();

    rerender(
      <TradeTicket
        symbol="AAPL"
        assetClass="equity"
        assetRules={equityRules}
        cashAvailable="1000"
        assetQuantityAvailable="10"
        value={{
          ...initialValue,
          limitPrice: "11",
        }}
        onChange={() => {}}
        onSubmit={async () => {
          throw new Error("Rejected");
        }}
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("displays a host-controlled submission error", () => {
    renderTradeTicket({
      submissionError: "Broker rejected this order.",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Broker rejected this order.",
    );
  });

  it("does not clear a host-controlled submission error when the draft changes", async () => {
    const user = userEvent.setup();

    renderTradeTicket({
      submissionError: "Broker rejected this order.",
    });

    await user.type(screen.getByRole("textbox", { name: "Quantity" }), "2");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Broker rejected this order.",
    );
  });

  // The host must clear it by changing the prop:
  it("clears a host-controlled submission error when its prop becomes null", () => {
    const { rerender } = renderTradeTicket({
      submissionError: "Broker rejected this order.",
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(
      <TradeTicket
        symbol="AAPL"
        assetClass="equity"
        assetRules={equityRules}
        cashAvailable="1000"
        assetQuantityAvailable="10"
        submissionError={null}
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
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
      cashAvailable="1000"
      assetQuantityAvailable="10"
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

function ControlledTradeTicket({
  onChange,
}: {
  onChange?: (value: TradeDraftValue) => void;
}) {
  const [value, setValue] = useState<TradeDraftValue>({
    side: "buy",
    type: "limit",
    tif: "day",
    limitPrice: "100",
  });

  function handleChange(nextValue: TradeDraftValue) {
    setValue(nextValue);
    onChange?.(nextValue);
  }

  return (
    <TradeTicket
      symbol="AAPL"
      assetClass="equity"
      assetRules={equityRules}
      cashAvailable="1000"
      assetQuantityAvailable="10"
      value={value}
      onChange={handleChange}
    />
  );
}

function ControlledPriceTicket({ limitPrice }: { limitPrice: DecimalString }) {
  const value: TradeDraftValue = {
    side: "buy",
    type: "limit",
    tif: "day",
    limitPrice,
  };

  return (
    <TradeTicket
      symbol="AAPL"
      assetClass="equity"
      assetRules={equityRules}
      cashAvailable="1000"
      assetQuantityAvailable="10"
      value={value}
      onChange={() => {}}
    />
  );
}

function createDeferredPromise() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<void>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, reject, resolve };
}
