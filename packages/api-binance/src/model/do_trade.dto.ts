import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsString } from 'class-validator';

export class DoTradeDto {
  @ApiProperty({
    description: 'Upper percent for sell limit order',
  })
  @IsNumberString()
  readonly sellPercent: string;

  @ApiProperty({
    description: 'Usdt amount for buy limit order',
  })
  @IsNumberString()
  readonly usdtAmount: string;

  @ApiProperty({
    description: 'Order symbol',
  })
  @IsString()
  readonly symbol: string;
}
