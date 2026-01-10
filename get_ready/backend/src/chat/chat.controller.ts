import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations' })
  @ApiResponse({ status: 200, description: 'Returns all conversations' })
  async getConversations(@CurrentUser() user: any) {
    return this.chatService.getConversations(user.sub);
  }

  @Get('messages/:friendId')
  @ApiOperation({ summary: 'Get message history with a friend' })
  @ApiResponse({ status: 200, description: 'Returns message history' })
  async getMessages(
    @CurrentUser() user: any,
    @Param('friendId') friendId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.chatService.getMessages(
      user.sub,
      friendId,
      limit || 50,
      offset || 0,
    );
  }

  @Post('messages/:friendId')
  @ApiOperation({ summary: 'Send a message to a friend (REST fallback)' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @CurrentUser() user: any,
    @Param('friendId') friendId: string,
    @Body('content') content: string,
  ) {
    return this.chatService.sendMessage(user.sub, friendId, content);
  }

  @Patch('messages/:messageId/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  async markAsRead(
    @CurrentUser() user: any,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.markAsRead(messageId, user.sub);
  }

  @Patch('messages/:friendId/read-all')
  @ApiOperation({ summary: 'Mark all messages from a friend as read' })
  @ApiResponse({ status: 200, description: 'All messages marked as read' })
  async markAllAsRead(
    @CurrentUser() user: any,
    @Param('friendId') friendId: string,
  ) {
    return this.chatService.markAllAsRead(user.sub, friendId);
  }
}
