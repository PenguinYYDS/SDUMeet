import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { UserRole, VerifyStatus } from '@sdumeet/shared'
import { Profile } from './profile.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  studentId: string

  @Column({ nullable: true })
  email: string

  @Column()
  nickname: string

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole

  @Column({ type: 'enum', enum: VerifyStatus, default: VerifyStatus.PENDING })
  verifyStatus: VerifyStatus

  @Column({ default: true })
  isActive: boolean

  @OneToOne(() => Profile, (p) => p.user)
  profile: Profile

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
