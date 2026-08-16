import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Profile } from '../users/profile.entity'
import { User } from '../users/user.entity'
import { SurveyAnswer } from '../survey/survey-answer.entity'
import { Like } from './like.entity'
import { Match } from './match.entity'
import { Recommendation } from './recommendation.entity'
import { ChatModule } from '../chat/chat.module'
import { MatchingController } from './matching.controller'
import { MatchingService } from './matching.service'

@Module({
  imports: [TypeOrmModule.forFeature([User, Profile, SurveyAnswer, Recommendation, Like, Match]), ChatModule],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
