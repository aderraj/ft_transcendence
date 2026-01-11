import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class ChatService {
    private prisma;
    private configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    private getAvatarUrl;
    getConversations(userId: string): Promise<any[]>;
    getMessages(userId: string, friendId: string, limit?: number, offset?: number): Promise<{
        sender: {
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
    }[]>;
    sendMessage(senderId: string, receiverId: string, content: string): Promise<{
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
    markAsRead(messageId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        senderId: string;
        receiverId: string;
        content: string;
        isRead: boolean;
    }>;
    markAllAsRead(userId: string, friendId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
//# sourceMappingURL=chat.service.d.ts.map