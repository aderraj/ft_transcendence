import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getAvatarUrl(filename: string | null): string | null {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    // Return relative URL - works with reverse proxy
    return `/uploads/avatars/${filename}`;
  }

  // Get global leaderboard ranked by level and experience
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

    // Add rank to each player
    const rankedPlayers = players.map((player, index) => ({
      rank: skip + index + 1,
      ...player,
      avatar: this.getAvatarUrl(player.avatar),
      totalGames: player.wins + player.losses,
      winRate:
        player.wins + player.losses > 0
          ? Math.round((player.wins / (player.wins + player.losses)) * 100)
          : 0,
    }));

    return { players: rankedPlayers, total, take, skip };
  }

  // Get user's rank and stats
  async getUserStats(userId: string) {
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

    // Count users with higher level or same level but higher experience
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

  // Get recent game history for a user
  async getGameHistory(userId: string, take = 10) {
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

  // Get top players by different criteria
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
}
