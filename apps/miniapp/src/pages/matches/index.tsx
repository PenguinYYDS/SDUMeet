import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Text, View } from '@tarojs/components'
import { ConversationSummary } from '@sdumeet/shared'
import { api } from '../../services/api'
import './index.scss'

export default function Matches() {
  const [list, setList] = useState<ConversationSummary[]>([])

  useDidShow(() => {
    api.getConversations().then(setList).catch(() => {})
  })

  return (
    <View className='page'>
      {list.length === 0 && (
        <View className='hint'>还没有配对成功，去「每日派单」看看吧</View>
      )}
      {list.map((c) => (
        <View
          className='conv'
          key={c.id}
          onClick={() => Taro.navigateTo({ url: '/pages/chat/index?id=' + c.id })}
        >
          <Text className='conv-name'>{c.peer.nickname}</Text>
          <Text className='conv-last'>{c.lastMessage || '配对成功，说点什么吧'}</Text>
        </View>
      ))}
    </View>
  )
}
