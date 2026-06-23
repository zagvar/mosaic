import { z } from "zod";

export const assetClassSchema = z.enum(["equity", "crypto"]);

export const orderSideSchema = z.enum(["buy", "sell"]);

export const orderTypeSchema = z.enum(["market", "limit"]);

export const tifSchema = z.enum(["day", "gtc", "opg", "cls", "ioc", "fok"]);

const positiveNumberSchema = z.number().positive();
const nonNegativeNumberSchema = z.number().nonnegative();

/**
 * Tradable asset constraints supplied by the host app or broker adapter.
 *
 * Different venues/assets have different precision, tick, lot, and minimum
 * rules. Broker-specific adapters can populate these constraints from their
 * own asset, product, or exchange metadata.
 */
export const assetRulesSchema = z.object({
  assetClass: assetClassSchema,
  symbol: z.string().min(1).max(32),

  allowedOrderTypes: z.array(orderTypeSchema).default(["market", "limit"]),
  allowedTifs: z.array(tifSchema).optional(),

  /**
   * Whether the asset/broker supports value-based orders, e.g. "buy $50".
   */
  supportsNotional: z.boolean().default(true),

  /**
   * Order types where `notional` is allowed. Most broker APIs only allow it on
   * market orders, but this stays configurable for non-Alpaca adapters.
   */
  notionalOrderTypes: z.array(orderTypeSchema).default(["market"]),

  minQty: positiveNumberSchema.optional(),
  maxQty: positiveNumberSchema.optional(),

  minNotional: positiveNumberSchema.optional(),
  maxNotional: positiveNumberSchema.optional(),

  qtyPrecision: z.number().int().min(0).max(18).default(6),
  pricePrecision: z.number().int().min(0).max(18).default(2),
  notionalPrecision: z.number().int().min(0).max(18).default(2),

  /**
   * Minimum quantity grid size. For example, a crypto pair may only trade in
   * lots of 0.000001 base units.
   */
  lotSize: positiveNumberSchema.optional(),

  /**
   * Minimum price movement. For example, a stock priced in cents has a tick
   * size of 0.01.
   */
  tickSize: positiveNumberSchema.optional(),

  /**
   * Minimum quote-currency grid size for notional/value-based orders.
   */
  quoteIncrement: positiveNumberSchema.optional(),

  extendedHours: z
    .object({
      allowed: z.boolean().default(false),
      allowedOrderTypes: z.array(orderTypeSchema).default(["limit"]),
      allowedTifs: z.array(tifSchema).default(["day", "gtc"]),
    })
    .optional(),
});

/**
 * Draft order produced by Mosaic components.
 *
 * qty = asset quantity/shares/units.
 * notional = quote-currency value to trade, e.g. USD amount.
 * limitPx = explicit limit price. Market orders do not guarantee this price.
 * tif = time in force.
 */
export const orderDraftSchema = z.object({
  symbol: z.string().min(1).max(32),
  assetClass: assetClassSchema,

  side: orderSideSchema,
  type: orderTypeSchema,
  tif: tifSchema.optional(),

  qty: positiveNumberSchema.optional(),
  notional: positiveNumberSchema.optional(),
  limitPx: positiveNumberSchema.optional(),

  extendedHours: z.boolean().optional(),
});

export const orderValidationCodeSchema = z.enum([
  "invalid_order",
  "invalid_context",
  "asset_rules_mismatch",
  "qty_or_notional_required",
  "qty_and_notional_conflict",
  "limit_px_required",
  "unsupported_order_type",
  "unsupported_tif",
  "notional_not_supported",
  "notional_not_supported_for_order_type",
  "extended_hours_not_supported",
  "extended_hours_unsupported_order_type",
  "extended_hours_unsupported_tif",
  "qty_below_min",
  "qty_above_max",
  "notional_below_min",
  "notional_above_max",
  "qty_precision_exceeded",
  "limit_px_precision_exceeded",
  "notional_precision_exceeded",
  "qty_lot_size_mismatch",
  "limit_px_tick_size_mismatch",
  "notional_quote_increment_mismatch",
  "insufficient_cash",
  "insufficient_asset_qty",
]);

export const orderValidationContextSchema = z.object({
  /**
   * Cash/buying power available in the quote currency, for example USD.
   */
  cashAvailable: nonNegativeNumberSchema,

  /**
   * Asset quantity available to sell.
   */
  assetQtyAvailable: nonNegativeNumberSchema,

  /**
   * Broker or asset-specific precision/min/max rules.
   */
  assetRules: assetRulesSchema,
});

export type AssetClass = z.infer<typeof assetClassSchema>;
export type OrderSide = z.infer<typeof orderSideSchema>;
export type OrderType = z.infer<typeof orderTypeSchema>;
export type Tif = z.infer<typeof tifSchema>;
export type AssetRules = z.infer<typeof assetRulesSchema>;
export type OrderDraft = z.infer<typeof orderDraftSchema>;
export type OrderValidationCode = z.infer<typeof orderValidationCodeSchema>;
export type OrderValidationContext = z.infer<
  typeof orderValidationContextSchema
>;
