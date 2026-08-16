import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('likes')
// 双向查询（我的心动 / 谁心动了我）都命中该组合索引
@Index(['userId', 'targetUserId'])
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
