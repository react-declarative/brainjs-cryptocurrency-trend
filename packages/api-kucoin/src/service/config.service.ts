import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get globalConfig() {
    return {
      symbol: 'ETH-USDT',
      host: process.env.API_HOST || '0.0.0.0',
      port: +process.env.API_PORT || 8080,
    };
  }

  get exchangeConfig() {
    return {
      baseUrl: 'https://openapi-sandbox.kucoin.cc',
      apiAuth: {
        key: '',
        secret: '',
        passphrase: '',
      },
      authVersion: 2,
    };
  }
}
