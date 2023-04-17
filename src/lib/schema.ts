import { createSsManager } from "react-declarative";

interface INeuralNetworkOptions {
    activation: string;
    leakyReluAlpha: number;
    inputSize: number;
    outputSize: number;
    binaryThresh: number;
    hiddenLayers?: number[];
}

interface INeuralNetworkTrainOptions {
    iterations: number;
    errorThresh: number;
    log: boolean;
    logPeriod: number;
    learningRate: number;
    momentum: number;
    callbackPeriod: number;
    timeout: number;
}

export const netManager = createSsManager<INeuralNetworkOptions>("HYPEBOT_NET");

export const trainManager = createSsManager<INeuralNetworkTrainOptions>("HYPEBOT_TRAIN");
