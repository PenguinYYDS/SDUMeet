import { IsEnum } from 'class-validator'
import { LikeDecision } from '@sdumeet/shared'

export class DecideDto {
  @IsEnum(LikeDecision)
  decision: LikeDecision
}
