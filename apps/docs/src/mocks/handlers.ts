import { HttpResponse, http, ws } from "msw";
import type { OrderBookUpdate } from "@mosaic/core";
import {
  bitcoinBookUpdateTemplates,
  createBitcoinBookSnapshot,
} from "./order-book-data";
import {
  createBitcoinTradesSnapshot,
  createBitcoinTradeUpdate,
} from "./recent-trades-data";

const orderBookStream = ws.link("/api/demo/order-book/stream");
const recentTradesStream = ws.link("/api/demo/recent-trades/stream");

export const handlers = [
  http.get("/api/demo/order-book", ({ request }) => {
    const symbol = new URL(request.url).searchParams.get("symbol");

    if (symbol !== "BTC/USD") {
      return HttpResponse.json(
        { message: "Unknown demo instrument." },
        { status: 404 },
      );
    }

    return HttpResponse.json(createBitcoinBookSnapshot());
  }),

  http.get("/api/demo/recent-trades", ({ request }) => {
    const symbol = new URL(request.url).searchParams.get("symbol");

    if (symbol !== "BTC/USD") {
      return HttpResponse.json(
        { message: "Unknown demo instrument." },
        { status: 404 },
      );
    }

    return HttpResponse.json(createBitcoinTradesSnapshot());
  }),

  orderBookStream.addEventListener("connection", ({ client }) => {
    let updateIndex = 0;
    let sequence = createBitcoinBookSnapshot().sequence ?? 0;

    const interval = window.setInterval(() => {
      const template =
        bitcoinBookUpdateTemplates[
          updateIndex % bitcoinBookUpdateTemplates.length
        ]!;
      const update: OrderBookUpdate = {
        ...template,
        observedAt: Date.now(),
        previousSequence: sequence,
        sequence: sequence + 1,
      };

      updateIndex += 1;
      sequence = update.sequence ?? sequence;
      client.send(JSON.stringify(update));
    }, 670);

    client.addEventListener("close", () => {
      window.clearInterval(interval);
    });
  }),

  recentTradesStream.addEventListener("connection", ({ client }) => {
    let sequence = 1_000;

    const interval = window.setInterval(() => {
      sequence += 1;
      client.send(JSON.stringify(createBitcoinTradeUpdate(sequence)));
    }, 900);

    client.addEventListener("close", () => {
      window.clearInterval(interval);
    });
  }),
];
