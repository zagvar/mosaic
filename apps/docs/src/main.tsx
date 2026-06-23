import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { AssetRules } from "@mosaic/core";
import { TradeTicket } from "@mosaic/react";
import type { TradeTicketClassNames } from "@mosaic/react";
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main>
      <h1>Mosaic</h1>

      <TradeTicket
        symbol="AAPL"
        assetClass="equity"
        assetRules={appleRules}
        cashAvailable={1000}
        assetQtyAvailable={10}
        quoteCurrency="USD"
        defaultTif="day"
        classNames={tradeTicketClassNames}
        onSubmitDraft={(draft) => {
          console.info("Draft submitted", draft);
        }}
        onValidationIssues={(issues) => {
          console.info("Validation issues", issues);
        }}
      />
    </main>
  </StrictMode>,
);
