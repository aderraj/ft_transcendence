import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(private prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract userId from handshake query (client must send ?userId=xxx)
      const userId = client.handshake.query.userId as string;
      
      if (!userId) {
        client.disconnect();
        return;
      }

      // Store user as online
      this.onlineUsers.set(userId, client.id);
      
      // Update user status in database
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: 'ONLINE' },
      });

      // Notify friends that user is online
      this.server.emit('userOnline', { userId });
      
      console.log(`User ${userId} connected to chat`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    // Find user by socket id and remove
    const userId = Array.from(this.onlineUsers.entries())
      .find(([_, socketId]) => socketId === client.id)?.[0];

    if (userId) {
      this.onlineUsers.delete(userId);
      
      // Update user status in database
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: 'OFFLINE' },
      });

      // Notify friends that user is offline
      this.server.emit('userOffline', { userId });
      
      console.log(`User ${userId} disconnected from chat`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { toId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.handshake.query.userId as string;

      if (!userId) {
        return { error: 'Unauthorized' };
      }

      // Check if users are friends
      const friendship = await this.prisma.friendship.findFirst({
        where: {
          OR: [
            { userId1: userId, userId2: data.toId },
            { userId1: data.toId, userId2: userId },
          ],
          isBlocked: false,
        },
        include: {
          conversations: true,
        },
      });

      if (!friendship) {
        return { error: 'You can only message friends' };
      }

      // Get or create conversation
      let conversation = friendship.conversations[0];
      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            friendshipId: friendship.id,
          },
        });
      }

      // Save message to database
      const message = await this.prisma.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          fromId: userId,
          toId: data.toId,
          content: data.content,
        },
        include: {
          from: {
            select: {
              id: true,
              username: true,
              profilePic: true,
            },
          },
        },
      });

      // Send message to recipient if online
      const recipientSocketId = this.onlineUsers.get(data.toId);
      if (recipientSocketId) {
        this.server.to(recipientSocketId).emit('messageReceived', {
          id: message.id,
          content: message.content,
          from: message.from,
          createdAt: message.createdAt,
        });
      }

      // Confirm to sender
      return {
        success: true,
        message: {
          id: message.id,
          content: message.content,
          from: message.from,
          createdAt: message.createdAt,
        },
      };
    } catch (error) {
      console.error('Message error:', error);
      return { error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: Date.now() } };
  }
}
