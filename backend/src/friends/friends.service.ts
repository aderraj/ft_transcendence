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
    return `${protocol}://${host}:${port}/uploads/avatars/${filename}`;
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

    // Check for existing pending request
    const existingPendingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        status: FriendRequestStatus.PENDING,
      },
    });
    if (existingPendingRequest) {
      throw new ConflictException('Friend request already exists');
    }

    // Check for any declined or accepted request and delete it
    // This handles cases where the request was previously declined
    const oldRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        status: {
          in: [FriendRequestStatus.DECLINED, FriendRequestStatus.ACCEPTED],
        },
      },
    });
    
    if (oldRequest) {
      await this.prisma.friendRequest.delete({
        where: { id: oldRequest.id },
      });
    }

    return this.prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
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

  // ============================================
  // Game Invitation Methods
  // ============================================

  /**
   * Invite a friend to play a game
   */
  async inviteFriendToGame(
    inviterId: string,
    inviteeId: string,
    gameMode: string = 'remote',
  ) {
    // Check if users are friends
    const areFriends = await this.areFriends(inviterId, inviteeId);
    if (!areFriends) {
      throw new BadRequestException('You can only invite friends to play');
    }

    // Check if invitee exists and is online (optional check)
    const invitee = await this.prisma.user.findUnique({
      where: { id: inviteeId },
      select: { id: true, username: true, displayName: true, isOnline: true },
    });

    if (!invitee) {
      throw new NotFoundException('Friend not found');
    }

    // Optional: Check if user is online
    // if (!invitee.isOnline) {
    //   throw new BadRequestException('Friend is currently offline');
    // }

    // Clean up expired invitations first
    await this.prisma.gameInvitation.deleteMany({
      where: {
        inviterId,
        inviteeId,
        status: 'PENDING',
        expiresAt: { lte: new Date() },
      },
    });

    // Check for existing pending game invitation
    const existingInvitation = await this.prisma.gameInvitation.findFirst({
      where: {
        inviterId,
        inviteeId,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
    });

    if (existingInvitation) {
      throw new ConflictException('Game invitation already sent to this friend');
    }

    // Create game invitation (expires in 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const invitation = await this.prisma.gameInvitation.create({
      data: {
        inviterId,
        inviteeId,
        gameMode,
        status: 'PENDING',
        expiresAt,
      },
      include: {
        inviter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        invitee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    return {
      invitationId: invitation.id,
      gameMode: invitation.gameMode,
      inviter: {
        ...invitation.inviter,
        avatar: this.getAvatarUrl(invitation.inviter.avatar),
      },
      invitee: {
        ...invitation.invitee,
        avatar: this.getAvatarUrl(invitation.invitee.avatar),
      },
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Accept game invitation
   */
  async acceptGameInvitation(userId: string, invitationId: string) {
    // Find invitation
    const invitation = await this.prisma.gameInvitation.findUnique({
      where: { id: invitationId },
      include: {
        inviter: {
          select: { id: true, username: true, displayName: true },
        },
        invitee: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Game invitation not found');
    }

    // Verify the user is the invitee
    if (invitation.inviteeId !== userId) {
      throw new BadRequestException('This invitation is not for you');
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation has already been processed');
    }

    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      // Delete expired invitation
      await this.prisma.gameInvitation.delete({ where: { id: invitationId } });
      throw new BadRequestException('Invitation has expired');
    }

    // Update invitation status
    await this.prisma.gameInvitation.update({
      where: { id: invitationId },
      data: { status: 'ACCEPTED' },
    });

    // Generate game session details
    const gameServerUrl = process.env.GAME_SERVER_URL || 'ws://localhost:3002/websocket';
    const roomId = `game-${invitation.inviterId}-${invitation.inviteeId}-${Date.now()}`;

    return {
      message: 'Game invitation accepted',
      gameSession: {
        invitationId: invitation.id,
        gameMode: invitation.gameMode,
        player1Id: invitation.inviterId,
        player1Username: invitation.inviter.username,
        player2Id: invitation.inviteeId,
        player2Username: invitation.invitee.username,
        gameServerUrl,
        roomId,
        connectionParams: {
          user_id: userId,
          room: roomId,
          mode: invitation.gameMode,
        },
      },
    };
  }

  /**
   * Decline game invitation
   */
  async declineGameInvitation(userId: string, invitationId: string) {
    const invitation = await this.prisma.gameInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Game invitation not found');
    }

    // User can decline if they are invitee or cancel if they are inviter
    if (invitation.inviteeId !== userId && invitation.inviterId !== userId) {
      throw new BadRequestException('You are not part of this invitation');
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation has already been processed');
    }

    // Update status
    await this.prisma.gameInvitation.update({
      where: { id: invitationId },
      data: { status: 'DECLINED' },
    });

    return {
      message:
        invitation.inviteeId === userId
          ? 'Game invitation declined'
          : 'Game invitation cancelled',
      inviterId: invitation.inviterId,
      inviteeId: invitation.inviteeId,
    };
  }

  /**
   * Get pending game invitations (received and sent)
   */
  async getPendingGameInvitations(userId: string) {
    const now = new Date();

    // Get received invitations
    const received = await this.prisma.gameInvitation.findMany({
      where: {
        inviteeId: userId,
        status: 'PENDING',
        expiresAt: { gt: now },
      },
      include: {
        inviter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isOnline: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get sent invitations
    const sent = await this.prisma.gameInvitation.findMany({
      where: {
        inviterId: userId,
        status: 'PENDING',
        expiresAt: { gt: now },
      },
      include: {
        invitee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isOnline: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Clean up expired invitations
    await this.prisma.gameInvitation.deleteMany({
      where: {
        OR: [{ inviterId: userId }, { inviteeId: userId }],
        status: 'PENDING',
        expiresAt: { lte: now },
      },
    });

    return {
      received: received.map((inv) => ({
        id: inv.id,
        gameMode: inv.gameMode,
        inviter: {
          ...inv.inviter,
          avatar: this.getAvatarUrl(inv.inviter.avatar),
        },
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
      })),
      sent: sent.map((inv) => ({
        id: inv.id,
        gameMode: inv.gameMode,
        invitee: {
          ...inv.invitee,
          avatar: this.getAvatarUrl(inv.invitee.avatar),
        },
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
      })),
    };
  }
}
