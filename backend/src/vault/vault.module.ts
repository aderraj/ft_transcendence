import { Module, Global } from '@nestjs/common';
import { VaultService } from './vault.service';
import { VaultController } from './vault.controller';

@Global()
@Module({
  providers: [VaultService],
  controllers: [VaultController],
  exports: [VaultService],
})
export class VaultModule {}
