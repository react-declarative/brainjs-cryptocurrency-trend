import { useRef, useLayoutEffect } from "react";
import { TSubject, useSubject } from "react-declarative";

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

interface IChartProps {
  predictChanged: TSubject<"train" | "upward" | "downward" | null>;
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
      let hour = date.getHours().toString();
      let minute = date.getMinutes().toString();
      let second = date.getSeconds().toString();
      hour = hour.length === 1 ? '0' + hour : hour;
      minute = minute.length === 1 ? '0' + minute : minute;
      second = second.length === 1 ? '0' + second : second;
      return `${hour}:${minute}:${second}.${date.getMilliseconds()}`;
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

export const Chart = ({ predictChanged: upperPredictChanged, height, width }: IChartProps) => {
  const elementRef = useRef<HTMLDivElement>(undefined as never);

  const predictChanged = useSubject(upperPredictChanged);

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
        color: 'transparent',
        lineWidth: 3,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: '',
    });

    predictChanged.subscribe((trend) => {
        if (trend === "upward") {
            line.applyOptions({
                title: "Raise predict",
                color: "#00a73e",
                price: lastPrice,
            });
        } else if (trend === "downward") {
            line.applyOptions({
                title: "Fail predict",
                color: "#e4000b",
                price: lastPrice,
            });
        }
    });

    return () => {
      chart.remove();
      disconnectPriceEmitter();
    };
  }, [height, width, predictChanged]);

  return <div ref={elementRef} />;
};

export default Chart;
