import type { AssetRules, OrderValidationContext } from "../src/order";

export const equityRules: AssetRules = {
  assetClass: "equity",
  symbol: "AAPL",
  allowedOrderTypes: ["market", "limit"],
  allowedTifs: ["day", "gtc", "opg", "cls", "ioc", "fok"],
  supportsNotional: true,
  notionalOrderTypes: ["market"],
  minQuantity: 0.000001,
  minNotional: 1,
  minPrice: 0.01,
  maxPrice: 1000,
  quantityPrecision: 6,
  pricePrecision: 2,
  notionalPrecision: 2,
  lotSize: 0.000001,
  tickSize: 0.01,
  quoteIncrement: 0.01,
  extendedHours: {
    allowed: true,
    allowedOrderTypes: ["limit"],
    allowedTifs: ["day", "gtc"],
  },
};

export const cryptoRules: AssetRules = {
  assetClass: "crypto",
  symbol: "BTC/USD",
  allowedOrderTypes: ["market", "limit"],
  allowedTifs: ["gtc", "ioc"],
  supportsNotional: true,
  notionalOrderTypes: ["market"],
  minQuantity: 0.00000001,
  quantityPrecision: 8,
  pricePrecision: 2,
  notionalPrecision: 2,
};

export function equityContext(
  overrides: Partial<OrderValidationContext> = {},
): OrderValidationContext {
  return {
    cashAvailable: 1000,
    assetQuantityAvailable: 10,
    assetRules: equityRules,
    ...overrides,
  };
}

export function cryptoContext(
  overrides: Partial<OrderValidationContext> = {},
): OrderValidationContext {
  return {
    cashAvailable: 1000,
    assetQuantityAvailable: 1,
    assetRules: cryptoRules,
    ...overrides,
  };
}
