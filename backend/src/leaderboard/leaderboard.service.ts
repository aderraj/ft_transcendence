import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  // Get global leaderboard ranked by ELO
  async getLeaderboard(take = 50, skip = 0) {
    const [players, total] = await Promise.all([
      this.prisma.user.findMany({
        take,
        skip,
        orderBy: { elo: 'desc' },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          elo: true,
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
        elo: true,
        wins: true,
        losses: true,
      },
    });

    if (!user) {
      return null;
    }

    // Count users with higher ELO to determine rank
    const higherRanked = await this.prisma.user.count({
      where: { elo: { gt: user.elo } },
    });

    const totalGames = user.wins + user.losses;
    const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;

    return {
      rank: higherRanked + 1,
      ...user,
      totalGames,
      winRate,
    };
  }

  // Get recent game history for a user
  async getGameHistory(userId: string, take = 10) {
    return this.prisma.game.findMany({
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
  }

  // Get top players by different criteria
  async getTopByWins(take = 10) {
    return this.prisma.user.findMany({
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
        elo: true,
      },
    });
  }
}
