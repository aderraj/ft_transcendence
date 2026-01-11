import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { Enable2FADto, Verify2FADto } from './dto/2fa.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    logout(user: any): Promise<{
        message: string;
    }>;
    getMe(user: any): Promise<{
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
    fortyTwoAuth(): Promise<void>;
    fortyTwoCallback(req: Request, res: Response): Promise<void>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    generate2FA(user: any): Promise<{
        secret: string;
        qrCode: string;
    }>;
    enable2FA(user: any, dto: Enable2FADto): Promise<{
        message: string;
    }>;
    disable2FA(user: any, dto: Enable2FADto): Promise<{
        message: string;
    }>;
    verify2FA(dto: Verify2FADto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            username: string;
            twoFactorEnabled: boolean;
        };
    }>;
    googleAuth(): Promise<void>;
    googleAuthCallback(req: any, res: Response): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map