import { Ball, Paddle } from '@pixelpong/shared';
import { InputController } from './InputController.js';

export class LocalGame {
    constructor(canvas, callbacks) {
        this.ctx = canvas.getContext('2d');
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        this.callbacks = callbacks || {};
        
        this.maxScore = 4;
        this.maxTime = 35000;

        this.ball = new Ball(
            this.canvasWidth / 2, 
            this.canvasHeight / 2, 
            10, 
            '#FFFFFF', 
            0.3
        );
        
        const paddleWidth = 15;
        const paddleHeight = 100;
        const centerY = this.canvasHeight / 2 - paddleHeight / 2;

        this.leftPaddle = new Paddle(30, centerY, paddleWidth, paddleHeight, '#facc15');
        this.rightPaddle = new Paddle(this.canvasWidth - 40, centerY, paddleWidth, paddleHeight, '#a855f7');
        
        this.player1 = this.leftPaddle;
        this.player2 = this.rightPaddle;
        this.player1Name = "Player 1";
        this.player2Name = "Player 2";

        this.gameTime = 0;
        this.lastTimerUpdate = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        
        this.countdownActive = false;
        this.countdownNumber = 3;
        this.countdownStartTime = 0;
        
        this.input = new InputController();
        this.animationFrameId = null;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        this.leftPaddle.score = 0;
        this.rightPaddle.score = 0;
        
        this.updateUI(); 
        this.resetRound();
        
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    resetRound() {
        this.ball.reset(this.canvasWidth / 2, this.canvasHeight / 2);
        
        const centerY = this.canvasHeight / 2 - this.leftPaddle.height / 2;
        this.leftPaddle.y = centerY;
        this.rightPaddle.y = centerY;
        
        this.gameTime = 0;
        this.lastTimerUpdate = 0; 
        if (this.callbacks.onTimerUpdate) {
            this.callbacks.onTimerUpdate(Math.ceil(this.maxTime / 1000));
        }

        this.countdownActive = true;
        this.countdownNumber = 3;
        this.countdownStartTime = 0;
        if (this.callbacks.onCountdownUpdate) this.callbacks.onCountdownUpdate(3);
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    destroy() {
        this.stop();
        if (this.input) this.input.destroy();
        
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.ctx.fillStyle = "rgba(16, 24, 39, 0.4)"; 
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    update(deltaTime) {
        if (this.countdownActive) {
            this.countdownStartTime += deltaTime;
            if (this.countdownStartTime >= 1000) {
                this.countdownNumber--;
                this.countdownStartTime = 0;
                
                if (this.callbacks.onCountdownUpdate) {
                    this.callbacks.onCountdownUpdate(this.countdownNumber > 0 ? this.countdownNumber : "GO!");
                }

                if (this.countdownNumber < 0) {
                    this.countdownActive = false;
                    if (this.callbacks.onCountdownUpdate) this.callbacks.onCountdownUpdate(null);
                }
            }
            return;
        }

        if (this.isPaused || !this.isRunning) return;

        this.gameTime += deltaTime;
        const timeLeft = Math.max(0, this.maxTime - this.gameTime);
        const currentSeconds = Math.ceil(timeLeft / 1000);
        
        if (currentSeconds !== this.lastTimerUpdate) {
            this.lastTimerUpdate = currentSeconds;
            if (this.callbacks.onTimerUpdate) this.callbacks.onTimerUpdate(currentSeconds);
        }

        if (this.gameTime >= this.maxTime) {
            this.resetRound(); 
            return;
        }

        const moveSpeed = 0.5 * deltaTime;
        if (this.input.isKeyPressed('w')) 
            this.leftPaddle.y = Math.max(0, this.leftPaddle.y - moveSpeed);
        if (this.input.isKeyPressed('s')) 
            this.leftPaddle.y = Math.min(this.canvasHeight - this.leftPaddle.height, this.leftPaddle.y + moveSpeed);
        if (this.input.isKeyPressed('ArrowUp')) 
            this.rightPaddle.y = Math.max(0, this.rightPaddle.y - moveSpeed);
        if (this.input.isKeyPressed('ArrowDown')) 
            this.rightPaddle.y = Math.min(this.canvasHeight - this.rightPaddle.height, this.rightPaddle.y + moveSpeed);

        this.ball.update(deltaTime);
        this.checkCollision();
    }

    checkCollision() {
        if (this.ball.y - this.ball.radius <= 0) {
            this.ball.y = this.ball.radius;
            this.ball.dy = Math.abs(this.ball.dy);
        } else if (this.ball.y + this.ball.radius >= this.canvasHeight) {
            this.ball.y = this.canvasHeight - this.ball.radius;
            this.ball.dy = -Math.abs(this.ball.dy);
        }


        if (this.ball.x < 0) {
            this.rightPaddle.onScore();
            this.handleScore();
        } else if (this.ball.x > this.canvasWidth) {
            this.leftPaddle.onScore();
            this.handleScore();
        }

        this.checkPaddleHit(this.leftPaddle, 'left');
        this.checkPaddleHit(this.rightPaddle, 'right');
    }

    checkPaddleHit(paddle, side) {
        if (
            this.ball.x + this.ball.radius > paddle.x &&
            this.ball.x - this.ball.radius < paddle.x + paddle.width &&
            this.ball.y + this.ball.radius > paddle.y &&
            this.ball.y - this.ball.radius < paddle.y + paddle.height
        ) {
            if (side === 'left') {
                this.ball.x = paddle.x + paddle.width + this.ball.radius;
                this.ball.dx = Math.abs(this.ball.dx);
            } else {
                this.ball.x = paddle.x - this.ball.radius;
                this.ball.dx = -Math.abs(this.ball.dx);
            }

            const hitPoint = this.ball.y - (paddle.y + paddle.height / 2);
            this.ball.dy += hitPoint * 0.005; 
            
            this.ball.dx *= 1.05;
            this.ball.dy *= 1.05;
        }
    }

    handleScore() {
        this.updateUI();
        if (this.leftPaddle.score >= this.maxScore || this.rightPaddle.score >= this.maxScore) {
            this.endGame();
        } else {
            this.resetRound();
        }
    }

    updateUI() {
        if (this.callbacks.onScoreUpdate) {
            this.callbacks.onScoreUpdate({ 
                p1: this.leftPaddle.score, 
                p2: this.rightPaddle.score 
            });
        }
    }

    endGame() {
        this.stop();
        if (this.callbacks.onGameEnd) {
            const winner = this.leftPaddle.score > this.rightPaddle.score ? this.player1Name : this.player2Name;
            this.callbacks.onGameEnd(winner);
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        this.ctx.fillStyle = "rgba(16, 24, 39, 0.4)"; 
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.setLineDash([15, 15]);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvasWidth / 2, 0);
        this.ctx.lineTo(this.canvasWidth / 2, this.canvasHeight);
        this.ctx.stroke();
        this.ctx.setLineDash([]); 

        this.ctx.fillStyle = this.ball.color;
        this.ctx.shadowBlur = 7;
        this.ctx.shadowColor = this.ball.color;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0; 

        const drawCapsulePaddle = (paddle) => {
            this.ctx.fillStyle = paddle.color;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = paddle.color;
            
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 10);
            } else {
                this.ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
            }
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        };

        drawCapsulePaddle(this.leftPaddle);
        drawCapsulePaddle(this.rightPaddle);
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        
        if (deltaTime > 100) {
            this.lastTime = currentTime;
            this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }

        this.lastTime = currentTime;
        this.update(deltaTime);
        this.render();
        
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
}