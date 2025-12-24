import Fastify from 'fastify';
import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client/client.ts';

const fastify = Fastify({
    logger: true 
});

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const connections =  new Set();
const game = new Map();
let gameCounter = 0;
const players = new Map();
const playerQueu = [];


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
//web socket route handler
fastify.register(async function (fastify) {
    fastify.get('/websocket', { websocket: true }, (connection, request) =>
    {
        console.log('Client Connected');

//=============================================================================================================================================================

        const userId = request.query.user_id; 

        if (! connections.has(connection))
        {
            if (! players.has(userId))
            {
                addPlayer(userId, connection);
            }
            connections.add(connection);

            // check if an avialable player is available if it's not 
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

                            const upsertUser = async (uid) => {
                                await prisma.user.upsert({
                                    where: { id: uid },
                                    update: {},
                                    create: { id: uid, username: `User_${uid}` }
                                });
                            };

                            await Promise.all([upsertUser(user1Id), upsertUser(user2Id)]);

                            await prisma.match.create({
                                data: {
                                    user1Id,
                                    user2Id,
                                    user1Score,
                                    user2Score,
                                    winnerId,
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
                    if (user1Score > user2Score) winnerId = user1Id;
                    else if (user2Score > user1Score) winnerId = user2Id;

                    // Helper to upsert user to ensure foreign keys exist
                    const upsertUser = async (uid) => {
                         await prisma.user.upsert({
                            where: { id: uid },
                            update: {},
                            create: { id: uid, username: `User_${uid}` } 
                        });
                    };

                    await Promise.all([upsertUser(user1Id), upsertUser(user2Id)]);

                    await prisma.match.create({
                        data: {
                            user1Id,
                            user2Id,
                            user1Score,
                            user2Score,
                            winnerId,
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
