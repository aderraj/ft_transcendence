"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatService = class ChatService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    getAvatarUrl(filename) {
        if (!filename)
            return null;
        if (filename.startsWith('http'))
            return filename;
        const protocol = this.configService.get('USE_HTTPS') === 'true' ? 'https' : 'http';
        const host = this.configService.get('HOST_IP') || 'localhost';
        const port = this.configService.get('PORT') || '3001';
        return `${protocol}://${host}:${port}/uploads/avatars/${filename}`;
    }
    async getConversations(userId) {
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
        const conversationsMap = new Map();
        friendships.forEach((friendship) => {
            const friend = friendship.userId === userId ? friendship.friend : friendship.user;
            conversationsMap.set(friend.id, {
                user: friend,
                lastMessage: null,
                unreadCount: 0,
            });
        });
        messages.forEach((message) => {
            const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
            const otherUser = message.senderId === userId ? message.receiver : message.sender;
            if (conversationsMap.has(otherUserId)) {
                const conv = conversationsMap.get(otherUserId);
                if (!conv.lastMessage) {
                    conv.lastMessage = message;
                }
            }
            else {
                conversationsMap.set(otherUserId, {
                    user: otherUser,
                    lastMessage: message,
                    unreadCount: 0,
                });
            }
            if (message.receiverId === userId && !message.isRead) {
                const conv = conversationsMap.get(otherUserId);
                conv.unreadCount++;
            }
        });
        const conversations = Array.from(conversationsMap.values());
        return conversations.map((conv) => ({
            ...conv,
            user: {
                ...conv.user,
                avatar: this.getAvatarUrl(conv.user.avatar),
            },
        }));
    }
    async getMessages(userId, friendId, limit = 50, offset = 0) {
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
    async sendMessage(senderId, receiverId, content) {
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
    async markAsRead(messageId, userId) {
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
    async markAllAsRead(userId, friendId) {
        return this.prisma.message.updateMany({
            where: {
                senderId: friendId,
                receiverId: userId,
                isRead: false,
            },
            data: { isRead: true },
        });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], ChatService);
//# sourceMappingURL=chat.service.js.map