import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { CampusCode, DistancePreference, Gender, Orientation } from '@sdumeet/shared'
import { User } from './user.entity'

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userId: string

  @OneToOne(() => User, (u) => u.profile)
  @JoinColumn({ name: 'userId' })
  user: User

  @Column({ type: 'enum', enum: Gender })
  gender: Gender

  @Column({ type: 'enum', enum: Orientation, default: Orientation.HETEROSEXUAL })
  orientation: Orientation

  @Column({ type: 'enum', enum: CampusCode })
  campus: CampusCode

  @Column()
  department: string

  @Column({ type: 'int' })
  grade: number

  @Column({ type: 'date', nullable: true })
  birthday: string

  @Column({ nullable: true })
  mbti: string

  @Column({ nullable: true })
  avatarUrl: string

  @Column({ type: 'jsonb', default: () => "'[]'" })
  photos: string[]

  @Column({ type: 'text', nullable: true })
  bio: string

  @Column({ type: 'jsonb', default: () => "'[]'" })
  interests: string[]

  @Column({ default: false })
  smoke: boolean

  @Column({ default: true })
  acceptSmoker: boolean

  @Column({ type: 'enum', enum: DistancePreference, default: DistancePreference.SAME_CITY })
  distancePreference: DistancePreference

  @Column({ default: 18 })
  minAge: number

  @Column({ default: 30 })
  maxAge: number

  // 已配对对象（脱单后不再参与派单）
  @Column({ type: 'uuid', nullable: true })
  pairedWith: string | null

  @Column({ default: false })
  isHidden: boolean
}
