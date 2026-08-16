// 匹配引擎纯函数：硬过滤 + 软打分 + 公平性约束
// 详细算法说明见 docs/matching.md
import {
  CampusCode,
  DistancePreference,
  DistanceTier,
  Gender,
  Orientation,
  VALUE_DIMENSIONS,
  ValueDimension,
  getDistanceTier,
} from '@sdumeet/shared'

export interface MatcherWeights {
  values: number
  interests: number
  activity: number
}

export const DEFAULT_WEIGHTS: MatcherWeights = { values: 0.6, interests: 0.25, activity: 0.15 }

export interface SelfProfile {
  userId: string
  gender: Gender
  orientation: Orientation
  campus: CampusCode
  department: string
  distancePreference: DistancePreference
  acceptSmoker: boolean
  minAge: number
  maxAge: number
  interests: string[]
  valueVector: number[]
}

export interface Candidate {
  userId: string
  gender: Gender
  orientation: Orientation
  campus: CampusCode
  department: string
  age: number
  smoke: boolean
  interests: string[]
  valueVector: number[]
  activeDays: number
  todayExposure: number
}

export interface ScoredCandidate {
  userId: string
  score: number
  distanceTier: DistanceTier
  sharedInterests: string[]
  sharedValueDims: ValueDimension[]
}

export interface HardFilterOptions {
  maxExposurePerDay: number
  excludeSameDepartment: boolean
}

export const DEFAULT_FILTER_OPTIONS: HardFilterOptions = {
  maxExposurePerDay: 50,
  excludeSameDepartment: true,
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  const result = dot / (Math.sqrt(na) * Math.sqrt(nb))
  // 异常值（NaN/Infinity）防护：脏数据不参与打分
  return Number.isFinite(result) ? result : 0
}

export function jaccard(a: string[], b: string[]): number {
  // 去重后计算：重复标签不影响重合度；遍历较小集合减少比较次数
  const setA = new Set(a)
  const setB = new Set(b)
  if (setA.size === 0 && setB.size === 0) return 0
  const [small, large] = setA.size <= setB.size ? [setA, setB] : [setB, setA]
  let inter = 0
  for (const x of small) if (large.has(x)) inter++
  const union = setA.size + setB.size - inter
  return union === 0 ? 0 : inter / union
}

// 双方取向互洽才可能互相心动
export function orientationCompatible(
  me: Orientation,
  meGender: Gender,
  other: Orientation,
  otherGender: Gender,
): boolean {
  const meLikesOther =
    me === Orientation.BISEXUAL ||
    (me === Orientation.HETEROSEXUAL ? meGender !== otherGender : meGender === otherGender)
  const otherLikesMe =
    other === Orientation.BISEXUAL ||
    (other === Orientation.HETEROSEXUAL ? otherGender !== meGender : otherGender === meGender)
  return meLikesOther && otherLikesMe
}

export function distanceAllowed(me: DistancePreference, tier: DistanceTier): boolean {
  switch (me) {
    case DistancePreference.SAME_CAMPUS:
      return tier === DistanceTier.SAME_CAMPUS
    case DistancePreference.SAME_CITY:
      return tier <= DistanceTier.SAME_CITY
    case DistancePreference.ANY_DISTANCE:
      return true
    default:
      return false
  }
}

export function activityScore(activeDays: number): number {
  return Math.min(1, Math.max(0, activeDays / 30))
}

// 硬过滤：返回拒绝原因，通过返回 null
export function hardFilter(
  self: SelfProfile,
  candidate: Candidate,
  tier: DistanceTier,
  opts: HardFilterOptions = DEFAULT_FILTER_OPTIONS,
): string | null {
  if (candidate.userId === self.userId) return 'self'
  if (
    !orientationCompatible(self.orientation, self.gender, candidate.orientation, candidate.gender)
  ) {
    return 'orientation'
  }
  if (candidate.age < self.minAge || candidate.age > self.maxAge) return 'age'
  if (!distanceAllowed(self.distancePreference, tier)) return 'distance'
  if (!self.acceptSmoker && candidate.smoke) return 'smoke'
  if (opts.excludeSameDepartment && candidate.department === self.department) return 'department'
  if (candidate.todayExposure >= opts.maxExposurePerDay) return 'exposure'
  return null
}

export function scoreCandidate(
  self: SelfProfile,
  candidate: Candidate,
  tier: DistanceTier,
  weights: MatcherWeights = DEFAULT_WEIGHTS,
): ScoredCandidate {
  const valueScore = cosineSimilarity(self.valueVector, candidate.valueVector)
  const interestScore = jaccard(self.interests, candidate.interests)
  const activity = activityScore(candidate.activeDays)
  let score =
    weights.values * valueScore + weights.interests * interestScore + weights.activity * activity
  // 距离惩罚：同城跨校区 -0.05，跨城市 -0.15
  if (tier === DistanceTier.CROSS_CITY) score -= 0.15
  else if (tier === DistanceTier.SAME_CITY) score -= 0.05
  // Set 交集：O(n) 完成，避免 includes 的 O(n²)；去重避免报告中出现重复标签
  const selfInterests = new Set(self.interests)
  const sharedInterests = [...new Set(candidate.interests)].filter((x) => selfInterests.has(x))
  return {
    userId: candidate.userId,
    score: Math.max(0, Math.min(1, Math.round(score * 10000) / 10000)),
    distanceTier: tier,
    sharedInterests,
    sharedValueDims: topValueDims(self.valueVector, candidate.valueVector),
  }
}

function topValueDims(a: number[], b: number[], limit = 2): ValueDimension[] {
  const scores: { index: number; v: number }[] = []
  for (let i = 0; i < a.length; i++) {
    if (a[i] > 0 && b[i] > 0) scores.push({ index: i, v: a[i] * b[i] })
  }
  return scores
    .sort((x, y) => y.v - x.v)
    .slice(0, limit)
    .map((x) => VALUE_DIMENSIONS[x.index])
}

export function pickTopCandidates(
  self: SelfProfile,
  pool: Candidate[],
  opts: HardFilterOptions = DEFAULT_FILTER_OPTIONS,
  weights: MatcherWeights = DEFAULT_WEIGHTS,
  limit = 5,
): ScoredCandidate[] {
  // 有界 Top-K：只保留前 limit 名，避免对全量候选排序（O(n·k)，k = limit）
  const top: ScoredCandidate[] = []
  for (const c of pool) {
    const tier = getDistanceTier(self.campus, c.campus)
    if (hardFilter(self, c, tier, opts)) continue
    const s = scoreCandidate(self, c, tier, weights)
    const idx = top.findIndex((x) => s.score > x.score)
    if (idx === -1) {
      if (top.length < limit) top.push(s)
    } else {
      top.splice(idx, 0, s)
      if (top.length > limit) top.pop()
    }
  }
  return top
}
