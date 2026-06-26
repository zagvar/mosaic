import { useEffect, useRef, useState } from "react";
import {
  applyOrderBookUpdate,
  type OrderBookSnapshot,
  type OrderBookUpdate,
} from "@zagvar/mosaic-core";
import {
  fetchOrderBookSnapshot,
  subscribeToOrderBook,
} from "./order-book-feed";

export type OrderBookFeedStatus =
  | "loading"
  | "streaming"
  | "reconnecting"
  | "error";

export function useOrderBookFeed(symbol: string, enabled = true) {
  const [snapshot, setSnapshot] = useState<OrderBookSnapshot | null>(null);
  const [status, setStatus] = useState<OrderBookFeedStatus>("loading");
  const snapshotRef = useRef<OrderBookSnapshot | null>(null);

  useEffect(() => {
    if (!enabled) {
      snapshotRef.current = null;
      setSnapshot(null);
      setStatus("loading");
      return;
    }

    const abortController = new AbortController();
    let active = true;
    let resyncing = false;
    let unsubscribe = () => {};

    async function loadSnapshot() {
      if (resyncing) return;
      resyncing = true;

      try {
        const nextSnapshot = await fetchOrderBookSnapshot(
          symbol,
          abortController.signal,
        );

        if (!active) return;

        snapshotRef.current = nextSnapshot;
        setSnapshot(nextSnapshot);
        setStatus("streaming");
        unsubscribe();
        unsubscribe = subscribeToOrderBook(
          symbol,
          applyUpdate,
          handleStreamError,
        );
      } catch (error) {
        if (!active || isAbortError(error)) return;
        setStatus("error");
      } finally {
        resyncing = false;
      }
    }

    function applyUpdate(update: OrderBookUpdate) {
      const current = snapshotRef.current;
      if (current === null) return;

      const result = applyOrderBookUpdate(current, update, { depth: 50 });

      if (result.applied) {
        snapshotRef.current = result.snapshot;
        setSnapshot(result.snapshot);
        setStatus("streaming");
        return;
      }

      if (result.reason === "sequence_gap") {
        setStatus("reconnecting");
        unsubscribe();
        void loadSnapshot();
      }
    }

    function handleStreamError() {
      if (active) setStatus("error");
    }

    void loadSnapshot();

    return () => {
      active = false;
      abortController.abort();
      unsubscribe();
      snapshotRef.current = null;
    };
  }, [symbol, enabled]);

  return { snapshot, status };
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
