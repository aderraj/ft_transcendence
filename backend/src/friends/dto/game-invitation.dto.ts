import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum GameMode {
  REMOTE = 'remote',
  LOCAL = 'local',
}

export class GameInvitationDto {
  @ApiProperty({
    description: 'Friend user ID to invite',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  friendId: string;

  @ApiProperty({
    description: 'Game mode',
    enum: GameMode,
    example: GameMode.REMOTE,
    default: GameMode.REMOTE,
  })
  @IsEnum(GameMode)
  @IsOptional()
  gameMode?: GameMode = GameMode.REMOTE;
}

export class AcceptGameInvitationDto {
  @ApiProperty({
    description: 'Game invitation ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsString()
  @IsNotEmpty()
  invitationId: string;
}
