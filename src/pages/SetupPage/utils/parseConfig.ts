import IData from "../model/IData.model";

export const toData = (data: Record<string, any>): IData => {
  const {
    net: {
      binaryThresh,
      activation,
      hiddenLayers,
      leakyReluAlpha,
    },
    train: {
      iterations,
      errorThresh,
      log,
      logPeriod,
      learningRate,
      momentum,
      callbackPeriod,
      timeout,
    },
  } = data;
  return {
    net: {
      binaryThresh: String(binaryThresh),
      activation: String(activation),
      hiddenLayers: hiddenLayers
        .map((value: any, index: any) => [value, index.toString()])
        .reduce((acm: any, [val, idx]: [any, any]) => ({ ...acm, [idx]: val }), {}),
      leakyReluAlpha: String(leakyReluAlpha),
    },
    train: {
      iterations: String(iterations),
      errorThresh: String(errorThresh),
      log: !!log,
      logPeriod: String(logPeriod),
      learningRate: String(learningRate),
      momentum: String(momentum),
      callbackPeriod: String(callbackPeriod),
      timeout: timeout && isFinite(timeout) ? String(timeout) : '9999999',
    },
  };
};

export const parseConfig = (json: string) => {
  return toData(JSON.parse(json));
};

export default parseConfig;
