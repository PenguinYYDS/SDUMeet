import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('matches')
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
