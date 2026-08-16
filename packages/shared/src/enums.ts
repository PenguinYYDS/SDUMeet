// 全局枚举（string enum 便于序列化与跨端传输）

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NON_BINARY = 'NON_BINARY',
}

export enum Orientation {
  HETEROSEXUAL = 'HETEROSEXUAL',
  HOMOSEXUAL = 'HOMOSEXUAL',
  BISEXUAL = 'BISEXUAL',
}

export enum City {
  JINAN = 'JINAN',
  QINGDAO = 'QINGDAO',
  WEIHAI = 'WEIHAI',
}

// 山东大学八大校区
export enum CampusCode {
  CENTRAL = 'CENTRAL',
  HONGJIALOU = 'HONGJIALOU',
  BAOTUQUAN = 'BAOTUQUAN',
  QIANFOSHAN = 'QIANFOSHAN',
  SOFTWARE_PARK = 'SOFTWARE_PARK',
  XINGLONGSHAN = 'XINGLONGSHAN',
  QINGDAO = 'QINGDAO',
  WEIHAI = 'WEIHAI',
}

// 用户对校区距离的意愿（硬过滤条件）
export enum DistancePreference {
  SAME_CAMPUS = 'SAME_CAMPUS',
  SAME_CITY = 'SAME_CITY',
  ANY_DISTANCE = 'ANY_DISTANCE',
}

// 校区距离档位（由双方校区推导）
export enum DistanceTier {
  SAME_CAMPUS = 0,
  SAME_CITY = 1,
  CROSS_CITY = 2,
}

export enum VerifyStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  BANNED = 'BANNED',
}

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export enum LikeDecision {
  LIKE = 'LIKE',
  PASS = 'PASS',
}

export enum RecommendationStatus {
  DELIVERED = 'DELIVERED',
  LIKED = 'LIKED',
  PASSED = 'PASSED',
  MATCHED = 'MATCHED',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  TOPIC_CARD = 'TOPIC_CARD',
  SYSTEM = 'SYSTEM',
}
