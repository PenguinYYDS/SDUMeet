import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  LikeDecision,
  RecommendationStatus,
  UserSummary,
  VerifyStatus,
} from '@sdumeet/shared'
import { Profile } from '../users/profile.entity'
import { User } from '../users/user.entity'
import { SurveyAnswer } from '../survey/survey-answer.entity'
import { Like } from './like.entity'
import { Match } from './match.entity'
import { Recommendation } from './recommendation.entity'
import { ChatService } from '../chat/chat.service'
import {
  Candidate,
  DEFAULT_FILTER_OPTIONS,
  DEFAULT_WEIGHTS,
  pickTopCandidates,
  SelfProfile,
} from './matcher'

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
    @InjectRepository(SurveyAnswer) private readonly surveys: Repository<SurveyAnswer>,
    @InjectRepository(Recommendation) private readonly recs: Repository<Recommendation>,
    @InjectRepository(Like) private readonly likes: Repository<Like>,
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    private readonly chat: ChatService,
  ) {}

  private today(): string {
    return new Date().toISOString().slice(0, 10)
  }

  private ageOf(profile: Profile): number {
    if (!profile.birthday) return 0
    const birth = new Date(profile.birthday)
    const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
    return age
  }

  private toSummary(user: User, profile?: Profile): UserSummary {
    const p = profile || user.profile
    return {
      id: user.id,
      nickname: user.nickname,
      campus: p.campus,
      city: '',
      department: p.department,
      grade: p.grade,
      mbti: p.mbti ?? undefined,
      avatarUrl: p.avatarUrl ?? undefined,
      bio: p.bio ?? undefined,
      interests: p.interests || [],
      verifyStatus: user.verifyStatus,
    }
  }

  private async toCandidate(profile: Profile): Promise<Candidate> {
    const survey = await this.surveys.findOne({
      where: { userId: profile.userId },
      order: { submittedAt: 'DESC' },
    })
    const exposure = await this.recs.count({
      where: { candidateId: profile.userId, date: this.today() },
    })
    return {
      userId: profile.userId,
      gender: profile.gender,
      orientation: profile.orientation,
      campus: profile.campus,
      department: profile.department,
      age: this.ageOf(profile),
      smoke: profile.smoke,
      interests: profile.interests || [],
      valueVector: survey?.vector || [],
      activeDays: 30, // TODO: 接入行为日志后按真实活跃度计算
      todayExposure: exposure,
    }
  }

  private async toSelfProfile(profile: Profile): Promise<SelfProfile> {
    const survey = await this.surveys.findOne({
      where: { userId: profile.userId },
      order: { submittedAt: 'DESC' },
    })
    return {
      userId: profile.userId,
      gender: profile.gender,
      orientation: profile.orientation,
      campus: profile.campus,
      department: profile.department,
      distancePreference: profile.distancePreference,
      acceptSmoker: profile.acceptSmoker,
      minAge: profile.minAge,
      maxAge: profile.maxAge,
      interests: profile.interests || [],
      valueVector: survey?.vector || [],
    }
  }

  // 生成今日推荐（幂等：当日已生成则直接返回数量）
  async generateDailyBatch(userId: string): Promise<number> {
    const profile = await this.profiles.findOne({ where: { userId } })
    if (!profile) throw new NotFoundException('请先完善个人档案')
    if (profile.isHidden) throw new BadRequestException('当前账号已隐藏，无法参与匹配')
    if (profile.pairedWith) throw new BadRequestException('你已脱单啦，祝福你！')

    const existing = await this.recs.count({ where: { userId, date: this.today() } })
    if (existing > 0) return existing

    const self = await this.toSelfProfile(profile)
    const others = await this.profiles
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'u')
      .where('p.userId != :userId', { userId })
      .andWhere('u.verifyStatus = :status', { status: VerifyStatus.VERIFIED })
      .andWhere('u.isActive = true')
      .andWhere('p.isHidden = false')
      .andWhere('p.pairedWith IS NULL')
      .getMany()

    const pool: Candidate[] = []
    for (const p of others) pool.push(await this.toCandidate(p))

    const scored = pickTopCandidates(self, pool, DEFAULT_FILTER_OPTIONS, DEFAULT_WEIGHTS, 5)
    for (const s of scored) {
      await this.recs.save(
        this.recs.create({
          userId,
          candidateId: s.userId,
          date: this.today(),
          score: s.score,
          distanceTier: s.distanceTier,
          report: { sharedInterests: s.sharedInterests, sharedValueDims: s.sharedValueDims },
          status: RecommendationStatus.DELIVERED,
        }),
      )
    }
    return scored.length
  }

  async getTodayBatch(userId: string) {
    const recs = await this.recs.find({
      where: { userId, date: this.today() },
      order: { score: 'DESC' },
    })
    const result = []
    for (const rec of recs) {
      const candidateUser = await this.users.findOne({
        where: { id: rec.candidateId },
        relations: { profile: true },
      })
      if (!candidateUser) continue
      result.push({
        id: rec.id,
        score: rec.score,
        distanceTier: rec.distanceTier,
        report: rec.report,
        candidate: this.toSummary(candidateUser),
      })
    }
    return result
  }

  // 心动/跳过。双向心动 → 生成配对 + 聊天会话（由 Chat 模块创建）
  async decide(userId: string, recommendationId: string, decision: LikeDecision) {
    const rec = await this.recs.findOne({ where: { id: recommendationId, userId } })
    if (!rec) throw new NotFoundException('推荐不存在')
    if (rec.status !== RecommendationStatus.DELIVERED) {
      throw new ConflictException('该推荐已处理过')
    }
    if (decision === LikeDecision.PASS) {
      rec.status = RecommendationStatus.PASSED
      await this.recs.save(rec)
      return { matched: false }
    }

    rec.status = RecommendationStatus.LIKED
    await this.recs.save(rec)
    await this.likes.save(
      this.likes.create({ userId, targetUserId: rec.candidateId, date: this.today() }),
    )

    const mutual = await this.likes.findOne({
      where: { userId: rec.candidateId, targetUserId: userId },
    })
    if (!mutual) return { matched: false }

    // 双向心动 → 配对
    rec.status = RecommendationStatus.MATCHED
    await this.recs.save(rec)
    await this.recs.update(
      { userId: rec.candidateId, candidateId: userId, status: RecommendationStatus.LIKED },
      { status: RecommendationStatus.MATCHED },
    )
    await this.matches.save(
      this.matches.create({ userAId: userId, userBId: rec.candidateId, score: rec.score }),
    )
    // 配对成功即创建 1v1 聊天会话
    await this.chat.ensureConversation(userId, rec.candidateId)
    await this.profiles.update({ userId }, { pairedWith: rec.candidateId })
    await this.profiles.update({ userId: rec.candidateId }, { pairedWith: userId })
    return { matched: true }
  }
}
