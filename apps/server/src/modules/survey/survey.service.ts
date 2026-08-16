import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { computeSurveyVector, SURVEY_QUESTIONS, SurveyQuestion } from '@sdumeet/shared'
import { SubmitSurveyDto } from './dto/submit-survey.dto'
import { SurveyAnswer } from './survey-answer.entity'

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(SurveyAnswer)
    private readonly answers: Repository<SurveyAnswer>,
  ) {}

  // 只下发题目与选项，不下发权重（防作弊：用户不该看到计分规则）
  getQuestions(): SurveyQuestion[] {
    return SURVEY_QUESTIONS
  }

  async submit(userId: string, dto: SubmitSurveyDto) {
    const valid = dto.answers.filter((a) =>
      SURVEY_QUESTIONS.some((q) => q.id === a.questionId && !!q.options[a.optionIndex]),
    )
    if (valid.length === 0) throw new NotFoundException('没有有效的作答')
    const vector = computeSurveyVector(valid)
    const entity = this.answers.create({ userId, version: dto.version, answers: valid, vector })
    await this.answers.save(entity)
    return { ok: true, answered: valid.length }
  }

  async getLatestVector(userId: string): Promise<number[] | null> {
    const latest = await this.answers.findOne({
      where: { userId },
      order: { submittedAt: 'DESC' },
    })
    return latest ? latest.vector : null
  }
}
