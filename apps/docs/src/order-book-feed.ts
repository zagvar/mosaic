import {
  orderBookSnapshotSchema,
  orderBookUpdateSchema,
  type OrderBookSnapshot,
  type OrderBookUpdate,
} from "@zagvar/mosaic-core";

export async function fetchOrderBookSnapshot(
  symbol: string,
  signal?: AbortSignal,
): Promise<OrderBookSnapshot> {
  const response = await fetch(
    `/api/demo/order-book?symbol=${encodeURIComponent(symbol)}`,
    signal === undefined ? undefined : { signal },
  );

  if (!response.ok) {
    throw new Error(`Order-book snapshot failed with ${response.status}.`);
  }

  return orderBookSnapshotSchema.parse(await response.json());
}

export function subscribeToOrderBook(
  symbol: string,
  onUpdate: (update: OrderBookUpdate) => void,
  onError: () => void,
) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = new URL(`${protocol}//${window.location.host}`);

  url.pathname = "/api/demo/order-book/stream";
  url.searchParams.set("symbol", symbol);

  const socket = new WebSocket(url);

  socket.addEventListener("message", (event) => {
    try {
      const update = orderBookUpdateSchema.parse(JSON.parse(String(event.data)));
      onUpdate(update);
    } catch {
      onError();
    }
  });
  socket.addEventListener("error", onError);

  return () => socket.close();
}
