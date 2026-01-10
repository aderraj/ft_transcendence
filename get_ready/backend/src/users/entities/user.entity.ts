import { ApiProperty } from '@nestjs/swagger';

export class UserEntity {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'John Doe', nullable: true })
  displayName: string | null;

  @ApiProperty({ example: 'https://host:port/uploads/avatar/avatar.jpg', nullable: true })
  avatar: string | null;

  @ApiProperty({ example: true })
  isOnline: boolean;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  lastSeen: Date;

  @ApiProperty({ example: 1 })
  level: number;

  @ApiProperty({ example: 0 })
  experience: number;

  @ApiProperty({ example: 5 })
  wins: number;

  @ApiProperty({ example: 2 })
  losses: number;
}

export class PaginatedUsersResult {
  @ApiProperty({ type: [UserEntity] })
  users: UserEntity[];

  @ApiProperty()
  total: number;
  
  @ApiProperty()
  take: number;

  @ApiProperty()
  skip: number;
}
