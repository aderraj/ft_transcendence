"use client";
import React, { useRef, useEffect } from 'react';

export default function StarField({ density = 0.002 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    
    let w, h, stars = [];
    let animationId;
    
    const init = () => {
        // 1. Get the actual screen dimensions (CSS pixels)
        const cssWidth = window.innerWidth;
        const cssHeight = window.innerHeight;
        
        // 2. Get the device pixel ratio (e.g., 2 for Retina)
        const dpr = window.devicePixelRatio || 1;
        
        // 3. Set the internal buffer to match physical pixels (Sharper!)
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
        
        // 4. Force the CSS display size to match the logical size
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
        
        // 5. Scale drawing operations so we can still use CSS pixel coordinates
        ctx.scale(dpr, dpr);
        
        // Update global width/height variables for generation logic
        w = cssWidth;
        h = cssHeight;
        
        // --- STAR GENERATION (Same logic as before) ---
        // Horizon at 67% of screen height
        const horizonY = h * 0.67;
        const fadeZone = h * 0.05; 
        
        const starCount = Math.floor(w * h * density * 0.2); 
        stars = [];
        
        for (let i = 0; i < starCount; i++) {
            const y = Math.random() * horizonY; 
            const distanceToHorizon = horizonY - y;
            
            let horizonFade = 1.0;
            if (distanceToHorizon < fadeZone) {
                horizonFade = distanceToHorizon / fadeZone;
                horizonFade = Math.pow(horizonFade, 1.5); 
            }

            stars.push({
                x: Math.random() * w,
                y: y,
                size: Math.random() > 0.99 ? Math.random() * 2 + 1 : Math.random() * 1.5,
                maxAlpha: (Math.random() * 0.8 + 0.2) * horizonFade,
                phase: Math.random() * Math.PI * 2,
                speed: Math.random() * 2 + 0.5 
            });
        }
    };

    const draw = () => {
        // Clear the buffer
        // Note: we clear using w and h (which are logical pixels), 
        // but since we scaled the context, it clears the whole physical area.
        ctx.clearRect(0, 0, w, h);
        
        const time = performance.now() * 0.001;
        
        stars.forEach(star => {
            if (star.maxAlpha < 0.01) return;
            
            const twinkle = 0.7 + 0.3 * Math.sin(time * star.speed + star.phase);
            
            ctx.fillStyle = "white";
            ctx.globalAlpha = star.maxAlpha * twinkle;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        animationId = requestAnimationFrame(draw);
    };
    
    init();
    draw();

    const handleResize = () => {
        init();
        // The loop continues automatically
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationId);
    };
  }, [density]);

  return (
    <canvas 
      ref={ref} 
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
    />
  );
}