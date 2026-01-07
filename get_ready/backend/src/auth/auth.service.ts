import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
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

  // 42 OAuth login handler
  async handleOAuthLogin(oauthUser: any) {
    const { intraId, email, username, displayName, avatar } = oauthUser;

    // Check if user already exists by intraId
    let user = await this.prisma.user.findUnique({
      where: { intraId: intraId },
    });

    if (!user) {
      // First time login - create new user
      const uniqueUsername = await this.generateUniqueUsername(username);
      
      user = await this.prisma.user.create({
        data: {
          intraId: intraId,
          email: email || `${username}@student.42.fr`,
          username: uniqueUsername,
          displayName: displayName || username,
          avatar: avatar || 'default-avatar.png',
        },
      });
    }

    // Update online status and last seen
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() },
    });

    return this.generateToken(user);
  }

  // Generate unique username if username already exists
  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    let username = baseUsername;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    return username;
  }

  // Legacy 42 OAuth login (keeping for backward compatibility)
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

  // Forgot Password - Generate reset token and send email
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // OAuth users cannot reset password
    if (user.intraId || user.fortytwoId) {
      throw new BadRequestException('OAuth users cannot reset password. Please log in with your OAuth provider.');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpires,
      },
    });

    // Log token in development for faster testing
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔐 PASSWORD RESET TOKEN (DEV MODE):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Token: ${resetToken}`);
      console.log(`🔗 Reset URL: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Send email
    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    } catch (error) {
      throw new BadRequestException('Failed to send password reset email. Please try again later.');
    }
  }

  // Reset Password - Verify token and update password
  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Password has been reset successfully' };
  }
}
