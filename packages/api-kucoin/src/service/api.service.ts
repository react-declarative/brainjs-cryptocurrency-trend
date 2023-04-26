import { Injectable, OnModuleInit } from '@nestjs/common';
import * as API from 'kucoin-node-sdk';
import * as compose from 'compose-function';
import { Observable } from 'rxjs';

import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';

import { holdUSDT } from '../helper/holdUSDT';

const WS_OPEN = 1;
const WS_CLOSED = 3;

@Injectable()
export class ApiService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  onModuleInit() {
    API.init(this.configService.exchangeConfig);
  }

  getCandleEmitter() {
    return new Observable<number>((subscriber) => {
      let disposeRef: () => void = () => undefined;

      const process = async () => {
        let intervalRef: () => void = () => undefined;

        const {
          data: { instanceServers = [], token = '' },
        } = await fetch('https://api.kucoin.com/api/v1/bullet-public', {
          method: 'POST',
        }).then<any>((data) => data.json());

        const server = instanceServers.find(
          (server: any) => (server.protocol = 'websocket'),
        );
        const wsurl = new URL('endpoint', server.endpoint);
        wsurl.searchParams.set('token', token);

        const ws = new WebSocket(wsurl.toString());

        ws.addEventListener('open', () => {
          ws.send(
            JSON.stringify({
              id: Date.now(),
              type: 'subscribe',
              topic: '/market/ticker:ETH-USDT',
              privateChannel: false,
              response: false,
            }),
          );

          const interval = setInterval(() => {
            if (ws.readyState === WS_OPEN) {
              ws.send(
                JSON.stringify({
                  id: Date.now(),
                  type: 'ping',
                  response: false,
                }),
              );
            } else if (ws.readyState === WS_CLOSED) {
              intervalRef();
              subscriber.error(new Error('socket-failed'));
            }
          }, 1_000);

          intervalRef = () => clearInterval(interval);
        });

        ws.addEventListener('message', (msg) => {
          const data = JSON.parse(msg.data);
          if (
            data.type === 'message' &&
            data.topic === '/market/ticker:ETH-USDT'
          ) {
            subscriber.next(parseFloat(data.data.price));
          }
        });

        ws.addEventListener('error', (error) => {
          subscriber.error(error);
        });

        disposeRef = compose(
          () => ws.close(),
          () => intervalRef(),
        );
      };

      process().catch((e) => {
        subscriber.error(e);
      });

      return () => disposeRef();
    });
  }

  async doTrade(sellPercent: string, usdtAmount: string) {
    this.loggerService.log(
      `api-service do_trade sell_percent=${sellPercent} usdt_amount=${usdtAmount}`,
    );
    await holdUSDT(parseFloat(sellPercent), parseInt(usdtAmount));
  }
}
