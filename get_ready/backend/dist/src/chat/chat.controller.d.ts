import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getConversations(user: any): Promise<any[]>;
    getMessages(user: any, friendId: string, limit?: number, offset?: number): Promise<{
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
    sendMessage(user: any, friendId: string, content: string): Promise<{
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
    markAsRead(user: any, messageId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        senderId: string;
        receiverId: string;
        content: string;
        isRead: boolean;
    }>;
    markAllAsRead(user: any, friendId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
//# sourceMappingURL=chat.controller.d.ts.map