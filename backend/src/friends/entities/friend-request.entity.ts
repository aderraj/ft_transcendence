import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../users/entities/user.entity';

export class FriendRequestEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty()
  receiverId: string;

  @ApiProperty({ type: UserEntity, required: false })
  sender?: UserEntity;

  @ApiProperty({ type: UserEntity, required: false })
  receiver?: UserEntity;
}
