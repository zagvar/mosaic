import { describe, expect, it } from "vitest";
import {
  addDecimals,
  compareDecimals,
  decimalScale,
  decimalStringSchema,
  divideDecimals,
  isMultipleOfDecimalIncrement,
  multiplyDecimals,
  nonNegativeDecimalStringSchema,
  normalizeDecimalInput,
  positiveDecimalStringSchema,
  roundDecimalForDisplay,
  subtractDecimals,
} from "../src/decimal-string";

describe("decimal strings", () => {
  it.each([
    "0",
    "1",
    "42",
    "195.75",
    "0.000001",
    "0.000000000000000001",
    "999999999999999999999999.123456789",
  ])("accepts canonical decimal %s", (value) => {
    expect(decimalStringSchema.parse(value)).toBe(value);
  });

  it.each([
    "",
    " ",
    " 1",
    "1 ",
    "+1",
    "-1",
    "-0",
    ".1",
    "1.",
    "00",
    "01",
    "00.1",
    "0.0",
    "1.0",
    "1.20",
    "1e-6",
    "NaN",
    "Infinity",
    "1,000",
    "1".repeat(129),
  ])("rejects non-canonical decimal %s", (value) => {
    expect(decimalStringSchema.safeParse(value).success).toBe(false);
  });

  it("distinguishes non-negative and positive values", () => {
    expect(nonNegativeDecimalStringSchema.safeParse("0").success).toBe(true);
    expect(positiveDecimalStringSchema.safeParse("0").success).toBe(false);
    expect(positiveDecimalStringSchema.safeParse("0.000001").success).toBe(
      true,
    );
  });

  it("calculates scale from the canonical representation", () => {
    expect(decimalScale("0")).toBe(0);
    expect(decimalScale("195.75")).toBe(2);
    expect(decimalScale("0.000001")).toBe(6);
  });

  it("performs exact decimal arithmetic", () => {
    expect(addDecimals("0.1", "0.2")).toBe("0.3");
    expect(multiplyDecimals("0.1", "0.2")).toBe("0.02");
    expect(subtractDecimals("1", "0.000000000000000001")).toBe(
      "0.999999999999999999",
    );
  });

  it("compares and checks increments without floating-point loss", () => {
    expect(() => compareDecimals("0.3", "0.30")).toThrow();
    expect(compareDecimals("0.3", "0.300000000000000001")).toBe(-1);
    expect(isMultipleOfDecimalIncrement("0.000003", "0.000001")).toBe(true);
    expect(isMultipleOfDecimalIncrement("0.0000031", "0.000001")).toBe(false);
  });

  it("rounds with an explicit half-up policy", () => {
    expect(roundDecimalForDisplay("1.234", 2)).toBe("1.23");
    expect(roundDecimalForDisplay("1.235", 2)).toBe("1.24");
    expect(roundDecimalForDisplay("195.6", 0)).toBe("196");
    expect(() => roundDecimalForDisplay("1", -1)).toThrow(
      "decimalPlaces must be a non-negative safe integer.",
    );
  });

  it("normalizes complete editable decimal input", () => {
    expect(normalizeDecimalInput("1.20")).toBe("1.2");
    expect(normalizeDecimalInput("0.000")).toBe("0");
    expect(() => normalizeDecimalInput("1.")).toThrow();
    expect(() => normalizeDecimalInput("01")).toThrow();
  });

  it("divides with explicit truncation", () => {
    expect(divideDecimals("10", "3", 2)).toBe("3.33");
    expect(divideDecimals("1", "8", 4)).toBe("0.125");
    expect(() => divideDecimals("1", "0", 2)).toThrow("Cannot divide by zero.");
  });
});
