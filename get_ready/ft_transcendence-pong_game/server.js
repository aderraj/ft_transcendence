import Fastify from 'fastify';
import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client/index.js';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

const fastify = Fastify({
    logger: true 
});

// Register Swagger
await fastify.register(swagger, {
    openapi: {
        info: {
            title: 'Pong Game API',
            description: 'Real-time multiplayer Pong game with WebSocket support',
            version: '1.0.0',
        },
        tags: [
            { name: 'game', description: 'Game endpoints' },
            { name: 'websocket', description: 'WebSocket connection' },
        ],
    },
});

await fastify.register(swaggerUI, {
    routePrefix: '/api/docs',
    uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
    },
});

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const connections =  new Set();
const game = new Map();
let gameCounter = 0;
const players = new Map();
const playerQueu = [];
const privateLobbies = new Map(); // roomId -> { player1: connection }


/**
 * Game Messages Template:

########################### GAME START ######################
    {
        type: "game_start", 
        random : Math.random(), 
        game : {
            gameId: gameState.gameId,
            leftPlayer: {
                userId: gameState.leftPlayer.userId,
                score: gameState.leftPlayer.score
            },
            rightPlayer: {
                userId: gameState.rightPlayer.userId,
                score: gameState.rightPlayer.score
            },
            winner: gameState.winner,
            createdAt: gameState.createdAt
        }
    }
######################### GAME RESET ROUND #################
    {
        type: "reset_game_round",
        random: Math.random(),
        timeStamp: Date.now(),
        players: {
            leftPlayer: { score: currentGameState.leftPlayer.score },
            rightPlayer: { score: currentGameState.rightPlayer.score }
        }
    }

##################### GAME ON SCORE #############################
    {
        type: "reset_game_round",
        random: Math.random(),
        timeStamp: Date.now(),
        players: {
            leftPlayer: { score: currentGameState.leftPlayer.score },
            rightPlayer: { score: currentGameState.rightPlayer.score }
        }
    }

################## PLAYER LEFT #####################################
    {
        type: 'player_left',
        exited_paddel: isLeft ? 'left' : 'right'
    }
*/


/*
    player[]
    games[romms[]]
    room-> room_id | left_player - right_player

*/
await fastify.register(import('@fastify/static'), {
    root: new URL('public', import.meta.url).pathname
});

// websocket plugin 
await fastify.register(import('@fastify/websocket'));

fastify.get('/', async (request, reply) => {
    return reply.sendFile('index.html');
});

// API: Get game server status
fastify.get('/api/status', {
    schema: {
        description: 'Get current game server status',
        tags: ['game'],
        summary: 'Server status including player counts and active games',
        response: {
            200: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'online', description: 'Server status' },
                    playersOnline: { type: 'number', example: 12, description: 'Total connected players' },
                    playersInQueue: { type: 'number', example: 2, description: 'Players waiting for match' },
                    activeGames: { type: 'number', example: 5, description: 'Currently running games' },
                    totalConnections: { type: 'number', example: 12, description: 'WebSocket connections' },
                }
            }
        }
    }
}, async (request, reply) => {
    return {
        status: 'online',
        playersOnline: connections.size,
        playersInQueue: playerQueu.length,
        activeGames: game.size,
        totalConnections: connections.size,
    };
});

// API: Get all active games
fastify.get('/api/games', {
    schema: {
        description: 'Get list of all currently active games',
        tags: ['game'],
        summary: 'List active Pong matches with player info and scores',
        response: {
            200: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        gameId: { type: 'number', example: 1, description: 'Unique game ID' },
                        leftPlayer: {
                            type: 'object',
                            properties: {
                                userId: { type: 'string', example: 'user-123' },
                                score: { type: 'number', example: 3 }
                            }
                        },
                        rightPlayer: {
                            type: 'object',
                            properties: {
                                userId: { type: 'string', example: 'user-456' },
                                score: { type: 'number', example: 2 }
                            }
                        },
                        createdAt: { type: 'number', example: 1768007133000, description: 'Game start timestamp' }
                    }
                }
            }
        }
    }
}, async (request, reply) => {
    const activeGames = [];
    for (const [id, gameData] of game) {
        const gameState = gameData.data;
        activeGames.push({
            gameId: gameState.gameId,
            leftPlayer: {
                userId: gameState.leftPlayer.userId,
                score: gameState.leftPlayer.score,
            },
            rightPlayer: {
                userId: gameState.rightPlayer.userId,
                score: gameState.rightPlayer.score,
            },
            createdAt: gameState.createdAt,
        });
    }
    return activeGames;
});

// API: Get queue status
fastify.get('/api/queue', {
    schema: {
        description: 'Get matchmaking queue information',
        tags: ['game'],
        summary: 'Current players in matchmaking queue',
        response: {
            200: {
                type: 'object',
                properties: {
                    playersInQueue: { type: 'number', example: 2, description: 'Players waiting for match' },
                    estimatedWaitTime: { type: 'string', example: 'Less than 1 minute', description: 'Estimated time until match' }
                }
            }
        }
    }
}, async (request, reply) => {
    const queueCount = playerQueu.length;
    return {
        playersInQueue: queueCount,
        estimatedWaitTime: queueCount >= 1 ? 'Less than 1 minute' : 'Waiting for players'
    };
});

// API: Get game history (from database)
fastify.get('/api/history', {
    schema: {
        description: 'Get recent game history from database',
        tags: ['game'],
        summary: 'List of completed matches',
        querystring: {
            type: 'object',
            properties: {
                limit: { type: 'integer', default: 10, minimum: 1, maximum: 100, description: 'Number of games to return' }
            }
        },
        response: {
            200: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'uuid' },
                        user1Id: { type: 'string', example: 'user-123' },
                        user2Id: { type: 'string', example: 'user-456' },
                        user1Score: { type: 'number', example: 5 },
                        user2Score: { type: 'number', example: 3 },
                        winnerId: { type: 'string', example: 'user-123', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        endedAt: { type: 'string', format: 'date-time', nullable: true }
                    }
                }
            }
        }
    }
}, async (request, reply) => {
    try {
        const limit = request.query.limit || 10;
        const matches = await prisma.match.findMany({
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        });
        return matches;
    } catch (error) {
        reply.code(500).send({ error: 'Failed to fetch game history' });
    }
});


function addPlayer(userId, connection)
{
    players.set(userId, {
        // TO do send A request to db to get user meta data
        socket : connection,
        timeStamp : Date.now(),
        score: 0 // Initialize score if not present
    });
}

function formulateGameState(player1, player2, gameID)
{
    // Fetch persistent player data (like score) from the map if needed, 
    // but use the provided sockets for the active game connection.
    const leftPlayerData = players.get(player1.userId);
    const rightPlayerData = players.get(player2.userId);

    let data ={
        gameId : gameID,
        connections : [player1.socket, player2.socket],
        leftPlayer: {
            userId: player1.userId,
            score: leftPlayerData.score,
            socket: player1.socket
        },
        rightPlayer: {
            userId: player2.userId,
            score: rightPlayerData.score,
            socket: player2.socket
        },
        winner: null,
        createdAt: Date.now()
    };
    return data;

}

function startNewGame(player1, player2)
{

    const gameState = formulateGameState(player1, player2, gameCounter);
    
    // Create a version of the game state for the client that excludes sockets
    const clientGameState = {
        gameId: gameState.gameId,
        leftPlayer: {
            userId: gameState.leftPlayer.userId,
            score: gameState.leftPlayer.score
        },
        rightPlayer: {
            userId: gameState.rightPlayer.userId,
            score: gameState.rightPlayer.score
        },
        winner: gameState.winner,
        createdAt: gameState.createdAt
    };

    let data = 
    {
        type: "game_start", 
        random : Math.random(), 
        game : clientGameState
    };
    game.set(gameState.gameId, {
        data : gameState
    });

    gameState.connections.forEach(connection =>{
        try
        {
            if (gameState.connections[0] == connection)
                data.isLeft = true;
            else
                data.isLeft = false;
            if (connection.readyState == 1)
                connection.send(JSON.stringify(data));
        }
        catch (e)
        {
            console.error(e);
        }
    })

}
// WebSocket Documentation Endpoint
fastify.get('/api/websocket-info', {
    schema: {
        description: 'WebSocket connection information and event documentation',
        tags: ['websocket'],
        summary: 'How to connect and use the WebSocket for real-time gameplay',
        response: {
            200: {
                type: 'object',
                properties: {
                    endpoint: { type: 'string', example: 'ws://localhost:3002/websocket?user_id=YOUR_USER_ID' },
                    protocol: { type: 'string', example: 'WebSocket' },
                    authentication: { type: 'string', example: 'Pass user_id as query parameter' },
                    clientEvents: {
                        type: 'object',
                        description: 'Events that clients can send',
                        properties: {
                            moveUp: { type: 'string', example: 'Send string "moveUp" to move paddle up' },
                            moveDown: { type: 'string', example: 'Send string "moveDown" to move paddle down' },
                            resetGameRound: { type: 'string', example: 'JSON: {"type": "resetGameRound"}' },
                            gameOver: { type: 'string', example: 'JSON: {"type": "gameOver", "winner": "user-123"}' },
                            onScore: { type: 'string', example: 'JSON: {"type": "onScore"}' }
                        }
                    },
                    serverEvents: {
                        type: 'object',
                        description: 'Events that server sends to clients',
                        properties: {
                            game_start: { type: 'string', example: 'Sent when match starts with game state' },
                            reset_game_round: { type: 'string', example: 'Sent to reset ball between points' },
                            gameOver: { type: 'string', example: 'Sent when game ends' },
                            player_left: { type: 'string', example: 'Sent when opponent disconnects' },
                            moveUp: { type: 'string', example: 'Broadcast opponent paddle movement' },
                            moveDown: { type: 'string', example: 'Broadcast opponent paddle movement' }
                        }
                    },
                    exampleConnection: {
                        type: 'string',
                        example: 'const ws = new WebSocket("ws://localhost:3002/websocket?user_id=user123"); ws.onmessage = (e) => console.log(e.data);'
                    }
                }
            }
        }
    }
}, async (request, reply) => {
    return {
        endpoint: 'ws://localhost:3002/websocket?user_id=YOUR_USER_ID',
        protocol: 'WebSocket',
        authentication: 'Pass user_id as query parameter',
        clientEvents: {
            moveUp: 'Send string "moveUp" to move your paddle up',
            moveDown: 'Send string "moveDown" to move your paddle down',
            resetGameRound: 'Send JSON: {"type": "resetGameRound"} to reset round',
            gameOver: 'Send JSON: {"type": "gameOver", "winner": "userId"} when game ends',
            onScore: 'Send JSON: {"type": "onScore"} when point is scored'
        },
        serverEvents: {
            game_start: 'Received when matched with opponent. Contains full game state',
            reset_game_round: 'Received to reset ball position between points',
            gameOver: 'Received when game ends with winner information',
            player_left: 'Received when opponent disconnects (you win by forfeit)',
            moveUp: 'Received when opponent moves paddle up',
            moveDown: 'Received when opponent moves paddle down'
        },
        gameFlow: [
            '1. Connect to WebSocket with your user_id',
            '2. Server adds you to matchmaking queue',
            '3. When matched, receive "game_start" event',
            '4. Send moveUp/moveDown to control paddle',
            '5. Opponent movements are broadcast to you',
            '6. Send onScore when ball crosses goal',
            '7. Send gameOver when match ends',
            '8. Match is saved to database automatically'
        ],
        exampleConnection: 'const ws = new WebSocket("ws://localhost:3002/websocket?user_id=user123"); ws.onmessage = (e) => console.log(e.data); ws.send("moveUp");'
    };
});

//web socket route handler
fastify.register(async function (fastify) {
    fastify.get('/websocket', { websocket: true }, async (connection, request) =>
    {
        console.log('Client Connected');

//=============================================================================================================================================================

        let userId = request.query.user_id;
        const token = request.query.token;

        // Token Verification Logic
        if (token) {
            try {
                // Try container request first, then localhost fallback
                let verifyUrl = process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/users/me` : 'http://backend:3001/api/users/me';
                let res = await fetch(verifyUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null);

                if (!res || !res.ok) {
                     res = await fetch('http://localhost:3001/api/users/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).catch(() => null);
                }

                if (res && res.ok) {
                    const profile = await res.json();
                    userId = profile.id; // Securely set ID from token
                    console.log(`Auth Success: ${profile.username} (${userId})`);
                } else {
                    console.warn("Auth Failed: Invalid Token");
                    // connection.socket.send("Auth Failed");
                    // connection.socket.close();
                    // return;
                }
            } catch (err) {
                console.error("Auth Error:", err);
            }
        }

        if (!userId) {
             // connection.socket.close(); // Uncomment to enforce auth
             // return;
        } 

        if (! connections.has(connection))
        {
            if (! players.has(userId))
            {
                addPlayer(userId, connection);
            }
            connections.add(connection);

            const roomId = request.query.roomId;

            if (roomId) {
                 // Private Match Logic
                console.log(`Checking private lobby for room ${roomId}`);
                if (privateLobbies.has(roomId)) {
                    const opponent = privateLobbies.get(roomId);
                    // Prevent playing against yourself in same tab (or ensure safety)
                    if (opponent.userId === userId) {
                         // Reconnecting? 
                         opponent.socket = connection;
                         privateLobbies.set(roomId, opponent);
                    } else if (opponent.socket.readyState === 1) {
                         console.log("Found opponent in private lobby! Starting match...");
                         startNewGame(opponent, { userId, socket: connection });
                         gameCounter++;
                         privateLobbies.delete(roomId);
                    } else {
                         // Opponent dead
                         privateLobbies.set(roomId, { userId, socket: connection });
                    }
                } else {
                    console.log("Creating private lobby waiting room");
                    privateLobbies.set(roomId, { userId, socket: connection });
                }
            } else {
                // Public Matchmaking
                console.log(`player queu size ${playerQueu.length}`);
                if (! playerQueu.length)
                {
                    playerQueu.push({userId: userId, socket: connection });
                }
                else
                {
                    const opponent = playerQueu.shift();
                    startNewGame(opponent, { userId, socket: connection });
                    gameCounter++;
                }
            }
        }

//=============================================================================================================================================================

        //WELCOME CLIENT
        connection.send(`Connected Succesfully to Fastify WebSocket Server ! Total users number is${connections.size}`);

//=============================================================================================================================================================

        // //HANDLING INCOMING DATA
        connection.on('message', message => {
            try
            {
                console.log(message);
                handleClientInput(message, connection);
            }
            catch(e)
            {
                console.log(e);
            }
        })


//=============================================================================================================================================================
        //HANDLLING CONNECTION CLOSE 
        connection.on('close', () => {
            console.log('Client Disconnected');
            connections.delete(connection);

            // Clean up private lobbies
            for (const [roomId, player] of privateLobbies.entries()) {
                if (player.socket === connection) {
                    privateLobbies.delete(roomId);
                    console.log(`Player removed from private lobby ${roomId}`);
                    return;
                }
            }

            const queueIndex = playerQueu.findIndex(p => p.socket === connection);                                                                                                                                                 
            if (queueIndex !== -1)
            {                                                                                                                                                                                               
                playerQueu.splice(queueIndex, 1);                                                                                                                                                                                  
                console.log('Player removed from queue');                                                                                                                                                                          
                return;                                                                                                                                                                                                            
            }                                                                                                                                                                                                                      
                

            for (const [key, value] of game.entries())
            {
                const gameState = value.data; 
                if (gameState.leftPlayer.socket === connection ||
                    (gameState.rightPlayer && gameState.rightPlayer.socket === connection))
                {
                    const isLeft = gameState.leftPlayer.socket === connection;
                    const opponent = isLeft ? gameState.rightPlayer : gameState.leftPlayer;
                    
                    // Save match when player disconnects (opponent wins by forfeit)
                    const saveMatchOnDisconnect = async () => {
                        try {
                            const user1Id = gameState.leftPlayer.userId;
                            const user2Id = gameState.rightPlayer.userId;
                            // Disconnecting player forfeits, opponent wins
                            const user1Score = isLeft ? 0 : gameState.leftPlayer.score;
                            const user2Score = isLeft ? gameState.rightPlayer.score : 0;
                            const winnerId = isLeft ? user2Id : user1Id;
                            const loserId = isLeft ? user1Id : user2Id;

                            // Same update logic as gameOver
                            const updateUserStats = async (userId, isWinner) => {
                                 const user = await prisma.user.findUnique({ where: { id: userId } });
                                 if (!user) {
                                     await prisma.user.create({
                                         data: {
                                            id: userId,
                                            username: `User_${userId}`,
                                            wins: isWinner ? 1 : 0,
                                            losses: isWinner ? 0 : 1,
                                            experience: isWinner ? 50 : 10,
                                            level: 1
                                         }
                                     });
                                     return;
                                 }
                                 const newWins = user.wins + (isWinner ? 1 : 0);
                                 const newLosses = user.losses + (isWinner ? 0 : 1);
                                 const newXp = user.experience + (isWinner ? 50 : 10);
                                 const newLevel = Math.floor(newXp / 100) + 1;
                                 await prisma.user.update({
                                     where: { id: userId },
                                     data: {
                                         wins: newWins,
                                         losses: newLosses,
                                         experience: newXp,
                                         level: newLevel
                                     }
                                 });
                            };

                            await Promise.all([
                                updateUserStats(winnerId, true),
                                updateUserStats(loserId, false)
                            ]);

                            await prisma.match.create({
                                data: {
                                    user1Id,
                                    user2Id,
                                    user1Score,
                                    user2Score,
                                    winnerId,
                                    status: 'FINISHED',
                                    endedAt: new Date()
                                }
                            });
                            console.log(`Match saved (forfeit): ${user1Id} vs ${user2Id}, winner: ${winnerId}`);
                        } catch (error) {
                            console.error("Error saving match on disconnect:", error);
                        }
                    };
                    saveMatchOnDisconnect();

                    if (opponent && opponent.socket && opponent.socket.readyState === 1)
                    {
                        opponent.socket.send(JSON.stringify({
                            type: 'player_left',
                            exited_paddel: isLeft ? 'left' : 'right'
                        }));
                        // opponent.socket.close(); 
                    }
                    
                    // Cleanup game to prevent double-save if opponent disconnects
                    game.delete(key);
                    console.log(`Game ${key} ended due to disconnect.`);
                    break;
                }
            }
        })
    });
});


function handlePlayerMomvements(gameConnections, paddelSide, action)
{
    let data = 
    {
        type: 'key_move', 
        paddel : {
            side : paddelSide,
            action : action
        },
        timeStamp: performance.now() 
    }
    let inputData = JSON.stringify(data);
    gameConnections.forEach(connection =>
    {
        try
        {
            if (connection.readyState === 1) // WebSocket.OPEN
                connection.send(inputData);
        }
        catch(e)
        {
            console.log(e);
        }
    });
}

function handlResetGameRound(gameConnections, data)
{
    try
    {
        gameConnections.forEach(connection => 
        {
            if (gameConnections[0] == connection)
                data.isLeft = true;
            else
                data.isLeft = false;

            if (connection.readyState == 1)
                connection.send(JSON.stringify(data));
        })
    }
    catch (e)
    {
        console.error(e);
    }
}

function handleClientInput(message, sender)
{
    const messageString = message.toString();
    const validMessage = ["moveUp", "moveDown", "gameOver", "resetGameRound", "onScore"];
    
    let command = messageString;
    let parsedMessage = null;

    try
    {
        const parsed = JSON.parse(messageString);
        if (parsed && typeof parsed === 'object')
        {
            parsedMessage = parsed;
            // Check for 'type' or 'action' property
            if (parsed.type)
                command = parsed.type;
            else if (parsed.action)
                command = parsed.action;
        }
    }catch (e)
    {
        // To doNot JSON, continue with raw string
    }

    if (validMessage.includes(command))
    {
        let currentGameState = null;
        for (const [id, g] of game)
        {
            const state = g.data;
            if ((state.leftPlayer && state.leftPlayer.socket === sender) || 
                (state.rightPlayer && state.rightPlayer.socket === sender))
            {
                currentGameState = state;
                break;
            }
        }

        if (!currentGameState)
            {
            console.log("No active game found for input sender.");
            return;
        }

        // check if it's reset game
        if (command == "resetGameRound")
        {
            let data = {
                type: "reset_game_round",
                random: Math.random(),
                timeStamp: Date.now(),
                players: {
                    leftPlayer: { score: currentGameState.leftPlayer.score },
                    rightPlayer: { score: currentGameState.rightPlayer.score }
                }
            }
            handlResetGameRound(currentGameState.connections, data);
            return;
        }
        else if (command == "gameOver")
        {
            console.log("Game Over Event Detected !!!!!!!!!!!!!!!!!!!")
            
            // Save match result
            const saveMatch = async () => {
                try {
                    const user1Id = currentGameState.leftPlayer.userId;
                    const user2Id = currentGameState.rightPlayer.userId;
                    const user1Score = currentGameState.leftPlayer.score;
                    const user2Score = currentGameState.rightPlayer.score;
                    
                    let winnerId = null;
                    let loserId = null;
                    if (user1Score > user2Score) { winnerId = user1Id; loserId = user2Id; }
                    else if (user2Score > user1Score) { winnerId = user2Id; loserId = user1Id; }

                    const updateUserStats = async (userId, isWinner) => {
                         // 1. Get current stats
                         const user = await prisma.user.findUnique({ where: { id: userId } });
                         if (!user) {
                             // Create if missing
                             await prisma.user.create({
                                 data: {
                                    id: userId,
                                    username: `User_${userId}`,
                                    wins: isWinner ? 1 : 0,
                                    losses: isWinner ? 0 : 1,
                                    experience: isWinner ? 50 : 10,
                                    level: 1
                                 }
                             });
                             return;
                         }

                         // 2. Calculate new stats
                         const newWins = user.wins + (isWinner ? 1 : 0);
                         const newLosses = user.losses + (isWinner ? 0 : 1);
                         const newXp = user.experience + (isWinner ? 50 : 10);
                         // Simple level formula: 1 level per 100 XP
                         const newLevel = Math.floor(newXp / 100) + 1;

                         // 3. Update
                         await prisma.user.update({
                             where: { id: userId },
                             data: {
                                 wins: newWins,
                                 losses: newLosses,
                                 experience: newXp,
                                 level: newLevel
                             }
                         });
                    };

                    if (winnerId && loserId) {
                        await Promise.all([
                            updateUserStats(winnerId, true),
                            updateUserStats(loserId, false)
                        ]);
                    } else {
                        // Draw or abort - just ensure users exist
                        const ensureUser = async (uid) => {
                            const exists = await prisma.user.findUnique({ where: { id: uid } });
                            if (!exists) {
                                await prisma.user.create({
                                    data: { id: uid, username: `User_${uid}` }
                                });
                            }
                        };
                        await Promise.all([ensureUser(user1Id), ensureUser(user2Id)]);
                    }

                    await prisma.match.create({
                        data: {
                            user1Id,
                            user2Id,
                            user1Score,
                            user2Score,
                            winnerId,
                            status: 'FINISHED',
                            endedAt: new Date()
                        }
                    });
                    console.log(`Match saved: ${user1Id} vs ${user2Id}`);
                } catch (error) {
                    console.error("Error saving match:", error);
                }
            };
            saveMatch();

            currentGameState.connections.forEach(connection =>{
                try
                {
                    if (connection.readyState == 1)
                        connection.send(JSON.stringify(
                        {
                            type: "gameOver",
                            timeStamp: Date.now(),
                            players: {
                                leftPlayer: { score: currentGameState.leftPlayer.score },
                                rightPlayer: { score: currentGameState.rightPlayer.score }
                            } 
                        }));
                }
                catch(e)
                {
                    console.error(e)
                }
            })
            
            // Remove game from map to prevent disconnect handler from saving it again
            game.delete(currentGameState.gameId);
            console.log(`Game ${currentGameState.gameId} finished and removed.`);
        }
        else if (command == "onScore")
        {

            // console.log("before========================")
            // console.log(`score 1 ${currentGameState.leftPlayer.score} - score 2 ${currentGameState.rightPlayer.score}`)
            if (parsedMessage && parsedMessage.side) {
                if (parsedMessage.side === "left")
                {
                    currentGameState.leftPlayer.score++;
                } 
                else if (parsedMessage.side === "right")
                {
                    currentGameState.rightPlayer.score++;
                }

            // console.log("before========================")
            // console.log(`score 1 ${currentGameState.leftPlayer.score} - score 2 ${currentGameState.rightPlayer.score}`)
                let data = {
                    type: "reset_game_round",
                    random: Math.random(),
                    timeStamp: Date.now(),
                    players: {
                        leftPlayer: { score: currentGameState.leftPlayer.score },
                        rightPlayer: { score: currentGameState.rightPlayer.score }
                    }
                };
                handlResetGameRound(currentGameState.connections, data);
            }
            return;
        }

        if (currentGameState.leftPlayer && sender === currentGameState.leftPlayer.socket)
        {
            console.log("Input received from LEFT player");
            handlePlayerMomvements(currentGameState.connections, "left", command === "moveUp" ? "up" : "down");
        }
        else if (currentGameState.rightPlayer && sender === currentGameState.rightPlayer.socket)
        {
            console.log("Input received from RIGHT player");
            handlePlayerMomvements(currentGameState.connections, "right", command === "moveUp" ? "up" : "down");
        }
        else
        {
            console.log("Input received from unknown socket/observer");
        }

    } else
    {
        try {
            if (sender.readyState === 1)
                sender.send("message is not Defined try Again with a VALID MESSAGE ");
        } catch (e) {
            console.log(e);
        }
    }
}


const PORT = process.env.PORT || 3000;

const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`Server running on http://localhost:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
