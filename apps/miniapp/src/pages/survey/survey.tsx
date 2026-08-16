import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'
import { SurveyQuestion } from '@sdumeet/shared'
import { api } from '../../services/api'
import './survey.scss'

export default function Survey() {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api
      .getQuestions()
      .then(setQuestions)
      .catch((e) => {
        Taro.showToast({ title: String(e instanceof Error ? e.message : e), icon: 'none' })
      })
  }, [])

  const q = questions[step]
  if (!q) {
    return (
      <View className="page">
        <View className="hint">问卷加载中…</View>
      </View>
    )
  }

  const choose = async (optionIndex: number) => {
    const next = { ...answers, [q.id]: optionIndex }
    setAnswers(next)
    if (step < questions.length - 1) {
      setStep(step + 1)
      return
    }
    if (submitting) return
    setSubmitting(true)
    try {
      await api.submitSurvey({
        version: 1,
        answers: Object.keys(next).map((id) => ({ questionId: id, optionIndex: next[id] })),
      })
      Taro.switchTab({ url: '/pages/index/index' })
    } catch (e) {
      Taro.showToast({ title: String(e instanceof Error ? e.message : e), icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="page">
      <View className="progress">
        <Text>
          {step + 1} / {questions.length}
        </Text>
        <View className="bar">
          <View
            className="bar-inner"
            style={{ width: Math.round(((step + 1) / questions.length) * 100) + '%' }}
          />
        </View>
      </View>
      <View className="card">
        <Text className="question">{q.text}</Text>
        {q.options.map((opt, i) => (
          <View
            className={'option' + (answers[q.id] === i ? ' selected' : '')}
            key={i}
            onClick={() => choose(i)}
          >
            {opt.label}
          </View>
        ))}
        <Text className="tip">结果仅供匹配参考，非心理诊断</Text>
      </View>
    </View>
  )
}
