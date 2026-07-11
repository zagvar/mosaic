import { describe, expect, it } from "vitest";
import { assetClassSchema } from "../src/order";

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
});
