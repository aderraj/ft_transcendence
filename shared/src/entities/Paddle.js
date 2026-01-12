import { Entity } from "./Entity.js";

export class Paddle extends Entity {
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color);
        this.score = 0;
        this.speed = 0.5;
    }

    render(ctx, r1 = 0, r2 = 0, r3 = 0, r4 = 0) {
        ctx.fillStyle = this.color;
        
        // Try drawing rounded rect, fallback to standard rect if unsupported
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.width, this.height, [r1, r2, r3, r4]);
            ctx.fill();
            ctx.closePath();
        } else {
            // Fallback for compatibility
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            score: this.score
        };
    }
    
    onScore() {
        this.score += 1;
    }
}