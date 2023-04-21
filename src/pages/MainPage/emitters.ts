import { Subject, fetchApi } from "react-declarative";
import getTimeLabel from "../../utils/getTimeLabel";

export const predictEmitter = new Subject<"train" | "upward" | "downward" | null>();

/**
 * TODO: implement
 *  - buys crypto with limit order (price CANDLE_HIGH_PRICE + 0.000001) and makes sell limit order (price AVERAGE_BUY_PRICE + 1%)
 *  - does nothing if see opened orders
 *  - avoid duplicated requests
 */
const doTrade = async (sellPercent: number, usdtAmount: number) => {
    try {
        await fetchApi(new URL('/api/v1/do_trade', window.location.origin), {
            method: "POST",
            body: JSON.stringify({ symbol: "ETHUSDT", sellPercent, usdtAmount }, null, 2),
        });
        console.log(`trade request sended ${getTimeLabel(new Date())}`);
    } catch {
        console.log(`trade request failed ${getTimeLabel(new Date())}`);
    }
}

predictEmitter.subscribe(() => doTrade(0.01, 100));

(window as any).predictEmitter = predictEmitter;
