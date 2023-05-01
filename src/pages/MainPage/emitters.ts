import { Subject, Source, Operator, singlerun } from "react-declarative";

import dayjs, { Dayjs } from "dayjs";

import getTimeLabel from "../../utils/getTimeLabel";
import playSound, { Sound } from "../../utils/playSound";

import { doNotify, doTrade, doRollback, errorSubject } from "./api";

import { CC_FREEZE_SECONDS, CC_PLAYSOUND_MINUTES, CC_TRADE_AMOUNT, CC_TRADE_PERCENT } from "../../config/params";

export const predictEmitter = new Subject<"train" | "upward" | "downward" | "untrained" | null>();

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

const upwardEmitter = Source.multicast(() => {
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
        .filter((trend) => trend === "upward")
});

const downwardEmitter = Source.multicast(() => predictEmitter
    .filter((trend) => trend === "downward")
);

const doEmit = singlerun(async (trend) => {
    doNotify(trend);
    if (trend === "upward") {
        await doTrade(CC_TRADE_PERCENT, CC_TRADE_AMOUNT);
    }
    if (trend === "downward") {
        await doRollback();
    }
});

const tradeEmitter = Source.multicast(() => Source.merge([
    upwardEmitter,
    downwardEmitter,
]));

tradeEmitter.connect(doEmit);

(window as any).predictEmitter = predictEmitter;
(window as any).tradeEmitter = tradeEmitter;
(window as any).errorSubject = errorSubject;
