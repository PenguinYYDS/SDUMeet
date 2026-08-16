import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { SubmitSurveyDto } from './dto/submit-survey.dto'
import { SurveyService } from './survey.service'

@Controller('survey')
@UseGuards(JwtAuthGuard)
export class SurveyController {
  constructor(private readonly survey: SurveyService) {}

  @Get('questions')
  getQuestions() {
    return this.survey.getQuestions()
  }

  @Post('answers')
  submit(@CurrentUser('sub') userId: string, @Body() dto: SubmitSurveyDto) {
    return this.survey.submit(userId, dto)
  }
}
