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
exports.FriendsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const friends_service_1 = require("./friends.service");
const friends_gateway_1 = require("./friends.gateway");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const decorators_1 = require("../common/decorators");
const user_entity_1 = require("../users/entities/user.entity");
const friend_request_entity_1 = require("./entities/friend-request.entity");
let FriendsController = class FriendsController {
    constructor(friendsService, friendsGateway) {
        this.friendsService = friendsService;
        this.friendsGateway = friendsGateway;
    }
    getFriends(user) {
        return this.friendsService.getFriends(user.sub);
    }
    getPendingRequests(user) {
        return this.friendsService.getPendingRequests(user.sub);
    }
    getSentRequests(user) {
        return this.friendsService.getSentRequests(user.sub);
    }
    async sendFriendRequest(user, receiverId) {
        const request = await this.friendsService.sendFriendRequest(user.sub, receiverId);
        if (request && request.receiver) {
            await this.friendsGateway.notifyFriendRequest(receiverId, request.id, user.sub, request.sender.username, request.sender.displayName || request.sender.username);
        }
        return request;
    }
    acceptFriendRequest(user, requestId) {
        return this.friendsService.acceptFriendRequest(user.sub, requestId);
    }
    declineFriendRequest(user, requestId) {
        return this.friendsService.declineFriendRequest(user.sub, requestId);
    }
    cancelFriendRequest(user, requestId) {
        return this.friendsService.cancelFriendRequest(user.sub, requestId);
    }
    removeFriend(user, friendId) {
        return this.friendsService.removeFriend(user.sub, friendId);
    }
};
exports.FriendsController = FriendsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all friends' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns list of friends', type: [user_entity_1.UserEntity] }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "getFriends", null);
__decorate([
    (0, common_1.Get)('requests/pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending friend requests received' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns pending requests', type: [friend_request_entity_1.FriendRequestEntity] }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "getPendingRequests", null);
__decorate([
    (0, common_1.Get)('requests/sent'),
    (0, swagger_1.ApiOperation)({ summary: 'Get sent friend requests' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns sent requests', type: [friend_request_entity_1.FriendRequestEntity] }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "getSentRequests", null);
__decorate([
    (0, common_1.Post)('request/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Send friend request' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Friend request sent', type: friend_request_entity_1.FriendRequestEntity }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Already friends or request exists' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "sendFriendRequest", null);
__decorate([
    (0, common_1.Post)('request/:requestId/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept friend request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Friend request accepted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Request not found' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('requestId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "acceptFriendRequest", null);
__decorate([
    (0, common_1.Post)('request/:requestId/decline'),
    (0, swagger_1.ApiOperation)({ summary: 'Decline friend request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Friend request declined' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Request not found' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('requestId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "declineFriendRequest", null);
__decorate([
    (0, common_1.Delete)('request/:requestId'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel sent friend request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Friend request cancelled' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Request not found' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('requestId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "cancelFriendRequest", null);
__decorate([
    (0, common_1.Delete)(':friendId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove friend' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Friend removed' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Friendship not found' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('friendId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "removeFriend", null);
exports.FriendsController = FriendsController = __decorate([
    (0, swagger_1.ApiTags)('friends'),
    (0, common_1.Controller)('friends'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [friends_service_1.FriendsService,
        friends_gateway_1.FriendsGateway])
], FriendsController);
//# sourceMappingURL=friends.controller.js.map