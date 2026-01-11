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
exports.LeaderboardService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let LeaderboardService = class LeaderboardService {
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
    async getLeaderboard(take = 50, skip = 0) {
        const [players, total] = await Promise.all([
            this.prisma.user.findMany({
                take,
                skip,
                orderBy: [
                    { level: 'desc' },
                    { experience: 'desc' },
                ],
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                    level: true,
                    experience: true,
                    wins: true,
                    losses: true,
                },
            }),
            this.prisma.user.count(),
        ]);
        const rankedPlayers = players.map((player, index) => ({
            rank: skip + index + 1,
            ...player,
            avatar: this.getAvatarUrl(player.avatar),
            totalGames: player.wins + player.losses,
            winRate: player.wins + player.losses > 0
                ? Math.round((player.wins / (player.wins + player.losses)) * 100)
                : 0,
        }));
        return { players: rankedPlayers, total, take, skip };
    }
    async getUserStats(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                level: true,
                experience: true,
                wins: true,
                losses: true,
            },
        });
        if (!user) {
            return null;
        }
        const higherRanked = await this.prisma.user.count({
            where: {
                OR: [
                    { level: { gt: user.level } },
                    {
                        AND: [
                            { level: user.level },
                            { experience: { gt: user.experience } },
                        ],
                    },
                ],
            },
        });
        const totalGames = user.wins + user.losses;
        const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;
        return {
            rank: higherRanked + 1,
            ...user,
            avatar: this.getAvatarUrl(user.avatar),
            totalGames,
            winRate,
        };
    }
    async getGameHistory(userId, take = 10) {
        const games = await this.prisma.game.findMany({
            where: {
                OR: [{ player1Id: userId }, { player2Id: userId }],
                status: 'FINISHED',
            },
            take,
            orderBy: { finishedAt: 'desc' },
            select: {
                id: true,
                player1Id: true,
                player2Id: true,
                player1Score: true,
                player2Score: true,
                winnerId: true,
                finishedAt: true,
                player1: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
                player2: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
            },
        });
        return games.map(game => ({
            ...game,
            player1: {
                ...game.player1,
                avatar: this.getAvatarUrl(game.player1.avatar),
            },
            player2: {
                ...game.player2,
                avatar: this.getAvatarUrl(game.player2.avatar),
            },
        }));
    }
    async getTopByWins(take = 10) {
        const players = await this.prisma.user.findMany({
            take,
            orderBy: { wins: 'desc' },
            where: { wins: { gt: 0 } },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                wins: true,
                losses: true,
                level: true,
                experience: true,
            },
        });
        return players.map(player => ({
            ...player,
            avatar: this.getAvatarUrl(player.avatar),
        }));
    }
};
exports.LeaderboardService = LeaderboardService;
exports.LeaderboardService = LeaderboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], LeaderboardService);
//# sourceMappingURL=leaderboard.service.js.map