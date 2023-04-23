import { Module, ValidationPipe } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_PIPE } from '@nestjs/core';
import { join } from "path";

import { ApiService } from './service/api.service';
import { ConfigService } from './service/config.service';
import { ApiController } from './controller/api.controller';
import { LoggerService } from './service/logger.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), '..', '..', 'build'),
    }),
  ],
  controllers: [ApiController],
  providers: [
    LoggerService,
    ApiService,
    ConfigService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
})
export class AppModule {}
