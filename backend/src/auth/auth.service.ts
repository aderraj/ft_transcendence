import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        isOnline: true,
        elo: true,
        wins: true,
        losses: true,
        twoFactorEnabled: true,
      },
    });
  }

  async generateToken(user: { id: string; email: string; username: string }) {
    const payload = { sub: user.id, email: user.email, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  // Register new user with username/password
  async register(registerDto: RegisterDto) {
    const { email, username, password, displayName } = registerDto;

    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        displayName: displayName || username,
      },
    });

    return this.generateToken(user);
  }

  // Login with username/email and password
  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Find user by username or email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has a password (might be OAuth-only user)
    if (!user.password) {
      throw new BadRequestException('This account uses 42 OAuth. Please login with 42.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update online status
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() },
    });

    return this.generateToken(user);
  }

  // For development/testing - create a test user and get token
  async createTestUser() {
    const testUser = await this.prisma.user.upsert({
      where: { email: 'test@test.com' },
      update: {},
      create: {
        email: 'test@test.com',
        username: 'testuser',
        displayName: 'Test User',
        password: await bcrypt.hash('testpassword', 10),
      },
    });
    return this.generateToken(testUser);
  }

  // 42 OAuth login - to be implemented with passport-42
  async fortytwoLogin(profile: any) {
    let user = await this.prisma.user.findUnique({
      where: { fortytwoId: profile.id },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          fortytwoId: profile.id,
          email: profile.emails[0]?.value || `${profile.username}@42.fr`,
          username: profile.username,
          displayName: profile.displayName,
          avatar: profile._json?.image?.link || 'default-avatar.png',
        },
      });
    }

    return this.generateToken(user);
  }
}
