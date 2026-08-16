import {
  CampusCode, DistanceTier, Gender, LikeDecision, MessageType, Orientation, VerifyStatus,
} from './enums'

// 统一响应包裹
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// ---- 认证 ----
export interface AuthToken {
  accessToken: string
  expiresIn: number
}

export interface VerifyRequest {
  studentId: string
  email: string
  code: string
}

// ---- 测评 ----
export interface SubmitSurveyRequest {
  version: number
  answers: { questionId: string; optionIndex: number }[]
}

// ---- 用户 ----
export interface UserSummary {
  id: string
  nickname: string
  campus: CampusCode
  city: string
  department: string
  grade: number
  mbti?: string
  avatarUrl?: string
  bio?: string
  interests: string[]
  verifyStatus: VerifyStatus
}

export interface UpdateProfileRequest {
  nickname?: string
  gender?: Gender
  orientation?: Orientation
  campus?: CampusCode
  department?: string
  grade?: number
  birthday?: string
  mbti?: string
  bio?: string
  interests?: string[]
  smoke?: boolean
  acceptSmoker?: boolean
  distancePreference?: import('./enums').DistancePreference
  minAge?: number
  maxAge?: number
  photos?: string[]
}

// ---- 匹配 ----
export interface MatchReport {
  sharedInterests: string[]
  sharedValueDims: string[]
}

export interface DailyRecommendation {
  id: string
  score: number
  distanceTier: DistanceTier
  report: MatchReport
  candidate: UserSummary
}

export interface DecideRequest {
  decision: LikeDecision
}

export interface LikeResult {
  matched: boolean
}

// ---- 聊天 ----
export interface SendMessageRequest {
  conversationId: string
  content: string
  type?: MessageType
}

export interface ChatMessage {
  id: string
  senderId: string
  type: MessageType
  content: string
  createdAt: string
}

export interface ConversationSummary {
  id: string
  peer: UserSummary
  lastMessage?: string
  lastMessageAt?: string
}
