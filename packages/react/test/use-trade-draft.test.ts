import { act, renderHook } from "@testing-library/react";
import type { AssetRules } from "@mosaic/core";
import { describe, expect, it, vi } from "vitest";
import { useTradeDraft, type TradeDraftValue } from "../src/use-trade-draft";

const assetRules: AssetRules = {
  assetClass: "equity",
  symbol: "AAPL",
  allowedOrderTypes: ["market", "limit"],
  allowedTifs: ["day", "gtc"],
  supportsNotional: true,
  notionalOrderTypes: ["market"],
  qtyPrecision: 6,
  pricePrecision: 2,
  notionalPrecision: 2,
};

function renderTradeDraft() {
  return renderHook(() =>
    useTradeDraft({
      symbol: "AAPL",
      assetClass: "equity",
      assetRules,
      cashAvailable: 1000,
      assetQtyAvailable: 10,
    }),
  );
}

describe("useTradeDraft transitions", () => {
  it("clears quantity and price when changing a limit buy to market", () => {
    const { result } = renderTradeDraft();

    act(() => {
      result.current.setQty(2);
      result.current.setLimitPx(100);
    });

    act(() => {
      result.current.setType("market");
    });

    expect(result.current.qty).toBeUndefined();
    expect(result.current.limitPx).toBeUndefined();
  });

  it("preserves quantity between sell order types", () => {
    const { result } = renderTradeDraft();

    act(() => {
      result.current.setSide("sell");
      result.current.setQty(2);
    });

    act(() => {
      result.current.setType("market");
    });

    expect(result.current.qty).toBe(2);
    expect(result.current.limitPx).toBeUndefined();
  });

  it("clears notional when changing a market buy to sell", () => {
    const { result } = renderTradeDraft();

    act(() => {
      result.current.setType("market");
      result.current.setNotional(100);
    });

    act(() => {
      result.current.setSide("sell");
    });

    expect(result.current.notional).toBeUndefined();
    expect(result.current.qty).toBeUndefined();
  });

  it("clears instrument-specific values when the asset changes", () => {
    const { result, rerender } = renderHook(
      ({ symbol, rules }) =>
        useTradeDraft({
          symbol,
          assetClass: rules.assetClass,
          assetRules: rules,
          cashAvailable: 1000,
          assetQtyAvailable: 10,
        }),
      {
        initialProps: {
          symbol: "AAPL",
          rules: assetRules,
        },
      },
    );

    act(() => {
      result.current.setQty(2);
      result.current.setLimitPx(100);
      result.current.setNotional(200);
    });

    rerender({
      symbol: "MSFT",
      rules: {
        ...assetRules,
        symbol: "MSFT",
      },
    });

    expect(result.current.qty).toBeUndefined();
    expect(result.current.limitPx).toBeUndefined();
    expect(result.current.notional).toBeUndefined();
  });

  it("preserves quantity when changing a market sell to limit", () => {
    const { result } = renderTradeDraft();

    act(() => {
      result.current.setSide("sell");
      result.current.setType("market");
    });

    act(() => {
      result.current.setQty(2);
    });

    act(() => {
      result.current.setType("limit");
    });

    expect(result.current.qty).toBe(2);
    expect(result.current.limitPx).toBeUndefined();
    expect(result.current.notional).toBeUndefined();
  });

  it("preserves quantity and limit price when changing a limit buy to sell", () => {
    const { result } = renderTradeDraft();

    act(() => {
      result.current.setQty(2);
      result.current.setLimitPx(100);
    });

    act(() => {
      result.current.setSide("sell");
    });

    expect(result.current.side).toBe("sell");
    expect(result.current.qty).toBe(2);
    expect(result.current.limitPx).toBe(100);
    expect(result.current.notional).toBeUndefined();
  });

  it("replaces a TIF that is no longer allowed", () => {
    const { result, rerender } = renderHook(
      ({ rules }) =>
        useTradeDraft({
          symbol: "AAPL",
          assetClass: "equity",
          assetRules: rules,
          cashAvailable: 1000,
          assetQtyAvailable: 10,
        }),
      {
        initialProps: {
          rules: assetRules,
        },
      },
    );

    act(() => {
      result.current.setTif("gtc");
    });

    expect(result.current.tif).toBe("gtc");

    rerender({
      rules: {
        ...assetRules,
        allowedTifs: ["ioc", "fok"],
      },
    });

    expect(result.current.tif).toBe("ioc");
  });

  it("restores the default price when changing back to a limit order", () => {
    const { result } = renderHook(() =>
      useTradeDraft({
        symbol: "AAPL",
        assetClass: "equity",
        assetRules,
        cashAvailable: 1000,
        assetQtyAvailable: 10,
        defaultLimitPx: 195.5,
      }),
    );

    act(() => {
      result.current.setLimitPx(190);
      result.current.setType("market");
    });

    expect(result.current.limitPx).toBeUndefined();

    act(() => {
      result.current.setType("limit");
    });

    expect(result.current.limitPx).toBe(195.5);
  });
});

describe("useTradeDraft initialization", () => {
  it("selects the first allowed TIF by default", () => {
    const { result } = renderTradeDraft();

    expect(result.current.tif).toBe("day");
  });

  it("initializes a limit order with the default limit price", () => {
    const { result } = renderHook(() =>
      useTradeDraft({
        symbol: "AAPL",
        assetClass: "equity",
        assetRules,
        cashAvailable: 1000,
        assetQtyAvailable: 10,
        defaultLimitPx: 195.5,
      }),
    );

    expect(result.current.limitPx).toBe(195.5);
  });

  it("initializes uncontrolled state from defaultValue", () => {
    const { result } = renderHook(() =>
      useTradeDraft({
        symbol: "AAPL",
        assetClass: "equity",
        assetRules,
        cashAvailable: 1000,
        assetQtyAvailable: 10,
        defaultValue: {
          side: "sell",
          type: "market",
          qty: 3,
        },
      }),
    );

    expect(result.current.value).toEqual({
      side: "sell",
      type: "market",
      tif: "day",
      qty: 3,
    });
  });
});

describe("useTradeDraft controlled state", () => {
  it("uses an externally controlled value", () => {
    const controlledValue: TradeDraftValue = {
      side: "sell",
      type: "market",
      tif: "gtc",
      qty: 2,
    };

    const { result } = renderHook(() =>
      useTradeDraft({
        symbol: "AAPL",
        assetClass: "equity",
        assetRules,
        cashAvailable: 1000,
        assetQtyAvailable: 10,
        value: controlledValue,
      }),
    );

    expect(result.current.value).toEqual(controlledValue);
    expect(result.current.draft).toEqual({
      symbol: "AAPL",
      assetClass: "equity",
      ...controlledValue,
    });
  });

  it("emits one complete value for a controlled type transition", () => {
    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useTradeDraft({
        symbol: "AAPL",
        assetClass: "equity",
        assetRules,
        cashAvailable: 1000,
        assetQtyAvailable: 10,
        value: {
          side: "buy",
          type: "limit",
          tif: "day",
          qty: 2,
          limitPx: 100,
        },
        onChange: handleChange,
      }),
    );

    act(() => {
      result.current.setType("market");
    });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      side: "buy",
      type: "market",
      tif: "day",
    });
  });

  it("reflects externally updated controlled values", () => {
    const { result, rerender } = renderHook(
      ({ value }) =>
        useTradeDraft({
          symbol: "AAPL",
          assetClass: "equity",
          assetRules,
          cashAvailable: 1000,
          assetQtyAvailable: 10,
          value,
        }),
      {
        initialProps: {
          value: {
            side: "buy",
            type: "limit",
            tif: "day",
            limitPx: 100,
          } satisfies TradeDraftValue,
        },
      },
    );

    rerender({
      value: {
        side: "buy",
        type: "limit",
        tif: "day",
        limitPx: 101,
      },
    });

    expect(result.current.limitPx).toBe(101);
  });
});
