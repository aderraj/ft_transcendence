import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
          elo: true,
          wins: true,
          losses: true,
          createdAt: true,
        },
        orderBy: { elo: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { users, total, take, skip };
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
        elo: true,
        wins: true,
        losses: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
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
        elo: true,
        wins: true,
        losses: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${username} not found`);
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
