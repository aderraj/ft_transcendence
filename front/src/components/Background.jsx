import { useEffect, useRef } from "react";
import '../styles/Background.css'

function Background() {
    const _ref = useRef(null);
    const isInitialized = useRef(false);
    useEffect( 
        () => {
            if (isInitialized.current) return ;
            isInitialized.current = true ;
            const canvas = _ref.current;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const offscreen = canvas.transferControlToOffscreen();

            const worker = new Worker(new URL('../workers/stars_worker.js', import.meta.url));

            worker.postMessage({type: 'init', canvas: offscreen}, [offscreen]);

            const handleResize = () => {
                worker.postMessage({
                    type: 'resize',
                    w: window.innerWidth,
                    h: window.innerHeight})
            }
            addEventListener('resize', handleResize);            
            
            return () => removeEventListener('resize', handleResize);
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