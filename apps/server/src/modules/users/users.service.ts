import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserSummary, VerifyStatus } from '@sdumeet/shared'
import { Profile } from './profile.entity'
import { User } from './user.entity'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { Like } from '../matching/like.entity'
import { Match } from '../matching/match.entity'
import { toUserSummary } from '../../common/utils/user-summary'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
  ) {}

  async getSummary(userId: string): Promise<UserSummary> {
    const user = await this.users.findOne({ where: { id: userId }, relations: { profile: true } })
    if (!user) throw new NotFoundException('用户不存在')
    return toUserSummary(user)
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserSummary> {
    return this.users.manager.transaction(async (em) => {
      const userRepo = em.getRepository(User)
      const profileRepo = em.getRepository(Profile)
      const user = await userRepo.findOne({ where: { id: userId } })
      if (!user) throw new NotFoundException('用户不存在')
      if (dto.nickname !== undefined) {
        user.nickname = dto.nickname
        await userRepo.save(user)
      }
      let profile = await profileRepo.findOne({ where: { userId } })
      if (!profile) profile = profileRepo.create({ userId })
      // 只写入客户端实际提交的字段，避免 undefined 覆盖已有值；
      // 修正历史实现把 nickname 等非档案字段混入 Profile 的问题
      for (const [key, value] of Object.entries(dto)) {
        if (key === 'nickname' || value === undefined) continue
        ;(profile as unknown as Record<string, unknown>)[key] = value
      }
      await profileRepo.save(profile)
      user.profile = profile
      return toUserSummary(user)
    })
  }

  // 注销账户：软删除 + 匿名化 + 解除配对并清理心动/配对数据。
  // 按 PIPL 要求，生产环境应在 30 天内完成物理删除（后台任务）。
  async deleteAccount(userId: string) {
    return this.users.manager.transaction(async (em) => {
      const user = await em.getRepository(User).findOne({ where: { id: userId } })
      if (!user) throw new NotFoundException('用户不存在')
      user.isActive = false
      user.nickname = '已注销用户'
      user.verifyStatus = VerifyStatus.BANNED
      user.studentId = 'deleted-' + user.id
      user.email = null
      await em.getRepository(User).save(user)

      const profile = await em.getRepository(Profile).findOne({ where: { userId } })
      if (profile?.pairedWith) {
        // 解除对方的配对状态，让其恢复参与派单
        await em.getRepository(Profile).update({ userId: profile.pairedWith }, { pairedWith: null })
      }
      await em
        .getRepository(Profile)
        .update(
          { userId },
          { isHidden: true, bio: null, photos: [], avatarUrl: null, interests: [] },
        )
      // 清理心动与配对记录，防止注销用户继续出现在匹配数据流中
      await em.getRepository(Like).delete({ userId })
      await em.getRepository(Like).delete({ targetUserId: userId })
      await em.getRepository(Match).delete({ userAId: userId })
      await em.getRepository(Match).delete({ userBId: userId })
      return { ok: true }
    })
  }
}
