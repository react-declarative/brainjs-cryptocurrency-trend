import { Subject, Operator, fetchApi, singlerun, roundTicks } from "react-declarative";

import getTimeLabel from "../../utils/getTimeLabel";

import { CC_TRADE_HANDLER } from "../../config/params";

export const predictEmitter = new Subject<"train" | "upward" | "downward" | "untrained" | null>();

/**
 * TODO: implement
 *  - handler which buys crypto with limit order (price CANDLE_HIGH_PRICE + 0.000001) and makes sell limit order (price AVERAGE_BUY_PRICE + 1%)
 *      1. does nothing if have pending request (avoid duplicated requests)
 *      2. does nothing if have unresolved order (opened LIMIT_SELL or opened LIMIT_BUY with incoming LIMIT_SELL)
 */
const doTrade = singlerun(async (sellPercent: number, usdtAmount: number) => {
    try {
        await fetchApi(new URL(CC_TRADE_HANDLER, window.location.origin), {
            method: "POST",
            body: JSON.stringify({
                symbol: "ETHUSDT",
                sellPercent: roundTicks(sellPercent, 6),
                usdtAmount: usdtAmount.toFixed(0),
            }, null, 2),
            headers: {
                "Content-Type": "application/json",
            },
        });
        console.log(`trade request sended ${getTimeLabel(new Date())}`);
    } catch {
        console.log(`trade request failed ${getTimeLabel(new Date())}`);
    }
});

predictEmitter
    .operator(Operator.skip(1))
    .connect((trend: "upward" | "downward") => {
        if (trend === "upward") {
            doTrade(1.01, 100);
        }
    });

(window as any).predictEmitter = predictEmitter;
