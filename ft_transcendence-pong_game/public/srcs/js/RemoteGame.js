import {Ball} from "./entities/Ball.js";
import {Paddle} from "./entities/Paddle.js";
import { InputController } from "./managers/InputController.js";
import { NetworkManager } from "./managers/NetworkManager.js";


class RemoteGame {
    constructor(canvasid, width=1000, height=600, wsocketSever)
    {
        ;
        const canvas = document.getElementById(canvasid);
        if (!canvas) {
            console.error("Canvas element not found!");
            return;
        }
        this.ctx = canvas.getContext('2d');
        this.canvasWidth = width;
        this.canvasHeight = height;
        canvas.width = width;
        canvas.height = height;
        
        // Game Components
        this.ball = new Ball(canvas.width / 2, canvas.height / 2, 10, 'rgb(250, 204, 21)');

        // Managers
        this.inputController = new InputController();
        this.networkManger = new NetworkManager(wsocketSever);
        this.networkManger.setMessageHandler(this.handleServerMessages.bind(this));

        // Game State
        this.lastTime = 0;
        this.gameTime = 0;
        this.isRunning = false;
        this.gameMode = 'remote';
        this.isPaused = false;
        this.countdownActive = false;
        this.gameState =  null;

        //player - these ARE the paddles
        this.player2 = new Paddle(canvas.width - 40, canvas.height / 2 - 50, 15, 100, 'purple');
        this.player1 = new Paddle(30, canvas.height / 2 - 50, 15, 100, 'yellow');
        
        //  paddles to players 
        this.leftPaddle = this.player1;
        this.rightPaddel = this.player2;
        this.player1Name = "Player 1";
        this.player2Name = "Player 2";
        this.localPaddel = null;

        //score
        this.maxScore = 4;
        this.maxGameRounds = 7;
        this.maxTime = 35000;
        this.gameState = null;
    }

    //initial draw functions
    renderBoard()
    {
        const ctx = this.ctx;

        // Draw center line
        ctx.strokeStyle = 'white';
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(this.canvasWidth / 2, 0);
        ctx.lineTo(this.canvasWidth / 2, this.canvasHeight);
        ctx.stroke();
        ctx.setLineDash([]);
    }


// =================================== GAME LOGIC FUCTIONS ====================================================
    resetBall(random)
    {
        // Reset ball position
        this.ball.x = this.canvasWidth / 2;
        this.ball.y = this.canvasHeight / 2;
        
        const angle = (random - 0.5) * Math.PI / 3; 
        const direction = random < 0.5 ? 1 : -1;
        this.ball.baseSpeed = 0.3;
        const speed = this.ball.baseSpeed;

        this.ball.dx = direction * speed * Math.cos(angle);
        this.ball.dy = speed * Math.sin(angle);
    }

    // collision detection between ball and paddles
    checkPaddleCollision()
    {
        //left paddle collision
        const closestX = Math.max(this.leftPaddle.x, Math.min(this.ball.x, this.leftPaddle.x + this.leftPaddle.width));
        const closestY = Math.max(this.leftPaddle.y, Math.min(this.ball.y, this.leftPaddle.y + this.leftPaddle.height)); 
        const distanceX = this.ball.x - closestX;
        const distanceY = this.ball.y - closestY; 
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

        if (distanceSquared < this.ball.radius * this.ball.radius)
        {
            return 1;
        }

        //right paddle collision
        const closestX2 = Math.max(this.rightPaddel.x, Math.min(this.ball.x, this.rightPaddel.x + this.rightPaddel.width));
        const closestY2 = Math.max(this.rightPaddel.y, Math.min(this.ball.y, this.rightPaddel.y + this.rightPaddel.height));        
        const distanceX2 = this.ball.x - closestX2;
        const distanceY2 = this.ball.y - closestY2;
        const distanceSquared2 = (distanceX2 * distanceX2) + (distanceY2 * distanceY2);
       
        if (distanceSquared2 < this.ball.radius * this.ball.radius)
        {
            return 2;
        }
        return 0;
    }

    checkWallCollision()
    {
        let collision = 0;
        
        // Top wall collision
        if (this.ball.y - this.ball.radius <= 0)
        {
            this.ball.y = this.ball.radius ; 
            this.ball.dy = Math.abs(this.ball.dy); 
            collision = 1;
        }
        else if (this.ball.y + this.ball.radius >= this.canvasHeight)
        {

            this.ball.y = this.canvasHeight - this.ball.radius; 
            this.ball.dy = -Math.abs(this.ball.dy); 
            collision = 1;
        }
        
        // Left wall collision
        if (this.ball.x - this.ball.radius <= 0)
        {
            collision = 2;
        }
        // Right wall collision
        else if (this.ball.x + this.ball.radius >= this.canvasWidth)
        {
            collision = 2;
        }
        return collision;
    }

        // Update Player 1 score
    updateScore1(score)
    {
        document.getElementById('score1').textContent = score;
    }
    
    // Update Player 2 score
    updateScore2(score)
    {
        document.getElementById('score2').textContent = score;
    }

    checkCollision()
    {
        const wallHit = this.checkWallCollision();
        if (wallHit === 2)
        {
            ;
            // Left/Right wall collision - scoring
            if (this.ball.x - this.ball.radius <= 0 && this.localPaddel == "right")
            {
                // this.player2.onScore();
                // let data 

                this.networkManger.broadCast(JSON.stringify({
                    type : "onScore",
                    side : "right",
                    gameId : this.gameState.game.gameId,
                    timeStamp : Date.now(),
                }));
                // 
                this.isRunning = false; // Prevent multiple sends
                if (this.player2.score  + 1 == this.maxScore)
                {   
                    ;
                    this.networkManger.broadCast("gameOver")
                    return;
                }
            }
            else if (this.ball.x + this.ball.radius >= this.canvasWidth &&  this.localPaddel == "left")
            {
                // 
                // this.player1.onScore();
                // this.updateScore1(this.player1.score);
                this.networkManger.broadCast(JSON.stringify({
                    type : "onScore",
                    side : "left",
                    gameId : this.gameState.game.gameId,
                    timeStamp : Date.now(),
                }));
                this.isRunning = false; // Prevent multiple sends

                if (this.player1.score + 1 === this.maxScore)
                {
                    ;
                    this.networkManger.broadCast("gameOver");
                    return;
                }
            }
            // this.resetGameRound();
            return;
        }
        
        // Now check paddle collisions
        const paddleHit = this.checkPaddleCollision();
        const speed = this.ball.baseSpeed;

        if (paddleHit === 1)
        {
            this.ball.x = this.leftPaddle.x + this.leftPaddle.width + this.ball.radius;
            
            let offset = (this.ball.y - (this.leftPaddle.y + this.leftPaddle.height / 2)) / (this.leftPaddle.height / 2);
            offset = Math.max(-1, Math.min(1, offset));

            let angle = offset * (Math.PI / 4);
            this.ball.dx = Math.abs(speed * Math.cos(angle));
            this.ball.dy = speed * Math.sin(angle);
        }
        else if (paddleHit === 2)
        {
            this.ball.x = this.rightPaddel.x - this.ball.radius;
            
            let offset = (this.ball.y - (this.rightPaddel.y + this.rightPaddel.height / 2)) / (this.rightPaddel.height / 2);
            offset = Math.max(-1, Math.min(1, offset));
            
            let angle = offset * (Math.PI / 4);
            this.ball.dx = -Math.abs(speed * Math.cos(angle));
            this.ball.dy = speed * Math.sin(angle);
        }
    }
//========================================= CANVAS GENERATION FUNCTUION============================================
    drawCountDownTimer()
    {
        if (this.countdownActive)
            return;
        this.countdownActive = true;
        this.countdownNumber = 3;
    }
    
    updateCountdown(deltaTime)
    {
        if (!this.countdownActive)
            return ;
        if (!this.countdownStartTime) 
            this.countdownStartTime = 0;        
        this.countdownStartTime += deltaTime;
        if (this.countdownStartTime >= 1000)
        {
            this.countdownNumber--;
            this.countdownStartTime = 0;
            
            if (this.countdownNumber < 0)
            {
                this.countdownActive = false;
                this.isRunning = true;
                this.countdownStartTime = null;
            }
        }
    }

    drawTimer()
    {
        const ctx = this.ctx;
        const timeLeft = Math.max(0, this.maxTime - this.gameTime);
        const secondsLeft = Math.ceil(timeLeft / 1000);

        document.getElementById('timer').textContent = secondsLeft;
    }

    gameEnd()
    {
        this.isRunning = false;
        this.isPaused = true;
        const winnerName = this.player1.score >= this.maxScore ? this.player1Name : this.player2Name;
        const gameEndMessage = document.getElementById('gameEndMessage');

        if (gameEndMessage)
        {
            document.getElementById('winnerText').textContent = winnerName;
            gameEndMessage.style.display = 'flex';
        }
        else
        {
            console.error("gameEndMessage element not found!");
        }
    }
    /*
    deltaTime (which is the variable name for the time stamp you're asking about) represents the time passed since the last frame was drawn, usually
    in milliseconds.
    */
   
    // Update and render loop
    update(deltaTime)
    {
        if (this.countdownActive)
        {
            this.updateCountdown(deltaTime);
            return;
        }
        if (this.isPaused || !this.isRunning)
            return;
        this.gameTime += deltaTime;
        if (this.gameTime >= this.maxTime)
        {
            // this.resetGameRound();
            this.networkManger.broadCast("resetGameRound");
            return;
        }
        // Handle paddle input - Send to Server
        if (this.inputController.keys['w'] || this.inputController.keys['ArrowUp'])
        {
            this.networkManger.broadCast("moveUp");
        }
        if (this.inputController.keys['s'] || this.inputController.keys['ArrowDown'])
        {
            this.networkManger.broadCast("moveDown");
        }
        
        this.ball.update(deltaTime);
        this.checkCollision();
        return;
    }

    //============================================ Game Loop FUNCITON ================================================
    render()
    {
        //clear the canvas
        this.ctx.fillStyle = "rgb(38 54 92 /0.6)";
        this.ctx.fillRect(1, 1, canvas.width, canvas.height);
        //render game elements
        this.renderBoard();
        this.ball.render(this.ctx);
        this.leftPaddle.render(this.ctx, 20, 0, 0, 20);
        this.rightPaddel.render(this.ctx, 0, 20 , 20, 0);
        // this.drawScore();
        // this.drawPlayerNames();
        if (!this.isRunning && !this.isPaused && this.countdownActive)
        {
            const ctx = this.ctx;
            ctx.fillStyle = 'white';
            ctx.font = '72px Arial';
            ctx.fillText(this.countdownNumber, this.canvasWidth / 2 - 20, this.canvasHeight / 2 + 20);
        }
        if (this.isRunning)
        {
            this.drawTimer();
        }
    }

    gameLoop(currentTime)
    {
        const deltaTime = currentTime - this.lastTime;
        
        if (this.lastTime === 0)
        {
            this.lastTime = currentTime;
            this.countdownActive = true;
            requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }
        this.update(deltaTime);
        this.render();
        // ;
        this.lastTime = currentTime;
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    resetPaddels()
    {
        this.player1.y = this.canvasHeight / 2 - 50;
        this.player2.y = this.canvasHeight / 2 - 50;
    }
    
    start(data)
    {
        ;
        const gameEndMessage = document.getElementById('gameEndMessage');
        const waitingMessage = document.getElementById('waitingMessage');
        
        if (gameEndMessage) {
            gameEndMessage.style.display = 'none';
        }
        if (waitingMessage) {
            waitingMessage.style.display = 'none';
        }

        this.lastTime = 0;
        this.countdownNumber = 3;
        this.countdownStartTime = null;
        this.player1.score = data.game.leftPlayer.score;
        this.player2.score = data.game.rightPlayer.score;
        this.lastTime = 0;
        this.gameTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        // this.gameID = data.game.gamId;
        this.gameState = data;
        if (data.isLeft)
            this.localPaddel = "left";
        else
            this.localPaddel = "right";
        this.resetBall(data.random);
        this.resetPaddels();
        this.updateScore1(this.player1.score);
        this.updateScore2(this.player2.score);
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    resetTimer()
    {
        document.getElementById('timer').textContent = this.maxTime / 1000;
    }

    resetGameRound(data)
    {
        this.resetBall(data.random);
        this.leftPaddle.y = this.canvasHeight / 2 - this.leftPaddle.height / 2;
        this.rightPaddel.y = this.canvasHeight / 2 - this.rightPaddel.height / 2;
        this.gameTime = 0;
        this.isRunning = false; 
        this.countdownActive = false; 
        this.lastTime = 0;
        this.rightPaddel.score = data.players.rightPlayer.score;
        this.leftPaddle.score = data.players.leftPlayer.score;
        this.updateScore1(this.leftPaddle.score);
        this.updateScore2(this.rightPaddel.score);
        this.resetTimer();
        this.drawCountDownTimer(); 
    }


    // ================================= NETWORK MANGEMENT FUNCTION ====================================

    handleInput(data)
    {
        // Use a fixed time step for network updates to avoid clock synchronization issues
        const networkDelta = 16; // approx 60fps frame time

        //move left paddel
        if (data.paddel.side == 'left')
        {
            if (data.paddel.action == 'up' && this.leftPaddle.y > 0)
            {
                this.leftPaddle.y -= 0.5 * networkDelta;
            }
            else if (data.paddel.action == 'down' && this.leftPaddle.y < this.canvasHeight - this.leftPaddle.height)
            {
                this.leftPaddle.y += 0.5 * networkDelta;
            }
        }
        else
        {
            if (data.paddel.action == 'up' && this.rightPaddel.y > 0)
            {
                this.rightPaddel.y -= 0.5 * networkDelta;
            }
            else if (data.paddel.action == 'down' && this.rightPaddel.y < this.canvasHeight - this.rightPaddel.height)
            {
                this.rightPaddel.y += 0.5 * networkDelta;
            }
        }
        //move right paddel
    }

    //updating Game State 
    updateGameState(data)
    {
        this.leftPaddle.score = data.players.leftPlayer.score;
        this.rightPaddel.score = data.players.rightPaddel.score;
    }

    handlePlayerLeft(data)
    {
        this.isRunning = false;
        this.isPaused = true;

        if (data.exited_paddel === 'left') {
            this.leftPaddle.score = 0;
            this.rightPaddel.score = this.maxScore;
        } else {
            this.leftPaddle.score = this.maxScore;
            this.rightPaddel.score = 0;
        }

        this.updateScore1(this.leftPaddle.score);
        this.updateScore2(this.rightPaddel.score);
        this.gameEnd();
    }
    //handling Server Messages
    handleServerMessages(data)
    {
        ;
        switch(data.type)
        {
            case 'player_left':
                this.handlePlayerLeft(data);
                break;
            case 'key_move':
                this.handleInput(data);
                break;
            case 'game_start':
                this.start(data);
                break;
            case 'gameOver':
                this.gameEnd();
                break;
            case 'reset_game_round':
                this.resetGameRound(data);
                break;
            default:
                this.updateGameState(data);
                break;
        }
    }
}

export { RemoteGame };

// Parse query parameters
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id') || crypto.randomUUID(); // Fallback for testing
const token = urlParams.get('token');

// Construct WebSocket URL
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host; // e.g. localhost:3002
const wsUrl = `${protocol}//${host}/websocket?user_id=${userId}&token=${token || ''}`;

const remoteGame = new RemoteGame("canvas", 1000, 600, wsUrl); 