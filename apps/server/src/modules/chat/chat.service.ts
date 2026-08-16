import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, In, Repository } from 'typeorm'
import { MessageType, SendMessageRequest } from '@sdumeet/shared'
import { User } from '../users/user.entity'
import { Conversation } from './conversation.entity'
import { Message } from './message.entity'
import { toUserSummary } from '../../common/utils/user-summary'

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation) private readonly conversations: Repository<Conversation>,
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  // 配对成功后由 MatchingService 调用，创建 1v1 会话。
  // 支持传入事务 EntityManager，使会话创建与配对写入同事务原子提交。
  async ensureConversation(
    userAId: string,
    userBId: string,
    manager?: EntityManager,
  ): Promise<Conversation> {
    const repo = manager ? manager.getRepository(Conversation) : this.conversations
    const existing = await repo
      .createQueryBuilder('c')
      .where('(c.userAId = :a AND c.userBId = :b) OR (c.userAId = :b AND c.userBId = :a)', {
        a: userAId,
        b: userBId,
      })
      .getOne()
    if (existing) return existing
    return repo.save(repo.create({ userAId, userBId }))
  }

  async isMember(conversationId: string, userId: string): Promise<boolean> {
    // exists 只做存在性判断，不加载整行数据
    return this.conversations.exists({
      where: [
        { id: conversationId, userAId: userId },
        { id: conversationId, userBId: userId },
      ],
    })
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
    if (list.length === 0) return []

    const peerIdOf = (c: Conversation) => (c.userAId === userId ? c.userBId : c.userAId)
    const convIds = list.map((c) => c.id)
    // 批量取对端用户与各会话最新一条消息（2 条查询替代 2N 条）
    const [peers, lastMessages] = await Promise.all([
      this.users.find({
        where: { id: In(list.map(peerIdOf)) },
        relations: { profile: true },
      }),
      this.messages
        .createQueryBuilder('m')
        .distinctOn(['m.conversationId'])
        .where('m.conversationId IN (:...ids)', { ids: convIds })
        .orderBy('m.conversationId', 'ASC')
        .addOrderBy('m.createdAt', 'DESC')
        .getMany(),
    ])
    const peerById = new Map(peers.map((p) => [p.id, p]))
    const lastByConv = new Map(lastMessages.map((m) => [m.conversationId, m]))

    const result = []
    for (const c of list) {
      const peer = peerById.get(peerIdOf(c))
      if (!peer) continue
      const last = lastByConv.get(c.id)
      result.push({
        id: c.id,
        peer: toUserSummary(peer),
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
    // 非法 limit（如 NaN）回落默认值，避免产生错误 SQL
    const safeLimit = Number.isFinite(limit) ? limit : 50
    const list = await this.messages.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(safeLimit, 1), 200),
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
