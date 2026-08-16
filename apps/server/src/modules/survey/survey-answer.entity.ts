import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('survey_answers')
@Index(['userId', 'submittedAt'])
export class SurveyAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userId: string

  @Column({ type: 'int', default: 1 })
  version: number

  @Column({ type: 'jsonb' })
  answers: { questionId: string; optionIndex: number }[]

  // 归一化后的价值观向量（维度顺序与 VALUE_DIMENSIONS 一致）
  @Column({ type: 'jsonb' })
  vector: number[]

  @CreateDateColumn()
  submittedAt: Date
}
