import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { VaultService } from '../vault/vault.service';
import { VaultModule } from '../vault/vault.module';

@Module({
  imports: [
    UsersModule,
    VaultModule,
    JwtModule.registerAsync({
      imports: [VaultModule],
      inject: [VaultService],
      useFactory: async (vaultService: VaultService) => {
        const secrets = await vaultService.getSecretsAsync();
        return {
          secret: secrets?.jwt_secret || 'fallback-insecure-key',
          signOptions: { expiresIn: '24h' },
        };
      },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
