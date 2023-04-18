
/**
 * @description percentDiff(10, 9) -0.1
 * @description percentDiff(9, 10) 0.1
 */
export const percentDiff = (b: number, a: number) => {
    return 100 * ((a - b) / ((a + b) / 2));
}

/**
 * @description range(-1.0; 1.0) to range(0, 1.0)
 */
export const toNeuralValue = (diff: number) => {
    return ((diff * 100) + 100) / 200; 
}

export default percentDiff;
