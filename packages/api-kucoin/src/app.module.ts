import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { ApiService } from './service/api.service';
import { ConfigService } from './service/config.service';
import { ApiController } from './controller/api.controller';
import { LoggerService } from './service/logger.service';

@Module({
  imports: [
    ServeStaticModule.forRootAsync({
      useFactory: async (configService: ConfigService) => [
        ...(configService.globalConfig.staticPath && [
          { rootPath: configService.globalConfig.staticPath },
        ]),
        { rootPath: join(process.cwd(), '..', '..', 'build') },
      ],
      extraProviders: [ConfigService],
      inject: [ConfigService],
    }),
  ],
  controllers: [ApiController],
  providers: [LoggerService, ApiService, ConfigService],
})
export class AppModule {}
