let     canvas;
let     ctx;
let     size = {w: 0, h: 0};
const   stars = [];
let     dpr = 1;

function resizeCanvas(w, h) {
    dpr = self.devicePixelRatio || 1;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    canvas.styleWidth = w;
    canvas.styleHeight = h;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    size.w = w;
    size.h = h;

    initStars(stars);
}



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
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, size.w, size.h);

    ctx.fillStyle = "white";
    for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        s.x += s.vx * s.size;
        s.y += s.vy * s.size;

        if (s.x < 0) s.x = size.w;
        if (s.x > size.w) s.x = 0;
        if (s.y < 0) s.y = size.h;
        if (s.y > size.h) s.y = 0;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    }

    requestAnimationFrame(render);
};

self.onmessage = function (e) {
    if (e.data.type === 'init') {
        canvas = e.data.canvas;
        ctx = canvas.getContext("2d");

        resizeCanvas(canvas.width, canvas.height);
        render();
    }

    if (e.data.type === 'resize') {
        resizeCanvas(e.data.w, e.data.h);
    }
};