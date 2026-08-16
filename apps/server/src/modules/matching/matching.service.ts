import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import {
  DailyRecommendation,
  LikeDecision,
  RecommendationStatus,
  VerifyStatus,
} from '@sdumeet/shared'
import { Profile } from '../users/profile.entity'
import { User } from '../users/user.entity'
import { SurveyAnswer } from '../survey/survey-answer.entity'
import { Like } from './like.entity'
import { Match } from './match.entity'
import { Recommendation } from './recommendation.entity'
import { ChatService } from '../chat/chat.service'
import { toUserSummary } from '../../common/utils/user-summary'
import {
  Candidate,
  DEFAULT_FILTER_OPTIONS,
  DEFAULT_WEIGHTS,
  pickTopCandidates,
  SelfProfile,
} from './matcher'

// 「今日」按北京时间切日：避免 toISOString 用 UTC 导致每天 8 点才换日
const DAY_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Shanghai'

function localDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DAY_TIMEZONE }).format(now)
}

// 无序用户对的稳定键：同一对用户的并发决策共用一把咨询锁
function pairKey(a: string, b: string): string {
  return a < b ? a + '|' + b : b + '|' + a
}

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

  private ageOf(profile: Profile): number {
    if (!profile.birthday) return 0
    const birth = new Date(profile.birthday)
    const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
    return age
  }

  // 批量取每人最新一份问卷向量（DISTINCT ON），替代逐人 findOne 的 N+1 查询
  private async loadLatestSurveys(userIds: string[]): Promise<Map<string, number[]>> {
    if (userIds.length === 0) return new Map()
    const rows = await this.surveys
      .createQueryBuilder('s')
      .distinctOn(['s.userId'])
      .where('s.userId IN (:...ids)', { ids: userIds })
      .orderBy('s.userId', 'ASC')
      .addOrderBy('s.submittedAt', 'DESC')
      .getMany()
    return new Map(rows.map((r) => [r.userId, r.vector]))
  }

  // 批量统计今日曝光次数（GROUP BY），替代逐人 count 的 N+1 查询
  private async loadTodayExposure(userIds: string[], date: string): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map()
    const rows = await this.recs
      .createQueryBuilder('r')
      .select('r.candidateId', 'candidateId')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.date = :date', { date })
      .andWhere('r.candidateId IN (:...ids)', { ids: userIds })
      .groupBy('r.candidateId')
      .getRawMany<{ candidateId: string; cnt: string }>()
    return new Map(rows.map((r) => [r.candidateId, Number(r.cnt)]))
  }

  private toCandidate(
    profile: Profile,
    surveyVectors: Map<string, number[]>,
    exposure: Map<string, number>,
  ): Candidate {
    return {
      userId: profile.userId,
      gender: profile.gender,
      orientation: profile.orientation,
      campus: profile.campus,
      department: profile.department,
      age: this.ageOf(profile),
      smoke: profile.smoke,
      interests: profile.interests || [],
      valueVector: surveyVectors.get(profile.userId) || [],
      activeDays: 30, // TODO: 接入行为日志后按真实活跃度计算
      todayExposure: exposure.get(profile.userId) || 0,
    }
  }

  private toSelfProfile(profile: Profile, valueVector: number[] | undefined): SelfProfile {
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
      valueVector: valueVector || [],
    }
  }

  // 生成今日推荐（幂等：当日已生成则直接返回数量）
  async generateDailyBatch(userId: string): Promise<number> {
    const profile = await this.profiles.findOne({ where: { userId } })
    if (!profile) throw new NotFoundException('请先完善个人档案')
    if (profile.isHidden) throw new BadRequestException('当前账号已隐藏，无法参与匹配')
    if (profile.pairedWith) throw new BadRequestException('你已脱单啦，祝福你！')

    const date = localDate()
    const existing = await this.recs.count({ where: { userId, date } })
    if (existing > 0) return existing

    const others = await this.profiles
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'u')
      .where('p.userId != :userId', { userId })
      .andWhere('u.verifyStatus = :status', { status: VerifyStatus.VERIFIED })
      .andWhere('u.isActive = true')
      .andWhere('p.isHidden = false')
      .andWhere('p.pairedWith IS NULL')
      .getMany()

    // 一次批量取齐所有候选的问卷与曝光数据（2 条查询替代 2N 条）
    const [surveyVectors, exposure] = await Promise.all([
      this.loadLatestSurveys([userId, ...others.map((p) => p.userId)]),
      this.loadTodayExposure(
        others.map((p) => p.userId),
        date,
      ),
    ])
    const self = this.toSelfProfile(profile, surveyVectors.get(userId))
    const pool = others.map((p) => this.toCandidate(p, surveyVectors, exposure))
    const scored = pickTopCandidates(self, pool, DEFAULT_FILTER_OPTIONS, DEFAULT_WEIGHTS, 5)

    // 并发幂等：事务 + 用户级咨询锁，重复/并发触发只会有一份写入
    return this.recs.manager.transaction(async (em) => {
      await em.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['batch:' + userId])
      const count = await em.getRepository(Recommendation).count({ where: { userId, date } })
      if (count > 0) return count
      if (scored.length === 0) return 0
      const recRepo = em.getRepository(Recommendation)
      await recRepo.save(
        scored.map((s) =>
          recRepo.create({
            userId,
            candidateId: s.userId,
            date,
            score: s.score,
            distanceTier: s.distanceTier,
            report: { sharedInterests: s.sharedInterests, sharedValueDims: s.sharedValueDims },
            status: RecommendationStatus.DELIVERED,
          }),
        ),
      )
      return scored.length
    })
  }

  async getTodayBatch(userId: string): Promise<DailyRecommendation[]> {
    const date = localDate()
    const recs = await this.recs.find({
      where: { userId, date },
      order: { score: 'DESC' },
    })
    if (recs.length === 0) return []
    // 批量取候选用户（替代逐条 findOne 的 N+1 查询）
    const candidateUsers = await this.users.find({
      where: { id: In(recs.map((r) => r.candidateId)) },
      relations: { profile: true },
    })
    const byId = new Map(candidateUsers.map((u) => [u.id, u]))
    const result: DailyRecommendation[] = []
    for (const rec of recs) {
      const candidateUser = byId.get(rec.candidateId)
      if (!candidateUser) continue
      result.push({
        id: rec.id,
        score: rec.score,
        distanceTier: rec.distanceTier,
        report: rec.report,
        candidate: toUserSummary(candidateUser),
      })
    }
    return result
  }

  // 心动/跳过。双向心动 → 生成配对 + 聊天会话（由 Chat 模块创建）
  async decide(userId: string, recommendationId: string, decision: LikeDecision) {
    return this.recs.manager.transaction(async (em) => {
      const recRepo = em.getRepository(Recommendation)
      const initial = await recRepo.findOne({ where: { id: recommendationId, userId } })
      if (!initial) throw new NotFoundException('推荐不存在')

      // 同一对用户的决策互斥执行：防止并发双击/双向并发导致重复心动、重复配对
      await em.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        pairKey(userId, initial.candidateId),
      ])

      // 拿到锁后重新读取，避免基于过期状态判断
      const rec = await recRepo.findOne({ where: { id: recommendationId } })
      if (!rec || rec.userId !== userId) throw new NotFoundException('推荐不存在')
      if (rec.status !== RecommendationStatus.DELIVERED) {
        throw new ConflictException('该推荐已处理过')
      }

      if (decision === LikeDecision.PASS) {
        rec.status = RecommendationStatus.PASSED
        await recRepo.save(rec)
        return { matched: false }
      }

      rec.status = RecommendationStatus.LIKED
      await recRepo.save(rec)
      await em
        .createQueryBuilder()
        .insert()
        .into(Like)
        .values({ userId, targetUserId: rec.candidateId, date: localDate() })
        .orIgnore()
        .execute()

      const mutual = await em.getRepository(Like).findOne({
        where: { userId: rec.candidateId, targetUserId: userId },
      })
      if (!mutual) return { matched: false }

      // 双向心动 → 配对（重复调用幂等：已存在配对则只补状态）
      const matchRepo = em.getRepository(Match)
      const existingMatch = await matchRepo.findOne({
        where: [
          { userAId: userId, userBId: rec.candidateId },
          { userAId: rec.candidateId, userBId: userId },
        ],
      })
      if (!existingMatch) {
        await matchRepo.save(
          matchRepo.create({ userAId: userId, userBId: rec.candidateId, score: rec.score }),
        )
        // 配对成功即创建 1v1 聊天会话
        await this.chat.ensureConversation(userId, rec.candidateId, em)
      }

      rec.status = RecommendationStatus.MATCHED
      await recRepo.save(rec)
      await recRepo.update(
        { userId: rec.candidateId, candidateId: userId, status: RecommendationStatus.LIKED },
        { status: RecommendationStatus.MATCHED },
      )
      await em.getRepository(Profile).update({ userId }, { pairedWith: rec.candidateId })
      await em.getRepository(Profile).update({ userId: rec.candidateId }, { pairedWith: userId })
      return { matched: true }
    })
  }
}
