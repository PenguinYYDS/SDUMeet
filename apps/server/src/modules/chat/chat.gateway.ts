import { JwtService } from '@nestjs/jwt'
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { SendMessageRequest } from '@sdumeet/shared'
import { ChatService } from './chat.service'

@WebSocketGateway({ namespace: '/chat', cors: { origin: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  constructor(
    private readonly chat: ChatService,
    private readonly jwt: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = String(client.handshake.query.token || '')
      const payload = await this.jwt.verifyAsync(token)
      client.data.userId = payload.sub
    } catch {
      client.disconnect(true)
    }
  }

  handleDisconnect(client: Socket) {
    // 无状态网关，断开无需额外清理
  }

  @SubscribeMessage('conversation:join')
  async handleJoin(client: Socket, payload: { conversationId: string }) {
    const userId = client.data.userId
    if (!userId) return { ok: false }
    const ok = await this.chat.isMember(payload.conversationId, userId)
    if (ok) client.join('conv:' + payload.conversationId)
    return { ok }
  }

  @SubscribeMessage('message:send')
  async handleSend(client: Socket, payload: SendMessageRequest) {
    const userId = client.data.userId
    if (!userId) return { ok: false }
    const msg = await this.chat.sendMessage(userId, payload)
    this.server
      .to('conv:' + payload.conversationId)
      .emit('message:new', {
        id: msg.id,
        senderId: msg.senderId,
        type: msg.type,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
      })
    return { ok: true, message: msg }
  }
}
