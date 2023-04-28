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
      apiKey:
        process.env.API_KEY ||
        '83jBpt8ItE5GKJjxJQ51WafkNNUEPgBRCZFw2emWpWOwZKxHIbNkH6ue9OhHiw1r',
      apiSecret:
        process.env.API_SECRET ||
        'iYno7Ja6pywGuuNPf578raD0mNTatr7yYl4IrRweJbyAm6PS32mtacy4SwxXT1Jn',
      useServerTime: true,
    };
  }
}
