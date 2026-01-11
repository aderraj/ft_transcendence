import { AuthService } from "./auth.service";
import { AuthDto } from "./dto";
import type { Request, Response } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: AuthDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            username: string;
        };
    }>;
    login(dto: AuthDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            username: string;
            status: string;
        };
    }>;
    fortyTwoAuth(): void;
    fortyTwoAuthCallback(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
