import { LoggerService } from '@nestjs/common';
import { Binance, OrderType, SymbolFilterType } from 'binance-api-node';

export const createHoldUSDT = (binance: Binance, logger: LoggerService) => {
  const IGNORE_ORDERS = new Set<number>();

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
    filterType: SymbolFilterType = SymbolFilterType.LOT_SIZE,
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
    } = (filters.find((filter) => filter.filterType === filterType) as any) ||
    {};
    return {
      stepSize,
      tickSize,
      minQty,
    };
  };

  const getBinancePrice = async (symbol = 'ETHUSDT'): Promise<number> => {
    const prices = await binance.prices({ symbol });
    const price = prices[symbol];
    return parseFloat(price);
  };

  const getTransactionFee = async (
    symbol = 'ETHUSDT',
  ): Promise<{
    maker: number;
    taker: number;
  }> => {
    const tradeFee = await binance.tradeFee();
    const { makerCommission = 0.001, takerCommission = 0.001 } = tradeFee.find(
      (fee) => fee.symbol === symbol,
    );
    return {
      maker: makerCommission,
      taker: takerCommission,
    };
  };

  const getMarketPrice = async (symbol = 'ETHUSDT'): Promise<number> => {
    const ticks = await binance.candles({
      symbol,
      interval: '1m',
    });
    const candles = ticks.map(({ high, closeTime: time }) => ({ high, time }));
    const sorted = candles.sort(({ time: a }, { time: b }) => b - a);
    const [lastTick] = sorted;
    const { high } = lastTick;
    const binancePrice = await getBinancePrice(symbol);
    return Math.min(Number(binancePrice), Number(high));
  };

  const getBalance = async (coin = 'ETH'): Promise<number> => {
    const account = await binance.accountInfo();
    const { free } = account.balances.find(({ asset }) => asset === coin) || {};
    if (!free) {
      throw new Error('holdUSDT balance fetch failed');
    }
    return parseFloat(free);
  };

  const getTradeInfo = async (symbol = 'ETHUSDT') => {
    const marketPrice = await getMarketPrice(symbol);
    const { stepSize: sizeDecimalPlaces } = await getInfo(
      symbol,
      SymbolFilterType.LOT_SIZE,
    );
    const { tickSize: priceDecimalPlaces } = await getInfo(
      symbol,
      SymbolFilterType.PRICE_FILTER,
    );
    return {
      marketPrice,
      priceDecimalPlaces,
      sizeDecimalPlaces,
    };
  };

  const hasOpenOrders = async (symbol = 'ETHUSDT') => {
    let totalOrders = await binance.openOrders({ symbol });
    totalOrders = totalOrders.filter(
      ({ orderId }) => !IGNORE_ORDERS.has(orderId),
    );
    return !!totalOrders.length;
  };

  const ignoreAllOrders = async (symbol = 'ETHUSDT') => {
    const totalOrders = await binance.openOrders({ symbol });
    totalOrders.forEach(({ orderId }) => IGNORE_ORDERS.add(orderId));
  };

  const isOrderFullfilled = async (symbol = 'ETHUSDT', orderId: number) => {
    const { status } = await binance.getOrder({
      symbol,
      orderId,
    });
    return status === 'FILLED';
  };

  const cancelOrder = async (symbol = 'ETHUSDT', orderId: number) => {
    logger.log(`cancel symbol=${symbol} orderId=${orderId}`);
    await binance.cancelOrder({
      orderId,
      symbol,
    });
  };

  const sendBuyUSDT = async (
    symbol = 'ETHUSDT',
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
  ): Promise<number | null> => {
    const fastPrice = marketPrice * 1.001;
    const size = usdToCoins(usdtAmount, fastPrice);
    logger.log(`buy symbol=${symbol} price=${fastPrice} size=${size}`);
    const { orderId: buyOrderId } = await binance.order({
      type: OrderType.LIMIT,
      side: 'BUY',
      symbol,
      quantity: roundTicks(size, sizeDecimalPlaces),
      price: roundTicks(fastPrice, priceDecimalPlaces),
    });
    return buyOrderId || null;
  };

  const sendSellQTY = async (
    symbol = 'ETHUSDT',
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
  ): Promise<number | null> => {
    const winPrice = marketPrice * sellPercent;
    logger.log(`sell symbol=${symbol} price=${winPrice} size=${ethQuantity}`);
    const { orderId: sellOrderId } = await binance.order({
      type: OrderType.LIMIT,
      side: 'SELL',
      symbol,
      quantity: roundTicks(ethQuantity, sizeDecimalPlaces),
      price: roundTicks(winPrice, priceDecimalPlaces),
    });
    return sellOrderId || null;
  };

  const holdUSDT = async (sellPercent = 1.01, usdtAmount = 100) => {
    if (await hasOpenOrders('ETHUSDT')) {
      return;
    }

    const { marketPrice, priceDecimalPlaces, sizeDecimalPlaces } =
      await getTradeInfo('ETHUSDT');
    const { maker } = await getTransactionFee('ETHUSDT');
    const balanceBefore = await getBalance('ETH');

    const buyOrderId = await sendBuyUSDT('ETHUSDT', usdtAmount, {
      marketPrice,
      priceDecimalPlaces,
      sizeDecimalPlaces,
    });

    if (!buyOrderId) {
      throw new Error('holdUSDT sendBuyUSDT failed');
    }

    let isOk = false;

    for (let i = 0; i !== 10; i++) {
      if (await isOrderFullfilled('ETHUSDT', buyOrderId)) {
        isOk = true;
        break;
      }
      await sleep();
    }

    if (!isOk) {
      await cancelOrder('ETHUSDT', buyOrderId);
      throw new Error('holdUSDT sendBuyUSDT order not resolved');
    }

    const balanceAfter = await getBalance('ETH');

    let ethQuantity = balanceAfter - balanceBefore;
    ethQuantity -= ethQuantity * maker;

    const sellOrderId = await sendSellQTY('ETHUSDT', ethQuantity, sellPercent, {
      marketPrice,
      priceDecimalPlaces,
      sizeDecimalPlaces,
    });

    if (!sellOrderId) {
      throw new Error('holdUSDT sendSellQTY failed');
    }

    for (let i = 0; i !== 10; i++) {
      if (await isOrderFullfilled('ETHUSDT', sellOrderId)) {
        break;
      }
      await sleep();
    }
  };

  (globalThis as any).hasOpenOrders = hasOpenOrders;
  (globalThis as any).ignoreAllOrders = ignoreAllOrders;
  (globalThis as any).getBalance = getBalance;
  (globalThis as any).getTradeFee = getTransactionFee;
  (globalThis as any).getMarketPrice = getMarketPrice;
  (globalThis as any).holdUSDT = holdUSDT;
  (globalThis as any).roundTicks = roundTicks;
  (globalThis as any).usdToCoins = usdToCoins;
  (globalThis as any).sendSellQTY = sendSellQTY;
  (globalThis as any).sendBuyUSDT = sendBuyUSDT;
  (globalThis as any).getTradeInfo = getTradeInfo;

  return {
    holdUSDT,
    ignoreAllOrders,
  };
};
