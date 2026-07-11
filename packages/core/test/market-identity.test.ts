import { describe, expect, it } from "vitest";
import { marketIdentitySchema } from "../src/order";

describe("marketIdentitySchema", () => {
  it("parses an equity instrument", () => {
    expect(
      marketIdentitySchema.parse({
        symbol: " AAPL ",
        assetClass: "equity",
        venue: " NASDAQ ",
        quoteAsset: " USD ",
      }),
    ).toEqual({
      symbol: "AAPL",
      assetClass: "equity",
      venue: "NASDAQ",
      quoteAsset: "USD",
    });
  });

  it("parses a digital-asset pair", () => {
    expect(
      marketIdentitySchema.parse({
        symbol: " BTC/USDT ",
        assetClass: "crypto",
        venue: " COINBASE ",
        baseAsset: " BTC ",
        quoteAsset: " USDT ",
      }),
    ).toEqual({
      symbol: "BTC/USDT",
      assetClass: "crypto",
      venue: "COINBASE",
      baseAsset: "BTC",
      quoteAsset: "USDT",
    });
  });

  it("supports a tokenized equity without changing its asset class", () => {
    expect(
      marketIdentitySchema.parse({
        symbol: "AAPLX",
        assetClass: "equity",
        venue: "DIGITAL_EXCHANGE",
        quoteAsset: "USDC",
      }),
    ).toEqual({
      symbol: "AAPLX",
      assetClass: "equity",
      venue: "DIGITAL_EXCHANGE",
      quoteAsset: "USDC",
    });
  });

  it.each([
    { name: "empty symbol", value: { symbol: " ", assetClass: "equity" } },
    {
      name: "empty venue",
      value: { symbol: "AAPL", assetClass: "equity", venue: " " },
    },
    {
      name: "unsupported asset class",
      value: { symbol: "AAPL", assetClass: "tokenized_equity" },
    },
  ])("rejects $name", ({ value }) => {
    expect(marketIdentitySchema.safeParse(value).success).toBe(false);
  });
});
