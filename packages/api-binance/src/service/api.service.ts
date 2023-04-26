import { Injectable, OnModuleInit } from '@nestjs/common';
import * as BINANCE from 'node-binance-api';
import { Observable, Subject, interval, map, switchMap } from 'rxjs';

import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';

import { createHoldUSDT } from 'src/helper/holdUSDT';

const CANDLE_REPEAT_INTERVAL = 150;

const Binance = BINANCE as any;

@Injectable()
export class ApiService implements OnModuleInit {
  private binance: typeof Binance = null as never;
  private holdUSDT: ReturnType<typeof createHoldUSDT>;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  async onModuleInit() {
    this.binance = new Binance().options({
      ...this.configService.exchangeConfig,
      ...(!this.configService.globalConfig.shouldTrade && {
        APIKEY: undefined,
        APISECRET: undefined,
      }),
    });
    await this.binance.useServerTime();
    this.holdUSDT = createHoldUSDT(this.binance);
  }

  getCandleEmitter() {
    return new Observable((subscriber) => {
      const repeatEmitter = new Subject<number>();

      const disposeCandle = this.binance.websockets.candlesticks(
        'ETHUSDT',
        '1m',
        (trade) => {
          const { k: ticks } = trade;
          const candle = {
            eventType: trade.e,
            eventTime: trade.E,
            symbol: trade.s,
            ticks: {
              open: ticks.o,
              high: ticks.h,
              low: ticks.l,
              close: ticks.c,
              volume: ticks.v,
              trades: ticks.n,
              interval: ticks.i,
              isFinal: ticks.x,
              quoteVolume: ticks.q,
              buyVolume: ticks.V,
              sellVolume: ticks.v - ticks.V,
              quoteBuyVolume: ticks.Q,
            },
          };
          const price = candle.ticks.high;
          repeatEmitter.next(price);
          subscriber.next(price);
        },
      );

      const disposeRepeat = repeatEmitter
        .pipe(
          switchMap((val) =>
            interval(CANDLE_REPEAT_INTERVAL).pipe(map(() => val)),
          ),
        )
        .subscribe((val) => subscriber.next(val));

      return () => {
        this.binance.websockets.terminate(disposeCandle);
        disposeRepeat.unsubscribe();
      };
    });
  }

  async doTrade(sellPercent: string, usdtAmount: string) {
    this.loggerService.log(
      `api-service do_trade sell_percent=${sellPercent} usdt_amount=${usdtAmount}`,
    );
    await this.holdUSDT(parseFloat(sellPercent), parseInt(usdtAmount));
  }
}
