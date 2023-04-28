import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get informerConfig() {
    return {
      host: process.env.INFORMER_HOST || '127.0.0.1',
      port: +process.env.INFORMER_PORT || 1337,
    };
  }

  get globalConfig() {
    return {
      staticPath: process.env.STATIC_PATH || '',
      host: process.env.APP_HOST || '0.0.0.0',
      port: +process.env.APP_PORT || 8080,
      shouldTrade: !!+process.env.SHOULD_TRADE || false,
    };
  }

  get exchangeConfig() {
    return {
      baseUrl: process.env.API_BASE_URL || 'https://openapi-sandbox.kucoin.com',
      apiAuth: {
        key: process.env.API_KEY || '64459234ba02b40001f97b0a',
        secret:
          process.env.API_SECRET || '54f3b54a-1680-4e8b-bed5-9034c8bfed1e',
        passphrase: process.env.API_PASSPHRASE || '123456',
      },
      authVersion: 2,
    };
  }
}
