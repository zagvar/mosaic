import { describe, expect, it } from "vitest";
import { marketQuoteSchema } from "../src/order";

const validQuote = {
  symbol: "AAPL",
  assetClass: "equity" as const,
  bidPrice: 195.7,
  bidQuantity: 120,
  askPrice: 195.8,
  askQuantity: 95,
  lastPrice: 195.75,
  timestamp: "2026-01-01T14:30:00.000Z",
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
        bidPrice: 195.75,
        askPrice: 195.75,
      }).success,
    ).toBe(true);
  });

  it.each([
    {
      name: "crossed bid and ask",
      quote: {
        ...validQuote,
        bidPrice: 196,
      },
    },
    {
      name: "non-positive price",
      quote: {
        ...validQuote,
        bidPrice: 0,
      },
    },
    {
      name: "non-positive size",
      quote: {
        ...validQuote,
        askQuantity: 0,
      },
    },
    {
      name: "fractional timestamp",
      quote: {
        ...validQuote,
        timestamp: "not-a-date",
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
