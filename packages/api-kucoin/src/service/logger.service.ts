import { Injectable, Logger } from '@nestjs/common';
import { LoggerService as BaseLoggerService } from '@nestjs/common';

const logger = new Logger('nestjs');

@Injectable()
export class LoggerService implements BaseLoggerService {
  log(message: any, ...optionalParams: any[]) {
    logger.log(message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    logger.error(message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    logger.warn(message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    logger.debug(message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    logger.verbose(message, ...optionalParams);
  }
}
