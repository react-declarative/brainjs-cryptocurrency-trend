import Binance from 'node-binance-api';

export const createHoldUSDT = (binance: Binance) => {
  const roundTicks = (price: number, tickSize = '0.00010000') => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    });
    const precision =
      formatter.format(parseFloat(tickSize)).split('.')[1].length || 0;
    if (typeof price === 'string') price = parseFloat(price);
    return price.toFixed(precision);
  };

  const getInfo = async (
    symbol = 'ETHUSDT',
    filterType = 'LOT_SIZE',
  ): Promise<{
    stepSize?: string;
    tickSize?: string;
    minQty?: string;
  }> => {
    const { symbols = [] } = await binance.exchangeInfo();
    const { filters = [] } = symbols.find((info) => info.symbol === symbol);
    const {
      stepSize = '0.00010000',
      tickSize = '0.01000000',
      minQty = '0.00010000',
    } = filters.find((filter) => filter.filterType === filterType);
    return {
      stepSize,
      tickSize,
      minQty,
    };
  };

  const getBinancePrice = async (symbol = 'ETHUSDT'): Promise<number> => {
    const prices = await binance.prices(symbol);
    const price = prices[symbol];
    return price;
  };

  const getTransactionFee = async (COIN = 'ETHUSDT') => {
    const { tradeFee } = await binance.tradeFee();
    const { maker, taker } = tradeFee.find(({ symbol }) => symbol === COIN);
    return { maker, taker };
  };

  const getPrice = async (COIN = 'ETHUSDT'): Promise<number> => {
    const ticks = await binance.candlesticks(COIN, '1m');
    const candles = ticks.map(
      ([
        time,
        open,
        high,
        low,
        close,
        volume,
        closeTime,
        assetVolume,
        trades,
        buyBaseVolume,
        buyAssetVolume,
        ignored,
      ]) => ({
        time,
        open,
        high,
        low,
        close,
        volume,
        closeTime,
        assetVolume,
        trades,
        buyBaseVolume,
        buyAssetVolume,
        ignored,
      }),
    );
    const sorted = candles.sort(({ time: a }, { time: b }) => b - a);
    const [lastTick] = sorted;
    const { high } = lastTick;
    const binancePrice = await getBinancePrice(COIN);
    return Math.min(Number(binancePrice), Number(high));
  };

  const getBalance = async (coin = 'ETH') => {
    const { available = -1 } = (await binance.balance()[coin]) || {};
    if (available === -1) {
      throw new Error('holdUSDT balance fetch failed');
    }
    return available;
  };

  const holdUSDT = async (sellPercent: number, usdtAmount: number) => {
    const { maker } = await getTransactionFee('ETHUSDT');
    const { stepSize: stepSizeQ } = await getInfo('ETHUSDT', 'LOT_SIZE');
    const { tickSize: stepSizeP } = await getInfo('ETHUSDT', 'PRICE_FILTER');
    console.log(stepSizeQ, stepSizeP, maker);
  };

  (globalThis as any).holdUSDT = holdUSDT;

  return holdUSDT;
};
