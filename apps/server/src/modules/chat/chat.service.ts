import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MessageType, SendMessageRequest } from '@sdumeet/shared'
import { User } from '../users/user.entity'
import { Profile } from '../users/profile.entity'
import { Conversation } from './conversation.entity'
import { Message } from './message.entity'

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation) private readonly conversations: Repository<Conversation>,
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  // 配对成功后由 MatchingService 调用，创建 1v1 会话
  async ensureConversation(userAId: string, userBId: string): Promise<Conversation> {
    const existing = await this.conversations
      .createQueryBuilder('c')
      .where(
        '(c.userAId = :a AND c.userBId = :b) OR (c.userAId = :b AND c.userBId = :a)',
        { a: userAId, b: userBId },
      )
      .getOne()
    if (existing) return existing
    return this.conversations.save(this.conversations.create({ userAId, userBId }))
  }

  async isMember(conversationId: string, userId: string): Promise<boolean> {
    const c = await this.conversations.findOne({ where: { id: conversationId } })
    return !!c && (c.userAId === userId || c.userBId === userId)
  }

  async sendMessage(userId: string, payload: SendMessageRequest) {
    if (!(await this.isMember(payload.conversationId, userId))) {
      throw new ForbiddenException('你不在该会话中')
    }
    const content = (payload.content || '').trim().slice(0, 500)
    if (!content) throw new NotFoundException('消息内容不能为空')
    const msg = await this.messages.save(
      this.messages.create({
        conversationId: payload.conversationId,
        senderId: userId,
        type: payload.type || MessageType.TEXT,
        content,
      }),
    )
    await this.conversations.update({ id: payload.conversationId }, { lastMessageAt: new Date() })
    return msg
  }

  async listConversations(userId: string) {
    const list = await this.conversations
      .createQueryBuilder('c')
      .where('c.userAId = :userId OR c.userBId = :userId', { userId })
      .orderBy('c.lastMessageAt', 'DESC', 'NULLS LAST')
      .getMany()
    const result = []
    for (const c of list) {
      const peerId = c.userAId === userId ? c.userBId : c.userAId
      const peer = await this.users.findOne({ where: { id: peerId }, relations: { profile: true } })
      if (!peer) continue
      const last = await this.messages.findOne({
        where: { conversationId: c.id },
        order: { createdAt: 'DESC' },
      })
      result.push({
        id: c.id,
        peer: {
          id: peer.id,
          nickname: peer.nickname,
          campus: peer.profile?.campus,
          city: '',
          department: peer.profile?.department || '',
          grade: peer.profile?.grade || 0,
          mbti: peer.profile?.mbti,
          avatarUrl: peer.profile?.avatarUrl,
          bio: peer.profile?.bio,
          interests: peer.profile?.interests || [],
          verifyStatus: peer.verifyStatus,
        },
        lastMessage: last?.content,
        lastMessageAt: c.lastMessageAt?.toISOString(),
      })
    }
    return result
  }

  async listMessages(userId: string, conversationId: string, limit = 50) {
    if (!(await this.isMember(conversationId, userId))) {
      throw new ForbiddenException('你不在该会话中')
    }
    const list = await this.messages.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
    })
    return list.reverse().map((m) => ({
      id: m.id,
      senderId: m.senderId,
      type: m.type,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }))
  }
}
