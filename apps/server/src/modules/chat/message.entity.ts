import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { MessageType } from '@sdumeet/shared'

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  conversationId: string

  @Column()
  senderId: string

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType

  @Column({ type: 'text' })
  content: string

  @CreateDateColumn()
  createdAt: Date
}
