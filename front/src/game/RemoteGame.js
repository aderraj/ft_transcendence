import { InputController } from './InputController.js';

export class RemoteGame {
    constructor(canvas, socket, userId, callbacks) {
        this.ctx = canvas.getContext('2d');
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        this.socket = socket;
        this.userId = userId;
        this.callbacks = callbacks || {};

        this.ball = { 
            x: 50, 
            y: 50, 
            radius: 10, 
            color: '#FFFFFF',
            dx: 0,
            dy: 0
        };
        
        this.leftPaddle = { 
            x: 30, 
            y: 0, 
            width: 15, 
            height: 100, 
            color: '#facc15'
        };
        
        this.rightPaddle = { 
            x: this.canvasWidth - 40, 
            y: 0, 
            width: 15, 
            height: 100, 
            color: '#a855f7' 
        };

        this.isRunning = false;
        this.animationFrameId = null;
        this.side = null;
        this.input = new InputController();
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        this.socket.onmessage = (event) => {
            try {
                if (event.data === "Connected Successfully!") {
                    return;
                }
                const msg = JSON.parse(event.data);
                this.handleServerMessage(msg);
            } catch (e) {
                console.warn("Non-JSON message:", event.data);
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (this.callbacks.onConnectionError) {
                this.callbacks.onConnectionError('Connection error occurred');
            }
        };

        this.socket.onclose = (event) => {
            ;
            if (this.isRunning && this.callbacks.onConnectionClosed) {
                this.callbacks.onConnectionClosed('Connection closed unexpectedly');
            }
            this.stop();
        };
    }

    handleServerMessage(msg) {
        switch (msg.type) {
            case 'game_start':
                this.side = msg.side;
                
                if (this.callbacks.onGameStart) {
                    this.callbacks.onGameStart();
                }

                if (!this.isRunning) {
                    this.isRunning = true;
                    this.gameLoop();
                }
                break;

            case 'countdown':
                if (this.callbacks.onCountdownUpdate) {
                    this.callbacks.onCountdownUpdate(msg.value);
                }
                break;

            case 'game_update':
            case 'match_update':
                if (msg.ball) {
                    this.ball.x = msg.ball.x;
                    this.ball.y = msg.ball.y;
                }
                if (msg.leftPaddleY !== undefined) this.leftPaddle.y = msg.leftPaddleY;
                if (msg.rightPaddleY !== undefined) this.rightPaddle.y = msg.rightPaddleY;
                
                if (msg.scores && this.callbacks.onScoreUpdate) {
                    this.callbacks.onScoreUpdate({ p1: msg.scores.left, p2: msg.scores.right });
                }

                if (msg.timeLeft !== undefined && this.callbacks.onTimerUpdate) {
                    this.callbacks.onTimerUpdate(msg.timeLeft);
                }
                break;

            case 'score_update':
                if (msg.scores && this.callbacks.onScoreUpdate) {
                    this.callbacks.onScoreUpdate({ p1: msg.scores.left, p2: msg.scores.right });
                }
                break;

            case 'gameOver':
                if (this.callbacks.onGameEnd) this.callbacks.onGameEnd(msg);
                this.stop();
                break;

            case 'player_left':
                if (this.callbacks.onGameEnd) {
                    this.callbacks.onGameEnd({
                        winner: this.userId,
                        players: null,
                        disconnected: true
                    });
                }
                this.stop();
                break;
        }
    }

    start() {
        this.render();
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
        if (this.input) {
            this.input.destroy();
            this.input = null;
        }
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close();
        }
    }

    update() {
        if (!this.isRunning) return;
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        const up = this.input.isKeyPressed('w') || this.input.isKeyPressed('ArrowUp');
        const down = this.input.isKeyPressed('s') || this.input.isKeyPressed('ArrowDown');

        if (up) this.socket.send(JSON.stringify({ type: 'moveUp' }));
        if (down) this.socket.send(JSON.stringify({ type: 'moveDown' }));
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

        if (this.side) {
            this.ctx.strokeStyle = '#06b6d4';
            this.ctx.lineWidth = 2;
            const p = this.side === 'left' ? this.leftPaddle : this.rightPaddle;
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                 this.ctx.roundRect(p.x - 3, p.y - 3, p.width + 6, p.height + 6, 12);
            } else {
                 this.ctx.rect(p.x - 3, p.y - 3, p.width + 6, p.height + 6);
            }
            this.ctx.stroke();
        }
    }

    gameLoop() {
        if (!this.isRunning) return;
        this.update(); 
        this.render();   
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
}