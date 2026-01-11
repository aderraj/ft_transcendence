import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { RegisterDto, LoginDto } from './dto';


@Injectable()
export class AuthService {
  private readonly SESSION_EXPIRY_HOURS = 24;

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
        level: true,
        experience: true,
        wins: true,
        losses: true,
        twoFactorEnabled: true,
      },
    });
  }

  async generateToken(user: { id: string; email: string; username: string; twoFactorEnabled?: boolean }) {
    // Generate a unique session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiresAt = new Date(Date.now() + this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    // Store session token in database (invalidates any previous session)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        currentSessionToken: sessionToken,
        sessionExpiresAt,
        isOnline: true,
        lastSeen: new Date(),
      },
    });

    const payload = { 
      sub: user.id, 
      email: user.email, 
      username: user.username,
      sessionToken, // Include session token in JWT for validation
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        twoFactorEnabled: user.twoFactorEnabled || false,
      },
    };
  }

  // Validate session token - call this in JWT strategy
  async validateSession(userId: string, sessionToken: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentSessionToken: true, sessionExpiresAt: true },
    });

    if (!user || !user.currentSessionToken || !user.sessionExpiresAt) {
      return false;
    }

    // Check if session token matches and hasn't expired
    if (user.currentSessionToken !== sessionToken) {
      return false;
    }

    if (new Date() > user.sessionExpiresAt) {
      return false;
    }

    return true;
  }

  // Check if user already has an active session
  async hasActiveSession(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentSessionToken: true, sessionExpiresAt: true, isOnline: true },
    });

    if (!user || !user.currentSessionToken || !user.sessionExpiresAt) {
      return false;
    }

    return user.isOnline && new Date() < user.sessionExpiresAt;
  }

  // Logout - invalidate session
  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentSessionToken: null,
        sessionExpiresAt: null,
        isOnline: false,
        lastSeen: new Date(),
      },
    });
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

    if (!user.password) {
      throw new BadRequestException('This account uses OAuth. Please login with your OAuth provider.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Invalidate any existing session before creating a new one
    // This allows the user to login from a new device
    if (await this.hasActiveSession(user.id)) {
      await this.logout(user.id);
    }

    if (user.twoFactorEnabled) {
      return {
        requires2FA: true,
        userId: user.id,
        message: '2FA verification required',
      };
    }

    return this.generateToken(user);
  }

  // 42 OAuth login handler
  async handleOAuthLogin(oauthUser: any) {
    const { intraId, email, username, displayName, avatar } = oauthUser;

    let user = await this.prisma.user.findUnique({
      where: { intraId: intraId },
    });

    if (!user) {
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
    } else {
      // Invalidate any existing session before creating a new one
      if (await this.hasActiveSession(user.id)) {
        await this.logout(user.id);
      }
    }

    if (user.twoFactorEnabled) {
      return {
        requires2FA: true,
        userId: user.id,
        message: '2FA verification required',
      };
    }

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

  // Generate username from email (for OAuth providers without username field)
  private async generateUsernameFromEmail(email: string): Promise<string> {
    // Extract the part before @ and clean it
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    return this.generateUniqueUsername(baseUsername);
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

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return {
        requires2FA: true,
        userId: user.id,
        message: '2FA verification required',
      };
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

  // ============================================
  // 2FA (Two-Factor Authentication) Methods
  // ============================================

  /**
   * Generate 2FA secret and QR code for user
   */
  async generate2FASecret(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate secret
    const secret = authenticator.generateSecret();
    
    // Create otpauth URL for QR code
    const otpauthUrl = authenticator.keyuri(
      user.email,
      'Transcendence',
      secret,
    );

    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    // Store secret temporarily (not enabled yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return {
      secret,
      qrCode,
    };
  }

  /**
   * Verify and enable 2FA
   */
  async enable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA secret not found. Generate QR code first.');
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: '2FA enabled successfully' };
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify the code before disabling
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Disable 2FA and clear secret
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { message: '2FA disabled successfully' };
  }

  /**
   * Validate 2FA code during login
   */
  async validate2FACode(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Update online status
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeen: new Date() },
    });

    // Generate and return JWT token
    return this.generateToken(user);
  }

  // ============================================
  // Google OAuth Methods
  // ============================================

  /**
   * Handle Google OAuth login/registration
   */
  async googleLogin(req: any) {
    if (!req.user) {
      throw new UnauthorizedException('No user from Google');
    }

    const { googleId, email, displayName, avatar } = req.user;

    let user = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Invalidate any existing session before linking Google account
        if (await this.hasActiveSession(user.id)) {
          await this.logout(user.id);
        }
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        });
      }
    } else {
      // Invalidate any existing session before creating a new one
      if (await this.hasActiveSession(user.id)) {
        await this.logout(user.id);
      }
    }

    if (!user) {
      const username = await this.generateUsernameFromEmail(email);
      
      user = await this.prisma.user.create({
        data: {
          email,
          username,
          displayName: displayName || username,
          googleId,
          avatar: avatar || 'default-avatar.png',
          password: null,
        },
      });
    }

    if (user.twoFactorEnabled) {
      return {
        requires2FA: true,
        userId: user.id,
        message: '2FA verification required',
      };
    }

    return this.generateToken(user);
  }
}

