import { Injectable, OnModuleInit } from '@nestjs/common';
import * as vault from 'node-vault';

export interface VaultSecrets {
  db_password: string;
  jwt_secret: string;
  admin_password: string;
  api_key: string;
}

@Injectable()
export class VaultService {
  private client: any;
  private secrets: VaultSecrets | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    // Start connecting immediately in constructor
    this.connectionPromise = this.connect();
  }

  async waitForConnection(): Promise<void> {
    if (this.connectionPromise) {
      await this.connectionPromise;
    }
  }

  private async connect(): Promise<void> {
    const vaultAddr = process.env.VAULT_ADDR || 'http://vault:8200';
    const vaultToken = process.env.VAULT_TOKEN;

    if (!vaultToken) {
      console.error('[WARN] VAULT_TOKEN not set. Using fallback mode.');
      return;
    }

    this.client = vault({
      apiVersion: 'v1',
      endpoint: vaultAddr,
      token: vaultToken,
      requestOptions: {
        strictSSL: false,
        rejectUnauthorized: false,
      },
    });

    // Retry loop for Vault readiness
    for (let attempt = 1; attempt <= 10; attempt++) {
      try {
        const health = await this.client.health();
        
        if (health.initialized && !health.sealed) {
          // Fetch secrets from KV v2
          const response = await this.client.read('secret/data/pong-app');
          this.secrets = response.data.data as VaultSecrets;
          this.isConnected = true;
          console.log('[INFO] Secrets loaded successfully from Vault');
          return;
        } else {
          console.warn(`[WARN] Vault sealed or not initialized (attempt ${attempt}/10)`);
        }
      } catch (error: any) {
        console.warn(`[WARN] Vault connection attempt ${attempt}/10: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.error('[WARN] Could not connect to Vault after 10 attempts - using fallback');
  }

  async getSecretsAsync(): Promise<VaultSecrets | null> {
    await this.waitForConnection();
    return this.secrets;
  }

  isVaultConnected(): boolean {
    return this.isConnected;
  }

  getSecret(key: keyof VaultSecrets): string | null {
    return this.secrets?.[key] || null;
  }

  getMaskedSecrets(): Record<string, { value: string; status: string }> {
    if (!this.secrets) {
      return {};
    }

    const masked: Record<string, { value: string; status: string }> = {};
    
    for (const [key, value] of Object.entries(this.secrets)) {
      const strValue = String(value);
      if (strValue.length <= 4) {
        masked[key] = { value: '*'.repeat(strValue.length), status: 'loaded' };
      } else {
        masked[key] = {
          value: strValue.slice(0, 2) + '*'.repeat(strValue.length - 4) + strValue.slice(-2),
          status: 'loaded',
        };
      }
    }
    
    return masked;
  }
}
