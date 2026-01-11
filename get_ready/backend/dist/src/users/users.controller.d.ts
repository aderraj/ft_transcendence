import { Response } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
    getMe(user: any): Promise<{
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
    updateMe(user: any, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatar: string;
    }>;
    uploadAvatar(user: any, file: any): Promise<{
        id: string;
        avatar: string;
    }>;
    removeAvatar(user: any): Promise<{
        id: string;
        avatar: string;
    }>;
    getAvatar(filename: string, res: Response): void | Response<any, Record<string, any>>;
    deleteMe(user: any): Promise<{
        message: string;
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
}
//# sourceMappingURL=users.controller.d.ts.map