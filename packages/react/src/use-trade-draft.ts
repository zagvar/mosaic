import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AssetClass,
  AssetRules,
  DecimalString,
  OrderDraft,
  OrderSide,
  OrderType,
  OrderValidationContext,
  OrderValidationResult,
  Tif,
} from "@zagvar/mosaic-core";
import {
  compareDecimals,
  decimalScale,
  decimalStringSchema,
  divideDecimals,
  multiplyDecimals,
  truncateDecimal,
  validateOrderDraft,
} from "@zagvar/mosaic-core";

/**
 * User-editable state managed by a trade ticket.
 *
 * Instrument identity and validation context remain separate because they are
 * supplied by the host application.
 */
export interface TradeDraftValue {
  side: OrderSide;
  type: OrderType;
  tif?: Tif;
  quantity?: DecimalString;
  limitPrice?: DecimalString;
  notional?: DecimalString;
}

export interface UseTradeDraftOptions {
  symbol: string;
  assetClass: AssetClass;
  assetRules: AssetRules;
  cashAvailable: DecimalString;
  assetQuantityAvailable: DecimalString;

  /**
   * Controlled editable draft value.
   */
  value?: TradeDraftValue;

  /**
   * Initial editable value when the hook owns its state.
   */
  defaultValue?: Partial<TradeDraftValue>;

  /**
   * Called once with the complete next value after any change.
   */
  onChange?: (value: TradeDraftValue) => void;

  initialSide?: OrderSide;
  initialType?: OrderType;
  initialTif?: Tif;
  defaultLimitPrice?: DecimalString;
}

export interface UseTradeDraftResult {
  value: TradeDraftValue;

  side: OrderSide;
  setSide: (side: OrderSide) => void;

  type: OrderType;
  setType: (type: OrderType) => void;

  tif: Tif | undefined;
  setTif: (tif: Tif | undefined) => void;

  quantity: DecimalString | undefined;
  setQuantity: (quantity: DecimalString | undefined) => void;

  limitPrice: DecimalString | undefined;
  setLimitPrice: (limitPrice: DecimalString | undefined) => void;

  notional: DecimalString | undefined;
  setNotional: (notional: DecimalString | undefined) => void;

  applyPercent: (percent: number) => void;

  draft: OrderDraft;
  context: OrderValidationContext;
  validation: OrderValidationResult;

  reset: () => void;
}

interface CreateInitialTradeDraftValueOptions {
  defaultValue: Partial<TradeDraftValue> | undefined;
  side: OrderSide;
  type: OrderType;
  tif: Tif | undefined;
  defaultLimitPrice: DecimalString | undefined;
  allowedTifs: Tif[] | undefined;
}

type OptionalTradeDraftField = "tif" | "quantity" | "limitPrice" | "notional";

type TradeDraftValueUpdater = (current: TradeDraftValue) => TradeDraftValue;

export function useTradeDraft({
  symbol,
  assetClass,
  assetRules,
  cashAvailable,
  assetQuantityAvailable,
  value: controlledValue,
  defaultValue,
  onChange,
  initialSide = "buy",
  initialType = "limit",
  initialTif,
  defaultLimitPrice,
}: UseTradeDraftOptions): UseTradeDraftResult {
  const isControlled = controlledValue !== undefined;

  const [internalValue, setInternalValue] = useState<TradeDraftValue>(() =>
    createInitialTradeDraftValue({
      defaultValue,
      side: initialSide,
      type: initialType,
      tif: initialTif,
      defaultLimitPrice,
      allowedTifs: assetRules.allowedTifs,
    }),
  );

  const value = controlledValue ?? internalValue;
  const valueRef = useRef(value);
  valueRef.current = value;

  const { side, type, tif, quantity, limitPrice, notional } = value;

  const assetKey = `${assetClass}:${symbol}`;
  const previousAssetKey = useRef(assetKey);

  function updateValue(updater: TradeDraftValueUpdater) {
    const current = valueRef.current;
    const next = updater(current);

    if (next === current) return;

    valueRef.current = next;

    if (!isControlled) {
      setInternalValue(next);
    }

    onChange?.(next);
  }

  useEffect(() => {
    if (previousAssetKey.current === assetKey) return;

    previousAssetKey.current = assetKey;

    updateValue((current) => ({
      side: current.side,
      type: current.type,
      ...(current.tif === undefined ? {} : { tif: current.tif }),
      ...(current.type === "limit" && defaultLimitPrice !== undefined
        ? { limitPrice: defaultLimitPrice }
        : {}),
    }));
  }, [assetKey, defaultLimitPrice]);

  useEffect(() => {
    updateValue((current) => {
      const nextTif = getValidTif(current.tif, assetRules.allowedTifs);

      if (nextTif === current.tif) {
        return current;
      }

      return updateOptionalField(current, "tif", nextTif);
    });
  }, [assetRules.allowedTifs]);

  const draft = useMemo<OrderDraft>(() => {
    return {
      symbol,
      assetClass,
      ...value,
    };
  }, [assetClass, symbol, value]);

  const context = useMemo<OrderValidationContext>(() => {
    return {
      cashAvailable,
      assetQuantityAvailable,
      assetRules,
    };
  }, [assetQuantityAvailable, assetRules, cashAvailable]);

  const validation = useMemo(() => {
    return validateOrderDraft(draft, context);
  }, [context, draft]);

  function setTif(nextTif: Tif | undefined) {
    updateValue((current) => updateOptionalField(current, "tif", nextTif));
  }

  function setQuantity(nextQuantity: DecimalString | undefined) {
    updateValue((current) =>
      updateOptionalField(current, "quantity", nextQuantity),
    );
  }

  function setLimitPrice(nextLimitPrice: DecimalString | undefined) {
    updateValue((current) =>
      updateOptionalField(current, "limitPrice", nextLimitPrice),
    );
  }

  function setNotional(nextNotional: DecimalString | undefined) {
    updateValue((current) =>
      updateOptionalField(current, "notional", nextNotional),
    );
  }

  function handleSideChange(nextSide: OrderSide) {
    updateValue((current) => {
      if (nextSide === current.side) {
        return current;
      }

      if (current.type === "market") {
        const { quantity: _quantity, notional: _notional, ...rest } = current;

        return {
          ...rest,
          side: nextSide,
        };
      }

      return {
        ...current,
        side: nextSide,
      };
    });
  }

  function handleTypeChange(nextType: OrderType) {
    updateValue((current) => {
      if (nextType === current.type) {
        return current;
      }

      const {
        quantity,
        limitPrice: _limitPrice,
        notional: _notional,
        ...rest
      } = current;

      return {
        ...rest,
        type: nextType,
        ...(current.side === "sell" && quantity !== undefined
          ? { quantity }
          : {}),
        ...(nextType === "limit" && defaultLimitPrice !== undefined
          ? { limitPrice: defaultLimitPrice }
          : {}),
      };
    });
  }

  function applyPercent(percent: number) {
    const ratio = percentToRatio(percent);

    updateValue((current) => {
      if (current.side === "buy" && current.type === "market") {
        const notional = truncateDecimal(
          multiplyDecimals(cashAvailable, ratio),
          assetRules.notionalPrecision,
        );

        const { quantity: _quantity, notional: _notional, ...rest } = current;

        return { ...rest, notional };
      }

      if (current.side === "buy" && current.type === "limit") {
        if (
          current.limitPrice === undefined ||
          compareDecimals(current.limitPrice, "0") <= 0
        ) {
          return current;
        }

        const quantity = divideDecimals(
          multiplyDecimals(cashAvailable, ratio),
          current.limitPrice,
          assetRules.quantityPrecision,
        );

        const { quantity: _quantity, notional: _notional, ...rest } = current;

        return { ...rest, quantity };
      }

      if (current.side === "sell") {
        const quantity = truncateDecimal(
          multiplyDecimals(assetQuantityAvailable, ratio),
          assetRules.quantityPrecision,
        );

        const { quantity: _quantity, notional: _notional, ...rest } = current;

        return { ...rest, quantity };
      }

      return current;
    });
  }

  function reset() {
    updateValue((current) => ({
      side: current.side,
      type: current.type,
      ...(current.tif === undefined ? {} : { tif: current.tif }),
      ...(current.type === "limit" && defaultLimitPrice !== undefined
        ? { limitPrice: defaultLimitPrice }
        : {}),
    }));
  }

  return {
    value,
    side,
    setSide: handleSideChange,
    type,
    setType: handleTypeChange,
    tif,
    setTif,
    quantity,
    setQuantity,
    limitPrice,
    setLimitPrice,
    notional,
    setNotional,
    applyPercent,
    draft,
    context,
    validation,
    reset,
  };
}

function percentToRatio(percent: number): DecimalString {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new RangeError("percent must be a finite value from 0 through 100.");
  }

  const percentText = percent.toString();

  if (/[eE]/.test(percentText)) {
    throw new RangeError("percent must not use exponent notation.");
  }

  const percentDecimal = decimalStringSchema.parse(percentText);

  return divideDecimals(
    percentDecimal,
    "100",
    decimalScale(percentDecimal) + 2,
  );
}

function getValidTif(
  tif: Tif | undefined,
  allowedTifs: Tif[] | undefined,
): Tif | undefined {
  if (allowedTifs === undefined) return tif;

  if (tif !== undefined && allowedTifs.includes(tif)) {
    return tif;
  }

  return allowedTifs[0];
}

function createInitialTradeDraftValue({
  defaultValue,
  side,
  type,
  tif,
  defaultLimitPrice,
  allowedTifs,
}: CreateInitialTradeDraftValueOptions): TradeDraftValue {
  const initialSide = defaultValue?.side ?? side;
  const initialType = defaultValue?.type ?? type;
  const initialTif = getValidTif(defaultValue?.tif ?? tif, allowedTifs);

  return {
    side: initialSide,
    type: initialType,
    ...(initialTif === undefined ? {} : { tif: initialTif }),
    ...(defaultValue?.quantity === undefined
      ? {}
      : { quantity: defaultValue.quantity }),
    ...(defaultValue?.notional === undefined
      ? {}
      : { notional: defaultValue.notional }),
    ...(defaultValue?.limitPrice !== undefined
      ? { limitPrice: defaultValue.limitPrice }
      : initialType === "limit" && defaultLimitPrice !== undefined
        ? { limitPrice: defaultLimitPrice }
        : {}),
  };
}

function updateOptionalField(
  value: TradeDraftValue,
  field: OptionalTradeDraftField,
  nextValue: DecimalString | Tif | undefined,
): TradeDraftValue {
  if (nextValue === undefined) {
    const next = { ...value };

    delete next[field];

    return next;
  }

  return {
    ...value,
    [field]: nextValue,
  };
}
