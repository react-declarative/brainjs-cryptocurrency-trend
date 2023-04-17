export interface IData {
    net: {
        binaryThresh: string | number,
        hiddenLayers: {
            [k: string]: string
        } | number[],
        activation: string,
        leakyReluAlpha: string | number,
    },
    train: {
        iterations: string | number,
        errorThresh: string | number,
        log: boolean,
        logPeriod: string | number,
        learningRate: string | number,
        momentum: string | number,
        callbackPeriod: string | number,
        timeout: string | number,
    },
};

export default IData;
