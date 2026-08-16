import { CAMPUS_BY_CODE, CITY_NAMES, UserSummary } from '@sdumeet/shared'
import { Profile } from '../../modules/users/profile.entity'
import { User } from '../../modules/users/user.entity'

// 统一 UserSummary 组装：集中维护一份实现，避免各模块重复实现导致字段漂移
// （历史问题：matching/chat 模块把 city 硬编码为空字符串）
export function toUserSummary(user: User, profile?: Profile): UserSummary {
  const p = profile || user.profile
  const campus = p?.campus
  return {
    id: user.id,
    nickname: user.nickname,
    campus,
    city: campus ? CITY_NAMES[CAMPUS_BY_CODE[campus].city] : '',
    department: p?.department || '',
    grade: p?.grade || 0,
    mbti: p?.mbti ?? undefined,
    avatarUrl: p?.avatarUrl ?? undefined,
    bio: p?.bio ?? undefined,
    interests: p?.interests || [],
    verifyStatus: user.verifyStatus,
  }
}
