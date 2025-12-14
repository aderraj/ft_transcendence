import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'username', 'wins', 'losses', 'status', 'createdAt'],
      order: { wins: 'DESC' },
    });
  }

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(username: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      username,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async updateScore(userId: number, won: boolean): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');
    
    if (won) {
      user.wins += 1;
    } else {
      user.losses += 1;
    }
    
    return this.usersRepository.save(user);
  }

  async getLeaderboard(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'username', 'wins', 'losses', 'status'],
      order: { wins: 'DESC' },
      take: 10,
    });
  }

  async search(query: string): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) LIKE LOWER(:query)', { query: `%${query}%` })
      .select(['user.id', 'user.username', 'user.status', 'user.wins', 'user.losses'])
      .getMany();
  }
}
