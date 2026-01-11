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
exports.UsersController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const path_1 = require("path");
const fs_1 = require("fs");
const users_service_1 = require("./users.service");
const update_user_dto_1 = require("./dto/update-user.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const decorators_1 = require("../common/decorators");
const user_entity_1 = require("./entities/user.entity");
const avatarStorage = (0, multer_1.diskStorage)({
    destination: './uploads/avatars',
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = (0, path_1.extname)(file.originalname);
        callback(null, `avatar-${uniqueSuffix}${ext}`);
    },
});
const imageFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return callback(new common_1.BadRequestException('Only image files are allowed!'), false);
    }
    callback(null, true);
};
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    findAll(take, skip) {
        return this.usersService.findAll(take || 20, skip || 0);
    }
    getMe(user) {
        return this.usersService.findOne(user.sub);
    }
    updateMe(user, updateUserDto) {
        return this.usersService.update(user.sub, updateUserDto);
    }
    async uploadAvatar(user, file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        return this.usersService.updateAvatar(user.sub, file.filename);
    }
    async removeAvatar(user) {
        return this.usersService.updateAvatar(user.sub, 'default-avatar.png');
    }
    getAvatar(filename, res) {
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', 'avatars', filename);
        if (!(0, fs_1.existsSync)(filePath)) {
            const defaultPath = (0, path_1.join)(process.cwd(), 'uploads', 'avatars', 'default-avatar.png');
            if ((0, fs_1.existsSync)(defaultPath)) {
                return res.sendFile(defaultPath);
            }
            return res.status(404).json({ message: 'Avatar not found' });
        }
        return res.sendFile(filePath);
    }
    deleteMe(user) {
        return this.usersService.delete(user.sub);
    }
    findOne(id) {
        return this.usersService.findOne(id);
    }
    findByUsername(username) {
        return this.usersService.findByUsername(username);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users (paginated)' }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns list of users', type: user_entity_1.PaginatedUsersResult }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('take')),
    __param(1, (0, common_1.Query)('skip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns current user', type: user_entity_1.UserEntity }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Put)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User updated successfully', type: user_entity_1.UserEntity }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Username already taken' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Post)('me/avatar'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload avatar image' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Avatar uploaded successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid file type' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: avatarStorage,
        fileFilter: imageFileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
    })),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Delete)('me/avatar'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove avatar image' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Avatar removed successfully' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "removeAvatar", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('avatar/:filename'),
    (0, swagger_1.ApiOperation)({ summary: 'Get avatar image' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns avatar image' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Avatar not found' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getAvatar", null);
__decorate([
    (0, common_1.Delete)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete current user account' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User deleted successfully' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteMe", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns user' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('username/:username'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by username' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns user' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findByUsername", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map