import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async findAll(take = 20, skip = 0) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        take,
        skip,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isOnline: true,
          level: true,
          experience: true,
          wins: true,
          losses: true,
          createdAt: true,
        },
        orderBy: [
          { level: 'desc' },
          { experience: 'desc' },
        ],
      }),
      this.prisma.user.count(),
    ]);

    // Convert avatar filenames to full URLs
    const protocol = this.configService.get('USE_HTTPS') === 'true' ? 'https' : 'http';
    const host = this.configService.get('HOST_IP') || 'localhost';
    const port = this.configService.get('PORT') || '3001';

    const usersWithAvatarUrls = users.map((user) => ({
      ...user,
      avatar: user.avatar && !user.avatar.startsWith('http') ? `${protocol}://${host}:${port}/uploads/avatars/${user.avatar}` : user.avatar,
    }));

    return { users: usersWithAvatarUrls, total, take, skip };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
        level: true,
        experience: true,
        wins: true,
        losses: true,
        createdAt: true,
        twoFactorEnabled: true, // Include 2FA status
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Convert avatar filename to full URL
    if (user.avatar && !user.avatar.startsWith('http')) {
      const protocol = this.configService.get('USE_HTTPS') === 'true' ? 'https' : 'http';
      const host = this.configService.get('HOST_IP') || 'localhost';
      const port = this.configService.get('PORT') || '3001';
      user.avatar = `${protocol}://${host}:${port}/uploads/avatars/${user.avatar}`;
    }

    return user;
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        isOnline: true,
        level: true,
        experience: true,
        wins: true,
        losses: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${username} not found`);
    }

    // Convert avatar filename to full URL
    if (user.avatar && !user.avatar.startsWith('http')) {
      const protocol = this.configService.get('USE_HTTPS') === 'true' ? 'https' : 'http';
      const host = this.configService.get('HOST_IP') || 'localhost';
      const port = this.configService.get('PORT') || '3001';
      user.avatar = `${protocol}://${host}:${port}/uploads/avatars/${user.avatar}`;
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if username is being changed and is unique
    if (updateUserDto.username) {
      const existing = await this.prisma.user.findFirst({
        where: {
          username: updateUserDto.username,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException('Username already taken');
      }
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async updateOnlineStatus(id: string, isOnline: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isOnline,
        lastSeen: new Date(),
      },
    });
  }

  async updateAvatar(id: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        avatar: true,
      },
    });
  }

  async delete(id: string) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
