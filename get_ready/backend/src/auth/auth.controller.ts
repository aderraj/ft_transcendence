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
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username/email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('test-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get test token (dev only)' })
  @ApiResponse({ status: 200, description: 'Returns JWT token for test user' })
  async testLogin() {
    return this.authService.createTestUser();
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
  @ApiResponse({ status: 200, description: 'Returns JWT token' })
  async fortyTwoCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.handleOAuthLogin(req.user);
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
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

  // ============================================
  // 2FA Endpoints
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 2FA QR code' })
  @ApiResponse({ status: 200, description: 'QR code generated successfully' })
  async generate2FA(@CurrentUser() user: any) {
    return this.authService.generate2FASecret(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA with verification code' })
  @ApiBody({ type: Enable2FADto })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  async enable2FA(@CurrentUser() user: any, @Body() dto: Enable2FADto) {
    return this.authService.enable2FA(user.id, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiBody({ type: Enable2FADto })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  async disable2FA(@CurrentUser() user: any, @Body() dto: Enable2FADto) {
    return this.authService.disable2FA(user.id, dto.code);
  }

  @Public()
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA code during login' })
  @ApiBody({ type: Verify2FADto })
  @ApiResponse({ status: 200, description: '2FA verification successful' })
  @ApiResponse({ status: 401, description: 'Invalid 2FA code' })
  async verify2FA(@Body() dto: Verify2FADto, @Req() req: any) {
    // This would be called after initial login with username/password
    // The userId should be in a temporary session or token
    // For now, we'll handle this in the login endpoint
    return { message: '2FA verification endpoint' };
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
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const { access_token } = await this.authService.googleLogin(req);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
  }
}

