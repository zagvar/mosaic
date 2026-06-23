import Big from "big.js";

export function hasMoreDecimals(value: number, precision: number): boolean {
  const normalized = Big(value).toFixed();
  const [, decimals = ""] = normalized.split(".");

  return decimals.length > precision;
}

export function multiplyDecimal(a: number, b: number): number {
  return Big(a).times(b).toNumber();
}

export function isMultipleOfIncrement(
  value: number,
  increment: number,
): boolean {
  return Big(value).mod(increment).eq(0);
}

export function isGreaterThan(a: number, b: number): boolean {
  return Big(a).gt(b);
}

export function isLessThan(a: number, b: number): boolean {
  return Big(a).lt(b);
}
