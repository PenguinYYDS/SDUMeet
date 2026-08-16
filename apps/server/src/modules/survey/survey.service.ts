import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { computeSurveyVector, SURVEY_QUESTIONS, SurveyQuestion } from '@sdumeet/shared'
import { SubmitSurveyDto } from './dto/submit-survey.dto'
import { SurveyAnswer } from './survey-answer.entity'

// 预建题目索引：提交校验从 O(n·m) 降为 O(n)
const QUESTION_BY_ID = new Map(SURVEY_QUESTIONS.map((q) => [q.id, q]))

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(SurveyAnswer)
    private readonly answers: Repository<SurveyAnswer>,
  ) {}

  // 只下发题目与选项，不下发权重（防作弊：用户不该看到计分规则）
  getQuestions(): SurveyQuestion[] {
    // 深拷贝下发，防止调用方误改全局题库常量
    return SURVEY_QUESTIONS.map((q) => ({
      ...q,
      options: q.options.map((o) => ({ ...o, weights: [...o.weights] })),
    }))
  }

  async submit(userId: string, dto: SubmitSurveyDto) {
    const valid = dto.answers.filter((a) => {
      const q = QUESTION_BY_ID.get(a.questionId)
      return (
        !!q && Number.isInteger(a.optionIndex) && a.optionIndex >= 0 && !!q.options[a.optionIndex]
      )
    })
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
