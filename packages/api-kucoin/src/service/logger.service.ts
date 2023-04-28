import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { LoggerService as BaseLoggerService } from '@nestjs/common';
import { Subject, Subscription, concatMap } from 'rxjs';
import { appendFile } from 'fs/promises';

const logger = new Logger('nestjs');

@Injectable()
export class LoggerService
  implements BaseLoggerService, OnModuleInit, OnModuleDestroy
{
  private dataSubject = new Subject<object>();
  private dataWriter: Subscription;

  onModuleInit() {
    this.dataWriter = this.dataSubject
      .pipe(
        concatMap(async (data) => {
          await appendFile('./log.log', JSON.stringify(data, null, 2));
        }),
      )
      .subscribe(() => logger.log('log written'));
  }

  onModuleDestroy() {
    if (this.dataWriter) {
      this.dataWriter.unsubscribe();
    }
  }

  log(message: any, ...params: any[]) {
    this.dataSubject.next({ message, params });
    logger.log(message, ...params);
  }

  error(message: any, ...params: any[]) {
    this.dataSubject.next({ message, params });
    logger.error(message, ...params);
  }

  warn(message: any, ...params: any[]) {
    this.dataSubject.next({ message, params });
    logger.warn(message, ...params);
  }

  debug(message: any, ...params: any[]) {
    this.dataSubject.next({ message, params });
    logger.debug(message, ...params);
  }

  verbose(message: any, ...params: any[]) {
    this.dataSubject.next({ message, params });
    logger.verbose(message, ...params);
  }
}
