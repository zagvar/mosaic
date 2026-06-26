import type { MarketCandle } from "@mosaic/core";
import type {
  CandlestickData,
  HistogramData,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from "lightweight-charts";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import { classNameProps } from "./internal/class-name";

export interface TradingChartClassNames {
  root?: string;
  header?: string;
  title?: string;
  attribution?: string;
  chart?: string;
}

export interface TradingChartMessages {
  title: string;
  attribution: string;
}

export interface TradingChartProps {
  candles: MarketCandle[];
  symbol: string;

  height?: number;
  showVolume?: boolean;
  theme?: "light" | "dark";

  messages?: Partial<TradingChartMessages>;
  classNames?: TradingChartClassNames;
}

export const defaultTradingChartMessages: TradingChartMessages = {
  title: "Chart",
  attribution: "Charts by TradingView",
};

export function TradingChart({
  candles,
  symbol,
  height = 320,
  showVolume = true,
  theme = "light",
  messages,
  classNames,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const text = {
    ...defaultTradingChartMessages,
    ...messages,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    const chart = createChart(container, {
      height: container.clientHeight || height,
      width: container.clientWidth,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: theme === "dark" ? "#8b95a7" : "#6b7280",
      },
      grid: {
        vertLines: { color: theme === "dark" ? "#1b2432" : "#eef2f7" },
        horzLines: { color: theme === "dark" ? "#1b2432" : "#eef2f7" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#059669",
      downColor: "#dc2626",
      borderVisible: false,
      wickUpColor: "#059669",
      wickDownColor: "#dc2626",
    });

    const volumeSeries = showVolume
      ? chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "",
        })
      : null;

    if (volumeSeries !== null) {
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry === undefined) return;

      chart.applyOptions({
        height: Math.floor(entry.contentRect.height),
        width: Math.floor(entry.contentRect.width),
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();

      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [height, showVolume, theme]);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    if (candleSeries === null) return;

    candleSeries.setData(candles.map(toCandlestickData));

    const volumeSeries = volumeSeriesRef.current;
    if (volumeSeries !== null) {
      volumeSeries.setData(candles.map(toVolumeData));
    }

    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return (
    <section
      aria-label={`${symbol} ${text.title}`}
      {...classNameProps(classNames?.root)}
    >
      <header {...classNameProps(classNames?.header)}>
        <h2 {...classNameProps(classNames?.title)}>
          {symbol} {text.title}
        </h2>
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noreferrer"
          {...classNameProps(classNames?.attribution)}
        >
          {text.attribution}
        </a>
      </header>

      <div ref={containerRef} {...classNameProps(classNames?.chart)} />
    </section>
  );
}

function toCandlestickData(candle: MarketCandle): CandlestickData {
  return {
    time: candle.time as UTCTimestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

function toVolumeData(candle: MarketCandle): HistogramData {
  return {
    time: candle.time as UTCTimestamp,
    value: candle.volume ?? 0,
    color: candle.close >= candle.open ? "#05966955" : "#dc262655",
  };
}
