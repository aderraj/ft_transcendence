import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { FriendsGateway } from './friends.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { UserEntity } from '../users/entities/user.entity';
import { FriendRequestEntity } from './entities/friend-request.entity';
import { GameInvitationDto, AcceptGameInvitationDto } from './dto/game-invitation.dto';

@ApiTags('friends')
@Controller('friends')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FriendsController {
  constructor(
    private readonly friendsService: FriendsService,
    private readonly friendsGateway: FriendsGateway,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all friends' })
  @ApiResponse({ status: 200, description: 'Returns list of friends', type: [UserEntity] })
  getFriends(@CurrentUser() user: any) {
    return this.friendsService.getFriends(user.sub);
  }

  @Get('requests/pending')
  @ApiOperation({ summary: 'Get pending friend requests received' })
  @ApiResponse({ status: 200, description: 'Returns pending requests', type: [FriendRequestEntity] })
  getPendingRequests(@CurrentUser() user: any) {
    return this.friendsService.getPendingRequests(user.sub);
  }

  @Get('requests/sent')
  @ApiOperation({ summary: 'Get sent friend requests' })
  @ApiResponse({ status: 200, description: 'Returns sent requests', type: [FriendRequestEntity] })
  getSentRequests(@CurrentUser() user: any) {
    return this.friendsService.getSentRequests(user.sub);
  }

  @Post('request/:userId')
  @ApiOperation({ summary: 'Send friend request' })
  @ApiResponse({ status: 201, description: 'Friend request sent', type: FriendRequestEntity })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Already friends or request exists' })
  async sendFriendRequest(
    @CurrentUser() user: any,
    @Param('userId', ParseUUIDPipe) receiverId: string,
  ) {
    const request = await this.friendsService.sendFriendRequest(user.sub, receiverId);
    
    // Notify the receiver via WebSocket
    if (request && request.receiver) {
      await this.friendsGateway.notifyFriendRequest(
        receiverId,
        request.id,
        user.sub,
        request.sender.username,
        request.sender.displayName || request.sender.username,
      );
    }
    
    return request;
  }

  @Post('request/:requestId/accept')
  @ApiOperation({ summary: 'Accept friend request' })
  @ApiResponse({ status: 200, description: 'Friend request accepted' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  acceptFriendRequest(
    @CurrentUser() user: any,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.friendsService.acceptFriendRequest(user.sub, requestId);
  }

  @Post('request/:requestId/decline')
  @ApiOperation({ summary: 'Decline friend request' })
  @ApiResponse({ status: 200, description: 'Friend request declined' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  declineFriendRequest(
    @CurrentUser() user: any,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.friendsService.declineFriendRequest(user.sub, requestId);
  }

  @Delete('request/:requestId')
  @ApiOperation({ summary: 'Cancel sent friend request' })
  @ApiResponse({ status: 200, description: 'Friend request cancelled' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  cancelFriendRequest(
    @CurrentUser() user: any,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.friendsService.cancelFriendRequest(user.sub, requestId);
  }

  @Delete(':friendId')
  @ApiOperation({ summary: 'Remove friend' })
  @ApiResponse({ status: 200, description: 'Friend removed' })
  @ApiResponse({ status: 404, description: 'Friendship not found' })
  removeFriend(
    @CurrentUser() user: any,
    @Param('friendId', ParseUUIDPipe) friendId: string,
  ) {
    return this.friendsService.removeFriend(user.sub, friendId);
  }

  // ============================================
  // Game Invitation Endpoints
  // ============================================

  @Post('invite-game')
  @ApiOperation({ 
    summary: 'Invite friend to play game',
    description: 'Send a game invitation to a friend. The friend will receive a real-time notification via WebSocket.'
  })
  @ApiBody({ type: GameInvitationDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Game invitation sent successfully',
    schema: {
      type: 'object',
      properties: {
        invitationId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440002' },
        gameMode: { type: 'string', example: 'remote' },
        inviter: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            displayName: { type: 'string' },
          }
        },
        invitee: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            displayName: { type: 'string' },
          }
        },
        createdAt: { type: 'string', format: 'date-time' },
        expiresAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Not friends with this user or user offline' })
  @ApiResponse({ status: 404, description: 'Friend not found' })
  async inviteFriendToGame(
    @CurrentUser() user: any,
    @Body() inviteDto: GameInvitationDto,
  ) {
    const invitation = await this.friendsService.inviteFriendToGame(
      user.sub,
      inviteDto.friendId,
      inviteDto.gameMode || 'remote',
    );

    // Notify friend via WebSocket
    await this.friendsGateway.notifyGameInvitation(
      inviteDto.friendId,
      invitation.invitationId,
      user.sub,
      invitation.inviter.username,
      invitation.inviter.displayName || invitation.inviter.username,
      inviteDto.gameMode || 'remote',
    );

    return invitation;
  }

  @Post('accept-game')
  @ApiOperation({ 
    summary: 'Accept game invitation',
    description: 'Accept a game invitation from a friend. Returns game session details and WebSocket connection info.'
  })
  @ApiBody({ type: AcceptGameInvitationDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Game invitation accepted',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Game invitation accepted' },
        gameSession: {
          type: 'object',
          properties: {
            invitationId: { type: 'string' },
            gameMode: { type: 'string', example: 'remote' },
            player1Id: { type: 'string', description: 'Inviter user ID' },
            player2Id: { type: 'string', description: 'Invitee user ID' },
            gameServerUrl: { type: 'string', example: 'ws://localhost:3002/websocket' },
            connectionParams: {
              type: 'object',
              properties: {
                user_id: { type: 'string', description: 'Your user ID' },
                room: { type: 'string', description: 'Private room ID' },
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid invitation' })
  @ApiResponse({ status: 404, description: 'Invitation not found or expired' })
  async acceptGameInvitation(
    @CurrentUser() user: any,
    @Body() acceptDto: AcceptGameInvitationDto,
  ) {
    const result = await this.friendsService.acceptGameInvitation(
      user.sub,
      acceptDto.invitationId,
    );

    // Notify inviter that invitation was accepted
    await this.friendsGateway.notifyGameInvitationAccepted(
      result.gameSession.player1Id,
      result.gameSession.invitationId,
      user.sub,
      result.gameSession.gameMode,
      result.gameSession.roomId,
      result.gameSession.gameServerUrl,
    );

    return result;
  }

  @Delete('game-invitation/:invitationId')
  @ApiOperation({ 
    summary: 'Decline/Cancel game invitation',
    description: 'Decline a received game invitation or cancel a sent invitation'
  })
  @ApiResponse({ status: 200, description: 'Game invitation declined/cancelled' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async declineGameInvitation(
    @CurrentUser() user: any,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    const result = await this.friendsService.declineGameInvitation(user.sub, invitationId);

    // Notify the other party
    const notifyUserId = result.inviterId === user.sub ? result.inviteeId : result.inviterId;
    await this.friendsGateway.notifyGameInvitationDeclined(
      notifyUserId,
      invitationId,
      user.sub,
    );

    return result;
  }

  @Get('game-invitations/pending')
  @ApiOperation({ 
    summary: 'Get pending game invitations',
    description: 'Get all pending game invitations (received and sent)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns pending game invitations',
    schema: {
      type: 'object',
      properties: {
        received: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              gameMode: { type: 'string' },
              inviter: { type: 'object' },
              createdAt: { type: 'string' },
              expiresAt: { type: 'string' },
            }
          }
        },
        sent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              gameMode: { type: 'string' },
              invitee: { type: 'object' },
              createdAt: { type: 'string' },
              expiresAt: { type: 'string' },
            }
          }
        }
      }
    }
  })
  async getPendingGameInvitations(@CurrentUser() user: any) {
    return this.friendsService.getPendingGameInvitations(user.sub);
  }
}
