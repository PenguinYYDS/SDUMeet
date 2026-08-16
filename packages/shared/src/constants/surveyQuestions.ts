// 价值观问卷题库（v1 精简版，10 题）
// 完整 18 题草稿见 docs/survey.md。每个选项的 weights 与 VALUE_DIMENSIONS 一一对应。

export const VALUE_DIMENSIONS = [
  'CONSUMPTION', // 消费观
  'MARRIAGE',    // 婚恋观
  'FAMILY',      // 家庭观
  'CAREER',      // 职业规划
  'STYLE',       // 相处模式
] as const

export type ValueDimension = (typeof VALUE_DIMENSIONS)[number]

export const VALUE_DIMENSION_LABELS: Record<ValueDimension, string> = {
  CONSUMPTION: '消费观',
  MARRIAGE: '婚恋观',
  FAMILY: '家庭观',
  CAREER: '职业规划',
  STYLE: '相处模式',
}

export interface SurveyOption {
  label: string
  weights: number[]
}

export interface SurveyQuestion {
  id: string
  dimension: ValueDimension
  text: string
  options: SurveyOption[]
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'v1',
    dimension: 'CONSUMPTION',
    text: '月底生活费紧张时，你倾向于？',
    options: [
      { label: '提前规划，记账控制开支', weights: [1, 0, 0, 0, 0] },
      { label: '先找家里或朋友周转', weights: [-1, 0, 0, 0, 0] },
      { label: '顺其自然，不够再说', weights: [0, 0, 0, 0, 0] },
    ],
  },
  {
    id: 'v2',
    dimension: 'CONSUMPTION',
    text: '约会开销你更认同哪种方式？',
    options: [
      { label: 'AA 或轮流出', weights: [1, 0, 0, 0, 0] },
      { label: '谁主动谁多承担', weights: [0, 0, 0, 0, -1] },
      { label: '无所谓，开心就好', weights: [0, 0, 0, 0, 1] },
    ],
  },
  {
    id: 'v3',
    dimension: 'MARRIAGE',
    text: '你对异地恋（济南/青岛/威海校区之间）的态度？',
    options: [
      { label: '只要人合适，异地也能坚持', weights: [0, 1, 0, 0, 0] },
      { label: '不接受异地，想常见面', weights: [0, -1, 0, 0, 0] },
      { label: '先接触看看，视感情而定', weights: [0, 0, 0, 0, 0] },
    ],
  },
  {
    id: 'v4',
    dimension: 'MARRIAGE',
    text: '你理想的恋爱节奏是？',
    options: [
      { label: '慢慢了解，细水长流', weights: [0, 1, 0, 0, 0] },
      { label: '感觉对了就尽快确定关系', weights: [0, 0, 0, 0, -1] },
      { label: '跟着感觉走，不定节奏', weights: [0, 0, 0, 0, 1] },
    ],
  },
  {
    id: 'v5',
    dimension: 'FAMILY',
    text: '毕业后你倾向在哪里发展？',
    options: [
      { label: '留在家乡山东', weights: [0, 0, 1, 0, 0] },
      { label: '去一线城市闯一闯', weights: [0, 0, -1, 1, 0] },
      { label: '跟另一半商量着来', weights: [0, 0, 0, 0, 1] },
    ],
  },
  {
    id: 'v6',
    dimension: 'FAMILY',
    text: '你对双方家庭的参与程度怎么看？',
    options: [
      { label: '希望双方家庭常走动', weights: [0, 0, 1, 0, 0] },
      { label: '小家庭独立，少被干涉', weights: [0, 0, -1, 0, 0] },
      { label: '看情况平衡', weights: [0, 0, 0, 0, 0] },
    ],
  },
  {
    id: 'v7',
    dimension: 'CAREER',
    text: '学业/事业遇到压力时，你希望伴侣？',
    options: [
      { label: '能一起商量，给建议', weights: [0, 0, 0, 1, 0] },
      { label: '安静陪着就好', weights: [0, 0, 0, 0, 1] },
      { label: '各自处理，互不添乱', weights: [0, 0, 0, -1, -1] },
    ],
  },
  {
    id: 'v8',
    dimension: 'CAREER',
    text: '你目前的生活重心是？',
    options: [
      { label: '学业/科研为主', weights: [0, 0, 0, 1, 0] },
      { label: '想认真谈一场恋爱', weights: [0, 1, 0, -1, 0] },
      { label: '平衡就好', weights: [0, 0, 0, 0, 1] },
    ],
  },
  {
    id: 'v9',
    dimension: 'STYLE',
    text: '发生分歧时你更倾向？',
    options: [
      { label: '当天说开，不隔夜', weights: [0, 0, 0, 0, 1] },
      { label: '先冷静，过后再谈', weights: [0, 0, 0, 0, 0] },
      { label: '不太会表达，希望对方主动', weights: [0, 0, 0, 0, -1] },
    ],
  },
  {
    id: 'v10',
    dimension: 'STYLE',
    text: '你理想的相处状态更像？',
    options: [
      { label: '各忙各的，但心里有对方', weights: [0, 0, 0, 1, 0] },
      { label: '形影不离，分享日常', weights: [0, 0, 0, -1, 1] },
      { label: '介于两者之间', weights: [0, 0, 0, 0, 0] },
    ],
  },
]
