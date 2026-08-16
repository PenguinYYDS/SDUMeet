import { SURVEY_QUESTIONS } from '../constants/surveyQuestions'

export interface SurveyAnswerInput {
  questionId: string
  optionIndex: number
}

// 将问卷作答聚合为归一化的价值观向量（L2 归一），维度顺序与 VALUE_DIMENSIONS 一致
export function computeSurveyVector(
  answers: SurveyAnswerInput[],
  questions = SURVEY_QUESTIONS,
): number[] {
  const dim = 5
  const sum = new Array(dim).fill(0)
  let count = 0
  for (const a of answers) {
    const q = questions.find((x) => x.id === a.questionId)
    if (!q || !q.options[a.optionIndex]) continue
    const w = q.options[a.optionIndex].weights
    for (let i = 0; i < dim; i++) sum[i] += w[i] || 0
    count++
  }
  if (count === 0) return sum
  const norm = Math.sqrt(sum.reduce((acc, x) => acc + x * x, 0)) || 1
  return sum.map((x) => x / norm)
}
