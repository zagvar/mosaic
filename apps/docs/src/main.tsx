import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type {
  OrderExecutionError,
  OrderIntent,
  OrderSummary,
} from "@mosaic/core";
import {
  OrderBook,
  OrderReview,
  QuoteDisplay,
  RecentTrades,
  TradeTicket,
  type TradeDraftValue,
} from "@mosaic/react";
import {
  appleQuote,
  appleRules,
  bitcoinRules,
  latestPrice,
  orderBookClassNames,
  orderReviewClassNames,
  quoteDisplayClassNames,
  recentTradesClassNames,
  tradeTicketClassNames,
} from "./demo-config";
import { createDemoOrderSummary } from "./demo-order-summary";
import { bitcoinBookSnapshot } from "./mocks/order-book-data";
import { useOrderBookFeed } from "./use-order-book-feed";
import { useRecentTradesFeed } from "./use-recent-trades-feed";
import "./styles.css";

type DemoInstrument = "equity" | "crypto";

function App() {
  const [instrument, setInstrument] = useState<DemoInstrument>("equity");
  const [equityValue, setEquityValue] = useState<TradeDraftValue>({
    side: "buy",
    type: "limit",
    tif: "day",
    limitPx: latestPrice,
  });
  const [cryptoValue, setCryptoValue] = useState<TradeDraftValue>({
    side: "buy",
    type: "limit",
    tif: "gtc",
    limitPx: bitcoinBookSnapshot.asks[0]!.px,
  });

  const pageVisible = usePageVisible();
  const cryptoFeedEnabled = instrument === "crypto" && pageVisible;

  const { snapshot: bitcoinBook, status: bitcoinBookStatus } = useOrderBookFeed(
    "BTC/USD",
    cryptoFeedEnabled,
  );
  const { trades: bitcoinTrades, status: bitcoinTradesStatus } =
    useRecentTradesFeed("BTC/USD", cryptoFeedEnabled);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false);
  const [confirmationError, setConfirmationError] =
    useState<OrderExecutionError | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(
    null,
  );

  const activeValue = instrument === "equity" ? equityValue : cryptoValue;
  const activeRules = instrument === "equity" ? appleRules : bitcoinRules;

  useEffect(() => {
    if (confirmationMessage === null) return;

    const timeout = window.setTimeout(() => {
      setConfirmationMessage(null);
    }, 6000);

    return () => window.clearTimeout(timeout);
  }, [confirmationMessage]);

  function selectInstrument(nextInstrument: DemoInstrument) {
    setInstrument(nextInstrument);
    setConfirmationMessage(null);
  }

  function applyEquityLimitPrice(limitPx: number) {
    if (equityValue.type !== "limit") return;

    setEquityValue((current) => ({
      ...current,
      limitPx,
    }));
  }

  function applyCryptoLimitPrice(limitPx: number) {
    if (cryptoValue.type !== "limit") return;

    setCryptoValue((current) => ({
      ...current,
      limitPx,
    }));
  }

  function applyCryptoTradePrice(limitPx: number) {
    if (cryptoValue.type !== "limit") return;

    setCryptoValue((current) => ({
      ...current,
      limitPx,
    }));
  }

  function reviewOrder(order: OrderIntent) {
    setConfirmationMessage(null);
    setConfirmationError(null);
    setOrderSummary(
      createDemoOrderSummary(order, bitcoinBook ?? bitcoinBookSnapshot),
    );
  }

  async function refreshPreview(order: OrderIntent) {
    setIsRefreshingPreview(true);

    try {
      await simulatePreviewRequest();
      setOrderSummary(
        createDemoOrderSummary(order, bitcoinBook ?? bitcoinBookSnapshot),
      );
    } finally {
      setIsRefreshingPreview(false);
    }
  }

  async function confirmOrder(order: OrderIntent) {
    setIsConfirming(true);
    setConfirmationError(null);

    try {
      await simulateBrokerSubmission();
      console.info("Order confirmed", order);
      setOrderSummary(null);
      setConfirmationMessage(
        `${order.side === "buy" ? "Buy" : "Sell"} order confirmed for ${order.symbol}.`,
      );
    } catch {
      setConfirmationError({ code: "network_error" });
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <main>
      <h1>Mosaic</h1>

      {orderSummary === null ? (
        <div className="demo-instrument-switcher" aria-label="Instrument">
          <button
            type="button"
            aria-pressed={instrument === "equity"}
            onClick={() => selectInstrument("equity")}
          >
            AAPL
          </button>
          <button
            type="button"
            aria-pressed={instrument === "crypto"}
            onClick={() => selectInstrument("crypto")}
          >
            BTC/USD
          </button>
        </div>
      ) : null}

      {confirmationMessage === null ? null : (
        <div className="demo-confirmation-status">
          <span role="status">{confirmationMessage}</span>
          <button
            type="button"
            aria-label="Dismiss confirmation"
            onClick={() => setConfirmationMessage(null)}
          >
            X
          </button>
        </div>
      )}

      <div className="demo-trading-workspace">
        <div className="demo-market-panel">
          {instrument === "equity" ? (
            <QuoteDisplay
              quote={appleQuote}
              quoteCurrency="USD"
              priceFractionDigits={appleRules.pricePrecision}
              quantityFractionDigits={appleRules.qtyPrecision}
              isDisabled={orderSummary !== null || equityValue.type !== "limit"}
              classNames={quoteDisplayClassNames}
              onSelectPrice={applyEquityLimitPrice}
            />
          ) : bitcoinBook === null ? (
            <p className="demo-market-status" role="status">
              Loading order book...
            </p>
          ) : (
            <>
              <OrderBook
                snapshot={bitcoinBook}
                quoteCurrency="USD"
                depth={12}
                priceFractionDigits={bitcoinRules.pricePrecision}
                quantityFractionDigits={bitcoinRules.qtyPrecision}
                isDisabled={
                  orderSummary !== null || cryptoValue.type !== "limit"
                }
                classNames={orderBookClassNames}
                onSelectPrice={applyCryptoLimitPrice}
              />

              <RecentTrades
                trades={bitcoinTrades}
                quoteCurrency="USD"
                depth={16}
                priceFractionDigits={bitcoinRules.pricePrecision}
                quantityFractionDigits={bitcoinRules.qtyPrecision}
                isDisabled={
                  orderSummary !== null || cryptoValue.type !== "limit"
                }
                classNames={recentTradesClassNames}
                onSelectPrice={applyCryptoTradePrice}
              />
            </>
          )}
          {instrument === "crypto" && bitcoinBookStatus === "error" ? (
            <p className="demo-market-error" role="alert">
              The demo market-data feed is unavailable.
            </p>
          ) : null}

          {instrument === "crypto" && bitcoinTradesStatus === "error" ? (
            <p className="demo-market-error" role="alert">
              The demo recent-trades feed is unavailable.
            </p>
          ) : null}
        </div>

        {orderSummary === null ? (
          <TradeTicket
            symbol={activeRules.symbol}
            assetClass={activeRules.assetClass}
            assetRules={activeRules}
            cashAvailable={instrument === "equity" ? 1000 : 10_000}
            assetQtyAvailable={instrument === "equity" ? 10 : 0.5}
            quoteCurrency="USD"
            value={activeValue}
            onChange={instrument === "equity" ? setEquityValue : setCryptoValue}
            classNames={tradeTicketClassNames}
            onSubmit={reviewOrder}
            onValidationIssues={(issues) => {
              console.info("Validation issues", issues);
            }}
          />
        ) : (
          <OrderReview
            summary={orderSummary}
            quoteCurrency="USD"
            quantityFractionDigits={activeRules.qtyPrecision}
            priceFractionDigits={activeRules.pricePrecision}
            notionalFractionDigits={activeRules.notionalPrecision}
            isConfirming={isConfirming}
            isRefreshingPreview={isRefreshingPreview}
            confirmationError={confirmationError}
            classNames={orderReviewClassNames}
            onCancel={() => {
              setConfirmationError(null);
              setOrderSummary(null);
            }}
            onRefreshPreview={refreshPreview}
            onConfirm={confirmOrder}
          />
        )}
      </div>
    </main>
  );
}

function simulatePreviewRequest() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 500);
  });
}

function simulateBrokerSubmission() {
  return new Promise<void>((resolve) => {
    window.setTimeout(() => {
      resolve();
    }, 700);
  });
}

function usePageVisible() {
  const [pageVisible, setPageVisible] = useState(
    document.visibilityState === "visible",
  );

  useEffect(() => {
    function syncVisibilityState() {
      setPageVisible(document.visibilityState === "visible");
    }

    document.addEventListener("visibilitychange", syncVisibilityState);

    return () => {
      document.removeEventListener("visibilitychange", syncVisibilityState);
    };
  }, []);

  return pageVisible;
}

/**
 * Starts Mock Service Worker before the app makes its initial market-data
 * request.
 */
async function enableMocking(): Promise<void> {
  const { worker } = await import("./mocks/browser");

  await worker.start({
    onUnhandledRequest: "bypass",
  });
}

await enableMocking();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
