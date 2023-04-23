import { INestApplication } from '@nestjs/common';

import { ApiService } from '../service/api.service';
import { ConfigService } from '../service/config.service';
import { LoggerService } from '../service/logger.service';

export const ioc = async (app: INestApplication) => {
  globalThis.ioc = {
    apiService: app.get<ApiService>(ApiService),
    configService: app.get<ConfigService>(ConfigService),
    loggerService: app.get<LoggerService>(LoggerService),
  };
};
