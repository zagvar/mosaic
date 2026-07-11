import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AssetClass,
  AssetRules,
  OrderDraft,
  OrderSide,
  OrderType,
  OrderValidationContext,
  OrderValidationResult,
  Tif,
} from "@zagvar/mosaic-core";
import { validateOrderDraft } from "@zagvar/mosaic-core";

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
  quantity?: number;
  limitPrice?: number;
  notional?: number;
}

export interface UseTradeDraftOptions {
  symbol: string;
  assetClass: AssetClass;
  assetRules: AssetRules;
  cashAvailable: number;
  assetQuantityAvailable: number;

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
  defaultLimitPrice?: number;
}

export interface UseTradeDraftResult {
  value: TradeDraftValue;

  side: OrderSide;
  setSide: (side: OrderSide) => void;

  type: OrderType;
  setType: (type: OrderType) => void;

  tif: Tif | undefined;
  setTif: (tif: Tif | undefined) => void;

  quantity: number | undefined;
  setQuantity: (quantity: number | undefined) => void;

  limitPrice: number | undefined;
  setLimitPrice: (limitPrice: number | undefined) => void;

  notional: number | undefined;
  setNotional: (notional: number | undefined) => void;

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
  defaultLimitPrice: number | undefined;
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

  function setQuantity(nextQuantity: number | undefined) {
    updateValue((current) =>
      updateOptionalField(current, "quantity", nextQuantity),
    );
  }

  function setLimitPrice(nextLimitPrice: number | undefined) {
    updateValue((current) =>
      updateOptionalField(current, "limitPrice", nextLimitPrice),
    );
  }

  function setNotional(nextNotional: number | undefined) {
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
    const ratio = percent / 100;

    updateValue((current) => {
      if (current.side === "buy" && current.type === "market") {
        const notional = roundToPrecision(
          cashAvailable * ratio,
          assetRules.notionalPrecision,
        );

        const { quantity: _quantity, notional: _notional, ...rest } = current;

        return {
          ...rest,
          notional,
        };
      }

      if (current.side === "buy" && current.type === "limit") {
        if (current.limitPrice === undefined || current.limitPrice <= 0) {
          return current;
        }

        const quantity = roundToPrecision(
          (cashAvailable * ratio) / current.limitPrice,
          assetRules.quantityPrecision,
        );

        const { quantity: _quantity, notional: _notional, ...rest } = current;

        return {
          ...rest,
          quantity,
        };
      }

      if (current.side === "sell") {
        const quantity = roundToPrecision(
          assetQuantityAvailable * ratio,
          assetRules.quantityPrecision,
        );

        const { quantity: _quantity, notional: _notional, ...rest } = current;

        return {
          ...rest,
          quantity,
        };
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

function roundToPrecision(value: number, precision: number) {
  const factor = 10 ** precision;

  return Math.floor(value * factor) / factor;
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
  nextValue: number | Tif | undefined,
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
