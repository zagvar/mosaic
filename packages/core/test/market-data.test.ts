import { describe, expect, it } from "vitest";
import { marketQuoteSchema } from "../src/order";

const validQuote = {
  symbol: "AAPL",
  assetClass: "equity" as const,
  bidPx: 195.7,
  bidQty: 120,
  askPx: 195.8,
  askQty: 95,
  lastPx: 195.75,
  observedAt: 1000,
};

describe("marketQuoteSchema", () => {
  it("parses valid top-of-book data", () => {
    expect(
      marketQuoteSchema.parse({
        ...validQuote,
        displaySource: " SIP ",
      }),
    ).toEqual({
      ...validQuote,
      displaySource: "SIP",
    });
  });

  it("allows a locked quote", () => {
    expect(
      marketQuoteSchema.safeParse({
        ...validQuote,
        bidPx: 195.75,
        askPx: 195.75,
      }).success,
    ).toBe(true);
  });

  it.each([
    {
      name: "crossed bid and ask",
      quote: {
        ...validQuote,
        bidPx: 196,
      },
    },
    {
      name: "non-positive price",
      quote: {
        ...validQuote,
        bidPx: 0,
      },
    },
    {
      name: "non-positive size",
      quote: {
        ...validQuote,
        askQty: 0,
      },
    },
    {
      name: "fractional timestamp",
      quote: {
        ...validQuote,
        observedAt: 1000.5,
      },
    },
    {
      name: "empty source",
      quote: {
        ...validQuote,
        displaySource: " ",
      },
    },
  ])("rejects $name", ({ quote }) => {
    expect(marketQuoteSchema.safeParse(quote).success).toBe(false);
  });
});
