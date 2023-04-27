import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get globalConfig() {
    return {
      host: process.env.API_HOST || '0.0.0.0',
      port: +process.env.API_PORT || 8080,
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
