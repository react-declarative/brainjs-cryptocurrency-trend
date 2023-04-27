import * as API from 'kucoin-node-sdk';
import * as uuid from 'uuid';

export const sleep = (timeout = 1_000) =>
  new Promise<void>((res) => {
    setTimeout(() => res(), timeout);
  });

export const usdToCoins = (totalUsd: number, coinPrice: number) => {
  return totalUsd / coinPrice;
};

export const roundTicks = (value: number, digits = 2) => {
  let multiplier = 1;
  for (let i = 0; i < digits; i++) {
    multiplier *= 10;
  }
  value = Math.floor(value * multiplier) / multiplier;
  return value.toFixed(digits);
};

export const getTradeFee = async (
  symbol = 'ETH-USDT',
): Promise<{
  maker: number;
  taker: number;
}> => {
  const { data = [] } = await API.rest.User.TradeFee.getActualFeeRateBySymbols([
    symbol,
  ]);
  const [{ makerFeeRate = '0.004', takerFeeRate = '0.004' }] = data;
  return {
    maker: parseFloat(makerFeeRate),
    taker: parseFloat(takerFeeRate),
  };
};

export const hasOpenOrders = async (symbol = 'ETH-USDT') => {
  const {
    data: { items = [] },
  } = await API.rest.Trade.Orders.getOrdersList();
  const { length = 0 } = items.filter((item) => {
    let isOk = true;
    isOk = isOk && item.symbol === symbol;
    isOk = isOk && item.isActive;
    return isOk;
  });
  return !!length;
};

export const isOrderFullfilled = async (orderId: string) => {
  const { data: { isActive = true } = {} } =
    await API.rest.Trade.Orders.getOrderByID(orderId);
  return !isActive;
};

export const cancelOrder = async (orderId: string) => {
  await API.rest.Trade.Orders.cancelOrder(orderId);
};

export const getMarketPrice = async (symbol = 'ETH-USDT') => {
  const { price = '40000' } = await API.rest.Market.Symbols.getTicker(symbol);
  const numericPrice = parseFloat(price);
  return numericPrice;
};

export const getRoundTickslInfo = async (
  symbol = 'ETH-USDT',
): Promise<{
  priceDecimalPlaces: number;
  sizeDecimalPlaces: number;
}> => {
  const { data = [] } = await API.rest.Market.Symbols.getSymbolsList();
  const item = data.find((item) => item.symbol === symbol);
  const { priceIncrement = '0.00001', baseIncrement = '0.0001' } = item;
  const { length: priceDecimalPlaces = 5 } = priceIncrement.slice(
    priceIncrement.indexOf('.') + 1,
  );
  const { length: sizeDecimalPlaces = 4 } = baseIncrement.slice(
    baseIncrement.indexOf('.') + 1,
  );
  return {
    priceDecimalPlaces,
    sizeDecimalPlaces,
  };
};

export const getBalance = async (currency = 'USDT') => {
  const {
    data: { available = '50000' },
  } = await API.rest.User.Account.getTransferable('MAIN', currency);
  return parseFloat(available);
};

export const sendBuyUSDT = async (
  usdtAmount: number,
  {
    marketPrice,
    priceDecimalPlaces,
    sizeDecimalPlaces,
  }: {
    marketPrice: number;
    priceDecimalPlaces: number;
    sizeDecimalPlaces: number;
  },
): Promise<string | null> => {
  const fastPrice = marketPrice * 1.001;
  const size = usdToCoins(usdtAmount, fastPrice);
  const { data: { orderId: buyOrderId = '' } = {} } =
    await API.rest.Trade.Orders.postOrder(
      {
        clientOid: uuid.v4(),
        side: 'buy',
        symbol: 'ETH-USDT',
        type: 'limit',
      },
      {
        price: roundTicks(fastPrice, priceDecimalPlaces),
        size: roundTicks(size, sizeDecimalPlaces),
      },
    );
  return buyOrderId || null;
};

export const sendSellQTY = async (
  ethQuantity: number,
  sellPercent: number,
  {
    marketPrice,
    priceDecimalPlaces,
    sizeDecimalPlaces,
  }: {
    marketPrice: number;
    priceDecimalPlaces: number;
    sizeDecimalPlaces: number;
  },
): Promise<string | null> => {
  const winPrice = marketPrice * sellPercent;
  const { data: { orderId: sellOrderId = '' } = {} } =
    await API.rest.Trade.Orders.postOrder(
      {
        clientOid: uuid.v4(),
        side: 'sell',
        symbol: 'ETH-USDT',
        type: 'limit',
      },
      {
        price: roundTicks(winPrice, priceDecimalPlaces),
        size: roundTicks(ethQuantity, sizeDecimalPlaces),
      },
    );
  return sellOrderId || null;
};

export const getTradeInfo = async (symbol = 'ETH-USDT') => {
  const marketPrice = await getMarketPrice(symbol);
  const { priceDecimalPlaces, sizeDecimalPlaces } = await getRoundTickslInfo(
    symbol,
  );
  return {
    marketPrice,
    priceDecimalPlaces,
    sizeDecimalPlaces,
  };
};

export const holdUSDT = async (sellPercent = 1.01, usdtAmount = 100) => {
  if (await hasOpenOrders('ETH-USDT')) {
    return;
  }

  const { marketPrice, priceDecimalPlaces, sizeDecimalPlaces } =
    await getTradeInfo();
  const { maker } = await getTradeFee('ETH-USDT');
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
(globalThis as any).getTradeFee = getTradeFee;
(globalThis as any).getMarketPrice = getMarketPrice;
(globalThis as any).holdUSDT = holdUSDT;
(globalThis as any).roundTicks = roundTicks;
(globalThis as any).usdToCoins = usdToCoins;
(globalThis as any).sendSellQTY = sendSellQTY;
(globalThis as any).sendBuyUSDT = sendBuyUSDT;
(globalThis as any).getTradeInfo = getTradeInfo;
