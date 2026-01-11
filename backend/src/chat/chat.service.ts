import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getAvatarUrl(filename: string | null): string | null {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    const protocol = this.configService.get('USE_HTTPS') === 'true' ? 'https' : 'http';
    const host = this.configService.get('HOST_IP') || 'localhost';
    const port = this.configService.get('PORT') || '3001';
    return `${protocol}://${host}:${port}/uploads/avatars/${filename}`;
  }

  // Get all conversations for a user
  async getConversations(userId: string) {
    // Get all friends
    const friendships = await this.prisma.friend.findMany({
      where: {
        OR: [
          { userId: userId },
          { friendId: userId },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isOnline: true,
          },
        },
        friend: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isOnline: true,
          },
        },
      },
    });

    // Get all messages
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isOnline: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isOnline: true,
          },
        },
      },
    });

    // Create conversations map with all friends
    const conversationsMap = new Map();

    // First, add all friends to the map
    friendships.forEach((friendship) => {
      const friend = friendship.userId === userId ? friendship.friend : friendship.user;
      conversationsMap.set(friend.id, {
        user: friend,
        lastMessage: null,
        unreadCount: 0,
      });
    });

    // Then, update with message data
    messages.forEach((message) => {
      const otherUserId =
        message.senderId === userId ? message.receiverId : message.senderId;
      const otherUser =
        message.senderId === userId ? message.receiver : message.sender;

      if (conversationsMap.has(otherUserId)) {
        const conv = conversationsMap.get(otherUserId);
        // Only update if this is the latest message
        if (!conv.lastMessage) {
          conv.lastMessage = message;
        }
      } else {
        // Add conversation even if not friends (for existing message history)
        conversationsMap.set(otherUserId, {
          user: otherUser,
          lastMessage: message,
          unreadCount: 0,
        });
      }

      // Count unread messages
      if (message.receiverId === userId && !message.isRead) {
        const conv = conversationsMap.get(otherUserId);
        conv.unreadCount++;
      }
    });

    const conversations = Array.from(conversationsMap.values());
    return conversations.map((conv: any) => ({
      ...conv,
      user: {
        ...conv.user,
        avatar: this.getAvatarUrl(conv.user.avatar),
      },
    }));
  }

  // Get message history between two users
  async getMessages(userId: string, friendId: string, limit = 50, offset = 0) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
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

    return messages.map((msg) => ({
      ...msg,
      sender: {
        ...msg.sender,
        avatar: this.getAvatarUrl(msg.sender.avatar),
      },
    }));
  }

  // Send a message
  async sendMessage(senderId: string, receiverId: string, content: string) {
    // Check if users are friends
    const friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId },
        ],
      },
    });

    if (!friendship) {
      throw new Error('You can only send messages to friends');
    }

    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
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

    return {
      ...message,
      sender: {
        ...message.sender,
        avatar: this.getAvatarUrl(message.sender.avatar),
      },
      receiver: {
        ...message.receiver,
        avatar: this.getAvatarUrl(message.receiver.avatar),
      },
    };
  }

  // Mark messages as read
  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.receiverId !== userId) {
      throw new Error('Message not found or unauthorized');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  // Mark all messages from a user as read
  async markAllAsRead(userId: string, friendId: string) {
    return this.prisma.message.updateMany({
      where: {
        senderId: friendId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }
}
