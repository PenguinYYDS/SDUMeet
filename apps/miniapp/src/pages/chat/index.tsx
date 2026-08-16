import { useEffect, useRef, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Button, Input, ScrollView, Text, View } from '@tarojs/components'
import { ChatMessage } from '@sdumeet/shared'
import { api } from '../../services/api'
import { getToken, WS_BASE } from '../../services/request'
import './index.scss'

const MAX_RECONNECT = 3

export default function Chat() {
  const router = useRouter()
  const conversationId = (router.params.id as string) || ''
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [myId, setMyId] = useState('')
  const taskRef = useRef<Taro.SocketTask | null>(null)

  useEffect(() => {
    if (!conversationId) return
    api
      .getMe()
      .then((me) => setMyId(me.id))
      .catch(() => {})
    api
      .getMessages(conversationId)
      .then(setMessages)
      .catch(() => {})

    let disposed = false
    let reconnectAttempts = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      Taro.connectSocket({
        url: WS_BASE + '/chat?token=' + encodeURIComponent(getToken()),
      })
        .then((task) => {
          if (disposed) {
            task.close({})
            return
          }
          taskRef.current = task
          task.onOpen(() => {
            reconnectAttempts = 0
            task.send({
              data: JSON.stringify({ event: 'conversation:join', data: { conversationId } }),
            })
          })
          task.onMessage((res) => {
            try {
              const parsed = JSON.parse(res.data)
              if (parsed.event === 'message:new') {
                setMessages((prev) => [...prev, parsed.data])
              }
            } catch {
              // 忽略无法解析的非法消息
            }
          })
          task.onClose(() => {
            taskRef.current = null
            if (disposed || reconnectAttempts >= MAX_RECONNECT) return
            reconnectAttempts++
            // 指数退避重连，避免断线后消息丢失
            reconnectTimer = setTimeout(connect, 1000 * reconnectAttempts)
          })
          task.onError(() => {
            taskRef.current = null
            if (disposed || reconnectAttempts >= MAX_RECONNECT) return
            reconnectAttempts++
            reconnectTimer = setTimeout(connect, 1000 * reconnectAttempts)
          })
        })
        .catch(() => {})
    }
    connect()

    return () => {
      disposed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      taskRef.current?.close({})
      taskRef.current = null
    }
  }, [conversationId])

  const send = () => {
    const content = text.trim()
    if (!content) return
    const task = taskRef.current
    if (!task) {
      Taro.showToast({ title: '连接中，请稍后再试', icon: 'none' })
      return
    }
    task.send({
      data: JSON.stringify({ event: 'message:send', data: { conversationId, content } }),
    })
    setText('')
  }

  return (
    <View className="chat-page">
      <ScrollView className="msg-list" scrollY scrollIntoView="bottom">
        {messages.map((m) => (
          <View key={m.id} className={'msg ' + (m.senderId === myId ? 'mine' : 'peer')}>
            <Text>{m.content}</Text>
          </View>
        ))}
        <View id="bottom" />
      </ScrollView>
      <View className="input-bar">
        <Input
          className="input"
          value={text}
          onInput={(e) => setText(e.detail.value)}
          placeholder="说点什么…"
          confirmType="send"
          onConfirm={send}
        />
        <Button className="send" onClick={send}>
          发送
        </Button>
      </View>
    </View>
  )
}
