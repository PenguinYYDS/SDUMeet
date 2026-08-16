import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Button, Input, Switch, Text, View } from '@tarojs/components'
import { api } from '../../services/api'
import { setToken } from '../../services/request'
import './auth.scss'

export default function Auth() {
  const [studentId, setStudentId] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [sending, setSending] = useState(false)

  const sendCode = async () => {
    if (!/^\d{10,12}$/.test(studentId)) {
      Taro.showToast({ title: '请填写正确的学号', icon: 'none' })
      return
    }
    if (!email.endsWith('@sdu.edu.cn') && !email.endsWith('@mail.sdu.edu.cn')) {
      Taro.showToast({ title: '请使用山大校园邮箱', icon: 'none' })
      return
    }
    setSending(true)
    try {
      const r = await api.requestCode(studentId, email)
      if (r.devCode) {
        Taro.showModal({ title: '开发环境', content: '验证码：' + r.devCode, showCancel: false })
      } else {
        Taro.showToast({ title: '验证码已发送，请查收邮件', icon: 'none' })
      }
    } catch (e) {
      Taro.showToast({ title: String(e instanceof Error ? e.message : e), icon: 'none' })
    } finally {
      setSending(false)
    }
  }

  const submit = async () => {
    if (!agreed) {
      Taro.showToast({ title: '请先阅读并同意《用户协议》与《隐私政策》', icon: 'none' })
      return
    }
    try {
      const r = await api.verify({ studentId, email, code })
      setToken(r.accessToken)
      Taro.redirectTo({ url: '/pages/survey/survey' })
    } catch (e) {
      Taro.showToast({ title: String(e instanceof Error ? e.message : e), icon: 'none' })
    }
  }

  return (
    <View className='page'>
      <View className='card'>
        <Text className='title'>山大学子实名认证</Text>
        <Text className='subtitle'>一人一号 · 只面向山东大学在校生 · 信息加密存储</Text>
        <View className='field'>
          <Text className='label'>学号</Text>
          <Input
            className='input'
            value={studentId}
            onInput={(e) => setStudentId(e.detail.value)}
            placeholder='请输入学号'
          />
        </View>
        <View className='field'>
          <Text className='label'>校园邮箱</Text>
          <Input
            className='input'
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
            placeholder='xxx@sdu.edu.cn'
          />
        </View>
        <View className='field'>
          <Text className='label'>验证码</Text>
          <View className='code-row'>
            <Input
              className='input'
              value={code}
              onInput={(e) => setCode(e.detail.value)}
              placeholder='6 位验证码'
            />
            <Button className='code-btn' loading={sending} onClick={sendCode}>
              获取验证码
            </Button>
          </View>
        </View>
        <View className='agree'>
          <Switch checked={agreed} onChange={(e) => setAgreed(e.detail.value)} />
          <Text className='agree-text'>我已阅读并同意《用户协议》《隐私政策》与《社区公约》</Text>
        </View>
        <Button className='sdu-btn' onClick={submit}>
          认证并开始
        </Button>
      </View>
    </View>
  )
}
