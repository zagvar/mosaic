import { describe, expect, it } from "vitest";
import { assetClassSchema, orderDraftSchema } from "../src/order";

describe("assetClassSchema", () => {
  it("supports the Zagvar economic asset classes", () => {
    expect(assetClassSchema.options).toEqual([
      "equity",
      "crypto",
      "fx",
      "commodity",
      "index",
      "fund",
      "option",
      "future",
      "other",
    ]);
  });

  it("rejects issuance and representation details as asset classes", () => {
    expect(assetClassSchema.safeParse("tokenized_equity").success).toBe(false);
  });

  it("requires canonical decimal strings in an order draft", () => {
    const draft = {
      symbol: "AAPL",
      assetClass: "equity",
      side: "buy",
      type: "limit",
      quantity: "1.25",
      limitPrice: "195.75",
    };

    expect(orderDraftSchema.safeParse(draft).success).toBe(true);

    expect(
      orderDraftSchema.safeParse({
        ...draft,
        quantity: 1.25,
      }).success,
    ).toBe(false);

    expect(
      orderDraftSchema.safeParse({
        ...draft,
        quantity: "1.250",
      }).success,
    ).toBe(false);
  });
});
