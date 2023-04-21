import { useRef, useLayoutEffect } from "react";

import { TSubject, Operator, useSubject, useReloadTrigger } from "react-declarative";

import {
  createChart,
  ChartOptions,
  LineStyleOptions,
  SeriesOptionsCommon,
  DeepPartial,
  LineStyle,
  UTCTimestamp,
} from "lightweight-charts";

import priceEmitter from "../../lib/source/priceEmitter";

import getTimeLabel from "../../utils/getTimeLabel";

interface IChartProps {
  predictEmitter: TSubject<"train" | "upward" | "downward" | null>;
  height: number;
  width: number;
}

const CHART_OPTIONS: DeepPartial<ChartOptions> = {
  layout: {
    textColor: "#d1d4dc",
    backgroundColor: "#0000",
  },
  rightPriceScale: {
    scaleMargins: {
      top: 0.3,
      bottom: 0.25,
    },
  },
  crosshair: {
    vertLine: {
      visible: false,
      labelVisible: false,
    },
    horzLine: {
      visible: false,
      labelVisible: false,
    },
  },
  grid: {
    vertLines: {
      color: "#f8b3",
    },
    horzLines: {
      color: "#f8b3",
    },
  },
  timeScale: {
    tickMarkFormatter: (time: number) => {
      const date = new Date(time);
      return getTimeLabel(date);
    },
  },
  handleScroll: {
    vertTouchDrag: false,
  },
};

const SERIES_OPTIONS: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  color: "#90cbfa",
  lineWidth: 2,
  crosshairMarkerVisible: false,
  lastValueVisible: false,
  priceLineVisible: false,
};

export const Chart = ({
  predictEmitter,
  height,
  width,
}: IChartProps) => {
  const elementRef = useRef<HTMLDivElement>(undefined as never);

  const predictChanged = useSubject(predictEmitter);
  const { reloadTrigger } = useReloadTrigger(600_000);

  useLayoutEffect(() => {
    const { current: chartElement } = elementRef;

    const chart = createChart(chartElement, {
      ...CHART_OPTIONS,
      height,
      width,
    });

    const series = chart.addLineSeries({
      ...SERIES_OPTIONS,
    });

    let lastPrice: number = 0;

    const disconnectPriceEmitter = priceEmitter.connect((value) => {
      lastPrice = value;
      series.update({ value, time: Date.now() as UTCTimestamp });
      // chart.timeScale().fitContent();
    });

    const line = series.createPriceLine({
      price: lastPrice,
      color: "transparent",
      lineWidth: 3,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: "",
    });

    const disconnectPredictEmitter = predictChanged
      .operator(Operator.distinct())
      .connect((trend: string) => {
        const date = new Date();
        if (trend === "upward") {
          line.applyOptions({
            title: `Raise predict ${getTimeLabel(date)}`,
            color: "#00a73e",
            price: lastPrice,
          });
        }
        if (trend === "downward") {
          line.applyOptions({
            title: `Fail predict ${getTimeLabel(date)}`,
            color: "#e4000b",
            price: lastPrice,
          });
        }
        if (trend === "train") {
          line.applyOptions({
            title: "",
            color: "transparent",
            price: 0,
          });
        }
      });

    return () => {
      chart.remove();
      disconnectPriceEmitter();
      disconnectPredictEmitter();
    };
  }, [height, width, predictChanged, reloadTrigger]);

  return <div ref={elementRef} />;
};

export default Chart;
