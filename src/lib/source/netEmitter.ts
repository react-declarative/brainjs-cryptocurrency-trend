import { Source, Operator } from 'react-declarative';
import { NeuralNetworkGPU } from 'brain.js';

import priceEmitter from './priceEmitter';

import { CC_INPUT_SIZE, CC_TRAIN_WINDOW_SIZE, CC_PRICE_SLOPE_ADJUST } from '../../config/params';

import getTimeLabel from '../../utils/getTimeLabel';
import percentDiff, { toNeuralValue } from '../../utils/percentDiff';
import calculateTrend from '../../utils/calculateTrend';

import { netManager, trainManager } from '../schema';

const positiveSetEmitter = Source.multicast<number[][]>(() =>
    priceEmitter
        .map((value) => Math.floor(value * CC_PRICE_SLOPE_ADJUST))
        .operator(Operator.distinct())
        .operator(Operator.group(CC_TRAIN_WINDOW_SIZE + 1))
        .filter((data) => calculateTrend(data) === 1)
        .operator(Operator.take(1))
        .flatMap((items) => items)
        .operator(Operator.pair())
        .map(([a, b]) => toNeuralValue(percentDiff(a, b)))
        .operator(Operator.group(CC_TRAIN_WINDOW_SIZE))
        .operator(Operator.strideTricks(CC_INPUT_SIZE))
        .tap(() => {
            const date = new Date();
            console.log(`catched raise pattern at ${getTimeLabel(date)}`);
        })
);

const negativeSetEmitter = Source.multicast<number[][]>(() =>
    priceEmitter
        .map((value) => Math.floor(value * CC_PRICE_SLOPE_ADJUST))
        .operator(Operator.distinct())
        .operator(Operator.group(CC_TRAIN_WINDOW_SIZE + 1))
        .filter((data) => calculateTrend(data) === -1)
        .operator(Operator.take(1))
        .flatMap((items) => items)
        .operator(Operator.pair())
        .map(([a, b]) => toNeuralValue(percentDiff(a, b)))
        .operator(Operator.group(CC_TRAIN_WINDOW_SIZE))
        .operator(Operator.strideTricks(CC_INPUT_SIZE))
        .tap(() => {
            const date = new Date();
            console.log(`catched fail pattern at ${getTimeLabel(date)}`);
        })
);

export const netEmitter = Source.join([
    positiveSetEmitter,
    negativeSetEmitter,
]).mapAsync(async ([positiveSet, negativeSet]) => {
    const net = new NeuralNetworkGPU({
        ...netManager.getValue()!,
    });
    const data = [
        ...positiveSet.map((input) => ({
            input,
            output: [1, 0],
        })),
        ...negativeSet.map((input) => ({
            input,
            output: [0, 1],
        })),
    ];
    await net.trainAsync(data, trainManager.getValue()!);
    return net;
});

export default netEmitter;
