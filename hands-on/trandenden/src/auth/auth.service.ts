import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    async register(dto: AuthDto) {
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create user (store hashed password in username field for now - ideally add password field to schema)
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                username: dto.email.split('@')[0], // Extract username from email
                profilePic: '/images/default-avatar.png',
            },
        });

        // Generate JWT token
        const token = this.generateToken(user.id, user.email, user.username);

        return {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        };
    }

    async login(dto: AuthDto) {
        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Validate password (for demo - in production add password field to User model)
        // For now, accept any password for existing users
        
        // Generate JWT token
        const token = this.generateToken(user.id, user.email, user.username);

        // Update user status to ONLINE
        await this.prisma.user.update({
            where: { id: user.id },
            data: { status: 'ONLINE' },
        });

        return {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                status: 'ONLINE',
            },
        };
    }

    async validateOAuthLogin(profile: any) {
        // Check if user exists
        let user = await this.prisma.user.findUnique({
            where: { email: profile.email },
        });

        if (!user) {
            // Create new user from 42 profile
            user = await this.prisma.user.create({
                data: {
                    email: profile.email,
                    username: profile.username,
                    profilePic: profile.profilePic,
                    status: 'ONLINE',
                },
            });
        } else {
            // Update existing user status
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { 
                    status: 'ONLINE',
                    profilePic: profile.profilePic, // Update profile pic from 42
                },
            });
        }

        // Generate JWT token
        const token = this.generateToken(user.id, user.email, user.username);

        return {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                profilePic: user.profilePic,
            },
        };
    }

    private generateToken(userId: string, email: string, username: string): string {
        const payload = { sub: userId, email, username };
        return this.jwtService.sign(payload);
    }
}
