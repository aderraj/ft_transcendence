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
      await this.prisma.user.update({
        where: { id: client.userId },
        data: { isOnline: true },
      });

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
      await this.prisma.user.update({
        where: { id: client.userId },
        data: { isOnline: false, lastSeen: new Date() },
      });

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
