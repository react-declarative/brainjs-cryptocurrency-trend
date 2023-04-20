import { Subject } from "react-declarative";

export const predictEmitter = new Subject<"train" | "upward" | "downward" | null>();

/*
const doTrade = (sellPercent: number, usdtAmount: number) => {
    // buys crypto with limit order (price CANDLE_HIGH_PRICE + 0.000001) and makes sell limit order (price AVERAGE_BUY_PRICE + 1%)
    // does nothing if see opened orders
}

predictEmitter.subscribe(() => doTrade(0.01, 100));
*/

(window as any).predictEmitter = predictEmitter;
