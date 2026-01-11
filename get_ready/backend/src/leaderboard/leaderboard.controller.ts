import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../common/decorators';

@ApiTags('leaderboard')
@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get global leaderboard (public)' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of players to return' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of players to skip' })
  @ApiResponse({ status: 200, description: 'Returns leaderboard' })
  getLeaderboard(@Query('take') take?: number, @Query('skip') skip?: number) {
    return this.leaderboardService.getLeaderboard(take || 50, skip || 0);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user stats and rank' })
  @ApiResponse({ status: 200, description: 'Returns user stats' })
  getMyStats(@CurrentUser() user: any) {
    return this.leaderboardService.getUserStats(user.sub);
  }

  @Get('top-winners')
  @ApiOperation({ summary: 'Get top players by wins' })
  @ApiResponse({ status: 200, description: 'Returns top winners' })
  getTopWinners() {
    return this.leaderboardService.getTopByWins(10);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get specific user stats and rank' })
  @ApiResponse({ status: 200, description: 'Returns user stats' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.leaderboardService.getUserStats(userId);
  }

  @Get('user/:userId/history')
  @ApiOperation({ summary: 'Get user game history' })
  @ApiResponse({ status: 200, description: 'Returns game history' })
  getUserHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('take') take?: number,
  ) {
    return this.leaderboardService.getGameHistory(userId, take || 10);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Get current user game history' })
  @ApiResponse({ status: 200, description: 'Returns game history' })
  getMyHistory(@CurrentUser() user: any, @Query('take') take?: number) {
    return this.leaderboardService.getGameHistory(user.sub, take || 10);
  }
}
