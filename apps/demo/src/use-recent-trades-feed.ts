import type { MarketTrade, MarketTradeUpdate } from "@zagvar/mosaic-core";
import {
  marketTradeUpdateSchema,
  marketTradeSchema,
} from "@zagvar/mosaic-core";
import { useEffect, useState } from "react";

export type RecentTradesFeedStatus = "loading" | "live" | "error";

export function useRecentTradesFeed(symbol: string, enabled = true) {
  const [trades, setTrades] = useState<MarketTrade[]>([]);
  const [status, setStatus] = useState<RecentTradesFeedStatus>("loading");

  useEffect(() => {
    if (!enabled) {
      setTrades([]);
      setStatus("loading");
      return;
    }

    const abortController = new AbortController();
    let isActive = true;
    const socket = new WebSocket("/api/demo/recent-trades/stream");

    async function loadSnapshot() {
      try {
        const response = await fetch(
          `/api/demo/recent-trades?symbol=${encodeURIComponent(symbol)}`,
          { signal: abortController.signal },
        );

        if (!response.ok) {
          throw new Error("Unable to load recent trades.");
        }

        const data = await response.json();
        const parsed = marketTradeSchema.array().parse(data);

        if (!isActive) return;

        setTrades(parsed);
        setStatus("live");
      } catch (error) {
        if (!isActive || isAbortError(error)) return;
        setStatus("error");
      }
    }

    void loadSnapshot();

    socket.addEventListener("message", (event) => {
      try {
        const update: MarketTradeUpdate = marketTradeUpdateSchema.parse(
          JSON.parse(event.data),
        );

        if (update.symbol !== symbol) return;

        setTrades((current) =>
          [...update.trades, ...current]
            .sort(
              (left, right) =>
                Date.parse(right.timestamp) - Date.parse(left.timestamp),
            )
            .slice(0, 100),
        );
        setStatus("live");
      } catch {
        setStatus("error");
      }
    });

    socket.addEventListener("error", () => {
      setStatus("error");
    });

    return () => {
      isActive = false;
      abortController.abort();
      socket.close();
    };
  }, [symbol, enabled]);

  return { trades, status };
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
