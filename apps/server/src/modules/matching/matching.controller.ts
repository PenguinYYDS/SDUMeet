import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { DecideDto } from './dto/decide.dto'
import { MatchingService } from './matching.service'

@Controller('matching')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get('today')
  getToday(@CurrentUser('sub') userId: string) {
    return this.matching.getTodayBatch(userId)
  }

  @Post('generate')
  generate(@CurrentUser('sub') userId: string) {
    // 正式环境由定时任务在夜间调用；此处仅供开发/调试触发（幂等）
    return this.matching.generateDailyBatch(userId)
  }

  @Post(':id/decide')
  decide(
    @CurrentUser('sub') userId: string,
    @Param('id') recommendationId: string,
    @Body() dto: DecideDto,
  ) {
    return this.matching.decide(userId, recommendationId, dto.decision)
  }
}
