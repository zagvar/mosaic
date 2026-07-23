import { describe, expect, it } from "vitest";
import {
  formatDecimal,
  formatCurrencyOrQuoteAmount,
} from "../src/internal/format";

describe("formatDecimal", () => {
  it("formats a large decimal string without converting it to a number", () => {
    expect(formatDecimal("123456789012345678901.234567", "en-US", 6)).toBe(
      "123,456,789,012,345,678,901.234567",
    );
  });

  it("formats decimal-string currency amounts", () => {
    expect(
      formatCurrencyOrQuoteAmount({
        value: "1000.5",
        currency: "USD",
        locale: "en-US",
      }),
    ).toBe("$1,000.50");
  });

  it("rounds decimal strings with the core half-up policy", () => {
    expect(formatDecimal("1.235", "en-US", 2)).toBe("1.24");
    expect(formatDecimal("195.6", "en-US", 0)).toBe("196");
  });

  it("uses the locale decimal and grouping separators", () => {
    expect(formatDecimal("1234.5", "de-DE", 2)).toBe("1.234,5");
  });

  it("preserves the existing numeric formatting path during migration", () => {
    expect(formatDecimal(1234.5, "en-US", 2)).toBe("1,234.5");
  });

  it("preserves the sign of negative values below one", () => {
    expect(formatDecimal("-0.005", "en-US", 3)).toBe("-0.005");
  });
});
