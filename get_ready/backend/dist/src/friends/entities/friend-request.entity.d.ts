import { UserEntity } from '../../users/entities/user.entity';
export declare class FriendRequestEntity {
    id: string;
    createdAt: Date;
    status: string;
    senderId: string;
    receiverId: string;
    sender?: UserEntity;
    receiver?: UserEntity;
}
//# sourceMappingURL=friend-request.entity.d.ts.map