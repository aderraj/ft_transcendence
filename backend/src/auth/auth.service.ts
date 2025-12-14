import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { VaultService } from '../vault/vault.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private vaultService: VaultService,
  ) {}

  async register(username: string, password: string) {
    const existingUser = await this.usersService.findOne(username);
    if (existingUser) {
      throw new UnauthorizedException('Username already exists');
    }
    
    const user = await this.usersService.create(username, password);
    const token = this.jwtService.sign({ sub: user.id, username: user.username });
    
    return {
      user: { id: user.id, username: user.username },
      token,
    };
  }

  async login(username: string, password: string) {
    // Check for admin login using Vault secret
    const adminPassword = this.vaultService.getSecret('admin_password');
    if (username === 'admin' && password === adminPassword) {
      const token = this.jwtService.sign({ sub: 0, username: 'admin', role: 'admin' });
      return {
        user: { id: 0, username: 'admin', role: 'admin' },
        token,
        message: 'Admin login successful (credentials from Vault)',
      };
    }

    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.usersService.validatePassword(user, password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id, username: user.username });
    
    return {
      user: { id: user.id, username: user.username },
      token,
    };
  }
}
