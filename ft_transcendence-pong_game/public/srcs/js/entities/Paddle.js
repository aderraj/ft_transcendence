import { Entity } from "./Entity.js";

class Paddle extends Entity {
    constructor(x, y, width, height, color)
    {
        super(x, y, width, height, color);
        this.speed = 0.5;
        this.score = 0;
    }

    update(deltaTime)
    {
        this.x = this.x  * this.speed;
        this.y = this.y  * this.speed;
    }
    
    render(ctx, rd1, rd2,rd3,rd4)
    {
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, [rd1, rd2, rd3, rd4]);
        ctx.stroke();
        ctx.closePath();
    }

    serialize()
    {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            score: this.score
        }
    }

    deserialize(data)
    {
        this.x = data.x;
        this.y = data.y;
        this.width = data.width;
        this.height = data.height;
        this.score = data.score;
    }

    onScore()
    {
        this.score += 1;
    }

}
export { Paddle };