import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ChatService } from './chat.service'

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('conversations')
  listConversations(@CurrentUser('sub') userId: string) {
    return this.chat.listConversations(userId)
  }

  @Get('conversations/:id/messages')
  listMessages(
    @CurrentUser('sub') userId: string,
    @Param('id') conversationId: string,
    @Query('limit') limit?: string,
  ) {
    return this.chat.listMessages(userId, conversationId, parseInt(limit || '50', 10))
  }
}
