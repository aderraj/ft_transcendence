import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { FriendsModule } from './friends/friends.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';


@Module({
  imports: [AuthModule, UserModule, FriendsModule, PrismaModule, ChatModule],
})
export class AppModule {}
