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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async findAll(take = 20, skip = 0) {
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                take,
                skip,
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                    isOnline: true,
                    level: true,
                    experience: true,
                    wins: true,
                    losses: true,
                    createdAt: true,
                },
                orderBy: [
                    { level: 'desc' },
                    { experience: 'desc' },
                ],
            }),
            this.prisma.user.count(),
        ]);
        const protocol = this.configService.get('USE_HTTPS') === 'true' ? 'https' : 'http';
        const host = this.configService.get('HOST_IP') || 'localhost';
        const port = this.configService.get('PORT') || '3001';
        const usersWithAvatarUrls = users.map((user) => ({
            ...user,
            avatar: user.avatar && !user.avatar.startsWith('http') ? `${protocol}://${host}:${port}/uploads/avatars/${user.avatar}` : user.avatar,
        }));
        return { users: usersWithAvatarUrls, total, take, skip };
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
                level: true,
                experience: true,
                wins: true,
                losses: true,
                createdAt: true,
                twoFactorEnabled: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        if (user.avatar && !user.avatar.startsWith('http')) {
            const protocol = this.configService.get('USE_HTTPS') === 'true' ? 'https' : 'http';
            const host = this.configService.get('HOST_IP') || 'localhost';
            const port = this.configService.get('PORT') || '3001';
            user.avatar = `${protocol}://${host}:${port}/uploads/avatars/${user.avatar}`;
        }
        return user;
    }
    async findByUsername(username) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isOnline: true,
                level: true,
                experience: true,
                wins: true,
                losses: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User ${username} not found`);
        }
        if (user.avatar && !user.avatar.startsWith('http')) {
            const protocol = this.configService.get('USE_HTTPS') === 'true' ? 'https' : 'http';
            const host = this.configService.get('HOST_IP') || 'localhost';
            const port = this.configService.get('PORT') || '3001';
            user.avatar = `${protocol}://${host}:${port}/uploads/avatars/${user.avatar}`;
        }
        return user;
    }
    async update(id, updateUserDto) {
        if (updateUserDto.username) {
            const existing = await this.prisma.user.findFirst({
                where: {
                    username: updateUserDto.username,
                    NOT: { id },
                },
            });
            if (existing) {
                throw new common_1.ConflictException('Username already taken');
            }
        }
        try {
            return await this.prisma.user.update({
                where: { id },
                data: updateUserDto,
                select: {
                    id: true,
                    email: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                },
            });
        }
        catch (error) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
    }
    async updateOnlineStatus(id, isOnline) {
        return this.prisma.user.update({
            where: { id },
            data: {
                isOnline,
                lastSeen: new Date(),
            },
        });
    }
    async updateAvatar(id, avatarUrl) {
        return this.prisma.user.update({
            where: { id },
            data: { avatar: avatarUrl },
            select: {
                id: true,
                avatar: true,
            },
        });
    }
    async delete(id) {
        try {
            await this.prisma.user.delete({ where: { id } });
            return { message: 'User deleted successfully' };
        }
        catch (error) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], UsersService);
//# sourceMappingURL=users.service.js.map