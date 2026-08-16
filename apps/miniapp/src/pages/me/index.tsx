import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import { CAMPUS_BY_CODE, UserSummary, VerifyStatus } from '@sdumeet/shared'
import { api } from '../../services/api'
import { clearToken } from '../../services/request'
import './index.scss'

export default function Me() {
  const [me, setMe] = useState<UserSummary | null>(null)

  useDidShow(() => {
    api.getMe().then(setMe).catch(() => {})
  })

  const logout = () => {
    clearToken()
    Taro.reLaunch({ url: '/pages/auth/auth' })
  }

  const deleteAccount = () => {
    Taro.showModal({
      title: '注销账户',
      content: '注销后你的资料将被删除且不可恢复，确定吗？',
      success: (res) => {
        if (!res.confirm) return
        api
          .deleteAccount()
          .then(() => {
            clearToken()
            Taro.reLaunch({ url: '/pages/auth/auth' })
          })
          .catch((e) => {
            Taro.showToast({ title: String(e instanceof Error ? e.message : e), icon: 'none' })
          })
      },
    })
  }

  const verified = me?.verifyStatus === VerifyStatus.VERIFIED

  return (
    <View className='page'>
      <View className='card profile-card'>
        <Text className='nickname'>{me?.nickname || '未登录'}</Text>
        <View className='badges'>
          {verified ? <Text className='badge ok'>已认证</Text> : <Text className='badge'>未认证</Text>}
          {me?.campus ? (
            <Text className='badge'>{CAMPUS_BY_CODE[me.campus]?.name}</Text>
          ) : null}
        </View>
        <Text className='department'>
          {me?.department ? me.department + ' · ' : ''}
          {me?.grade ? me.grade + '级' : ''}
        </Text>
      </View>

      <View className='card menu'>
        <View className='menu-item' onClick={() => Taro.showToast({ title: '开发中', icon: 'none' })}>
          编辑资料
        </View>
        <View className='menu-item' onClick={() => Taro.showToast({ title: '开发中', icon: 'none' })}>
          隐私政策
        </View>
        <View className='menu-item' onClick={() => Taro.showToast({ title: '开发中', icon: 'none' })}>
          社区公约
        </View>
        <View className='menu-item' onClick={() => Taro.showToast({ title: '开发中', icon: 'none' })}>
          关于我们
        </View>
      </View>

      <Button className='sdu-btn' onClick={logout}>
        退出登录
      </Button>
      <Button className='danger-btn' onClick={deleteAccount}>
        注销账户
      </Button>
    </View>
  )
}
