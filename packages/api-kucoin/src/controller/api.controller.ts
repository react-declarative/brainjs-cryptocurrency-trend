import { Controller, Post, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { serializeError } from 'serialize-error';

import { DoTradeDto } from 'src/model/do_trade.dto';
import { ResponseDto, createError, createOk } from 'src/model/response.dto';

import { ApiService } from 'src/service/api.service';

@ApiTags('BaseCompetition CRUD')
@Controller('/api/v1/do_trade')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @ApiOperation({
    description: 'Do trade',
  })
  @ApiBody({
    type: [DoTradeDto],
    description: 'Order params',
  })
  @ApiResponse({
    type: ResponseDto,
    description: 'Order status',
  })
  @Post()
  public async doTrade(@Body() tradeDto: DoTradeDto): Promise<ResponseDto> {
    try {
      await this.apiService.doTrade(tradeDto.sellPercent, tradeDto.usdtAmount);
      return createOk();
    } catch (error) {
      const { message } = serializeError(error);
      return createError(message);
    }
  }
}
