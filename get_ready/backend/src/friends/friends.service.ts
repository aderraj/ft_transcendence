import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendRequestStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FriendsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getAvatarUrl(filename: string | null): string | null {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    const protocol =
      this.configService.get('USE_HTTPS') === 'true' ? 'https' : 'http';
    const host = this.configService.get('HOST_IP') || 'localhost';
    const port = this.configService.get('PORT') || '3001';
    return `${protocol}://${host}:${port}/uploads/avatar/${filename}`;
  }

  // Get all friends for a user
  async getFriends(userId: string) {
    const friends = await this.prisma.friend.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
    });

    return friends.map((f) => ({
      ...f.friend,
      avatar: this.getAvatarUrl(f.friend.avatar),
    }));
  }

  // Get pending friend requests received
  async getPendingRequests(userId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: FriendRequestStatus.PENDING,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    return requests.map(req => ({
      ...req,
      sender: {
        ...req.sender,
        avatar: this.getAvatarUrl(req.sender.avatar),
      }
    }));
  }

  // Get sent friend requests
  async getSentRequests(userId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        senderId: userId,
        status: FriendRequestStatus.PENDING,
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    return requests.map(req => ({
      ...req,
      receiver: {
        ...req.receiver,
        avatar: this.getAvatarUrl(req.receiver.avatar),
      }
    }));
  }

  // Send friend request
  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    // Check if already friends
    const existingFriend = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId },
        ],
      },
    });
    if (existingFriend) {
      throw new ConflictException('Already friends with this user');
    }

    // Check for existing request
    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        status: FriendRequestStatus.PENDING,
      },
    });
    if (existingRequest) {
      throw new ConflictException('Friend request already exists');
    }

    return this.prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });
  }

  // Accept friend request
  async acceptFriendRequest(userId: string, requestId: string) {
    const request = await this.prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        receiverId: userId,
        status: FriendRequestStatus.PENDING,
      },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    // Create bidirectional friendship
    await this.prisma.$transaction([
      this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: FriendRequestStatus.ACCEPTED },
      }),
      this.prisma.friend.create({
        data: {
          userId: request.senderId,
          friendId: request.receiverId,
        },
      }),
      this.prisma.friend.create({
        data: {
          userId: request.receiverId,
          friendId: request.senderId,
        },
      }),
    ]);

    return { message: 'Friend request accepted' };
  }

  // Decline friend request
  async declineFriendRequest(userId: string, requestId: string) {
    const request = await this.prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        receiverId: userId,
        status: FriendRequestStatus.PENDING,
      },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: FriendRequestStatus.DECLINED },
    });

    return { message: 'Friend request declined' };
  }

  // Cancel sent friend request
  async cancelFriendRequest(userId: string, requestId: string) {
    const request = await this.prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        senderId: userId,
        status: FriendRequestStatus.PENDING,
      },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    await this.prisma.friendRequest.delete({
      where: { id: requestId },
    });

    return { message: 'Friend request cancelled' };
  }

  // Remove friend
  async removeFriend(userId: string, friendId: string) {
    const friendship = await this.prisma.friend.findFirst({
      where: {
        userId,
        friendId,
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // Remove bidirectional friendship
    await this.prisma.$transaction([
      this.prisma.friend.deleteMany({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
        },
      }),
    ]);

    return { message: 'Friend removed' };
  }

  // Check if two users are friends
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await this.prisma.friend.findFirst({
      where: {
        userId: userId1,
        friendId: userId2,
      },
    });
    return !!friendship;
  }
}
