import { Body, Controller, Post, Get, UseGuards, Req, Res } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from "./auth.service";
import { AuthDto } from "./dto";
import { Public } from './decorators/public.decorator';
import { FortyTwoAuthGuard } from './guards/fortytwo-auth.guard';
import type { Request, Response } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new user with email and password' })
    @ApiResponse({ status: 201, description: 'User successfully registered' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    register(@Body() dto: AuthDto) {
        return this.authService.register(dto);
    }

    @Public()
    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'User successfully logged in' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    login(@Body() dto: AuthDto) {
        return this.authService.login(dto);
    }

    @Public()
    @Get('42')
    @UseGuards(FortyTwoAuthGuard)
    @ApiOperation({ summary: 'Redirect to 42 OAuth login' })
    @ApiResponse({ status: 302, description: 'Redirect to 42 intranet' })
    fortyTwoAuth() {
        // Guard handles redirect
    }

    @Public()
    @Get('42/callback')
    @UseGuards(FortyTwoAuthGuard)
    @ApiOperation({ summary: '42 OAuth callback' })
    @ApiResponse({ status: 200, description: 'OAuth successful, returns JWT token' })
    async fortyTwoAuthCallback(@Req() req: Request, @Res() res: Response) {
        const result = await this.authService.validateOAuthLogin(req.user);
        
        // Redirect to frontend with token in query params (or set cookie)
        // For now, return JSON response
        return res.json(result);
    }

}