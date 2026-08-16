import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userAId: string

  @Column()
  userBId: string

  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt: Date

  @CreateDateColumn()
  createdAt: Date
}
