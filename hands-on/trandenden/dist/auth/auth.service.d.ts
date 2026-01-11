import { JwtService } from '@nestjs/jwt';
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
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
    validateOAuthLogin(profile: any): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            username: string;
            profilePic: string;
        };
    }>;
    private generateToken;
}
