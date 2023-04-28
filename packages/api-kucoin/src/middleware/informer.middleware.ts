import { INestApplication } from '@nestjs/common';

import { createProxyMiddleware } from 'http-proxy-middleware';

import { ConfigService } from 'src/service/config.service';

export const informer = (nest: INestApplication) => {
  const configService = nest.get<ConfigService>(ConfigService);

  const informerUrl = new URL(
    '/api/v1/do_inform',
    `http://${configService.informerConfig.host}:${configService.informerConfig.port}`,
  );

  nest.use(
    '/api/v1/do_inform',
    createProxyMiddleware({
      target: informerUrl.toString(),
      changeOrigin: true,
    }),
  );
};
