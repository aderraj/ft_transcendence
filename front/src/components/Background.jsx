import { useEffect, useRef } from "react";

function Background() {
    const _ref = useRef(null);
    useEffect( 
        () => {
            const canvas = _ref.current;
            const context = canvas.getContext("2d");
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            context.fillStyle = "Black";
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            const stars = []

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


            const render = () => {
                context.fillStyle = "Black";
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.fillStyle = "white";
                for (let i = 0; i <= 500; i++) {
                    stars[i].x += stars[i].vx;
                    stars[i].y += stars[i].vy;
                    stars[i].x = stars[i].x < 0 ? canvas.width :
                                 stars[i].x > canvas.width ? 0 : stars[i].x;
                    stars[i].y = stars[i].y < 0 ? canvas.height :
                                 stars[i].y > canvas.height ? 0 : stars[i].y;
                    context.beginPath();
                    context.arc(stars[i].x,
                        stars[i].y,
                        stars[i].size,
                        0,
                        Math.PI * 2);
                    context.fill();
                }
                requestAnimationFrame(render);
            }
            render();
        }
        , []
    );
    return (
        <canvas
            ref={_ref}
        />
    )
}

export default Background;