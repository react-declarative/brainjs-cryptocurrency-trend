/**
 * @see https://stackoverflow.com/questions/6195335/linear-regression-in-javascript
 * @description if Slope variable is positive the chart is going upward
 * @description if Slope variable is negative the chart is going downward
 * @description if Slope variable is infinite the chart is going inline
 */
export const calculateSlope = (data: number[]) => {

    const X: number[] = [];
    const Y: number[] = [];
    
    data.forEach((item, idx) => {
        X.push(idx);
        Y.push(item);
    });

    let Slope = 0;
    let Intercept = 0;
    let SX = 0;
    let SY = 0;
    let SXX = 0; 
    let SXY = 0;
    let SYY = 0;
    let N = X.length;
    
    for (let i = 0; i < N; i++) {
        SX = SX + X[i];
        SY = SY + Y[i];
        SXY = SXY + X[i] * Y[i];
        SXX = SXX + X[i] * X[i];
        SYY = SYY + Y[i] * Y[i];
    }
    
    Slope = ((N * SXY) - (SX * SY)) / ((N * SXX) - (SX * SX));
    Intercept = (SY - (Slope * SX)) / N;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const GetYValue = (xValue: number) => Intercept + (Slope * xValue);

    return Number.isFinite(Slope) ? Math.sign(Slope) : 0;
};

export default calculateSlope;
