import { Controller, Get } from '@nestjs/common';
import { VaultService } from '../vault/vault.service';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(
    private readonly vaultService: VaultService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  async getHealth() {
    let dbStatus = 'disconnected';
    
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        dbStatus = 'connected';
      }
    } catch (error) {
      dbStatus = 'error: ' + error.message;
    }

    return {
      service: 'pong-backend',
      status: this.vaultService.isVaultConnected() && dbStatus === 'connected' 
        ? 'operational' 
        : 'degraded',
      vault: this.vaultService.isVaultConnected() ? 'connected' : 'disconnected',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
