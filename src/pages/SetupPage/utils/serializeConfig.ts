import IData from "../model/IData.model";

import { CC_INPUT_SIZE, CC_OUTPUT_SIZE } from "../../../config/params";

export const fromData = (data: IData) => {
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
      inputSize: CC_INPUT_SIZE,
      outputSize: CC_OUTPUT_SIZE,
      binaryThresh: Number(binaryThresh),
      activation: activation,
      hiddenLayers: Object.values(hiddenLayers)
        .map((v) => Number(v))
        .filter((v) => !!v),
      leakyReluAlpha: Number(leakyReluAlpha),
    },
    train: {
      timeout: Number(timeout),
      iterations: Number(iterations),
      errorThresh: Number(errorThresh),
      log,
      logPeriod: Number(logPeriod),
      learningRate: Number(learningRate),
      momentum: Number(momentum),
      callbackPeriod: Number(callbackPeriod),
    },
  }
};

export const serializeData = (data: IData) => {
  return JSON.stringify(fromData(data), null, 2);
};

export default serializeData;
