import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import { RegisterDto, LoginDto } from './dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private emailService;
    private readonly SESSION_EXPIRY_HOURS;
    constructor(prisma: PrismaService, jwtService: JwtService, emailService: EmailService);
    validateUserById(userId: string): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatar: string;
        twoFactorEnabled: boolean;
        isOnline: boolean;
        wins: number;
        losses: number;
        level: number;
        experience: number;
    }>;
    generateToken(user: {
        id: string;
        email: string;
        username: string;
        twoFactorEnabled?: boolean;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            username: string;
            twoFactorEnabled: boolean;
        };
    }>;
    validateSession(userId: string, sessionToken: string): Promise<boolean>;
    hasActiveSession(userId: string): Promise<boolean>;
    logout(userId: string): Promise<void>;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            username: string;
            twoFactorEnabled: boolean;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            username: string;
            twoFactorEnabled: boolean;
        };
    } | {
        requires2FA: boolean;
        userId: string;
        message: string;
    }>;
    handleOAuthLogin(oauthUser: any): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            username: string;
            twoFactorEnabled: boolean;
        };
    } | {
        requires2FA: boolean;
        userId: string;
        message: string;
    }>;
    private generateUniqueUsername;
    private generateUsernameFromEmail;
    fortytwoLogin(profile: any): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            username: string;
            twoFactorEnabled: boolean;
        };
    } | {
        requires2FA: boolean;
        userId: string;
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    generate2FASecret(userId: string): Promise<{
        secret: string;
        qrCode: string;
    }>;
    enable2FA(userId: string, code: string): Promise<{
        message: string;
    }>;
    disable2FA(userId: string, code: string): Promise<{
        message: string;
    }>;
    validate2FACode(userId: string, code: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            username: string;
            twoFactorEnabled: boolean;
        };
    }>;
    googleLogin(req: any): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            username: string;
            twoFactorEnabled: boolean;
        };
    } | {
        requires2FA: boolean;
        userId: string;
        message: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map