import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { DistanceTier, RecommendationStatus } from '@sdumeet/shared'

@Entity('recommendations')
@Index(['userId', 'date'])
@Index(['candidateId', 'date'])
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userId: string

  @Column()
  candidateId: string

  @Column({ type: 'date' })
  date: string

  @Column({ type: 'float' })
  score: number

  @Column({ type: 'int', default: DistanceTier.SAME_CITY })
  distanceTier: DistanceTier

  // 匹配报告：共同兴趣 + 共同价值观维度（维度索引对应 VALUE_DIMENSIONS）
  @Column({ type: 'jsonb' })
  report: { sharedInterests: string[]; sharedValueDims: string[] }

  @Column({ type: 'enum', enum: RecommendationStatus, default: RecommendationStatus.DELIVERED })
  status: RecommendationStatus

  @CreateDateColumn()
  createdAt: Date
}
