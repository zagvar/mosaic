import Big from "big.js";
import { z } from "zod";

/**
 * A non-exponential, unsigned base-10 decimal string.
 *
 * Canonical examples: "0", "42", "195.75", "0.000001".
 * Non-canonical values such as "01", "1.0", "+1", and "1e-6" are rejected.
 */
export type DecimalString = string;

const maxDecimalLength = 128;

const canonicalDecimalPattern = /^(?:0|[1-9]\d*)(?:\.\d*[1-9])?$/;

export const decimalStringSchema = z
  .string()
  .max(maxDecimalLength)
  .regex(canonicalDecimalPattern, {
    message:
      "Expected a canonical unsigned decimal string without exponent notation or trailing zeros.",
  });

export const positiveDecimalStringSchema = decimalStringSchema.refine(
  (value) => new Big(value).gt(0),
  {
    message: "Expected a positive decimal string.",
  },
);

export const nonNegativeDecimalStringSchema = decimalStringSchema;

const editableDecimalPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

export function normalizeDecimalInput(value: string): DecimalString {
  if (!editableDecimalPattern.test(value)) {
    throw new RangeError(
      "Expected an unsigned decimal input without exponent notation or leading zeros.",
    );
  }

  const [integer = "0", fraction] = value.split(".");
  const normalizedFraction = fraction?.replace(/0+$/, "");

  return decimalStringSchema.parse(
    normalizedFraction === undefined || normalizedFraction === ""
      ? integer
      : `${integer}.${normalizedFraction}`,
  );
}

export function decimalScale(value: DecimalString): number {
  const parsed = decimalStringSchema.parse(value);
  const decimalPointIndex = parsed.indexOf(".");

  return decimalPointIndex === -1 ? 0 : parsed.length - decimalPointIndex - 1;
}

export function compareDecimals(
  left: DecimalString,
  right: DecimalString,
): -1 | 0 | 1 {
  const comparison = toBig(left).cmp(toBig(right));

  return comparison < 0 ? -1 : comparison > 0 ? 1 : 0;
}

export function addDecimals(
  left: DecimalString,
  right: DecimalString,
): DecimalString {
  return toDecimalString(toBig(left).plus(toBig(right)));
}

export function subtractDecimals(
  left: DecimalString,
  right: DecimalString,
): DecimalString {
  return toDecimalString(toBig(left).minus(toBig(right)));
}

export function multiplyDecimals(
  left: DecimalString,
  right: DecimalString,
): DecimalString {
  return toDecimalString(toBig(left).times(toBig(right)));
}

export function divideDecimals(
  dividend: DecimalString,
  divisor: DecimalString,
  decimalPlaces: number,
): DecimalString {
  assertDecimalPlaces(decimalPlaces);

  const divisorValue = toBig(divisor);

  if (divisorValue.eq(0)) {
    throw new RangeError("Cannot divide by zero.");
  }

  const DivisionBig = Big();
  DivisionBig.DP = decimalPlaces;
  DivisionBig.RM = Big.roundDown;

  return toDecimalString(
    new DivisionBig(decimalStringSchema.parse(dividend)).div(
      new DivisionBig(decimalStringSchema.parse(divisor)),
    ),
  );
}

export function isMultipleOfDecimalIncrement(
  value: DecimalString,
  increment: DecimalString,
): boolean {
  return toBig(value).mod(toBig(increment)).eq(0);
}

export function roundDecimalForDisplay(
  value: DecimalString,
  decimalPlaces: number,
): DecimalString {
  assertDecimalPlaces(decimalPlaces);

  return toDecimalString(toBig(value).round(decimalPlaces, Big.roundHalfUp));
}

export function truncateDecimal(
  value: DecimalString,
  decimalPlaces: number,
): DecimalString {
  assertDecimalPlaces(decimalPlaces);

  return toDecimalString(toBig(value).round(decimalPlaces, Big.roundDown));
}

function assertDecimalPlaces(decimalPlaces: number): void {
  if (!Number.isSafeInteger(decimalPlaces) || decimalPlaces < 0) {
    throw new RangeError("decimalPlaces must be a non-negative safe integer.");
  }
}

export function toDecimalString(value: Big): DecimalString {
  return decimalStringSchema.parse(value.toFixed());
}

function toBig(value: DecimalString): Big {
  return new Big(decimalStringSchema.parse(value));
}
