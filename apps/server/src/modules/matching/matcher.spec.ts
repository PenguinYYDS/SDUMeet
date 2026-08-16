import {
  CampusCode,
  DistancePreference,
  DistanceTier,
  Gender,
  Orientation,
} from '@sdumeet/shared'
import {
  Candidate,
  cosineSimilarity,
  DEFAULT_FILTER_OPTIONS,
  DEFAULT_WEIGHTS,
  hardFilter,
  jaccard,
  orientationCompatible,
  pickTopCandidates,
  SelfProfile,
} from './matcher'

function makeSelf(overrides: Partial<SelfProfile> = {}): SelfProfile {
  return {
    userId: 'self',
    gender: Gender.MALE,
    orientation: Orientation.HETEROSEXUAL,
    campus: CampusCode.SOFTWARE_PARK,
    department: '软件学院',
    distancePreference: DistancePreference.SAME_CITY,
    acceptSmoker: false,
    minAge: 20,
    maxAge: 28,
    interests: ['篮球', '摄影'],
    valueVector: [1, 0, 0, 0, 0],
    ...overrides,
  }
}

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    userId: 'c1',
    gender: Gender.FEMALE,
    orientation: Orientation.HETEROSEXUAL,
    campus: CampusCode.HONGJIALOU,
    department: '外国语学院',
    age: 22,
    smoke: false,
    interests: ['篮球', '电影'],
    valueVector: [1, 0, 0, 0, 0],
    activeDays: 30,
    todayExposure: 0,
    ...overrides,
  }
}

describe('cosineSimilarity', () => {
  it('相同向量为 1', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1)
  })
  it('正交向量为 0', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0)
  })
  it('空向量安全返回 0', () => {
    expect(cosineSimilarity([], [])).toBe(0)
  })
})

describe('jaccard', () => {
  it('交集重合度计算正确', () => {
    expect(jaccard(['a', 'b'], ['b', 'c'])).toBeCloseTo(1 / 3)
  })
  it('完全不相交为 0', () => {
    expect(jaccard(['a'], ['b'])).toBe(0)
  })
})

describe('orientationCompatible', () => {
  it('异性恋男女互洽', () => {
    expect(
      orientationCompatible(Orientation.HETEROSEXUAL, Gender.MALE, Orientation.HETEROSEXUAL, Gender.FEMALE),
    ).toBe(true)
  })
  it('同为男性异性恋不互洽', () => {
    expect(
      orientationCompatible(Orientation.HETEROSEXUAL, Gender.MALE, Orientation.HETEROSEXUAL, Gender.MALE),
    ).toBe(false)
  })
  it('双性恋可匹配两性', () => {
    expect(
      orientationCompatible(Orientation.HETEROSEXUAL, Gender.FEMALE, Orientation.BISEXUAL, Gender.MALE),
    ).toBe(true)
  })
})

describe('hardFilter', () => {
  it('跨城市被同城偏好过滤', () => {
    const self = makeSelf({ distancePreference: DistancePreference.SAME_CITY })
    const c = makeCandidate({ campus: CampusCode.QINGDAO })
    expect(hardFilter(self, c, DistanceTier.CROSS_CITY)).toBe('distance')
  })
  it('不吸烟要求过滤吸烟候选', () => {
    const self = makeSelf({ acceptSmoker: false })
    const c = makeCandidate({ smoke: true })
    expect(hardFilter(self, c, DistanceTier.SAME_CITY)).toBe('smoke')
  })
  it('同院系默认过滤（避尴尬）', () => {
    const self = makeSelf({ department: '软件学院' })
    const c = makeCandidate({ department: '软件学院', campus: CampusCode.SOFTWARE_PARK })
    expect(hardFilter(self, c, DistanceTier.SAME_CAMPUS)).toBe('department')
  })
  it('曝光配额用尽过滤', () => {
    const c = makeCandidate({ todayExposure: DEFAULT_FILTER_OPTIONS.maxExposurePerDay })
    expect(hardFilter(makeSelf(), c, DistanceTier.SAME_CITY)).toBe('exposure')
  })
})

describe('pickTopCandidates', () => {
  it('按分数降序并限制数量', () => {
    const pool = [
      makeCandidate({ userId: 'low', valueVector: [0, 1, 0, 0, 0], interests: ['游戏'] }),
      makeCandidate({ userId: 'high', valueVector: [1, 0, 0, 0, 0], interests: ['篮球', '摄影'] }),
    ]
    const result = pickTopCandidates(makeSelf(), pool, DEFAULT_FILTER_OPTIONS, DEFAULT_WEIGHTS, 1)
    expect(result).toHaveLength(1)
    expect(result[0].userId).toBe('high')
    expect(result[0].score).toBeGreaterThan(0)
  })
  it('距离惩罚生效', () => {
    const sameCity = makeCandidate({ userId: 'a', campus: CampusCode.CENTRAL })
    const crossCity = makeCandidate({ userId: 'b', campus: CampusCode.QINGDAO })
    const self = makeSelf({ distancePreference: DistancePreference.ANY_DISTANCE })
    const result = pickTopCandidates(self, [sameCity, crossCity], DEFAULT_FILTER_OPTIONS, DEFAULT_WEIGHTS, 2)
    const a = result.find((x) => x.userId === 'a')
    const b = result.find((x) => x.userId === 'b')
    expect(a).toBeDefined()
    expect(b).toBeDefined()
    expect(a!.score).toBeGreaterThan(b!.score)
  })
})
