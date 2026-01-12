import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { FriendsService } from './friends.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  handshake: any;
  disconnect: any;
  id: string;
}

// Parse allowed origins from environment
const getAllowedOrigins = () => {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
  const origins = allowedOriginsEnv
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
  
  if (origins.length === 0) {
    return process.env.FRONTEND_URL || '*';
  }
  return origins;
};

@ApiTags('friends')
@WebSocketGateway({
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
  namespace: '/friends',
})
export class FriendsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private friendsService: FriendsService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      this.userSockets.set(client.userId, client.id);

      await this.prisma.user.update({
        where: { id: client.userId },
        data: { isOnline: true },
      });

      await this.notifyFriendsStatus(client.userId, true);
    } catch (error) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.userSockets.delete(client.userId);

      await this.prisma.user.update({
        where: { id: client.userId },
        data: { isOnline: false, lastSeen: new Date() },
      });

      await this.notifyFriendsStatus(client.userId, false);
    }
  }

  private async notifyFriendsStatus(userId: string, isOnline: boolean) {
    const friends = await this.friendsService.getFriends(userId);

    friends.forEach((friend) => {
      const friendSocketId = this.userSockets.get(friend.id);
      if (friendSocketId) {
        this.server.to(friendSocketId).emit('friend:status', {
          userId,
          isOnline,
        });
      }
    });
  }

  // Notify a user when they receive a friend request
  async notifyFriendRequest(receiverId: string, requestId: string, senderId: string, senderUsername: string, senderDisplayName: string) {
    const receiverSocketId = this.userSockets.get(receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('friend:request_received', {
        requestId,
        senderId,
        senderUsername,
        senderDisplayName,
      });
    }
  }

  // Accept a friend request via WebSocket
  @SubscribeMessage('friend:accept_request')
  async handleAcceptFriendRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { requestId: string },
  ) {
    try {
      await this.friendsService.acceptFriendRequest(client.userId, data.requestId);

      // Notify both users that they are now friends
      const request = await this.prisma.friendRequest.findUnique({
        where: { id: data.requestId },
        include: {
          sender: { select: { id: true, username: true, displayName: true } },
          receiver: { select: { id: true, username: true, displayName: true } },
        },
      });

      if (request) {
        // Notify the sender
        const senderSocketId = this.userSockets.get(request.senderId);
        if (senderSocketId) {
          this.server.to(senderSocketId).emit('friend:request_accepted', {
            userId: request.receiverId,
            username: request.receiver.username,
            displayName: request.receiver.displayName,
          });
        }

        // Notify the receiver (current user)
        this.server.to(client.id).emit('friend:request_accepted', {
          userId: request.senderId,
          username: request.sender.username,
          displayName: request.sender.displayName,
        });
      }

      return { success: true, message: 'Friend request accepted' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Send a game invite to a friend
  @SubscribeMessage('friend:invite_game')
  async handleGameInvite(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { friendId: string },
  ) {
    try {
      const friendSocketId = this.userSockets.get(data.friendId);
      if (!friendSocketId) {
        return { success: false, error: 'User is offline' };
      }

      const sender = await this.prisma.user.findUnique({
        where: { id: client.userId },
        select: { username: true, displayName: true },
      });

      this.server.to(friendSocketId).emit('friend:game_invite_received', {
        senderId: client.userId,
        senderUsername: sender.username,
        senderDisplayName: sender.displayName || sender.username,
      });

      return { success: true, message: 'Game invite sent' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Respond to a game invite
  @SubscribeMessage('friend:respond_game_invite')
  async handleGameInviteResponse(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { senderId: string; accepted: boolean },
  ) {
    try {
      const senderSocketId = this.userSockets.get(data.senderId);
      
      if (data.accepted) {
        const roomId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Notify both players to start the game
        if (senderSocketId) {
          this.server.to(senderSocketId).emit('friend:game_start', { roomId, opponentId: client.userId });
        }
        this.server.to(client.id).emit('friend:game_start', { roomId, opponentId: data.senderId });

        return { success: true, roomId };
      } else {
        // Notify sender that invite was declined
        if (senderSocketId) {
          this.server.to(senderSocketId).emit('friend:game_invite_declined', {
            userId: client.userId,
          });
        }
        return { success: true, message: 'Game invite declined' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // Game Invitation WebSocket Methods
  // ============================================

  /**
   * Notify user about game invitation
   */
  async notifyGameInvitation(
    userId: string,
    invitationId: string,
    inviterId: string,
    inviterUsername: string,
    inviterDisplayName: string,
    gameMode: string,
  ) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('friend:game_invitation_received', {
        invitationId,
        inviterId,
        inviterUsername,
        inviterDisplayName,
        gameMode,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Notify inviter that invitation was accepted
   */
  async notifyGameInvitationAccepted(
    inviterId: string,
    invitationId: string,
    acceptedByUserId: string,
    gameMode: string,
  ) {
    const socketId = this.userSockets.get(inviterId);
    if (socketId) {
      this.server.to(socketId).emit('friend:game_invitation_accepted', {
        invitationId,
        acceptedByUserId,
        gameMode,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Notify user that game invitation was declined/cancelled
   */
  async notifyGameInvitationDeclined(
    userId: string,
    invitationId: string,
    declinedByUserId: string,
  ) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('friend:game_invitation_declined', {
        invitationId,
        declinedByUserId,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
