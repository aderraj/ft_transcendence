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
exports.AuthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const oauth42_guard_1 = require("./guards/oauth42.guard");
const google_auth_guard_1 = require("./guards/google-auth.guard");
const decorators_1 = require("../common/decorators");
const decorators_2 = require("../common/decorators");
const dto_1 = require("./dto");
const _2fa_dto_1 = require("./dto/2fa.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(registerDto) {
        return this.authService.register(registerDto);
    }
    async login(loginDto) {
        return this.authService.login(loginDto);
    }
    async logout(user) {
        await this.authService.logout(user.sub);
        return { message: 'Logged out successfully' };
    }
    async getMe(user) {
        return this.authService.validateUserById(user.sub);
    }
    async fortyTwoAuth() {
    }
    async fortyTwoCallback(req, res) {
        const result = await this.authService.handleOAuthLogin(req.user);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        if ('requires2FA' in result && result.requires2FA) {
            res.redirect(`${frontendUrl}/auth/2fa-verify?userId=${result.userId}`);
        }
        else if ('access_token' in result) {
            res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
        }
    }
    async forgotPassword(forgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }
    async resetPassword(resetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
    }
    async generate2FA(user) {
        return this.authService.generate2FASecret(user.sub);
    }
    async enable2FA(user, dto) {
        return this.authService.enable2FA(user.sub, dto.code);
    }
    async disable2FA(user, dto) {
        return this.authService.disable2FA(user.sub, dto.code);
    }
    async verify2FA(dto) {
        return this.authService.validate2FACode(dto.userId, dto.code);
    }
    async googleAuth() {
    }
    async googleAuthCallback(req, res) {
        const result = await this.authService.googleLogin(req);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        if ('requires2FA' in result && result.requires2FA) {
            res.redirect(`${frontendUrl}/auth/2fa-verify?userId=${result.userId}`);
        }
        else if ('access_token' in result) {
            res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user' }),
    (0, swagger_1.ApiBody)({ type: dto_1.RegisterDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'User registered successfully',
        schema: {
            type: 'object',
            properties: {
                access_token: { type: 'string', description: 'JWT access token' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        username: { type: 'string' },
                        twoFactorEnabled: { type: 'boolean', example: false },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email or username already exists' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login with username/email and password' }),
    (0, swagger_1.ApiBody)({ type: dto_1.LoginDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Login successful - returns JWT token if 2FA disabled, or requires 2FA verification if enabled',
        schema: {
            oneOf: [
                {
                    type: 'object',
                    description: 'Success response when 2FA is NOT enabled',
                    properties: {
                        access_token: { type: 'string', description: 'JWT access token' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                username: { type: 'string' },
                                twoFactorEnabled: { type: 'boolean', example: false },
                            },
                        },
                    },
                },
                {
                    type: 'object',
                    description: 'Response when 2FA is enabled - no JWT token returned yet',
                    properties: {
                        requires2FA: { type: 'boolean', example: true },
                        userId: { type: 'string', description: 'User ID - use this with POST /auth/2fa/verify' },
                        message: { type: 'string', example: '2FA verification required' },
                    },
                },
            ],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'User already has an active session' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Logout and invalidate current session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logged out successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, decorators_2.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns current user' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_2.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('42'),
    (0, common_1.UseGuards)(oauth42_guard_1.OAuth42Guard),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate 42 OAuth login' }),
    (0, swagger_1.ApiResponse)({ status: 302, description: 'Redirects to 42 OAuth' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "fortyTwoAuth", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('42/callback'),
    (0, common_1.UseGuards)(oauth42_guard_1.OAuth42Guard),
    (0, swagger_1.ApiOperation)({ summary: '42 OAuth callback' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns JWT token or requires 2FA' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "fortyTwoCallback", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Request password reset email' }),
    (0, swagger_1.ApiBody)({ type: dto_1.ForgotPasswordDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password reset email sent (if email exists)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password with token' }),
    (0, swagger_1.ApiBody)({ type: dto_1.ResetPasswordDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password reset successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired token' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('2fa/generate'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate 2FA QR code' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'QR code generated successfully',
        schema: {
            type: 'object',
            properties: {
                qrCode: {
                    type: 'string',
                    description: 'QR code data URL for authenticator app',
                    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
                },
                secret: {
                    type: 'string',
                    description: 'Manual entry secret key',
                    example: 'JBSWY3DPEHPK3PXP'
                },
            },
        },
    }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, decorators_2.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "generate2FA", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('2fa/enable'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Enable 2FA with verification code' }),
    (0, swagger_1.ApiBody)({ type: _2fa_dto_1.Enable2FADto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '2FA enabled successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '2FA has been enabled successfully' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid 2FA code' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, decorators_2.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, _2fa_dto_1.Enable2FADto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "enable2FA", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('2fa/disable'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Disable 2FA' }),
    (0, swagger_1.ApiBody)({ type: _2fa_dto_1.Enable2FADto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '2FA disabled successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '2FA has been disabled successfully' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid 2FA code' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, decorators_2.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, _2fa_dto_1.Enable2FADto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "disable2FA", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('2fa/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify 2FA code during login' }),
    (0, swagger_1.ApiBody)({ type: _2fa_dto_1.Verify2FADto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '2FA verification successful, returns JWT token',
        schema: {
            type: 'object',
            properties: {
                access_token: {
                    type: 'string',
                    description: 'JWT access token',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        username: { type: 'string' },
                        twoFactorEnabled: { type: 'boolean', example: true },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid 2FA code' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [_2fa_dto_1.Verify2FADto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verify2FA", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate Google OAuth login' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Google OAuth callback' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns JWT token or requires 2FA' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuthCallback", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map