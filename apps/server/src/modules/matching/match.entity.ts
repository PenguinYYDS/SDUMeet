import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('matches')
@Index(['userAId', 'userBId'])
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userAId: string

  @Column()
  userBId: string

  @Column({ type: 'float', nullable: true })
  score: number

  @CreateDateColumn()
  matchedAt: Date
}
