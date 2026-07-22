import { compareDecimals, type DecimalString } from "@zagvar/decimal";
import type { MarketCandle } from "@zagvar/mosaic-core";
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
import { classNameProps } from "./internal/class-name.js";

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

  const candlesRef = useRef(candles);
  const heightRef = useRef(height);
  const themeRef = useRef(theme);

  candlesRef.current = candles;
  heightRef.current = height;
  themeRef.current = theme;

  const text = {
    ...defaultTradingChartMessages,
    ...messages,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    const chart = createChart(container, {
      height: container.clientHeight || heightRef.current,
      width: container.clientWidth,
      ...getThemeOptions(themeRef.current),
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

    setChartData(chart, candleSeries, volumeSeries, candlesRef.current);

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
  }, [showVolume]);

  useEffect(() => {
    chartRef.current?.applyOptions(getThemeOptions(theme));
  }, [theme]);

  useEffect(() => {
    chartRef.current?.applyOptions({ height });
  }, [height]);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;

    if (chart === null || candleSeries === null) return;

    setChartData(chart, candleSeries, volumeSeriesRef.current, candles);
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

function getThemeOptions(theme: "light" | "dark") {
  return {
    layout: {
      background: {
        type: ColorType.Solid,
        color: "transparent",
      },
      textColor: theme === "dark" ? "#8b95a7" : "#6b7280",
    },
    grid: {
      vertLines: {
        color: theme === "dark" ? "#1b2432" : "#eef2f7",
      },
      horzLines: {
        color: theme === "dark" ? "#1b2432" : "#eef2f7",
      },
    },
  };
}

function setChartData(
  chart: IChartApi,
  candleSeries: ISeriesApi<"Candlestick">,
  volumeSeries: ISeriesApi<"Histogram"> | null,
  candles: readonly MarketCandle[],
) {
  candleSeries.setData(candles.map(toCandlestickData));

  if (volumeSeries !== null) {
    volumeSeries.setData(candles.map(toVolumeData));
  }

  chart.timeScale().fitContent();
}

function toCandlestickData(candle: MarketCandle): CandlestickData {
  return {
    time: toUnixTimestamp(candle.timestamp),
    open: toChartNumber(candle.open),
    high: toChartNumber(candle.high),
    low: toChartNumber(candle.low),
    close: toChartNumber(candle.close),
  };
}

function toVolumeData(candle: MarketCandle): HistogramData {
  return {
    time: toUnixTimestamp(candle.timestamp),
    value: toChartNumber(candle.volume ?? "0"),
    color:
      compareDecimals(candle.close, candle.open) >= 0
        ? "#05966955"
        : "#dc262655",
  };
}

function toChartNumber(value: DecimalString): number {
  const chartValue = Number(value);

  if (!Number.isFinite(chartValue)) {
    throw new RangeError(
      `Decimal value ${value} cannot be represented by the chart library.`,
    );
  }

  return chartValue;
}

function toUnixTimestamp(timestamp: string): UTCTimestamp {
  return Math.floor(Date.parse(timestamp) / 1000) as UTCTimestamp;
}
