import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import type { AssetRules, OrderSummary, PreparedOrder } from "@mosaic/core";
import { createOrderSummary } from "@mosaic/core";
import {
  OrderReview,
  TradeTicket,
  type OrderReviewClassNames,
  type TradeDraftValue,
  type TradeTicketClassNames,
} from "@mosaic/react";
import "./styles.css";

const appleRules: AssetRules = {
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
  extendedHours: {
    allowed: true,
    allowedOrderTypes: ["limit"],
    allowedTifs: ["day", "gtc"],
  },
};

// simulate prices supplied by a quote stream or order book
const latestPrice = 195.75;
const bidPrice = 195.7;
const askPrice = 195.8;

const segmentedClassNames = {
  root: "demo-segmented-radio",
  label: "demo-field-label",
  options: "demo-segmented-radio-options",
  field: "demo-segmented-radio-field",
  button: "demo-segmented-radio-button",
};

const tradeTicketClassNames: TradeTicketClassNames = {
  root: "demo-trade-ticket",
  availableBalance: {
    root: "demo-available-balance",
    label: "demo-available-balance-label",
    value: "demo-available-balance-value",
  },
  sideToggle: segmentedClassNames,
  typeToggle: segmentedClassNames,
  tifSelect: {
    root: "demo-tif-select",
    label: "demo-field-label",
    trigger: "demo-tif-select-trigger",
    value: "demo-tif-select-value",
    indicator: "demo-tif-select-indicator",
    popover: "demo-tif-select-popover",
    listBox: "demo-tif-select-listbox",
    item: "demo-tif-select-item",
  },
  numberField: {
    root: "demo-number-field",
    label: "demo-field-label",
    control: "demo-number-field-control",
    input: "demo-number-field-input",
    suffix: "demo-number-field-suffix",
    description: "demo-field-description",
    error: "demo-field-error",
  },
  amountPresets: {
    root: "demo-amount-presets",
    button: "demo-amount-preset-button",
  },
  alert: "demo-alert",
  submitButton: "demo-submit-button",
};

const orderReviewClassNames: OrderReviewClassNames = {
  root: "demo-order-review",
  title: "demo-order-review-title",
  details: "demo-order-review-details",
  row: "demo-order-review-row",
  term: "demo-order-review-term",
  value: "demo-order-review-value",
  warnings: "demo-order-review-warnings",
  warningsTitle: "demo-order-review-warnings-title",
  warningList: "demo-order-review-warning-list",
  warning: "demo-order-review-warning",
  actions: "demo-order-review-actions",
  cancelButton: "demo-order-review-cancel",
  confirmButton: "demo-order-review-confirm",
};

function App() {
  const [value, setValue] = useState<TradeDraftValue>({
    side: "buy",
    type: "limit",
    tif: "day",
    limitPx: latestPrice,
  });
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(
    null,
  );

  function applyLimitPrice(limitPx: number) {
    if (value.type !== "limit") return;

    setValue((current) => ({
      ...current,
      limitPx,
    }));
  }

  function reviewOrder(order: PreparedOrder) {
    setConfirmationMessage(null);
    setOrderSummary(
      createOrderSummary(order, {
        referencePx: latestPrice,
      }),
    );
  }

  async function confirmOrder(order: PreparedOrder) {
    setIsConfirming(true);

    try {
      await simulateBrokerSubmission();
      console.info("Order confirmed", order);
      setOrderSummary(null);
      setConfirmationMessage(
        `${order.side === "buy" ? "Buy" : "Sell"} order confirmed for ${order.symbol}.`,
      );
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <main>
      <h1>Mosaic</h1>

      {confirmationMessage === null ? null : (
        <p className="demo-confirmation-status" role="status">
          {confirmationMessage}
        </p>
      )}

      {orderSummary === null ? (
        <>
          <div className="demo-market-prices">
            <span className="demo-market-prices-label">Market prices</span>

            <div className="demo-market-price-actions">
              <button
                type="button"
                disabled={value.type !== "limit"}
                onClick={() => applyLimitPrice(bidPrice)}
              >
                Bid {bidPrice}
              </button>

              <button
                type="button"
                disabled={value.type !== "limit"}
                onClick={() => applyLimitPrice(latestPrice)}
              >
                Last {latestPrice}
              </button>

              <button
                type="button"
                disabled={value.type !== "limit"}
                onClick={() => applyLimitPrice(askPrice)}
              >
                Ask {askPrice}
              </button>
            </div>
          </div>

          <TradeTicket
            symbol="AAPL"
            assetClass="equity"
            assetRules={appleRules}
            cashAvailable={1000}
            assetQtyAvailable={10}
            quoteCurrency="USD"
            value={value}
            onChange={setValue}
            classNames={tradeTicketClassNames}
            onSubmitDraft={reviewOrder}
            onValidationIssues={(issues) => {
              console.info("Validation issues", issues);
            }}
          />
        </>
      ) : (
        <OrderReview
          summary={orderSummary}
          quoteCurrency="USD"
          quantityFractionDigits={appleRules.qtyPrecision}
          priceFractionDigits={appleRules.pricePrecision}
          notionalFractionDigits={appleRules.notionalPrecision}
          isConfirming={isConfirming}
          classNames={orderReviewClassNames}
          onCancel={() => setOrderSummary(null)}
          onConfirm={confirmOrder}
        />
      )}

      <section className="demo-draft-preview">
        <h2>Controlled value</h2>
        <pre>{JSON.stringify(value, null, 2)}</pre>
      </section>
    </main>
  );
}

function simulateBrokerSubmission() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 700);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
