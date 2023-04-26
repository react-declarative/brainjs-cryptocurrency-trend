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

  const sleep = (timeout = 1_000) =>
    new Promise<void>((res) => {
      setTimeout(() => res(), timeout);
    });

  const usdToCoins = (totalUsd: number, coinPrice: number) => {
    return totalUsd / coinPrice;
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

  const getTransactionFee = async (
    symbol = 'ETHUSDT',
  ): Promise<{
    maker: number;
    taker: number;
  }> => {
    const { tradeFee } = await binance.tradeFee();
    const { makerCommission = '0.001', takerCommission = '0.001' } =
      tradeFee.find((fee) => fee.symbol === symbol);
    return {
      maker: parseFloat(makerCommission),
      taker: parseFloat(takerCommission),
    };
  };

  const getMarketPrice = async (COIN = 'ETHUSDT'): Promise<number> => {
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

  const getBalance = async (coin = 'ETH'): Promise<number> => {
    const { available = -1 } = (await binance.balance()[coin]) || {};
    if (available === -1) {
      throw new Error('holdUSDT balance fetch failed');
    }
    return available;
  };

  const getTradeInfo = async (symbol = 'ETHUSDT') => {
    const marketPrice = await getMarketPrice(symbol);
    const { stepSize: sizeDecimalPlaces } = await getInfo(symbol, 'LOT_SIZE');
    const { tickSize: priceDecimalPlaces } = await getInfo(
      symbol,
      'PRICE_FILTER',
    );
    return {
      marketPrice,
      priceDecimalPlaces,
      sizeDecimalPlaces,
    };
  };

  const hasOpenOrders = async (symbol = 'ETHUSDT') => {
    const totalOrders = await binance.openOrders(symbol);
    return !!totalOrders.length;
  };

  const isOrderFullfilled = async (orderId: string) => {
    const { status } = await binance.orderStatus('ETHUSDT', orderId);
    return status === 'FILLED';
  };

  const cancelOrder = async (orderId: string) => {
    await binance.cancel('ETHUSDT', orderId);
  };

  const sendBuyUSDT = async (
    usdtAmount: number,
    {
      marketPrice,
      priceDecimalPlaces,
      sizeDecimalPlaces,
    }: {
      marketPrice: number;
      priceDecimalPlaces: string;
      sizeDecimalPlaces: string;
    },
  ): Promise<string | null> => {
    const fastPrice = marketPrice * 1.001;
    const size = usdToCoins(usdtAmount, fastPrice);
    const { orderId: buyOrderId = '' } = await binance.order(
      'BUY',
      'ETHUSDT',
      roundTicks(size, sizeDecimalPlaces),
      roundTicks(fastPrice, priceDecimalPlaces),
    );
    return buyOrderId || null;
  };

  const sendSellQTY = async (
    ethQuantity: number,
    sellPercent: number,
    {
      marketPrice,
      priceDecimalPlaces,
      sizeDecimalPlaces,
    }: {
      marketPrice: number;
      priceDecimalPlaces: string;
      sizeDecimalPlaces: string;
    },
  ): Promise<string | null> => {
    const winPrice = marketPrice * sellPercent;
    const { orderId: sellOrderId = '' } = await binance.order(
      'SELL',
      'ETHUSDT',
      roundTicks(ethQuantity, sizeDecimalPlaces),
      roundTicks(winPrice, priceDecimalPlaces),
    );
    return sellOrderId || null;
  };

  const holdUSDT = async (sellPercent: number, usdtAmount: number) => {
    if (await hasOpenOrders('ETHUSDT')) {
      return;
    }

    const { marketPrice, priceDecimalPlaces, sizeDecimalPlaces } =
      await getTradeInfo('ETHUSDT');
    const { maker } = await getTransactionFee('ETHUSDT');
    const balanceBefore = await getBalance('ETH');

    const buyOrderId = await sendBuyUSDT(usdtAmount, {
      marketPrice,
      priceDecimalPlaces,
      sizeDecimalPlaces,
    });

    if (!buyOrderId) {
      throw new Error('holdUSDT sendBuyUSDT failed');
    }

    let isOk = false;

    for (let i = 0; i !== 10; i++) {
      if (await isOrderFullfilled(buyOrderId)) {
        isOk = true;
        break;
      }
      await sleep();
    }

    if (!isOk) {
      await cancelOrder(buyOrderId);
      throw new Error('holdUSDT sendBuyUSDT order not resolved');
    }

    const balanceAfter = await getBalance('ETH');

    let ethQuantity = balanceAfter - balanceBefore;
    ethQuantity -= ethQuantity * maker;

    const sellOrderId = await sendSellQTY(ethQuantity, sellPercent, {
      marketPrice,
      priceDecimalPlaces,
      sizeDecimalPlaces,
    });

    if (!sellOrderId) {
      throw new Error('holdUSDT sendSellQTY failed');
    }

    for (let i = 0; i !== 10; i++) {
      if (await isOrderFullfilled(sellOrderId)) {
        break;
      }
      await sleep();
    }
  };

  (globalThis as any).hasOpenOrders = hasOpenOrders;
  (globalThis as any).getBalance = getBalance;
  (globalThis as any).getTradeFee = getTransactionFee;
  (globalThis as any).getMarketPrice = getMarketPrice;
  (globalThis as any).holdUSDT = holdUSDT;
  (globalThis as any).roundTicks = roundTicks;
  (globalThis as any).usdToCoins = usdToCoins;
  (globalThis as any).sendSellQTY = sendSellQTY;
  (globalThis as any).sendBuyUSDT = sendBuyUSDT;
  (globalThis as any).getTradeInfo = getTradeInfo;

  return holdUSDT;
};
