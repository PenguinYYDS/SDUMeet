import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // 会话列表按任一成员查询，两侧分别建索引
  @Index()
  @Column()
  userAId: string

  @Index()
  @Column()
  userBId: string

  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt: Date

  @CreateDateColumn()
  createdAt: Date
}
