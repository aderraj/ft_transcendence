import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
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

@ApiTags('friends')
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
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

  @ApiOperation({ summary: 'Handles socket connection for friend status updates' })
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

      // Update online status
      await this.prisma.user.update({
        where: { id: client.userId },
        data: { isOnline: true },
      });

      // Notify friends
      await this.notifyFriendsStatus(client.userId, true);

      console.log(`Friends/Presence: User ${client.userId} connected`);
    } catch (error) {
      console.error('FriendsGateway connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.userSockets.delete(client.userId);

      // Update offline status
      await this.prisma.user.update({
        where: { id: client.userId },
        data: { isOnline: false, lastSeen: new Date() },
      });

      // Notify friends
      await this.notifyFriendsStatus(client.userId, false);

      console.log(`Friends/Presence: User ${client.userId} disconnected`);
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
}
