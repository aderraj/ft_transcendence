import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class Enable2FADto {
  @ApiProperty({ description: '6-digit verification code from authenticator app' })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class Verify2FADto {
  @ApiProperty({ description: 'User ID from initial login' })
  @IsString()
  userId: string;

  @ApiProperty({ description: '6-digit 2FA code' })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class TwoFactorResponse {
  @ApiProperty({ description: 'QR code data URL for authenticator app' })
  qrCode: string;

  @ApiProperty({ description: 'Manual entry secret key' })
  secret: string;
}
