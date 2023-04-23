import { INestApplication, Logger } from '@nestjs/common';
import { Server } from 'http';

import { createServer } from 'sockjs';
import { serializeError } from 'serialize-error';

import { ApiService } from 'src/service/api.service';
import { Subscription } from 'rxjs';

const logger = new Logger('candle-middleware');

export const candle = (app: INestApplication, server: Server) => {
  const realtimeService = app.get<ApiService>(ApiService);

  const io = createServer();

  io.installHandlers(server, {
    prefix: '/api/v1/candle',
  });

  io.on('connection', (client) => {
    logger.log(`candle-middleware client connection client_id=${client.id}`);
    client.once('data', async (token) => {
      let subscription: Subscription | undefined;
      try {
        logger.log(
          `candle-middleware client auth client_id=${client.id} client_token=${token}`,
        );
        subscription = realtimeService.getCandleEmitter().subscribe(
          (price) => {
            client.write(price.toString(), (err) => {
              if (err) {
                const { name, message } = serializeError(err);
                logger.log(
                  `candle-middleware client error client_id=${client.id} client_token=${token}`,
                );
                subscription && subscription.unsubscribe();
                client.close(
                  '500',
                  JSON.stringify({
                    error: {
                      name,
                      message,
                    },
                  }),
                );
              }
            });
          },
          (error) => {
            const { name, message } = serializeError(error);
            logger.log(
              `candle-middleware api exception client_id=${client.id} name=${name} message=${message}`,
            );
            subscription && subscription.unsubscribe();
            client.close(
              '500',
              JSON.stringify({
                error: {
                  name,
                  message,
                },
              }),
            );
          },
        );
        client.once('close', () => {
          logger.log(`candle-middleware client close client_id=${client.id}`);
          subscription && subscription.unsubscribe();
        });
      } catch (err) {
        const { name, message } = serializeError(err);
        logger.log(
          `candle-middleware client exception client_id=${client.id} name=${name} message=${message}`,
        );
        client.close(
          '500',
          JSON.stringify({
            error: {
              name,
              message,
            },
          }),
        );
      }
    });
  });
};
