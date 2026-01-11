import { FriendsService } from './friends.service';
import { FriendsGateway } from './friends.gateway';
export declare class FriendsController {
    private readonly friendsService;
    private readonly friendsGateway;
    constructor(friendsService: FriendsService, friendsGateway: FriendsGateway);
    getFriends(user: any): Promise<{
        avatar: string;
        id: string;
        username: string;
        displayName: string;
        isOnline: boolean;
        lastSeen: Date;
    }[]>;
    getPendingRequests(user: any): Promise<{
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
    getSentRequests(user: any): Promise<{
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
    sendFriendRequest(user: any, receiverId: string): Promise<{
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
    acceptFriendRequest(user: any, requestId: string): Promise<{
        message: string;
    }>;
    declineFriendRequest(user: any, requestId: string): Promise<{
        message: string;
    }>;
    cancelFriendRequest(user: any, requestId: string): Promise<{
        message: string;
    }>;
    removeFriend(user: any, friendId: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=friends.controller.d.ts.map