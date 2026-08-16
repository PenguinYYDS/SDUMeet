import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CAMPUS_BY_CODE, CITY_NAMES, UserSummary } from '@sdumeet/shared'
import { Profile } from './profile.entity'
import { User } from './user.entity'
import { UpdateProfileDto } from './dto/update-profile.dto'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
  ) {}

  private toSummary(user: User, profile?: Profile): UserSummary {
    const p = profile || user.profile
    return {
      id: user.id,
      nickname: user.nickname,
      campus: p?.campus,
      city: p ? CITY_NAMES[CAMPUS_BY_CODE[p.campus]?.city] : '',
      department: p?.department || '',
      grade: p?.grade || 0,
      mbti: p?.mbti,
      avatarUrl: p?.avatarUrl,
      bio: p?.bio,
      interests: p?.interests || [],
      verifyStatus: user.verifyStatus,
    }
  }

  async getSummary(userId: string): Promise<UserSummary> {
    const user = await this.users.findOne({ where: { id: userId }, relations: { profile: true } })
    if (!user) throw new NotFoundException('用户不存在')
    return this.toSummary(user)
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserSummary> {
    const user = await this.users.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('用户不存在')
    if (dto.nickname) {
      user.nickname = dto.nickname
      await this.users.save(user)
    }
    let profile = await this.profiles.findOne({ where: { userId } })
    if (!profile) profile = this.profiles.create({ userId, ...dto } as Profile)
    else Object.assign(profile, dto)
    await this.profiles.save(profile)
    user.profile = profile
    return this.toSummary(user)
  }

  // 注销账户：软删除 + 匿名化。按 PIPL 要求，生产环境应在 30 天内完成物理删除（后台任务）。
  async deleteAccount(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('用户不存在')
    user.isActive = false
    user.nickname = '已注销用户'
    user.verifyStatus = 'BANNED' as never
    user.studentId = 'deleted-' + user.id
    user.email = null
    await this.users.save(user)
    await this.profiles.update({ userId }, { isHidden: true, bio: null, photos: [], avatarUrl: null, interests: [] })
    return { ok: true }
  }
}
