import { Entity } from "./Entity.js";

export class Ball extends Entity {
    constructor(x, y, radius, color, initialSpeed = 0.3) {
        super(x, y, radius * 2, radius * 2, color);
        this.radius = radius;
        this.baseSpeed = initialSpeed; 
        this.dx = initialSpeed;
        this.dy = initialSpeed; 
    }
    
    update(deltaTime) {
        // Accelerate slightly over time
        this.baseSpeed += 0.0001 * deltaTime; 
        
        // Move
        this.x += this.dx * deltaTime;
        this.y += this.dy * deltaTime;
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
    
    reset(x, y) {
        const angle = (Math.random() - 0.5) * Math.PI / 3; // Random launch angle
        this.x = x;
        this.y = y;
        this.baseSpeed = 0.3; // Reset speed
        
        const direction = Math.random() < 0.5 ? 1 : -1;
        this.dx = direction * this.baseSpeed * Math.cos(angle);
        this.dy = this.baseSpeed * Math.sin(angle);
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            dx: this.dx,
            dy: this.dy,
            radius: this.radius
        };
    }
    
    // Optional: Sync methods for Remote Game
    deserialize(data) {
        this.x = data.x;
        this.y = data.y;
        this.dx = data.dx;
        this.dy = data.dy;
    }
}