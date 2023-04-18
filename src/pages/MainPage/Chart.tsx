import { useRef, useLayoutEffect } from "react";
import { datetime } from "react-declarative";

import {
  createChart,
  ChartOptions,
  LineStyleOptions,
  SeriesOptionsCommon,
  DeepPartial,
  UTCTimestamp,
} from "lightweight-charts";

import priceEmitter from "../../lib/source/priceEmitter";

interface IChartProps {
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
      hour = hour.length === 1 ? '0' + hour : hour;
      minute = minute.length === 1 ? '0' + minute : minute;
      return `${hour}:${minute}:${date.getSeconds()}.${date.getMilliseconds()}`;
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

export const Chart = ({ height, width }: IChartProps) => {
  const elementRef = useRef<HTMLDivElement>(undefined as never);

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

    const disconnect = priceEmitter.connect((value) => {
        series.update({ value, time: Date.now() as UTCTimestamp });
        // chart.timeScale().fitContent();
    });

    return () => {
      chart.remove();
      disconnect();
    };
  }, [height, width]);

  return <div ref={elementRef} />;
};

export default Chart;
