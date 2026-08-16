import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('likes')
@Index(['targetUserId', 'userId'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userId: string

  @Column()
  targetUserId: string

  @Column({ type: 'date' })
  date: string

  @CreateDateColumn()
  createdAt: Date
}
