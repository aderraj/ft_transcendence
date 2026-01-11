import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { FriendsService } from './friends.service';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    handshake: any;
    disconnect: any;
    id: string;
}
export declare class FriendsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private friendsService;
    private prisma;
    server: Server;
    private userSockets;
    constructor(jwtService: JwtService, friendsService: FriendsService, prisma: PrismaService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): Promise<void>;
    private notifyFriendsStatus;
    notifyFriendRequest(receiverId: string, requestId: string, senderId: string, senderUsername: string, senderDisplayName: string): Promise<void>;
    handleAcceptFriendRequest(client: AuthenticatedSocket, data: {
        requestId: string;
    }): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    handleGameInvite(client: AuthenticatedSocket, data: {
        friendId: string;
    }): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    handleGameInviteResponse(client: AuthenticatedSocket, data: {
        senderId: string;
        accepted: boolean;
    }): Promise<{
        success: boolean;
        roomId: string;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        roomId?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        roomId?: undefined;
        message?: undefined;
    }>;
}
export {};
//# sourceMappingURL=friends.gateway.d.ts.map