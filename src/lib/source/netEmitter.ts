import { Source, Operator } from 'react-declarative';
import { NeuralNetworkGPU } from 'brain.js';

import priceEmitter from './priceEmitter';

import { CC_INPUT_SIZE, CC_TRAIN_WINDOW_SIZE, CC_PRICE_SLOPE_ADJUST, CC_TRAIN_TARGET_SIZE, CC_STRIDE_STEP } from '../../config/params';

import getTimeLabel from '../../utils/getTimeLabel';
import percentDiff, { toNeuralValue } from '../../utils/percentDiff';
import calculateTrend, { filterBullRun } from '../../utils/calculateTrend';

import { netManager, trainManager } from '../schema';

const positiveSetEmitter = Source.multicast<number[][]>(() =>
    priceEmitter
        .map((value) => Math.floor(value * CC_PRICE_SLOPE_ADJUST))
        .operator(Operator.distinct())
        .operator(Operator.group(CC_TRAIN_WINDOW_SIZE + 1))
        .filter((data) => calculateTrend(data) === 1)
        .flatMap((items) => items)
        .operator(Operator.pair())
        .map(([a, b]) => toNeuralValue(percentDiff(a, b)))
        .operator(Operator.group(CC_TRAIN_WINDOW_SIZE))
        .operator(Operator.strideTricks(CC_INPUT_SIZE, CC_STRIDE_STEP))
        .tap(() => {
            const date = new Date();
            console.log(`checking raise pattern at ${getTimeLabel(date)}`);
        })
        .map((strides: number[][]) => filterBullRun(strides, 1))
        .filter((strides) => {
            console.log(`chunk_size=${strides.length} required_size=${CC_TRAIN_TARGET_SIZE}`);
            if (strides.length < CC_TRAIN_TARGET_SIZE) {
                console.log(`raise pattern is not bull run ${getTimeLabel(new Date())}`);
                return false;
            }
            return true;
        })
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
        .flatMap((items) => items)
        .operator(Operator.pair())
        .map(([a, b]) => toNeuralValue(percentDiff(a, b)))
        .operator(Operator.group(CC_TRAIN_WINDOW_SIZE))
        .operator(Operator.strideTricks(CC_INPUT_SIZE, CC_STRIDE_STEP))
        .tap(() => {
            const date = new Date();
            console.log(`checking fail pattern at ${getTimeLabel(date)}`);
        })
        .map((strides: number[][]) => filterBullRun(strides, -1))
        .filter((strides) => {
            console.log(`chunk_size=${strides.length} required_size=${CC_TRAIN_TARGET_SIZE}`);
            if (strides.length < CC_TRAIN_TARGET_SIZE) {
                console.log(`fail pattern is not bull run ${getTimeLabel(new Date())}`);
                return false;
            }
            return true;
        })
        .tap(() => {
            const date = new Date();
            console.log(`catched fail pattern at ${getTimeLabel(date)}`);
        })
);

export const netEmitter = Source
    .join([
        positiveSetEmitter,
        negativeSetEmitter,
    ], {
        race: true,
    })
    .operator<[number[][], number[][]]>(Operator.take(1))
    .tap(() => console.log(`starting trainment ${getTimeLabel(new Date())}`))
    .mapAsync(async ([positiveSet, negativeSet]) => {
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
