let     canvas;
let     ctx;
let     size = {w: 0, h: 0};
const   stars = [];

function initStars(stars) {
    stars.length = 0;
    for (let i = 0; i <= 500; i++) {
        stars.push(
            {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.3,
                vx: Math.random() - 0.5,
                vy: Math.random() - 0.5,
            }
        )
    }
}

const render = () => {
    ctx.fillStyle = "Black";
    if (canvas.width != size.w)
        canvas.width = size.w;
    if (canvas.height != size.h)
        canvas.height = size.h;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    for (let i = 0; i <= 500; i++) {
        stars[i].x += stars[i].vx * stars[i].size;
        stars[i].y += stars[i].vy * stars[i].size;
        stars[i].x = stars[i].x < 0 ? canvas.width :
                        stars[i].x > canvas.width ? 0 : stars[i].x;
        stars[i].y = stars[i].y < 0 ? canvas.height :
                        stars[i].y > canvas.height ? 0 : stars[i].y;
        ctx.beginPath();
        ctx.arc(stars[i].x,
            stars[i].y,
            stars[i].size,
            0,
            Math.PI * 2);
        ctx.fill();
    }
    requestAnimationFrame(render);
}

self.onmessage = function(e) {
    if (e.data.type  == 'init') {        
        canvas = e.data.canvas;
        ctx = canvas.getContext("2d");
        size.w = canvas.width;
        size.h = canvas.height;
        initStars(stars);
        render();
    }
    else if (e.data.type == 'resize') {
        size.w = e.data.w;
        size.h = e.data.h;
    }
}