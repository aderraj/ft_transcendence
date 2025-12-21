import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { FriendsModule } from './friends/friends.module';
import { PrismaModule } from './prisma/prisma.module';


@Module({
  imports: [AuthModule, UserModule, FriendsModule, PrismaModule],
})
export class AppModule {}
