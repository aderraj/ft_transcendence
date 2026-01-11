import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OAuth42Guard } from './guards/oauth42.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Public } from '../common/decorators';
import { CurrentUser } from '../common/decorators';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { Enable2FADto, Verify2FADto } from './dto/2fa.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', description: 'JWT access token' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            twoFactorEnabled: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username/email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful - returns JWT token if 2FA disabled, or requires 2FA verification if enabled',
    schema: {
      oneOf: [
        {
          type: 'object',
          description: 'Success response when 2FA is NOT enabled',
          properties: {
            access_token: { type: 'string', description: 'JWT access token' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' },
                twoFactorEnabled: { type: 'boolean', example: false },
              },
            },
          },
        },
        {
          type: 'object',
          description: 'Response when 2FA is enabled - no JWT token returned yet',
          properties: {
            requires2FA: { type: 'boolean', example: true },
            userId: { type: 'string', description: 'User ID - use this with POST /auth/2fa/verify' },
            message: { type: 'string', example: '2FA verification required' },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'User already has an active session' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser() user: any) {
    await this.authService.logout(user.sub);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.validateUserById(user.sub);
  }

  // 42 OAuth endpoints
  @Public()
  @Get('42')
  @UseGuards(OAuth42Guard)
  @ApiOperation({ summary: 'Initiate 42 OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to 42 OAuth' })
  async fortyTwoAuth() {
    // Passport will handle the redirect
  }

  @Public()
  @Get('42/callback')
  @UseGuards(OAuth42Guard)
  @ApiOperation({ summary: '42 OAuth callback' })
  @ApiResponse({ status: 200, description: 'Returns JWT token or requires 2FA' })
  async fortyTwoCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.handleOAuthLogin(req.user);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Check if 2FA is required
    if ('requires2FA' in result && result.requires2FA) {
      // Redirect to 2FA verification page with userId
      res.redirect(`${frontendUrl}/auth/2fa-verify?userId=${result.userId}`);
    } else if ('access_token' in result) {
      // Redirect to frontend with token
      res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
    }
  }

  // Password Reset endpoints
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset email sent (if email exists)' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (authenticated users)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async changePassword(@Req() req, @Body() body: { currentPassword?: string; newPassword: string }) {
    return this.authService.changePassword(req.user.sub, body.newPassword, body.currentPassword);
  }

  // ============================================
  // 2FA Endpoints
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 2FA QR code' })
  @ApiResponse({ 
    status: 200, 
    description: 'QR code generated successfully',
    schema: {
      type: 'object',
      properties: {
        qrCode: { 
          type: 'string', 
          description: 'QR code data URL for authenticator app',
          example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
        },
        secret: { 
          type: 'string', 
          description: 'Manual entry secret key',
          example: 'JBSWY3DPEHPK3PXP'
        },
      },
    },
  })
  async generate2FA(@CurrentUser() user: any) {
    return this.authService.generate2FASecret(user.sub); // user.sub is the user ID from JWT
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA with verification code' })
  @ApiBody({ type: Enable2FADto })
  @ApiResponse({ 
    status: 200, 
    description: '2FA enabled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '2FA has been enabled successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  async enable2FA(@CurrentUser() user: any, @Body() dto: Enable2FADto) {
    return this.authService.enable2FA(user.sub, dto.code); // user.sub is the user ID from JWT
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiBody({ type: Enable2FADto })
  @ApiResponse({ 
    status: 200, 
    description: '2FA disabled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '2FA has been disabled successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  async disable2FA(@CurrentUser() user: any, @Body() dto: Enable2FADto) {
    return this.authService.disable2FA(user.sub, dto.code); // user.sub is the user ID from JWT
  }

  @Public()
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA code during login' })
  @ApiBody({ type: Verify2FADto })
  @ApiResponse({ 
    status: 200, 
    description: '2FA verification successful, returns JWT token',
    schema: {
      type: 'object',
      properties: {
        access_token: { 
          type: 'string', 
          description: 'JWT access token',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            twoFactorEnabled: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid 2FA code' })
  async verify2FA(@Body() dto: Verify2FADto) {
    return this.authService.validate2FACode(dto.userId, dto.code);
  }

  // ============================================
  // Google OAuth Endpoints
  // ============================================

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'Returns JWT token or requires 2FA' })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.googleLogin(req);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Check if 2FA is required
    if ('requires2FA' in result && result.requires2FA) {
      // Redirect to 2FA verification page with userId
      res.redirect(`${frontendUrl}/auth/2fa-verify?userId=${result.userId}`);
    } else if ('access_token' in result) {
      // Redirect to frontend with token
      res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
    }
  }
}

