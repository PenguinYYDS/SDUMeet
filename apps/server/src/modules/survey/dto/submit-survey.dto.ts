import { ArrayNotEmpty, IsArray, IsInt, IsString, Max, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class SurveyAnswerItemDto {
  @IsString()
  questionId: string

  @IsInt()
  @Min(0)
  @Max(9)
  optionIndex: number
}

export class SubmitSurveyDto {
  @IsInt()
  @Min(1)
  version: number

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SurveyAnswerItemDto)
  answers: SurveyAnswerItemDto[]
}
