import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../common/decorators';
import { CurrentUser } from '../common/decorators';
import { RegisterDto, LoginDto } from './dto';

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

  // 42 OAuth endpoints - to be implemented
  @Public()
  @Get('42')
  @ApiOperation({ summary: 'Initiate 42 OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to 42 OAuth' })
  async fortyTwoAuth() {
    // Will be handled by Passport 42 strategy
    return { message: '42 OAuth not configured yet. Use /api/auth/login for local auth.' };
  }

  @Public()
  @Get('42/callback')
  @ApiOperation({ summary: '42 OAuth callback' })
  async fortyTwoCallback() {
    // Will be handled by Passport 42 strategy
    return { message: '42 OAuth callback' };
  }
}
