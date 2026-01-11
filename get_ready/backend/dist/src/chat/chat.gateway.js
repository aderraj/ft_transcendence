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
const jwt_1 = require("@nestjs/jwt");
const chat_service_1 = require("./chat.service");
const prisma_service_1 = require("../prisma/prisma.service");
const getAllowedOrigins = () => {
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
    const origins = allowedOriginsEnv
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => origin.length > 0);
    if (origins.length === 0) {
        return process.env.FRONTEND_URL || 'http://localhost:3000';
    }
    return origins;
};
let ChatGateway = class ChatGateway {
    constructor(jwtService, chatService, prisma) {
        this.jwtService = jwtService;
        this.chatService = chatService;
        this.prisma = prisma;
        this.userSockets = new Map();
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token ||
                client.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            client.userId = payload.sub;
            this.userSockets.set(client.userId, client.id);
        }
        catch (error) {
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        if (client.userId) {
            this.userSockets.delete(client.userId);
        }
    }
    async handleSendMessage(client, data) {
        try {
            const message = await this.chatService.sendMessage(client.userId, data.receiverId, data.content);
            const receiverSocketId = this.userSockets.get(data.receiverId);
            if (receiverSocketId) {
                this.server.to(receiverSocketId).emit('message:receive', message);
            }
            client.emit('message:sent', message);
            return message;
        }
        catch (error) {
            client.emit('message:error', { error: error.message });
        }
    }
    async handleMarkAsRead(client, data) {
        try {
            await this.chatService.markAsRead(data.messageId, client.userId);
            const message = await this.prisma.message.findUnique({
                where: { id: data.messageId },
            });
            if (message) {
                const senderSocketId = this.userSockets.get(message.senderId);
                if (senderSocketId) {
                    this.server.to(senderSocketId).emit('message:read', { messageId: data.messageId });
                }
            }
        }
        catch (error) {
            client.emit('message:error', { error: error.message });
        }
    }
    handleTypingStart(client, data) {
        const receiverSocketId = this.userSockets.get(data.receiverId);
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('typing:start', { userId: client.userId });
        }
    }
    handleTypingStop(client, data) {
        const receiverSocketId = this.userSockets.get(data.receiverId);
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('typing:stop', { userId: client.userId });
        }
    }
    async handleGameInvite(client, data) {
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
    async handleInviteResponse(client, data) {
        const senderSocketId = this.userSockets.get(data.senderId);
        if (data.accepted) {
            const roomId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            if (senderSocketId) {
                this.server.to(senderSocketId).emit('game_start', { roomId });
            }
            client.emit('game_start', { roomId });
        }
        else {
            if (senderSocketId) {
                this.server.to(senderSocketId).emit('invite_declined', { receiverId: client.userId });
            }
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('message:send'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('message:read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkAsRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing:start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTypingStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing:stop'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTypingStop", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('invite_game'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleGameInvite", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('respond_invite'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleInviteResponse", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: getAllowedOrigins(),
            credentials: true,
        },
        namespace: '/chat',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        chat_service_1.ChatService,
        prisma_service_1.PrismaService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map