import { Subject, Source, Operator, fetchApi, singlerun, roundTicks } from "react-declarative";

import dayjs, { Dayjs } from "dayjs";

import getTimeLabel from "../../utils/getTimeLabel";
import playSound, { Sound } from "../../utils/playSound";

import { CC_FREEZE_SECONDS, CC_INFORM_HANDLER, CC_PLAYSOUND_MINUTES, CC_TRADE_AMOUNT, CC_TRADE_HANDLER, CC_TRADE_PERCENT } from "../../config/params";

export const predictEmitter = new Subject<"train" | "upward" | "downward" | "untrained" | null>();

export const errorSubject = new Subject<"now" | "schedule" | "drop">();

export const soundEmitter = Source.multicast(() =>
    Source.merge([
        Source.fromInterval(15_000).map(() => "tick" as const),
        errorSubject.toObserver(),
    ]).reduce<dayjs.Dayjs | null>((stamp, type) => {
        if (type === "schedule") {
            return stamp || dayjs();
        } else if (type === "now") {
            playSound(Sound.Alert);
            return null;
        } else if (type === "drop") {
            return null;
        }
        return stamp;
    }, null)
)

soundEmitter.connect((stamp) => {
    if (stamp && dayjs().diff(stamp, 'minute') >= CC_PLAYSOUND_MINUTES) {
        playSound(Sound.Alert);
    }
});

/**
 * TODO: implement
 *  - handler which buys crypto with limit order (price CANDLE_HIGH_PRICE + 0.000001) and makes sell limit order (price AVERAGE_BUY_PRICE + 1%)
 *      1. does nothing if have pending request (avoid duplicated requests)
 *      2. does nothing if have unresolved order (opened LIMIT_SELL or opened LIMIT_BUY with incoming LIMIT_SELL)
 */
const doTrade = singlerun(async (sellPercent: number, usdtAmount: number) => {
    try {
        const { status } = await fetchApi(new URL(CC_TRADE_HANDLER, window.location.origin), {
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
        console.log(`trade request sended status=${status} ${getTimeLabel(new Date())}`);
        if (status === "ok") {
            errorSubject.next("drop");
        }
        if (status === "error") {
            errorSubject.next("schedule");
        }
    } catch {
        console.log(`trade request failed ${getTimeLabel(new Date())}`);
        errorSubject.next("now");
    }
});

const tradeEmitter = Source.multicast(() => {
    let lastDownward: Dayjs | null = null;
    return predictEmitter
        .operator(Operator.skip(1))
        .tap((trend) => {
            if (trend === "downward") {
                lastDownward = dayjs();
            }
        })
        .filter(() => {
            if (lastDownward && dayjs().diff(lastDownward, 'second') <= CC_FREEZE_SECONDS) {
                console.log(`ambiguously rise prediction skipped ${getTimeLabel(new Date())}`)
                return false;
            }
            return true;
        })
});

tradeEmitter
    .connect((trend: "upward" | "downward") => {
        if (trend === "upward") {
            doTrade(CC_TRADE_PERCENT, CC_TRADE_AMOUNT);
        }
    });

tradeEmitter
    .connect(async (trend) => {
        try {
            await fetchApi(new URL(CC_INFORM_HANDLER, window.location.origin), {
                method: 'POST',
                body: JSON.stringify({
                    symbol: 'ETHUSDT',
                    trend,
                }, null, 2),
            });
        } catch {
            console.log(`telegram inform skipped ${getTimeLabel(new Date())}`);
        }
    });

(window as any).predictEmitter = predictEmitter;
(window as any).errorSubject = errorSubject;
