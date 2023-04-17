import IData from "./model/IData.model";

export const initialData: IData = {
  net: {
    binaryThresh: '0.5',
    hiddenLayers: {
      0: '5',
      1: '0',
      2: '0',
      3: '0',
      4: '0',
      5: '0',
      6: '0',
      7: '0',
    },
    activation: 'sigmoid',
    leakyReluAlpha: '0.3',
  },
  train: {
    iterations: '20000',
    errorThresh: '0.005',
    log: false,
    logPeriod: '10',
    learningRate: '0.3',
    momentum: '0.1',
    callbackPeriod: '10',
    timeout: '9999999999',
  },
};
