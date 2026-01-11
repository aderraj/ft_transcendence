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
exports.FriendsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
let FriendsService = class FriendsService {
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
    async getFriends(userId) {
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
    async getPendingRequests(userId) {
        const requests = await this.prisma.friendRequest.findMany({
            where: {
                receiverId: userId,
                status: client_1.FriendRequestStatus.PENDING,
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
    async getSentRequests(userId) {
        const requests = await this.prisma.friendRequest.findMany({
            where: {
                senderId: userId,
                status: client_1.FriendRequestStatus.PENDING,
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
    async sendFriendRequest(senderId, receiverId) {
        if (senderId === receiverId) {
            throw new common_1.BadRequestException('Cannot send friend request to yourself');
        }
        const receiver = await this.prisma.user.findUnique({
            where: { id: receiverId },
        });
        if (!receiver) {
            throw new common_1.NotFoundException('User not found');
        }
        const existingFriend = await this.prisma.friend.findFirst({
            where: {
                OR: [
                    { userId: senderId, friendId: receiverId },
                    { userId: receiverId, friendId: senderId },
                ],
            },
        });
        if (existingFriend) {
            throw new common_1.ConflictException('Already friends with this user');
        }
        const existingPendingRequest = await this.prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
                status: client_1.FriendRequestStatus.PENDING,
            },
        });
        if (existingPendingRequest) {
            throw new common_1.ConflictException('Friend request already exists');
        }
        const oldRequest = await this.prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
                status: {
                    in: [client_1.FriendRequestStatus.DECLINED, client_1.FriendRequestStatus.ACCEPTED],
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
    async acceptFriendRequest(userId, requestId) {
        const request = await this.prisma.friendRequest.findFirst({
            where: {
                id: requestId,
                receiverId: userId,
                status: client_1.FriendRequestStatus.PENDING,
            },
        });
        if (!request) {
            throw new common_1.NotFoundException('Friend request not found');
        }
        await this.prisma.$transaction([
            this.prisma.friendRequest.update({
                where: { id: requestId },
                data: { status: client_1.FriendRequestStatus.ACCEPTED },
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
    async declineFriendRequest(userId, requestId) {
        const request = await this.prisma.friendRequest.findFirst({
            where: {
                id: requestId,
                receiverId: userId,
                status: client_1.FriendRequestStatus.PENDING,
            },
        });
        if (!request) {
            throw new common_1.NotFoundException('Friend request not found');
        }
        await this.prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: client_1.FriendRequestStatus.DECLINED },
        });
        return { message: 'Friend request declined' };
    }
    async cancelFriendRequest(userId, requestId) {
        const request = await this.prisma.friendRequest.findFirst({
            where: {
                id: requestId,
                senderId: userId,
                status: client_1.FriendRequestStatus.PENDING,
            },
        });
        if (!request) {
            throw new common_1.NotFoundException('Friend request not found');
        }
        await this.prisma.friendRequest.delete({
            where: { id: requestId },
        });
        return { message: 'Friend request cancelled' };
    }
    async removeFriend(userId, friendId) {
        const friendship = await this.prisma.friend.findFirst({
            where: {
                userId,
                friendId,
            },
        });
        if (!friendship) {
            throw new common_1.NotFoundException('Friendship not found');
        }
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
    async areFriends(userId1, userId2) {
        const friendship = await this.prisma.friend.findFirst({
            where: {
                userId: userId1,
                friendId: userId2,
            },
        });
        return !!friendship;
    }
};
exports.FriendsService = FriendsService;
exports.FriendsService = FriendsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], FriendsService);
//# sourceMappingURL=friends.service.js.map