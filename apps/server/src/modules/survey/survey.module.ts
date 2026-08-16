import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SurveyAnswer } from './survey-answer.entity'
import { SurveyController } from './survey.controller'
import { SurveyService } from './survey.service'

@Module({
  imports: [TypeOrmModule.forFeature([SurveyAnswer])],
  controllers: [SurveyController],
  providers: [SurveyService],
  exports: [SurveyService],
})
export class SurveyModule {}
