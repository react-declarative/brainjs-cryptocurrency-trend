import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Kucoin api wrapper')
  .setDescription('The tradebot docs')
  .setVersion('1.0')
  .build();

export const swagger = (nest: INestApplication) => {
  const document = SwaggerModule.createDocument(nest, config);
  SwaggerModule.setup('swagger', nest, document);
};
