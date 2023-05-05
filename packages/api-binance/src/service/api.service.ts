import { Injectable, OnModuleInit } from '@nestjs/common';
import Binance from 'binance-api-node';
import { Observable, Subject, interval, map, switchMap } from 'rxjs';

import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';

import { createHoldUSDT } from 'src/helper/holdUSDT';

const CANDLE_REPEAT_INTERVAL = 150;

@Injectable()
export class ApiService implements OnModuleInit {
  private binance: ReturnType<typeof Binance> = null as never;

  private holdUSDT: ReturnType<typeof createHoldUSDT>['holdUSDT'];
  private averageUSDT: ReturnType<typeof createHoldUSDT>['averageUSDT'];

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  async onModuleInit() {
    this.binance = Binance({
      ...this.configService.exchangeConfig,
      ...(!this.configService.globalConfig.shouldTrade && {
        apiKey: undefined,
        apiSecret: undefined,
      }),
    });
    const { holdUSDT, averageUSDT } = createHoldUSDT(
      this.binance,
      this.loggerService,
    );
    this.holdUSDT = holdUSDT;
    this.averageUSDT = averageUSDT;
  }

  getCandleEmitter() {
    return new Observable((subscriber) => {
      const repeatEmitter = new Subject<number>();

      const disposeCandle = this.binance.ws.candles(
        'ETHUSDT',
        '1m',
        (candle) => {
          const price = parseFloat(candle.high);
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
        disposeCandle();
        disposeRepeat.unsubscribe();
      };
    });
  }

  async doTrade(usdtAmount: string) {
    this.loggerService.log(`api-service do_trade usdt_amount=${usdtAmount}`);
    await this.holdUSDT(parseInt(usdtAmount));
  }

  async doRollback(usdtAmount: string) {
    this.loggerService.log(`api-service do_rollback`);
    await this.averageUSDT(parseInt(usdtAmount));
  }
}
