import Taro from '@tarojs/taro'
import { ApiResponse } from '@sdumeet/shared'

declare const process: { env: Record<string, string | undefined> }

export const API_BASE = process.env.TARO_APP_API_BASE || 'http://127.0.0.1:3000/api'
export const WS_BASE = API_BASE.replace(/^http/, 'ws').replace(/\/api$/, '')

const TOKEN_KEY = 'sdumeet_token'

export function getToken(): string {
  return Taro.getStorageSync(TOKEN_KEY) || ''
}

export function setToken(token: string): void {
  Taro.setStorageSync(TOKEN_KEY, token)
}

export function clearToken(): void {
  Taro.removeStorageSync(TOKEN_KEY)
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

export async function request<T>(
  path: string,
  options: { method?: Method; data?: unknown } = {},
): Promise<T> {
  const token = getToken()
  const res = await Taro.request<ApiResponse<T>>({
    url: API_BASE + path,
    method: options.method || 'GET',
    data: options.data,
    header: token ? { Authorization: 'Bearer ' + token } : {},
  })
  if (res.statusCode === 401) {
    clearToken()
    Taro.navigateTo({ url: '/pages/auth/auth' })
    throw new Error('请先登录')
  }
  const body = res.data
  if (!body || body.code !== 0) {
    throw new Error((body && body.message) || '网络开小差了，请稍后再试')
  }
  return body.data
}
