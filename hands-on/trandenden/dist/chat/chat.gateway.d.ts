import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private prisma;
    server: Server;
    private onlineUsers;
    constructor(prisma: PrismaService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleMessage(data: {
        toId: string;
        content: string;
    }, client: Socket): Promise<{
        error: string;
        success?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        message: {
            id: string;
            content: string;
            from: {
                id: string;
                username: string;
                profilePic: string;
            };
            createdAt: Date;
        };
        error?: undefined;
    }>;
    handlePing(client: Socket): {
        event: string;
        data: {
            timestamp: number;
        };
    };
}
