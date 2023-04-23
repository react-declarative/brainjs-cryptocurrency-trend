import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum Status {
  Ok = 'ok',
  Error = 'error',
}

export const createOk = (): ResponseDto => ({
  status: Status.Ok,
  message: null,
});

export const createError = (error?: string): ResponseDto => ({
  status: Status.Error,
  message: error,
});

export class ResponseDto {
  @ApiProperty({
    description: 'Request status',
  })
  @IsEnum(Status)
  readonly status: 'ok' | 'error';

  @ApiProperty({
    description: 'Request message',
  })
  @IsString()
  @IsOptional()
  readonly message?: string;
}
