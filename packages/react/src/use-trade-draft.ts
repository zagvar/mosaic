import { useMemo, useState } from "react";
import type {
  AssetClass,
  AssetRules,
  OrderDraft,
  OrderSide,
  OrderType,
  OrderValidationContext,
  OrderValidationResult,
  Tif,
} from "@mosaic/core";
import { validateOrderDraft } from "@mosaic/core";

export interface UseTradeDraftOptions {
  symbol: string;
  assetClass: AssetClass;
  assetRules: AssetRules;
  cashAvailable: number;
  assetQtyAvailable: number;
  initialSide?: OrderSide;
  initialType?: OrderType;
  initialTif?: Tif;
}

export interface UseTradeDraftResult {
  side: OrderSide;
  setSide: (side: OrderSide) => void;

  type: OrderType;
  setType: (type: OrderType) => void;

  tif: Tif | undefined;
  setTif: (tif: Tif | undefined) => void;

  qty: number | undefined;
  setQty: (qty: number | undefined) => void;

  limitPx: number | undefined;
  setLimitPx: (limitPx: number | undefined) => void;

  notional: number | undefined;
  setNotional: (notional: number | undefined) => void;

  applyPercent: (percent: number) => void;

  draft: OrderDraft;
  context: OrderValidationContext;
  validation: OrderValidationResult;
}

export function useTradeDraft({
  symbol,
  assetClass,
  assetRules,
  cashAvailable,
  assetQtyAvailable,
  initialSide = "buy",
  initialType = "limit",
  initialTif,
}: UseTradeDraftOptions): UseTradeDraftResult {
  const [side, setSide] = useState<OrderSide>(initialSide);
  const [type, setType] = useState<OrderType>(initialType);
  const [tif, setTif] = useState<Tif | undefined>(initialTif);
  const [qty, setQty] = useState<number | undefined>();
  const [limitPx, setLimitPx] = useState<number | undefined>();
  const [notional, setNotional] = useState<number | undefined>();

  const draft = useMemo<OrderDraft>(() => {
    return {
      symbol,
      assetClass,
      side,
      type,
      ...(tif === undefined ? {} : { tif }),
      ...(qty === undefined ? {} : { qty }),
      ...(limitPx === undefined ? {} : { limitPx }),
      ...(notional === undefined ? {} : { notional }),
    };
  }, [assetClass, limitPx, notional, qty, side, symbol, tif, type]);

  const context = useMemo<OrderValidationContext>(() => {
    return {
      cashAvailable,
      assetQtyAvailable,
      assetRules,
    };
  }, [assetQtyAvailable, assetRules, cashAvailable]);

  const validation = useMemo(() => {
    return validateOrderDraft(draft, context);
  }, [context, draft]);

  function applyPercent(percent: number) {
    const ratio = percent / 100;

    if (side === "buy" && type === "market") {
      setNotional(
        roundToPrecision(cashAvailable * ratio, assetRules.notionalPrecision),
      );
      setQty(undefined);

      return;
    }

    if (side === "buy" && type === "limit") {
      if (limitPx === undefined || limitPx <= 0) return;

      setQty(
        roundToPrecision(
          (cashAvailable * ratio) / limitPx,
          assetRules.qtyPrecision,
        ),
      );
      setNotional(undefined);

      return;
    }

    if (side === "sell") {
      setQty(
        roundToPrecision(assetQtyAvailable * ratio, assetRules.qtyPrecision),
      );
      setNotional(undefined);
    }
  }

  return {
    side,
    setSide,

    type,
    setType,

    tif,
    setTif,

    qty,
    setQty,

    limitPx,
    setLimitPx,

    notional,
    setNotional,

    applyPercent,

    draft,
    context,
    validation,
  };
}

function roundToPrecision(value: number, precision: number) {
  const factor = 10 ** precision;

  return Math.floor(value * factor) / factor;
}
