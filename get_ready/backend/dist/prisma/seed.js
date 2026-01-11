"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    await prisma.game.deleteMany();
    await prisma.friendRequest.deleteMany();
    await prisma.friend.deleteMany();
    await prisma.user.deleteMany();
    const hashPassword = async (password) => {
        return bcrypt.hash(password, 10);
    };
    const user1 = await prisma.user.create({
        data: {
            email: 'reda@transcendence.ma',
            username: 'reda',
            displayName: 'Reda',
            password: await hashPassword('password1'),
            level: 1,
            experience: 730,
            wins: 7,
            losses: 3,
            isOnline: true,
        },
    });
    console.log('✅ Created user: reda');
    const user2 = await prisma.user.create({
        data: {
            email: 'samir@transcendence.ma',
            username: 'samir',
            displayName: 'Samir',
            password: await hashPassword('password2'),
            level: 1,
            experience: 550,
            wins: 5,
            losses: 5,
            isOnline: false,
        },
    });
    console.log('✅ Created user: samir');
    const user3 = await prisma.user.create({
        data: {
            email: 'aymen@transcendence.ma',
            username: 'aymen',
            displayName: 'Aymen',
            password: await hashPassword('password3'),
            level: 1,
            experience: 440,
            wins: 4,
            losses: 4,
            isOnline: true,
        },
    });
    console.log('✅ Created user: aymen');
    const user4 = await prisma.user.create({
        data: {
            email: 'karim@transcendence.ma',
            username: 'karim',
            displayName: 'Karim',
            password: await hashPassword('password4'),
            level: 1,
            experience: 660,
            wins: 6,
            losses: 6,
            isOnline: false,
        },
    });
    console.log('✅ Created user: karim');
    const user5 = await prisma.user.create({
        data: {
            email: 'user5@transcendence.ma',
            username: 'user5',
            displayName: 'User 5',
            password: await hashPassword('password5'),
            level: 1,
            experience: 550,
            wins: 5,
            losses: 5,
            isOnline: true,
        },
    });
    console.log('✅ Created user: user5');
    await prisma.friend.createMany({
        data: [
            { userId: user1.id, friendId: user2.id },
            { userId: user2.id, friendId: user1.id },
        ],
    });
    console.log('✅ Created friendship: reda <-> samir');
    await prisma.friend.createMany({
        data: [
            { userId: user4.id, friendId: user5.id },
            { userId: user5.id, friendId: user4.id },
        ],
    });
    console.log('✅ Created friendship: karim <-> user5');
    await prisma.friendRequest.create({
        data: {
            senderId: user3.id,
            receiverId: user4.id,
            status: 'PENDING',
        },
    });
    console.log('✅ Created pending friend request: aymen -> karim');
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
    console.log('✅ Created 10 game records');
    console.log('');
    console.log('🎉 Seeding complete!');
    console.log('');
    console.log('Test Users:');
    console.log('-------------------');
    console.log('| Username | Password   | ELO  |');
    console.log('|----------|------------|------|');
    console.log('| reda     | password1  | 1200 |');
    console.log('| samir    | password2  | 1100 |');
    console.log('| aymen    | password3  | 1050 |');
    console.log('| karim    | password4  | 1000 |');
    console.log('| user5    | password5  | 950  |');
    console.log('-------------------');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map