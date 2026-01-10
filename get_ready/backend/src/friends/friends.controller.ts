import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { UserEntity } from '../users/entities/user.entity';
import { FriendRequestEntity } from './entities/friend-request.entity';

@ApiTags('friends')
@Controller('friends')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all friends' })
  @ApiResponse({ status: 200, description: 'Returns list of friends', type: [UserEntity] })
  getFriends(@CurrentUser() user: any) {
    return this.friendsService.getFriends(user.sub);
  }

  @Get('requests/pending')
  @ApiOperation({ summary: 'Get pending friend requests received' })
  @ApiResponse({ status: 200, description: 'Returns pending requests', type: [FriendRequestEntity] })
  getPendingRequests(@CurrentUser() user: any) {
    return this.friendsService.getPendingRequests(user.sub);
  }

  @Get('requests/sent')
  @ApiOperation({ summary: 'Get sent friend requests' })
  @ApiResponse({ status: 200, description: 'Returns sent requests', type: [FriendRequestEntity] })
  getSentRequests(@CurrentUser() user: any) {
    return this.friendsService.getSentRequests(user.sub);
  }

  @Post('request/:userId')
  @ApiOperation({ summary: 'Send friend request' })
  @ApiResponse({ status: 201, description: 'Friend request sent', type: FriendRequestEntity })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Already friends or request exists' })
  sendFriendRequest(
    @CurrentUser() user: any,
    @Param('userId', ParseUUIDPipe) receiverId: string,
  ) {
    return this.friendsService.sendFriendRequest(user.sub, receiverId);
  }

  @Post('request/:requestId/accept')
  @ApiOperation({ summary: 'Accept friend request' })
  @ApiResponse({ status: 200, description: 'Friend request accepted' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  acceptFriendRequest(
    @CurrentUser() user: any,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.friendsService.acceptFriendRequest(user.sub, requestId);
  }

  @Post('request/:requestId/decline')
  @ApiOperation({ summary: 'Decline friend request' })
  @ApiResponse({ status: 200, description: 'Friend request declined' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  declineFriendRequest(
    @CurrentUser() user: any,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.friendsService.declineFriendRequest(user.sub, requestId);
  }

  @Delete('request/:requestId')
  @ApiOperation({ summary: 'Cancel sent friend request' })
  @ApiResponse({ status: 200, description: 'Friend request cancelled' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  cancelFriendRequest(
    @CurrentUser() user: any,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.friendsService.cancelFriendRequest(user.sub, requestId);
  }

  @Delete(':friendId')
  @ApiOperation({ summary: 'Remove friend' })
  @ApiResponse({ status: 200, description: 'Friend removed' })
  @ApiResponse({ status: 404, description: 'Friendship not found' })
  removeFriend(
    @CurrentUser() user: any,
    @Param('friendId', ParseUUIDPipe) friendId: string,
  ) {
    return this.friendsService.removeFriend(user.sub, friendId);
  }
}
