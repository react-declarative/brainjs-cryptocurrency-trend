import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class DoTradeDto {
  @ApiProperty({
    description: 'Upper percent for sell limit order',
  })
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  readonly sellPercent: number;

  @ApiProperty({
    description: 'Usdt amount for buy limit order',
  })
  @IsNumber({
    maxDecimalPlaces: 0,
  })
  readonly usdtAmount: number;

  @ApiProperty({
    description: 'Order symbol',
  })
  @IsString()
  readonly symbol: string;
}
