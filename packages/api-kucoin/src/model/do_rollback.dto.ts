import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsString } from 'class-validator';

export class DoRollbackDto {
  @ApiProperty({
    description: 'Usdt amount for rollback',
  })
  @IsNumberString()
  readonly usdtAmount: string;

  @ApiProperty({
    description: 'Order symbol',
  })
  @IsString()
  readonly symbol: string;
}
