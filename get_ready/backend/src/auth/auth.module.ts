import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OAuth42Strategy } from './strategies/oauth42.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OAuth42Guard } from './guards/oauth42.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    OAuth42Strategy,
    GoogleStrategy,
    JwtAuthGuard,
    OAuth42Guard,
    GoogleAuthGuard,
    EmailService,
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
