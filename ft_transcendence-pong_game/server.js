import Fastify from 'fastify';
import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client/index.js';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import cors from '@fastify/cors';

// IMPORT SHARED LOGIC
import { Ball, Paddle, GAME_CONFIG } from '@pixelpong/shared';

// Parse allowed origins from environment
const getAllowedOrigins = () => {
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
    const origins = allowedOriginsEnv
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => origin.length > 0);
    
    if (origins.length === 0) {
        return ['http://localhost:3000', 'https://localhost:3000'];
    }
    return origins;
};

const fastify = Fastify({
    logger: true 
});

// Register CORS
await fastify.register(cors, {
    origin: getAllowedOrigins(),
    credentials: true,
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
        socket : connection,
        timeStamp : Date.now(),
        score: 0 
    });
}

function formulateGameState(player1, player2, gameID)
{
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

// =========================================================================================
//  GAME LOOP & PHYSICS LOGIC
// =========================================================================================


function checkPaddleHit(ball, paddle, side) {
    // Check if ball is within paddle bounds (AABB collision)
    const hitX = ball.x + ball.radius > paddle.x && ball.x - ball.radius < paddle.x + paddle.width;
    const hitY = ball.y + ball.radius > paddle.y && ball.y - ball.radius < paddle.y + paddle.height;
    
    if (hitX && hitY) {
        , Paddle Y: ${paddle.y.toFixed(1)}`);
        
        if (side === 'left') {
            // Hit Left Paddle: Push ball to right side of paddle
            ball.x = paddle.x + paddle.width + ball.radius;
            ball.dx = Math.abs(ball.dx);
        } else {
            // Hit Right Paddle: Push ball to left side of paddle
            ball.x = paddle.x - ball.radius;
            ball.dx = -Math.abs(ball.dx);
        }

        // Add Spin/English based on hit position
        const hitPoint = ball.y - (paddle.y + paddle.height / 2);
        ball.dy += hitPoint * 0.005; 
        
        // Increase Speed
        ball.dx *= 1.05;
        ball.dy *= 1.05;
    }
}


function startCountdown(gameId) {
    const gameSession = game.get(gameId);
    if (!gameSession) return;

    let count = 3;
    const { data } = gameSession;

    const sendCountdown = (value) => {
        const msg = JSON.stringify({ type: 'countdown', value });
        data.connections.forEach(conn => {
            if (conn.readyState === 1) conn.send(msg);
        });
    };

    // Send initial countdown
    sendCountdown(count);
    ;

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            sendCountdown(count);
            ;
        } else if (count === 0) {
            sendCountdown('GO!');
            ;
        } else {
            // Countdown finished, start the actual game
            clearInterval(countdownInterval);
            sendCountdown(null); // Signal countdown is over
            
            // Set the actual start time NOW (after countdown)
            gameSession.startTime = Date.now();
            startGameLoop(gameId);
        }
    }, 1000);

    // Store countdown interval for cleanup
    gameSession.countdownIntervalId = countdownInterval;
}

function startGameLoop(gameId) {
    const gameSession = game.get(gameId);
    if (!gameSession) return;

    // Run at ~60 FPS (16ms)
    gameSession.intervalId = setInterval(() => {
        const { entities, data } = gameSession;
        
        // 0. Check Timer (End game if time is up)
        const elapsed = Date.now() - gameSession.startTime;
        const timeLeft = Math.max(0, Math.floor((gameSession.gameDuration - elapsed) / 1000));
        
        if (elapsed >= gameSession.gameDuration) {
            endGame(gameId);
            return;
        }
        
        // 1. Update Physics (16ms step)
        entities.ball.update(16); 

        // 2. Simple Wall Collision (Top/Bottom)
        if (entities.ball.y - entities.ball.radius <= 0) {
            entities.ball.y = entities.ball.radius;
            entities.ball.dy = Math.abs(entities.ball.dy); // Force down
        } else if (entities.ball.y + entities.ball.radius >= GAME_CONFIG.CANVAS_HEIGHT) {
            entities.ball.y = GAME_CONFIG.CANVAS_HEIGHT - entities.ball.radius;
            entities.ball.dy = -Math.abs(entities.ball.dy); // Force up
        }

        // 3. Check Paddle Collision (This was missing previously)
        checkPaddleHit(entities.ball, entities.leftPaddle, 'left');
        checkPaddleHit(entities.ball, entities.rightPaddle, 'right');

        // 4. Check Scoring (Server Authoritative)
        if (entities.ball.x < 0) {
            ;
            data.rightPlayer.score++;
            handleServerScore(gameId, "right");
        } else if (entities.ball.x > GAME_CONFIG.CANVAS_WIDTH) {
            ;
            data.leftPlayer.score++;
            handleServerScore(gameId, "left");
        }

        // 5. Broadcast State to Clients
        // We manually construct the ball object here to avoid issues if .serialize() is missing
        const updateMsg = JSON.stringify({
            type: 'game_update',
            ball: {
                x: entities.ball.x,
                y: entities.ball.y,
                dx: entities.ball.dx,
                dy: entities.ball.dy
            },
            leftPaddleY: entities.leftPaddle.y,
            rightPaddleY: entities.rightPaddle.y,
            scores: {
                left: data.leftPlayer.score,
                right: data.rightPlayer.score
            },
            timeLeft: timeLeft
        });

        data.connections.forEach(conn => {
            if (conn.readyState === 1) conn.send(updateMsg);
        });

    }, 16); 
}

function handleServerScore(gameId, scorerSide) {
    const gameSession = game.get(gameId);
    if (!gameSession) return;

    const { entities, data } = gameSession;
    
    const elapsed = Date.now() - gameSession.startTime;
    const timeLeft = Math.max(0, Math.floor((gameSession.gameDuration - elapsed) / 1000));
    // Check for Game Over by score
    const MAX_SCORE = 5;
    if (data.leftPlayer.score >= MAX_SCORE || data.rightPlayer.score >= MAX_SCORE || timeLeft <= 0) {
        endGame(gameId);
        return;
    }

    // Reset Ball
    entities.ball.reset(GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2);

    // Calculate time left for the score update message

    
    // Notify Clients of Score Update (Explicit Event)
    const scoreMsg = JSON.stringify({
        type: 'score_update',
        scorer: scorerSide,
        scores: {
            left: data.leftPlayer.score,
            right: data.rightPlayer.score
        },
        timeLeft: timeLeft
    });

    data.connections.forEach(conn => {
        if (conn.readyState === 1) conn.send(scoreMsg);
    });
}

function endGame(gameId) {
    const gameSession = game.get(gameId);
    if (!gameSession) return;
    
    // Stop all intervals
    if (gameSession.intervalId) clearInterval(gameSession.intervalId);
    if (gameSession.countdownIntervalId) clearInterval(gameSession.countdownIntervalId);

    const { data } = gameSession;
    
    // Determine Winner based on score
    let winnerId = null;
    let winnerName = 'Draw';
    
    if (data.leftPlayer.score > data.rightPlayer.score) {
        winnerId = data.leftPlayer.userId;
        winnerName = data.leftPlayer.userId;
    } else if (data.rightPlayer.score > data.leftPlayer.score) {
        winnerId = data.rightPlayer.userId;
        winnerName = data.rightPlayer.userId;
    }

    // Notify Clients
    const endMsg = JSON.stringify({
        type: "gameOver",
        winner: winnerName,
        players: {
            leftPlayer: { userId: data.leftPlayer.userId, score: data.leftPlayer.score },
            rightPlayer: { userId: data.rightPlayer.userId, score: data.rightPlayer.score }
        }
    });
    
    
    

    data.connections.forEach(conn => {
        if (conn.readyState === 1) conn.send(endMsg);
    });

    // Save to DB (only if there's a winner, not a draw)
        saveMatchResult(data, winnerId);
    

    // Cleanup
    game.delete(gameId);
    ;
}

async function saveMatchResult(gameState, winnerId) {
    try {
        const user1Id = gameState.leftPlayer.userId;
        const user2Id = gameState.rightPlayer.userId;
        const user1Score = gameState.leftPlayer.score;
        const user2Score = gameState.rightPlayer.score;
        // const loserId = (winnerId === user1Id) ? user2Id : user1Id;

        const updateUserStats = async (userId, isWinner) => {
             const user = await prisma.user.findUnique({ where: { id: userId } });
             if (!user) {
                 await prisma.user.create({
                     data: {
                        id: userId,
                        username: `User_${userId}`,
                        wins: isWinner <= 0 ? 0 : 1,
                        losses: isWinner <= 0 ? 1 : 0,
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

        let winner = winnerId == null ? user1Id : winnerId == user1Id ? user1Id : user2Id;
        let loser = winnerId == null ? user2Id : winnerId == user1Id ? user2Id : user1Id;
        let result1 = winnerId == null ? -1 : winnerId == user1Id ? 1 : 0;
        let result2 = winnerId == null ? -1 : winnerId == user2Id ? 1 : 0;

        await Promise.all([
            updateUserStats(winner, result1),
            updateUserStats(loser, result2)
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
        ;
    } catch (error) {
        console.error("Error saving match:", error);
    }
}


function startNewGame(player1, player2) {
    const gameState = formulateGameState(player1, player2, gameCounter);
    
    // Initialize entities using shared logic
    const ball = new Ball(GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2, 10, 'white', 0.3);
    const leftPaddle = new Paddle(30, GAME_CONFIG.CANVAS_HEIGHT / 2 - GAME_CONFIG.PADDLE_HEIGHT / 2, GAME_CONFIG.PADDLE_WIDTH, GAME_CONFIG.PADDLE_HEIGHT, 'yellow');
    const rightPaddle = new Paddle(GAME_CONFIG.CANVAS_WIDTH - 40, GAME_CONFIG.CANVAS_HEIGHT / 2 - GAME_CONFIG.PADDLE_HEIGHT / 2, GAME_CONFIG.PADDLE_WIDTH, GAME_CONFIG.PADDLE_HEIGHT, 'purple');

    ;
    ;
    ;

    game.set(gameState.gameId, {
        data: gameState,
        entities: { ball, leftPaddle, rightPaddle },
        intervalId: null,
        startTime: Date.now(),
        gameDuration: 60000 // 60 seconds in milliseconds
    });

    // Send individual start messages to each player with their side
    const baseMsg = {
        type: "game_start",
        gameId: gameState.gameId,
        config: GAME_CONFIG
    };

    if (player1.socket.readyState === 1) {
        player1.socket.send(JSON.stringify({ ...baseMsg, side: 'left' }));
    }
    if (player2.socket.readyState === 1) {
        player2.socket.send(JSON.stringify({ ...baseMsg, side: 'right' }));
    }

    // Start countdown before actual game
    startCountdown(gameState.gameId);
}

// =========================================================================================
//  WEBSOCKET ROUTES
// =========================================================================================

// WebSocket Documentation Endpoint
fastify.get('/api/websocket-info', {
    schema: {
        description: 'WebSocket connection info',
        tags: ['websocket'],
        response: {
            200: {
                type: 'object',
                properties: {
                    endpoint: { type: 'string' },
                    clientEvents: { type: 'object' },
                }
            }
        }
    }
}, async (request, reply) => {
    return {
        endpoint: 'ws://localhost:3002/websocket?user_id=YOUR_USER_ID',
        clientEvents: {
            moveUp: 'Send string "moveUp"',
            moveDown: 'Send string "moveDown"',
        }
    };
});

fastify.register(async function (fastify) {
    fastify.get('/websocket', { websocket: true }, async (connection, request) =>
    {
        ;
        let userId = request.query.user_id;
        const token = request.query.token;

        // Token Verification
        if (token) {
            try {
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
                    userId = profile.id; 
                    ;
                }
            } catch (err) {
                console.error("Auth Error:", err);
            }
        }

        if (!connections.has(connection))
        {
            // Add or update player
            if (!players.has(userId)) {
                addPlayer(userId, connection);
            } else {
                // Update existing player's socket
                players.set(userId, {
                    ...players.get(userId),
                    socket: connection,
                    timeStamp: Date.now()
                });
            }
            connections.add(connection);

            const roomId = request.query.roomId;

            if (roomId) {
                // Private Match Logic
                ;
                if (privateLobbies.has(roomId)) {
                    const opponent = privateLobbies.get(roomId);
                    if (opponent.userId === userId) {
                         // Same user reconnecting - update socket
                         opponent.socket = connection;
                         privateLobbies.set(roomId, opponent);
                         ;
                    } else if (opponent.socket.readyState === 1) {
                         ;
                         startNewGame(opponent, { userId, socket: connection });
                         gameCounter++;
                         privateLobbies.delete(roomId);
                    } else {
                         // Opponent socket is dead, replace with new player
                         ;
                         privateLobbies.set(roomId, { userId, socket: connection });
                    }
                } else {
                    ;
                    privateLobbies.set(roomId, { userId, socket: connection });
                }
            } else {
                // Public Matchmaking
                if (!playerQueu.length) {
                    playerQueu.push({userId: userId, socket: connection });
                    ;
                } else {
                    const opponent = playerQueu.shift();
                    if (opponent.socket.readyState === 1) {
                        startNewGame(opponent, { userId, socket: connection });
                        gameCounter++;
                    } else {
                        // Opponent socket is dead, add current player to queue instead
                        ;
                        playerQueu.push({userId: userId, socket: connection });
                    }
                }
            }
        }

        connection.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        connection.send(`Connected Successfully!`);

        // HANDLING INCOMING DATA
        connection.on('message', message => {
            try {
                handleClientInput(message, connection);
            } catch(e) { 
                console.error('Error handling client input:', e); 
            }
        })

        // HANDLING CONNECTION CLOSE 
        connection.on('close', () => {
            ;
            connections.delete(connection);

            // Remove from players Map
            for (const [uid, playerData] of players.entries()) {
                if (playerData.socket === connection) {
                    players.delete(uid);
                    ;
                    break;
                }
            }

            // Clean up private lobbies
            for (const [roomId, player] of privateLobbies.entries()) {
                if (player.socket === connection) {
                    privateLobbies.delete(roomId);
                    ;
                    return;
                }
            }
            // Remove from Queue
            const queueIndex = playerQueu.findIndex(p => p.socket === connection);                                                                                                                                                 
            if (queueIndex !== -1) {                                                                                                                                                                                               
                playerQueu.splice(queueIndex, 1);
                ;                                                                                                                                                                                  
                return;                                                                                                                                                                                                            
            }                                                                                                                                                                                                                      

            // Find Active Game and End it
            for (const [key, value] of game.entries())
            {
                const gameState = value.data; 
                if (gameState.leftPlayer.socket === connection ||
                    (gameState.rightPlayer && gameState.rightPlayer.socket === connection))
                {
                    const isLeft = gameState.leftPlayer.socket === connection;
                    const opponent = isLeft ? gameState.rightPlayer : gameState.leftPlayer;
                    
                    // Stop Loop Immediately
                    if (value.intervalId) clearInterval(value.intervalId);

                    // Save Forfeit Match
                    saveMatchResult(gameState, opponent.userId); // Opponent wins

                    if (opponent && opponent.socket && opponent.socket.readyState === 1) {
                        opponent.socket.send(JSON.stringify({
                            type: 'player_left',
                            exited_paddel: isLeft ? 'left' : 'right'
                        }));
                    }
                    
                    game.delete(key);
                    break;
                }
            }
        })
    });
});


function handlePlayerMomvements(gameConnections, paddelSide, action, gameId)
{
    // Update Server Side Paddle Position
    const gameSession = game.get(gameId);
    if (gameSession) {
        const { entities } = gameSession;
        const paddle = paddelSide === 'left' ? entities.leftPaddle : entities.rightPaddle;
        
        // Use paddle's own speed property (from shared Paddle class)
        const moveSpeed = paddle.speed * 16; // Scale by deltaTime (16ms)
        
        if (action === 'up' && paddle.y > 0) {
            paddle.y -= moveSpeed;
            if (paddle.y < 0) paddle.y = 0;
        } else if (action === 'down' && paddle.y < GAME_CONFIG.CANVAS_HEIGHT - paddle.height) {
            paddle.y += moveSpeed;
            if (paddle.y > GAME_CONFIG.CANVAS_HEIGHT - paddle.height) {
                paddle.y = GAME_CONFIG.CANVAS_HEIGHT - paddle.height;
            }
        }
    }

    // Broadcast to other player (so they see it)
    let data = {
        type: 'key_move', 
        paddel : { side : paddelSide, action : action },
        timeStamp: performance.now() 
    }
    let inputData = JSON.stringify(data);
    gameConnections.forEach(connection => {
        try {
            if (connection.readyState === 1) connection.send(inputData);
        } catch(e) { console.error('Error broadcasting paddle movement:', e); }
    });
}


function handleClientInput(message, sender)
{
    const messageString = message.toString();
    const validMessage = ["moveUp", "moveDown", "gameOver", "resetGameRound", "onScore"]; // 'onScore' is now deprecated/ignored from client
    
    let command = messageString;
    try {
        const parsed = JSON.parse(messageString);
        if (parsed.type) command = parsed.type;
        else if (parsed.action) command = parsed.action;
        ;
    } catch (e) {
        ;
    }

    // Find the game
    let currentGameState = null;
    let currentGameId = null;

    for (const [id, g] of game) {
        const state = g.data;
        if ((state.leftPlayer && state.leftPlayer.socket === sender) || 
            (state.rightPlayer && state.rightPlayer.socket === sender)) {
            currentGameState = state;
            currentGameId = id;
            break;
        }
    }

    if (!currentGameState) {
        ;
        return;
    }

    // IGNORE CLIENT SCORING (Server is authoritative now)
    if (command === "onScore" || command === "resetGameRound") {
        return; 
    }

    // Handle Movement
    if (currentGameState.leftPlayer && sender === currentGameState.leftPlayer.socket) {
        if (command === "moveUp" || command === "moveDown") {
            ;
            handlePlayerMomvements(currentGameState.connections, "left", command === "moveUp" ? "up" : "down", currentGameId);
        }
    }
    else if (currentGameState.rightPlayer && sender === currentGameState.rightPlayer.socket) {
        if (command === "moveUp" || command === "moveDown") {
            ;
            handlePlayerMomvements(currentGameState.connections, "right", command === "moveUp" ? "up" : "down", currentGameId);
        }
    }
}


const PORT = process.env.PORT || 3000;

const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        ;
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();  