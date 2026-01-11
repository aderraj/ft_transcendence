import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private prisma;
    private configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    findAll(take?: number, skip?: number): Promise<{
        users: {
            avatar: string;
            id: string;
            username: string;
            displayName: string;
            isOnline: boolean;
            wins: number;
            losses: number;
            level: number;
            experience: number;
            createdAt: Date;
        }[];
        total: number;
        take: number;
        skip: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatar: string;
        twoFactorEnabled: boolean;
        isOnline: boolean;
        lastSeen: Date;
        wins: number;
        losses: number;
        level: number;
        experience: number;
        createdAt: Date;
    }>;
    findByUsername(username: string): Promise<{
        id: string;
        username: string;
        displayName: string;
        avatar: string;
        isOnline: boolean;
        wins: number;
        losses: number;
        level: number;
        experience: number;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatar: string;
    }>;
    updateOnlineStatus(id: string, isOnline: boolean): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string | null;
        avatar: string | null;
        password: string | null;
        resetPasswordToken: string | null;
        resetPasswordExpires: Date | null;
        intraId: string | null;
        fortytwoId: string | null;
        googleId: string | null;
        twoFactorEnabled: boolean;
        twoFactorSecret: string | null;
        currentSessionToken: string | null;
        sessionExpiresAt: Date | null;
        isOnline: boolean;
        lastSeen: Date;
        wins: number;
        losses: number;
        level: number;
        experience: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateAvatar(id: string, avatarUrl: string): Promise<{
        id: string;
        avatar: string;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=users.service.d.ts.map