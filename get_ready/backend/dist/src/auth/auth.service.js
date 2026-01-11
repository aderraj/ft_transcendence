"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const otplib_1 = require("otplib");
const QRCode = require("qrcode");
jectable();
class AuthService {
    constructor(prisma, jwtService, emailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.SESSION_EXPIRY_HOURS = 24;
    }
    async validateUserById(userId) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatar: true,
                isOnline: true,
                level: true,
                experience: true,
                wins: true,
                losses: true,
                twoFactorEnabled: true,
            },
        });
    }
    async generateToken(user) {
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const sessionExpiresAt = new Date(Date.now() + this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                currentSessionToken: sessionToken,
                sessionExpiresAt,
                isOnline: true,
                lastSeen: new Date(),
            },
        });
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            sessionToken,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                twoFactorEnabled: user.twoFactorEnabled || false,
            },
        };
    }
    async validateSession(userId, sessionToken) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { currentSessionToken: true, sessionExpiresAt: true },
        });
        if (!user || !user.currentSessionToken || !user.sessionExpiresAt) {
            return false;
        }
        if (user.currentSessionToken !== sessionToken) {
            return false;
        }
        if (new Date() > user.sessionExpiresAt) {
            return false;
        }
        return true;
    }
    async hasActiveSession(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { currentSessionToken: true, sessionExpiresAt: true, isOnline: true },
        });
        if (!user || !user.currentSessionToken || !user.sessionExpiresAt) {
            return false;
        }
        return user.isOnline && new Date() < user.sessionExpiresAt;
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                currentSessionToken: null,
                sessionExpiresAt: null,
                isOnline: false,
                lastSeen: new Date(),
            },
        });
    }
    async register(registerDto) {
        const { email, username, password, displayName } = registerDto;
        const existingEmail = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingEmail) {
            throw new common_1.ConflictException('Email already registered');
        }
        const existingUsername = await this.prisma.user.findUnique({
            where: { username },
        });
        if (existingUsername) {
            throw new common_1.ConflictException('Username already taken');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                displayName: displayName || username,
            },
        });
        return this.generateToken(user);
    }
    async login(loginDto) {
        const { username, password } = loginDto;
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email: username },
                ],
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.password) {
            throw new common_1.BadRequestException('This account uses OAuth. Please login with your OAuth provider.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (await this.hasActiveSession(user.id)) {
            await this.logout(user.id);
        }
        if (user.twoFactorEnabled) {
            return {
                requires2FA: true,
                userId: user.id,
                message: '2FA verification required',
            };
        }
        return this.generateToken(user);
    }
    async handleOAuthLogin(oauthUser) {
        const { intraId, email, username, displayName, avatar } = oauthUser;
        let user = await this.prisma.user.findUnique({
            where: { intraId: intraId },
        });
        if (!user) {
            const uniqueUsername = await this.generateUniqueUsername(username);
            user = await this.prisma.user.create({
                data: {
                    intraId: intraId,
                    email: email || `${username}@student.42.fr`,
                    username: uniqueUsername,
                    displayName: displayName || username,
                    avatar: avatar || 'default-avatar.png',
                },
            });
        }
        else {
            if (await this.hasActiveSession(user.id)) {
                await this.logout(user.id);
            }
        }
        if (user.twoFactorEnabled) {
            return {
                requires2FA: true,
                userId: user.id,
                message: '2FA verification required',
            };
        }
        return this.generateToken(user);
    }
    async generateUniqueUsername(baseUsername) {
        let username = baseUsername;
        let counter = 1;
        while (await this.prisma.user.findUnique({ where: { username } })) {
            username = `${baseUsername}${counter}`;
            counter++;
        }
        return username;
    }
    async generateUsernameFromEmail(email) {
        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
        return this.generateUniqueUsername(baseUsername);
    }
    async fortytwoLogin(profile) {
        let user = await this.prisma.user.findUnique({
            where: { fortytwoId: profile.id },
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    fortytwoId: profile.id,
                    email: profile.emails[0]?.value || `${profile.username}@42.fr`,
                    username: profile.username,
                    displayName: profile.displayName,
                    avatar: profile._json?.image?.link || 'default-avatar.png',
                },
            });
        }
        if (user.twoFactorEnabled) {
            return {
                requires2FA: true,
                userId: user.id,
                message: '2FA verification required',
            };
        }
        return this.generateToken(user);
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return { message: 'If an account with that email exists, a password reset link has been sent.' };
        }
        if (user.intraId || user.fortytwoId) {
            throw new common_1.BadRequestException('OAuth users cannot reset password. Please log in with your OAuth provider.');
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: resetTokenExpires,
            },
        });
        if (process.env.NODE_ENV === 'development') {
            console.log('\n🔐 PASSWORD RESET TOKEN (DEV MODE):');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📧 Email: ${user.email}`);
            console.log(`🔑 Token: ${resetToken}`);
            console.log(`🔗 Reset URL: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
        try {
            await this.emailService.sendPasswordResetEmail(user.email, resetToken);
            return { message: 'If an account with that email exists, a password reset link has been sent.' };
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to send password reset email. Please try again later.');
        }
    }
    async resetPassword(token, newPassword) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });
        return { message: 'Password has been reset successfully' };
    }
    async generate2FASecret(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const secret = otplib_1.authenticator.generateSecret();
        const otpauthUrl = otplib_1.authenticator.keyuri(user.email, 'Transcendence', secret);
        const qrCode = await QRCode.toDataURL(otpauthUrl);
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret },
        });
        return {
            secret,
            qrCode,
        };
    }
    async enable2FA(userId, code) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.twoFactorSecret) {
            throw new common_1.BadRequestException('2FA secret not found. Generate QR code first.');
        }
        const isValid = otplib_1.authenticator.verify({
            token: code,
            secret: user.twoFactorSecret,
        });
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid 2FA code');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true },
        });
        return { message: '2FA enabled successfully' };
    }
    async disable2FA(userId, code) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.twoFactorEnabled) {
            throw new common_1.BadRequestException('2FA is not enabled');
        }
        const isValid = otplib_1.authenticator.verify({
            token: code,
            secret: user.twoFactorSecret,
        });
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid 2FA code');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });
        return { message: '2FA disabled successfully' };
    }
    async validate2FACode(userId, code) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            throw new common_1.BadRequestException('2FA is not enabled for this user');
        }
        const isValid = otplib_1.authenticator.verify({
            token: code,
            secret: user.twoFactorSecret,
        });
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid 2FA code');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { isOnline: true, lastSeen: new Date() },
        });
        return this.generateToken(user);
    }
    async googleLogin(req) {
        if (!req.user) {
            throw new common_1.UnauthorizedException('No user from Google');
        }
        const { googleId, email, displayName, avatar } = req.user;
        let user = await this.prisma.user.findUnique({
            where: { googleId },
        });
        if (!user) {
            user = await this.prisma.user.findUnique({
                where: { email },
            });
            if (user) {
                if (await this.hasActiveSession(user.id)) {
                    await this.logout(user.id);
                }
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: { googleId },
                });
            }
        }
        else {
            if (await this.hasActiveSession(user.id)) {
                await this.logout(user.id);
            }
        }
        if (!user) {
            const username = await this.generateUsernameFromEmail(email);
            user = await this.prisma.user.create({
                data: {
                    email,
                    username,
                    displayName: displayName || username,
                    googleId,
                    avatar: avatar || 'default-avatar.png',
                    password: null,
                },
            });
        }
        if (user.twoFactorEnabled) {
            return {
                requires2FA: true,
                userId: user.id,
                message: '2FA verification required',
            };
        }
        return this.generateToken(user);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map