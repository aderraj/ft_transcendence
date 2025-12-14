import { Controller, Get } from '@nestjs/common';
import { VaultService } from './vault.service';

@Controller('vault')
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Get('status')
  getStatus() {
    return {
      connected: this.vaultService.isVaultConnected(),
      secrets: this.vaultService.getMaskedSecrets(),
    };
  }
}
