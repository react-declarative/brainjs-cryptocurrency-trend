import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';

import * as express from 'express';

import { config } from 'dotenv';
import { createServer } from 'http';

import { AppModule } from './app.module';

import { candle } from './middleware/candle.middleware';
import { swagger } from './middleware/swagger.middleware';

import { listen } from './utils/nest-listen.util';
import { ioc } from './utils/nest-ioc.util';

import './polyfills';

const bootstrap = async () => {
  const server = express();
  const httpServer = createServer(server);

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  candle(app, httpServer);
  swagger(app);

  ioc(app);

  listen(app, httpServer);
};

config();
bootstrap();
