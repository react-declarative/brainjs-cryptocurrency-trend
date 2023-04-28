import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { appendFileSync } from 'fs';
import { serializeError } from 'serialize-error';

import * as express from 'express';

import { config } from 'dotenv';
import { createServer } from 'http';

import { AppModule } from './app.module';

import { candle } from './middleware/candle.middleware';
import { swagger } from './middleware/swagger.middleware';
import { informer } from './middleware/informer.middleware';

import { listen } from './utils/nest-listen.util';
import { ioc } from './utils/nest-ioc.util';

import './polyfills';

const bootstrap = async () => {
  const server = express();
  const httpServer = createServer(server);

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  candle(app, httpServer);
  informer(app);
  swagger(app);

  ioc(app);

  listen(app, httpServer);
};

process.on('uncaughtException', (error) => {
  appendFileSync('./error.log', JSON.stringify(serializeError(error), null, 2));
  process.exit(-1);
});

process.on('unhandledRejection', (error) => {
  throw error;
});

config();
bootstrap();
