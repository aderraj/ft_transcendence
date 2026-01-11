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
exports.LeaderboardController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const leaderboard_service_1 = require("./leaderboard.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const decorators_1 = require("../common/decorators");
let LeaderboardController = class LeaderboardController {
    constructor(leaderboardService) {
        this.leaderboardService = leaderboardService;
    }
    getLeaderboard(take, skip) {
        return this.leaderboardService.getLeaderboard(take || 50, skip || 0);
    }
    getMyStats(user) {
        return this.leaderboardService.getUserStats(user.sub);
    }
    getTopWinners() {
        return this.leaderboardService.getTopByWins(10);
    }
    getUserStats(userId) {
        return this.leaderboardService.getUserStats(userId);
    }
    getUserHistory(userId, take) {
        return this.leaderboardService.getGameHistory(userId, take || 10);
    }
    getMyHistory(user, take) {
        return this.leaderboardService.getGameHistory(user.sub, take || 10);
    }
};
exports.LeaderboardController = LeaderboardController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get global leaderboard (public)' }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: Number, description: 'Number of players to return' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: Number, description: 'Number of players to skip' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns leaderboard' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('take')),
    __param(1, (0, common_1.Query)('skip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], LeaderboardController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user stats and rank' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns user stats' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeaderboardController.prototype, "getMyStats", null);
__decorate([
    (0, common_1.Get)('top-winners'),
    (0, swagger_1.ApiOperation)({ summary: 'Get top players by wins' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns top winners' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LeaderboardController.prototype, "getTopWinners", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific user stats and rank' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns user stats' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeaderboardController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('user/:userId/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user game history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns game history' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], LeaderboardController.prototype, "getUserHistory", null);
__decorate([
    (0, common_1.Get)('me/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user game history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns game history' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], LeaderboardController.prototype, "getMyHistory", null);
exports.LeaderboardController = LeaderboardController = __decorate([
    (0, swagger_1.ApiTags)('leaderboard'),
    (0, common_1.Controller)('leaderboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [leaderboard_service_1.LeaderboardService])
], LeaderboardController);
//# sourceMappingURL=leaderboard.controller.js.map