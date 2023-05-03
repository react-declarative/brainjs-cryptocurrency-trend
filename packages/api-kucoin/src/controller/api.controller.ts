import { Controller, Post, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { serializeError } from 'serialize-error';

import { DoTradeDto } from 'src/model/do_trade.dto';
import { ResponseDto, createError, createOk } from 'src/model/response.dto';

import { ApiService } from 'src/service/api.service';
import { ConfigService } from 'src/service/config.service';
import { LoggerService } from 'src/service/logger.service';

@ApiTags('BaseCompetition CRUD')
@Controller('/api/v1')
export class ApiController {
  constructor(
    private readonly apiService: ApiService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  @ApiOperation({
    description: 'Do trade',
  })
  @ApiBody({
    type: [DoTradeDto],
    description: 'Order params',
  })
  @ApiResponse({
    type: ResponseDto,
    description: 'Request status',
  })
  @Post('do_trade')
  public async doTrade(@Body() tradeDto: DoTradeDto): Promise<ResponseDto> {
    try {
      if (this.configService.globalConfig.shouldTrade) {
        await this.apiService.doTrade(tradeDto.usdtAmount);
      }
      return createOk();
    } catch (error) {
      const { message } = serializeError(error);
      this.loggerService.log(message);
      return createError(message);
    }
  }

  @ApiOperation({
    description: 'Do rollback',
  })
  @ApiResponse({
    type: ResponseDto,
    description: 'Request status',
  })
  @Post('do_rollback')
  public async doRollback(): Promise<ResponseDto> {
    return createOk();
  }
}
