import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
interface AuthenticatedSocket extends Socket {
    userId?: string;
}
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private chatService;
    private prisma;
    server: Server;
    private userSockets;
    constructor(jwtService: JwtService, chatService: ChatService, prisma: PrismaService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): Promise<void>;
    handleSendMessage(client: AuthenticatedSocket, data: {
        receiverId: string;
        content: string;
    }): Promise<{
        sender: {
            avatar: string;
            id: string;
            username: string;
            displayName: string;
        };
        receiver: {
            avatar: string;
            id: string;
            username: string;
            displayName: string;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        senderId: string;
        receiverId: string;
        content: string;
        isRead: boolean;
    }>;
    handleMarkAsRead(client: AuthenticatedSocket, data: {
        messageId: string;
    }): Promise<void>;
    handleTypingStart(client: AuthenticatedSocket, data: {
        receiverId: string;
    }): void;
    handleTypingStop(client: AuthenticatedSocket, data: {
        receiverId: string;
    }): void;
    handleGameInvite(client: AuthenticatedSocket, data: {
        friendId: string;
    }): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        message?: undefined;
    }>;
    handleInviteResponse(client: AuthenticatedSocket, data: {
        senderId: string;
        accepted: boolean;
    }): Promise<void>;
}
export {};
//# sourceMappingURL=chat.gateway.d.ts.map