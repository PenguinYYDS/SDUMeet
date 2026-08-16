import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import {
  CAMPUS_BY_CODE,
  DailyRecommendation,
  DISTANCE_TIER_LABELS,
  LikeDecision,
} from '@sdumeet/shared'
import { api } from '../../services/api'
import './index.scss'

export default function Index() {
  const [list, setList] = useState<DailyRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [generated, setGenerated] = useState(false)
  // 正在处理的推荐 id：防止连点导致重复提交
  const [pendingId, setPendingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      let today = await api.getToday()
      if (today.length === 0 && !generated) {
        // 开发期前端触发生成；正式环境由服务端定时任务在夜间生成
        await api.generateToday()
        today = await api.getToday()
        setGenerated(true)
      }
      setList(today)
    } catch (e) {
      Taro.showToast({ title: String(e instanceof Error ? e.message : e), icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    load()
  })

  const decide = async (rec: DailyRecommendation, decision: LikeDecision) => {
    if (pendingId) return
    setPendingId(rec.id)
    try {
      const r = await api.decide(rec.id, decision)
      setList((prev) => prev.filter((x) => x.id !== rec.id))
      if (r.matched) {
        Taro.showModal({
          title: '配对成功',
          content: '你们互相心动啦！去「消息」页打个招呼吧',
          showCancel: false,
        })
      }
    } catch (e) {
      Taro.showToast({ title: String(e instanceof Error ? e.message : e), icon: 'none' })
    } finally {
      setPendingId(null)
    }
  }

  return (
    <View className="page">
      {loading && <View className="hint">加载中…</View>}
      {!loading && list.length === 0 && (
        <View className="hint">今日派单已处理完毕，明天再来～</View>
      )}
      {list.map((rec) => (
        <View className="card" key={rec.id}>
          <View className="card-top">
            <Text className="nickname">{rec.candidate.nickname}</Text>
            <Text className="distance">{DISTANCE_TIER_LABELS[rec.distanceTier]}</Text>
          </View>
          <View className="meta">
            {rec.candidate.campus ? CAMPUS_BY_CODE[rec.candidate.campus]?.name : ''} ·{' '}
            {rec.candidate.grade}级 · {rec.candidate.department}
          </View>
          <View className="bio">{rec.candidate.bio || '这个人很神秘，什么都没写'}</View>
          {rec.candidate.interests.length > 0 && (
            <View className="tags">
              {rec.candidate.interests.slice(0, 4).map((t) => (
                <Text className="tag" key={t}>
                  {t}
                </Text>
              ))}
            </View>
          )}
          <View className="report">
            为什么是 TA：
            {rec.report.sharedInterests.length > 0
              ? '共同兴趣 ' + rec.report.sharedInterests.join('、')
              : '你们的价值观看似互补，聊聊看'}
          </View>
          <View className="actions">
            <Button
              className="btn-pass"
              disabled={pendingId === rec.id}
              onClick={() => decide(rec, LikeDecision.PASS)}
            >
              跳过
            </Button>
            <Button
              className="btn-like"
              disabled={pendingId === rec.id}
              onClick={() => decide(rec, LikeDecision.LIKE)}
            >
              心动
            </Button>
          </View>
        </View>
      ))}
    </View>
  )
}
