import { Entity } from "./Entity.js";



/*
    we do 30 seconde per each round 
    and we gonna start with speeod 0.2 pixels/ms and we gonna be end with 0.8 pixels/ms
    so every seconde we increase the speed by (0.8 - 0.2) / 30 = 0.02 pixels/ms
*/
class Ball extends Entity {
    constructor(x, y, radius, color, initialSpeed)
    {
        super(x, y, radius * 2, radius * 2, color);
        this.radius = radius;
        this.baseSpeed = initialSpeed; 
        this.dx = initialSpeed;
        this.dy = initialSpeed; 
    }
    
    update(deltaTime){
        const speedIncreasePerSecond = 0.03;
        const speedIncrease = speedIncreasePerSecond * (deltaTime / 1000);
        this.baseSpeed += speedIncrease;
        this.x += this.dx * deltaTime ;
        this.y += this.dy * deltaTime;
    }

    render(ctx){
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
    
    reset(x,y){
        const angle = Math.random() * Math.PI / 4;
        this.x = x;
        this.y = y;
        this.dx = this.baseSpeed * Math.cos(angle) * (Math.random() < 0.5 ? -1 : 1);
        this.dy = this.baseSpeed * Math.sin(angle);
    }

    serialize(){
        return {
            x: this.x,
            y: this.y,
            radius: this.radius,
            dx :this.dx,
            dy : this.dy
        }
    }

    deserialize(data){
        this.x = data.x;
        this.y = data.y;
        this.radius = data.radius;
        this.dx = data.dx;
        this.dy = data.dy;
    }
}

export { Ball };