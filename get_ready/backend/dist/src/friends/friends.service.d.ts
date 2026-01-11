import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class FriendsService {
    private prisma;
    private configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    private getAvatarUrl;
    getFriends(userId: string): Promise<{
        avatar: string;
        id: string;
        username: string;
        displayName: string;
        isOnline: boolean;
        lastSeen: Date;
    }[]>;
    getPendingRequests(userId: string): Promise<{
        sender: {
            avatar: string;
            id: string;
            username: string;
            displayName: string;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.FriendRequestStatus;
        senderId: string;
        receiverId: string;
    }[]>;
    getSentRequests(userId: string): Promise<{
        receiver: {
            avatar: string;
            id: string;
            username: string;
            displayName: string;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.FriendRequestStatus;
        senderId: string;
        receiverId: string;
    }[]>;
    sendFriendRequest(senderId: string, receiverId: string): Promise<{
        sender: {
            id: string;
            username: string;
            displayName: string;
        };
        receiver: {
            id: string;
            username: string;
            displayName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.FriendRequestStatus;
        senderId: string;
        receiverId: string;
    }>;
    acceptFriendRequest(userId: string, requestId: string): Promise<{
        message: string;
    }>;
    declineFriendRequest(userId: string, requestId: string): Promise<{
        message: string;
    }>;
    cancelFriendRequest(userId: string, requestId: string): Promise<{
        message: string;
    }>;
    removeFriend(userId: string, friendId: string): Promise<{
        message: string;
    }>;
    areFriends(userId1: string, userId2: string): Promise<boolean>;
}
//# sourceMappingURL=friends.service.d.ts.map