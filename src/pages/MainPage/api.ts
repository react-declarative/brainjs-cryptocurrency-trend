import { fetchApi, singlerun, Subject } from "react-declarative";

import getTimeLabel from "../../utils/getTimeLabel";

import { CC_INFORM_HANDLER, CC_ROLLBACK_HANDLER, CC_TRADE_HANDLER } from "../../config/params";

export const errorSubject = new Subject<"now" | "schedule" | "drop">();

/**
 * INFO: implementation
 *  - handler which buys crypto with limit order (price CANDLE_HIGH_PRICE + 0.000001) and makes sell limit order (price AVERAGE_BUY_PRICE + 1%)
 *      1. does nothing if have pending request (avoid duplicated requests)
 *      2. does nothing if have unresolved order (opened LIMIT_SELL or opened LIMIT_BUY with incoming LIMIT_SELL)
 */
export const doTrade = singlerun(async (usdtAmount: number) => {
    try {
        const { status } = await fetchApi(new URL(CC_TRADE_HANDLER, window.location.origin), {
            method: "POST",
            body: JSON.stringify({
                symbol: "ETHUSDT",
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

export const doRollback = singlerun(async (usdtAmount: number) => {
    try {
        const { status } = await fetchApi(new URL(CC_ROLLBACK_HANDLER, window.location.origin), {
            method: "POST",
            body: JSON.stringify({
                symbol: "ETHUSDT",
                usdtAmount: usdtAmount.toFixed(0),
            }, null, 2),
        });
        console.log(`rollback request sended status=${status} ${getTimeLabel(new Date())}`);
        if (status === "ok") {
            errorSubject.next("drop");
        }
        if (status === "error") {
            errorSubject.next("schedule");
        }
    } catch {
        console.log(`rollback request failed ${getTimeLabel(new Date())}`);
        errorSubject.next("now");
    }
});

export const doNotify = singlerun(async (trend) => {
    try {
        await fetchApi(new URL(CC_INFORM_HANDLER, window.location.origin), {
            method: 'POST',
            body: JSON.stringify({
                symbol: 'ETHUSDT',
                trend,
            }, null, 2),
        });
    } catch (error) {
        console.log(`telegram inform skipped ${getTimeLabel(new Date())}`, { error });
    }
});
