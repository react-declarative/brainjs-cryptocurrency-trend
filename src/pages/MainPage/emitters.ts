import { Subject, Source, Operator, singlerun } from "react-declarative";

import dayjs from "dayjs";

import playSound, { Sound } from "../../utils/playSound";

import { doNotify, doTrade, doRollback, errorSubject } from "./api";

import { CC_NET_REPEAT, CC_PLAYSOUND_MINUTES, CC_TRADE_AMOUNT } from "../../config/params";

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

const upwardEmitter = Source.multicast(() => predictEmitter
    .filter((trend) => trend === "upward")
);

const downwardEmitter = Source.multicast(() => predictEmitter
    .filter((trend) => trend === "downward")
);

const doEmit = singlerun(async ({ value: trend, count }: {
    value: "upward" | "downward";
    count: number;
}) => {
    if (count === 0) {
        doNotify(trend);
    }
    if (trend === "upward") {
        await doTrade(CC_TRADE_AMOUNT);
    }
    if (trend === "downward") {
        await doRollback(CC_TRADE_AMOUNT);
    }
});

const tradeEmitter = Source.multicast(() => Source
    .merge([
        upwardEmitter,
        downwardEmitter,
    ])
    .repeat(CC_NET_REPEAT)
    .operator(Operator.count())
);

tradeEmitter.connect(doEmit);

(window as any).predictEmitter = predictEmitter;
(window as any).tradeEmitter = tradeEmitter;
(window as any).errorSubject = errorSubject;
