import { INestApplication, ValidationPipe } from '@nestjs/common';

import { Server } from 'http';

import { ConfigService } from 'src/service/config.service';

export const listen = async (app: INestApplication, server: Server) => {
  const configService = app.get<ConfigService>(ConfigService);

  const { host, port } = configService.globalConfig;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  server.listen(port, host);
};
