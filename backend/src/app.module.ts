import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VaultService } from './vault/vault.service';
import { VaultModule } from './vault/vault.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register(),
    LoggerModule,
    TypeOrmModule.forRootAsync({
      imports: [VaultModule],
      inject: [VaultService],
      useFactory: async (vaultService: VaultService) => {
        // Wait for vault to connect and fetch secrets
        const secrets = await vaultService.getSecretsAsync();
        
        const host = process.env.DATABASE_HOST || 'postgres';
        const port = parseInt(process.env.DATABASE_PORT || '5432');
        const database = process.env.DATABASE_NAME || 'pong';
        const username = process.env.DATABASE_USER || 'pong';
        
        if (!secrets) {
          console.error('[WARN] Vault secrets unavailable - using env fallback');
          return {
            type: 'postgres',
            host,
            port,
            username,
            password: process.env.DB_PASSWORD || 'fallback_password',
            database,
            autoLoadEntities: true,
            synchronize: true,
          };
        }
        
        console.log('[INFO] Database credentials loaded from Vault');
        return {
          type: 'postgres',
          host,
          port,
          username,
          password: secrets.db_password,
          database,
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    VaultModule,
    UsersModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
