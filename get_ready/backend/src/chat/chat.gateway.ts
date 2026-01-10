import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract JWT from handshake
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;

      // Store socket connection
      this.userSockets.set(client.userId, client.id);

      // Update user online status
      try {
        await this.prisma.user.update({
          where: { id: client.userId },
          data: { isOnline: true },
        });
      } catch (error) {
        if (error.code !== 'P2025') { // Ignore RecordNotFound
           console.error('Failed to update online status:', error);
        }
      }

      // Notify friends about online status
      this.notifyFriendsStatus(client.userId, true);

      console.log(`Client connected: ${client.id}, User: ${client.userId}`);
    } catch (error) {
      console.error('WebSocket auth error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.userSockets.delete(client.userId);

      // Update user offline status
      try {
        await this.prisma.user.update({
          where: { id: client.userId },
          data: { isOnline: false, lastSeen: new Date() },
        });
      } catch (error) {
        if (error.code !== 'P2025') { // Ignore RecordNotFound
           console.error('Failed to update offline status:', error);
        }
      }

      // Notify friends about offline status
      this.notifyFriendsStatus(client.userId, false);

      console.log(`Client disconnected: ${client.id}, User: ${client.userId}`);
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId: string; content: string },
  ) {
    try {
      const message = await this.chatService.sendMessage(
        client.userId,
        data.receiverId,
        data.content,
      );

      // Send message to receiver if online
      const receiverSocketId = this.userSockets.get(data.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('message:receive', message);
      }

      // Confirm to sender
      client.emit('message:sent', message);

      return message;
    } catch (error) {
      client.emit('message:error', { error: error.message });
    }
  }

  @SubscribeMessage('message:read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      await this.chatService.markAsRead(data.messageId, client.userId);

      // Notify sender that message was read
      const message = await this.prisma.message.findUnique({
        where: { id: data.messageId },
      });

      if (message) {
        const senderSocketId = this.userSockets.get(message.senderId);
        if (senderSocketId) {
          this.server
            .to(senderSocketId)
            .emit('message:read', { messageId: data.messageId });
        }
      }
    } catch (error) {
      client.emit('message:error', { error: error.message });
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId: string },
  ) {
    const receiverSocketId = this.userSockets.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('typing:start', {
        userId: client.userId,
      });
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId: string },
  ) {
    const receiverSocketId = this.userSockets.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('typing:stop', {
        userId: client.userId,
      });
    }
  }

  @SubscribeMessage('invite_game')
  async handleGameInvite(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { friendId: string },
  ) {
    const friendSocketId = this.userSockets.get(data.friendId);
    if (friendSocketId) {
      const sender = await this.prisma.user.findUnique({
        where: { id: client.userId },
        select: { username: true, displayName: true },
      });

      this.server.to(friendSocketId).emit('receive_invite', {
        senderId: client.userId,
        senderName: sender.displayName || sender.username,
      });

      return { success: true, message: 'Invite sent' };
    }
    return { success: false, error: 'User is offline' };
  }

  @SubscribeMessage('respond_invite')
  async handleInviteResponse(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { senderId: string; accepted: boolean },
  ) {
    const senderSocketId = this.userSockets.get(data.senderId);
    
    if (data.accepted) { 
      // Create room and notify both
      const roomId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Notify Sender (User A)
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('game_start', { roomId });
      }
      
      // Notify Accepter (User B - Client)
      // client is a Socket, which has emit
      (client as Socket).emit('game_start', { roomId });
      
    } else {
      // Notify Sender of Refusal
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('invite_declined', { 
           receiverId: client.userId 
        });
      }
    }
  }

  private async notifyFriendsStatus(userId: string, isOnline: boolean) {
    // Get user's friends
    const friends = await this.prisma.friend.findMany({
      where: {
        OR: [{ userId: userId }, { friendId: userId }],
      },
    });

    // Notify each online friend
    friends.forEach((friendship) => {
      const friendId =
        friendship.userId === userId
          ? friendship.friendId
          : friendship.userId;
      const friendSocketId = this.userSockets.get(friendId);

      if (friendSocketId) {
        this.server.to(friendSocketId).emit('friend:status', {
          userId: userId,
          isOnline: isOnline,
        });
      }
    });
  }
}
