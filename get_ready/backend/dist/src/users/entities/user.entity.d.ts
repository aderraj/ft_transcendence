export declare class UserEntity {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    isOnline: boolean;
    lastSeen: Date;
    level: number;
    experience: number;
    wins: number;
    losses: number;
}
export declare class PaginatedUsersResult {
    users: UserEntity[];
    total: number;
    take: number;
    skip: number;
}
//# sourceMappingURL=user.entity.d.ts.map