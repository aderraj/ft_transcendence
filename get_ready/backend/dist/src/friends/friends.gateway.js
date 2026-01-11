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
exports.FriendsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const friends_service_1 = require("./friends.service");
const swagger_1 = require("@nestjs/swagger");
const getAllowedOrigins = () => {
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
    const origins = allowedOriginsEnv
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => origin.length > 0);
    if (origins.length === 0) {
        return process.env.FRONTEND_URL || '*';
    }
    return origins;
};
let FriendsGateway = class FriendsGateway {
    constructor(jwtService, friendsService, prisma) {
        this.jwtService = jwtService;
        this.friendsService = friendsService;
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
            await this.prisma.user.update({
                where: { id: client.userId },
                data: { isOnline: true },
            });
            await this.notifyFriendsStatus(client.userId, true);
        }
        catch (error) {
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        if (client.userId) {
            this.userSockets.delete(client.userId);
            await this.prisma.user.update({
                where: { id: client.userId },
                data: { isOnline: false, lastSeen: new Date() },
            });
            await this.notifyFriendsStatus(client.userId, false);
        }
    }
    async notifyFriendsStatus(userId, isOnline) {
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
    async notifyFriendRequest(receiverId, requestId, senderId, senderUsername, senderDisplayName) {
        const receiverSocketId = this.userSockets.get(receiverId);
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('friend:request_received', {
                requestId,
                senderId,
                senderUsername,
                senderDisplayName,
            });
        }
    }
    async handleAcceptFriendRequest(client, data) {
        try {
            await this.friendsService.acceptFriendRequest(client.userId, data.requestId);
            const request = await this.prisma.friendRequest.findUnique({
                where: { id: data.requestId },
                include: {
                    sender: { select: { id: true, username: true, displayName: true } },
                    receiver: { select: { id: true, username: true, displayName: true } },
                },
            });
            if (request) {
                const senderSocketId = this.userSockets.get(request.senderId);
                if (senderSocketId) {
                    this.server.to(senderSocketId).emit('friend:request_accepted', {
                        userId: request.receiverId,
                        username: request.receiver.username,
                        displayName: request.receiver.displayName,
                    });
                }
                this.server.to(client.id).emit('friend:request_accepted', {
                    userId: request.senderId,
                    username: request.sender.username,
                    displayName: request.sender.displayName,
                });
            }
            return { success: true, message: 'Friend request accepted' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleGameInvite(client, data) {
        try {
            const friendSocketId = this.userSockets.get(data.friendId);
            if (!friendSocketId) {
                return { success: false, error: 'User is offline' };
            }
            const sender = await this.prisma.user.findUnique({
                where: { id: client.userId },
                select: { username: true, displayName: true },
            });
            this.server.to(friendSocketId).emit('friend:game_invite_received', {
                senderId: client.userId,
                senderUsername: sender.username,
                senderDisplayName: sender.displayName || sender.username,
            });
            return { success: true, message: 'Game invite sent' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleGameInviteResponse(client, data) {
        try {
            const senderSocketId = this.userSockets.get(data.senderId);
            if (data.accepted) {
                const roomId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                if (senderSocketId) {
                    this.server.to(senderSocketId).emit('friend:game_start', { roomId, opponentId: client.userId });
                }
                this.server.to(client.id).emit('friend:game_start', { roomId, opponentId: data.senderId });
                return { success: true, roomId };
            }
            else {
                if (senderSocketId) {
                    this.server.to(senderSocketId).emit('friend:game_invite_declined', {
                        userId: client.userId,
                    });
                }
                return { success: true, message: 'Game invite declined' };
            }
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
};
exports.FriendsGateway = FriendsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], FriendsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('friend:accept_request'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FriendsGateway.prototype, "handleAcceptFriendRequest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('friend:invite_game'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FriendsGateway.prototype, "handleGameInvite", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('friend:respond_game_invite'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FriendsGateway.prototype, "handleGameInviteResponse", null);
exports.FriendsGateway = FriendsGateway = __decorate([
    (0, swagger_1.ApiTags)('friends'),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: getAllowedOrigins(),
            credentials: true,
        },
        namespace: '/friends',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        friends_service_1.FriendsService,
        prisma_service_1.PrismaService])
], FriendsGateway);
//# sourceMappingURL=friends.gateway.js.map