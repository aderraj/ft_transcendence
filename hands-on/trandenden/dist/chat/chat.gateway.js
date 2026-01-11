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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatGateway = class ChatGateway {
    prisma;
    server;
    onlineUsers = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleConnection(client) {
        try {
            const userId = client.handshake.query.userId;
            if (!userId) {
                client.disconnect();
                return;
            }
            this.onlineUsers.set(userId, client.id);
            await this.prisma.user.update({
                where: { id: userId },
                data: { status: 'ONLINE' },
            });
            this.server.emit('userOnline', { userId });
            console.log(`User ${userId} connected to chat`);
        }
        catch (error) {
            console.error('Connection error:', error);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        const userId = Array.from(this.onlineUsers.entries())
            .find(([_, socketId]) => socketId === client.id)?.[0];
        if (userId) {
            this.onlineUsers.delete(userId);
            await this.prisma.user.update({
                where: { id: userId },
                data: { status: 'OFFLINE' },
            });
            this.server.emit('userOffline', { userId });
            console.log(`User ${userId} disconnected from chat`);
        }
    }
    async handleMessage(data, client) {
        try {
            const userId = client.handshake.query.userId;
            if (!userId) {
                return { error: 'Unauthorized' };
            }
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
            let conversation = friendship.conversations[0];
            if (!conversation) {
                conversation = await this.prisma.conversation.create({
                    data: {
                        friendshipId: friendship.id,
                    },
                });
            }
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
            const recipientSocketId = this.onlineUsers.get(data.toId);
            if (recipientSocketId) {
                this.server.to(recipientSocketId).emit('messageReceived', {
                    id: message.id,
                    content: message.content,
                    from: message.from,
                    createdAt: message.createdAt,
                });
            }
            return {
                success: true,
                message: {
                    id: message.id,
                    content: message.content,
                    from: message.from,
                    createdAt: message.createdAt,
                },
            };
        }
        catch (error) {
            console.error('Message error:', error);
            return { error: 'Failed to send message' };
        }
    }
    handlePing(client) {
        return { event: 'pong', data: { timestamp: Date.now() } };
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handlePing", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/chat',
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map