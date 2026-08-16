import {
  AuthToken,
  ChatMessage,
  ConversationSummary,
  DailyRecommendation,
  LikeDecision,
  LikeResult,
  SubmitSurveyRequest,
  SurveyQuestion,
  UpdateProfileRequest,
  UserSummary,
  VerifyRequest,
} from '@sdumeet/shared'
import { request } from './request'

export const api = {
  requestCode: (studentId: string, email: string) =>
    request<{ sent: boolean; devCode?: string }>('/auth/request-code', {
      method: 'POST',
      data: { studentId, email },
    }),
  verify: (payload: VerifyRequest) =>
    request<AuthToken>('/auth/verify', { method: 'POST', data: payload }),
  getQuestions: () => request<SurveyQuestion[]>('/survey/questions'),
  submitSurvey: (payload: SubmitSurveyRequest) =>
    request<{ ok: boolean }>('/survey/answers', { method: 'POST', data: payload }),
  getToday: () => request<DailyRecommendation[]>('/matching/today'),
  generateToday: () => request<number>('/matching/generate', { method: 'POST' }),
  decide: (recommendationId: string, decision: LikeDecision) =>
    request<LikeResult>('/matching/' + recommendationId + '/decide', {
      method: 'POST',
      data: { decision },
    }),
  getMe: () => request<UserSummary>('/users/me'),
  updateProfile: (payload: UpdateProfileRequest) =>
    request<UserSummary>('/users/me/profile', { method: 'PUT', data: payload }),
  deleteAccount: () => request<{ ok: boolean }>('/users/me', { method: 'DELETE' }),
  getConversations: () => request<ConversationSummary[]>('/chat/conversations'),
  getMessages: (conversationId: string) =>
    request<ChatMessage[]>('/chat/conversations/' + conversationId + '/messages'),
}
