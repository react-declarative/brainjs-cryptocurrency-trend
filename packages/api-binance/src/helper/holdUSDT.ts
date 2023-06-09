import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { Binance, OrderType, SymbolFilterType } from 'binance-api-node';

interface IOrder {
  orderId: number;
  stamp: number;
}

const FAST_TRADE_COEF = 1.001;
const SELL_PERCENT = 0.08; // 0.8% (our) + 0.1% (maker) + 0.1% (taker)
const ORDER_AWAIT_HOURS = 16;
const BUY_ITER_DELAY = 10;
const SELL_ITER_DELAY = 25;

export const createHoldUSDT = (binance: Binance, logger: LoggerService) => {
  let PENDING_ORDERS_LIST: IOrder[] = [];

  const inversePercent = (percent: number) => 1 - percent + 1;

  const getPercent = (source: number, percent: number) =>
    Math.floor((source / 100) * percent);

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
      maker: parseFloat(makerCommission.toString()),
      taker: parseFloat(takerCommission.toString()),
    };
  };

  const getMarketPrice = async (symbol = 'ETHUSDT'): Promise<number> => {
    const ticks = await binance.candles({
      symbol,
      interval: '1m',
      limit: 1,
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
    const activeOrders = PENDING_ORDERS_LIST.filter(
      ({ stamp }) => dayjs().diff(dayjs(stamp), 'hour') <= ORDER_AWAIT_HOURS,
    );
    const myOrders = new Set(activeOrders.map(({ orderId }) => orderId));
    PENDING_ORDERS_LIST = activeOrders;
    totalOrders = totalOrders.filter(({ orderId }) => myOrders.has(orderId));
    return !!totalOrders.length;
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
    const fastPrice = marketPrice * FAST_TRADE_COEF;
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

  const holdUSDT = async (usdtAmount = 100) => {
    if (await hasOpenOrders('ETHUSDT')) {
      logger.log('holdUSDT has orders');
      return;
    }

    const { marketPrice, priceDecimalPlaces, sizeDecimalPlaces } =
      await getTradeInfo('ETHUSDT');
    const { maker, taker } = await getTransactionFee('ETHUSDT');
    const balanceBefore = await getBalance('ETH');

    const sellPercent = 1.0 + maker + taker + SELL_PERCENT;

    const buyOrderId = await sendBuyUSDT('ETHUSDT', usdtAmount, {
      marketPrice,
      priceDecimalPlaces,
      sizeDecimalPlaces,
    });

    if (!buyOrderId) {
      throw new Error('holdUSDT sendBuyUSDT failed');
    }

    let isOk = false;

    for (let i = 0; i !== BUY_ITER_DELAY; i++) {
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

    PENDING_ORDERS_LIST.push({
      orderId: sellOrderId,
      stamp: Date.now(),
    });

    for (let i = 0; i !== SELL_ITER_DELAY; i++) {
      if (await isOrderFullfilled('ETHUSDT', sellOrderId)) {
        break;
      }
      await sleep();
    }

    logger.log(
      `holdUSDT pair buyOrderId=${buyOrderId} sellOrderId=${sellOrderId} sellPercent=${sellPercent} usdtAmount=${usdtAmount}`,
    );

    await sleep();
  };

  const averageUSDT = async (usdtAmount = 100) => {
    const { marketPrice, priceDecimalPlaces, sizeDecimalPlaces } =
      await getTradeInfo('ETHUSDT');
    const { maker, taker } = await getTransactionFee('ETHUSDT');

    const buyFee = inversePercent(FAST_TRADE_COEF) - taker;

    const criteriaThreshold = getPercent(usdtAmount, 30);

    const allOrders = await binance.openOrders({ symbol: 'ETHUSDT' });
    const pendingSellOrders = allOrders
      .filter(({ side }) => side === 'SELL')
      .filter(({ status }) => status === 'NEW')
      .filter(
        ({ price, origQty }) =>
          Math.abs(usdtAmount - parseFloat(price) * parseFloat(origQty)) <
          criteriaThreshold,
      )
      .filter(({ origQuoteOrderQty }) => parseFloat(origQuoteOrderQty) === 0);

    let pendingSellQty = pendingSellOrders.reduce(
      (acm, { origQty }) => acm + parseFloat(origQty),
      0,
    );

    pendingSellQty += await getBalance('ETH');
    pendingSellQty -= pendingSellQty * maker;

    if (pendingSellOrders.length === 0) {
      logger.log(
        `averageUSDT averading not available (no orders under the criteria)`,
      );
      return;
    }

    const estimateOriginQty = pendingSellQty * buyFee;

    if (
      usdtAmount * pendingSellOrders.length >
      estimateOriginQty * marketPrice
    ) {
      logger.log(
        `averageUSDT averading not available pendingSellQty=${pendingSellQty} estimateOriginQty=${estimateOriginQty} marketPrice=${marketPrice} pendingSellOrders=${pendingSellOrders.length}`,
      );
      return;
    }

    for (const { orderId } of pendingSellOrders) {
      await cancelOrder('ETHUSDT', orderId);
    }

    const sellOrderId = await sendSellQTY('ETHUSDT', pendingSellQty, 1.0, {
      marketPrice,
      priceDecimalPlaces,
      sizeDecimalPlaces,
    });

    if (!sellOrderId) {
      throw new Error('averageUSDT sendSellQTY failed');
    }

    for (let i = 0; i !== SELL_ITER_DELAY; i++) {
      if (await isOrderFullfilled('ETHUSDT', sellOrderId)) {
        break;
      }
      await sleep();
    }

    logger.log(
      `averageUSDT pair sellOrderId=${sellOrderId} pendingSellQty=${pendingSellQty} marketPrice=${marketPrice} pendingSellOrders=${pendingSellOrders.length} usdtAmount=${usdtAmount}`,
    );

    await sleep();
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

  return {
    holdUSDT,
    averageUSDT,
  };
};
