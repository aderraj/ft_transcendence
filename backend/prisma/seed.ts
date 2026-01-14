import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  ;

  // Clear existing data
  await prisma.game.deleteMany();
  await prisma.friendRequest.deleteMany();
  await prisma.friend.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const hashPassword = async (password: string) => {
    return bcrypt.hash(password, 10);
  };

  // Create users
  const user1 = await prisma.user.create({
    data: {
      email: 'reda@transcendence.ma',
      username: 'reda',
      displayName: 'Reda',
      password: await hashPassword('password1'),
      level: 1,
      experience: 730, // 7 wins * 100 + 3 losses * 10
      wins: 7,
      losses: 3,
      isOnline: true,
    },
  });
  ;

  const user2 = await prisma.user.create({
    data: {
      email: 'samir@transcendence.ma',
      username: 'samir',
      displayName: 'Samir',
      password: await hashPassword('password2'),
      level: 1,
      experience: 550, // 5 wins * 100 + 5 losses * 10
      wins: 5,
      losses: 5,
      isOnline: false,
    },
  });
  ;

  const user3 = await prisma.user.create({
    data: {
      email: 'aymen@transcendence.ma',
      username: 'aymen',
      displayName: 'Aymen',
      password: await hashPassword('password3'),
      level: 1,
      experience: 440, // 4 wins * 100 + 4 losses * 10
      wins: 4,
      losses: 4,
      isOnline: true,
    },
  });
  ;

  const user4 = await prisma.user.create({
    data: {
      email: 'karim@transcendence.ma',
      username: 'karim',
      displayName: 'Karim',
      password: await hashPassword('password4'),
      level: 1,
      experience: 660, // 6 wins * 100 + 6 losses * 10
      wins: 6,
      losses: 6,
      isOnline: false,
    },
  });
  ;

  const user5 = await prisma.user.create({
    data: {
      email: 'user5@transcendence.ma',
      username: 'user5',
      displayName: 'User 5',
      password: await hashPassword('password5'),
      level: 1,
      experience: 550, // 5 wins * 100 + 5 losses * 10
      wins: 5,
      losses: 5,
      isOnline: true,
    },
  });
  ;

  // Create friendships (accepted friend requests create mutual friendships)
  
  // User 1 and User 2 are friends (accepted)
  await prisma.friend.createMany({
    data: [
      { userId: user1.id, friendId: user2.id },
      { userId: user2.id, friendId: user1.id },
    ],
  });
  ;

  // User 4 and User 5 are friends (accepted)
  await prisma.friend.createMany({
    data: [
      { userId: user4.id, friendId: user5.id },
      { userId: user5.id, friendId: user4.id },
    ],
  });
  ;

  // User 3 sent pending request to User 4
  await prisma.friendRequest.create({
    data: {
      senderId: user3.id,
      receiverId: user4.id,
      status: 'PENDING',
    },
  });
  ;

  // Create some game history
  const games = [
    { player1Id: user1.id, player2Id: user2.id, player1Score: 11, player2Score: 5, winnerId: user1.id },
    { player1Id: user1.id, player2Id: user2.id, player1Score: 11, player2Score: 8, winnerId: user1.id },
    { player1Id: user2.id, player2Id: user1.id, player1Score: 11, player2Score: 9, winnerId: user2.id },
    { player1Id: user1.id, player2Id: user3.id, player1Score: 11, player2Score: 3, winnerId: user1.id },
    { player1Id: user3.id, player2Id: user4.id, player1Score: 11, player2Score: 7, winnerId: user3.id },
    { player1Id: user4.id, player2Id: user5.id, player1Score: 11, player2Score: 10, winnerId: user4.id },
    { player1Id: user5.id, player2Id: user4.id, player1Score: 11, player2Score: 6, winnerId: user5.id },
    { player1Id: user1.id, player2Id: user4.id, player1Score: 11, player2Score: 4, winnerId: user1.id },
    { player1Id: user2.id, player2Id: user3.id, player1Score: 11, player2Score: 9, winnerId: user2.id },
    { player1Id: user1.id, player2Id: user5.id, player1Score: 11, player2Score: 7, winnerId: user1.id },
  ];

  for (const game of games) {
    await prisma.game.create({ data: game });
  }
  ;

  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
