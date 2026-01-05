import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const AuroraBorealis = ({ className, style }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const frameIdRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Aurora shader material
    const auroraMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        
        varying vec2 vUv;
        
        // Simplex 3D Noise
        vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          
          i = mod(i, 289.0);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            
          float n_ = 1.0/7.0;
          vec3 ns = n_ * D.wyz - D.xzx;
          
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        // Fractional Brownian Motion for more natural noise
        float fbm(vec3 p, int octaves) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          float lacunarity = 2.0;
          float persistence = 0.5;
          
          for(int i = 0; i < 8; i++) {
            if(i >= octaves) break;
            value += amplitude * snoise(p * frequency);
            frequency *= lacunarity;
            amplitude *= persistence;
          }
          return value;
        }
        
        // Aurora curtain function - creates the characteristic vertical streaks
        float auroraCurtain(vec2 uv, float time) {
          float curtain = 0.0;
          
          // Multiple layers of curtains at different speeds and scales
          for(float i = 0.0; i < 5.0; i++) {
            float speed = 0.02 + i * 0.01;
            float scale = 1.5 + i * 0.5;
            float weight = 1.0 / (i + 1.0);
            
            // Horizontal wave displacement
            float wave = snoise(vec3(uv.x * scale, time * speed, i * 10.0)) * 0.3;
            wave += snoise(vec3(uv.x * scale * 2.0, time * speed * 1.5, i * 20.0)) * 0.15;
            
            // Vertical curtain structure
            float verticalNoise = fbm(vec3(uv.x * 3.0 + wave, uv.y * 0.5, time * 0.05 + i), 4);
            
            // Create curtain folds
            float fold = sin(uv.x * 8.0 + wave * 5.0 + time * 0.1) * 0.5 + 0.5;
            fold = pow(fold, 2.0);
            
            curtain += verticalNoise * fold * weight;
          }
          
          return curtain;
        }
        
        // Vertical ray structure
        float auroraRays(vec2 uv, float time) {
          float rays = 0.0;
          
          for(float i = 0.0; i < 12.0; i++) {
            float offset = snoise(vec3(i * 5.0, time * 0.03, 0.0)) * 2.0;
            float rayPos = mod(i * 0.15 + offset, 2.0) - 1.0;
            
            float rayWidth = 0.02 + snoise(vec3(i, time * 0.1, 0.0)) * 0.015;
            float ray = exp(-pow((uv.x - rayPos) / rayWidth, 2.0));
            
            // Vertical fade and movement
            float verticalWave = snoise(vec3(uv.y * 2.0, time * 0.2 + i, i * 3.0));
            ray *= smoothstep(0.0, 0.3, uv.y + verticalWave * 0.2);
            ray *= smoothstep(1.0, 0.5, uv.y);
            
            // Intensity variation
            float intensity = snoise(vec3(i * 2.0, time * 0.15, 0.0)) * 0.5 + 0.5;
            rays += ray * intensity * 0.3;
          }
          
          return rays;
        }
        
        // Shimmer effect
        float shimmer(vec2 uv, float time) {
          float shim = 0.0;
          
          for(float i = 0.0; i < 3.0; i++) {
            vec3 p = vec3(uv * (3.0 + i * 2.0), time * (0.5 + i * 0.2));
            shim += snoise(p) * (1.0 / (i + 1.0));
          }
          
          return shim * 0.5 + 0.5;
        }
        
        // Main aurora color mixing
        vec3 auroraColor(float intensity, float variation, float height) {
          // Classic aurora colors
          vec3 green = vec3(0.1, 0.9, 0.3);        // Bright green (oxygen at ~100km)
          vec3 teal = vec3(0.1, 0.8, 0.6);         // Teal transition
          vec3 blue = vec3(0.2, 0.4, 0.9);         // Blue (nitrogen)
          vec3 purple = vec3(0.5, 0.2, 0.8);       // Purple (high altitude)
          vec3 pink = vec3(0.9, 0.3, 0.5);         // Pink edges
          vec3 red = vec3(0.8, 0.1, 0.2);          // Red (oxygen at ~300km)
          
          // Height-based color mixing (simulating different atmospheric layers)
          vec3 color = green;
          
          // Lower aurora - more green
          color = mix(green, teal, smoothstep(0.2, 0.4, height));
          
          // Mid aurora - green to blue transition
          color = mix(color, blue, smoothstep(0.35, 0.55, height) * 0.6);
          
          // Upper aurora - purple and pink
          color = mix(color, purple, smoothstep(0.5, 0.75, height) * 0.7);
          color = mix(color, pink, smoothstep(0.65, 0.85, height) * 0.5);
          
          // Top edge - subtle red
          color = mix(color, red, smoothstep(0.8, 0.95, height) * 0.4);
          
          // Add variation based on noise
          color = mix(color, teal, variation * 0.3);
          color = mix(color, purple, (1.0 - variation) * 0.2);
          
          return color * intensity;
        }
        
        void main() {
          vec2 uv = vUv;
          vec2 centeredUv = uv * 2.0 - 1.0;
          
          float time = uTime * 0.3;
          
          // Sky gradient (dark night sky)
          vec3 skyColor = mix(
            vec3(0.0, 0.02, 0.05),   // Dark horizon
            vec3(0.02, 0.0, 0.08),    // Deep space purple
            pow(uv.y, 0.8)
          );
          
          // Stars
          float stars = 0.0;
          for(float i = 0.0; i < 3.0; i++) {
            vec2 starUv = uv * (100.0 + i * 50.0);
            float star = snoise(vec3(floor(starUv), i * 100.0));
            star = pow(max(star, 0.0), 20.0);
            float twinkle = snoise(vec3(floor(starUv.x) * 0.1, floor(starUv.y) * 0.1 + time * 2.0 + i, 0.0)) * 0.5 + 0.5;
            stars += star * twinkle * 0.5;
          }
          skyColor += vec3(stars);
          
          // Aurora base position and shape
          float auroraY = uv.y - 0.25;  // Shift aurora to upper portion
          float auroraHeight = auroraY / 0.75;
          
          // Horizontal wave for the main aurora band
          float mainWave = snoise(vec3(uv.x * 1.5, time * 0.1, 0.0)) * 0.15;
          mainWave += snoise(vec3(uv.x * 3.0, time * 0.15, 10.0)) * 0.08;
          
          // Create aurora mask (where the aurora appears)
          float auroraMask = smoothstep(0.0, 0.2, auroraY + mainWave);
          auroraMask *= smoothstep(0.9, 0.6, auroraY);
          
          // Curtain effect
          float curtain = auroraCurtain(vec2(centeredUv.x, auroraY), time);
          
          // Vertical rays
          float rays = auroraRays(vec2(centeredUv.x, auroraY), time);
          
          // Shimmer and glow
          float shim = shimmer(vec2(centeredUv.x, auroraY), time);
          
          // Combine aurora elements
          float auroraIntensity = curtain * 0.6 + rays * 0.4;
          auroraIntensity *= shim;
          auroraIntensity *= auroraMask;
          
          // Soft edges
          float edgeFade = 1.0 - pow(abs(centeredUv.x), 4.0);
          auroraIntensity *= edgeFade;
          
          // Add subtle pulsing
          float pulse = snoise(vec3(time * 0.5, 0.0, 0.0)) * 0.15 + 0.85;
          auroraIntensity *= pulse;
          
          // Clamp and enhance
          auroraIntensity = pow(max(auroraIntensity, 0.0), 1.2) * 1.5;
          
          // Get aurora color
          float colorVariation = snoise(vec3(uv.x * 2.0, time * 0.2, uv.y)) * 0.5 + 0.5;
          vec3 auroraCol = auroraColor(auroraIntensity, colorVariation, auroraHeight + mainWave);
          
          // Add glow effect
          float glow = auroraIntensity * 0.5;
          vec3 glowColor = vec3(0.1, 0.5, 0.3) * glow;
          
          // Atmospheric scattering (light pollution from aurora)
          vec3 scatter = auroraCol * 0.1 * smoothstep(0.5, 0.0, uv.y);
          
          // Final composition
          vec3 finalColor = skyColor + auroraCol + glowColor + scatter;
          
          // Tone mapping
          finalColor = finalColor / (finalColor + vec3(1.0));
          
          // Slight vignette
          float vignette = 1.0 - pow(length(centeredUv) * 0.5, 2.0) * 0.3;
          finalColor *= vignette;
          
          // Gamma correction
          finalColor = pow(finalColor, vec3(0.9));
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      transparent: true,
    });

    // Full-screen quad
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, auroraMaterial);
    scene.add(mesh);

    // Animation
    const clock = new THREE.Clock();
    
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();
      auroraMaterial.uniforms.uTime.value = elapsedTime;
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      
      renderer.setSize(newWidth, newHeight);
      auroraMaterial.uniforms.uResolution.value.set(newWidth, newHeight);
    };

    // Mouse interaction (subtle aurora response)
    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1.0 - (event.clientY - rect.top) / rect.height;
      auroraMaterial.uniforms.uMouse.value.set(x, y);
    };

    window.addEventListener('resize', handleResize);
    container.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      
      geometry.dispose();
      auroraMaterial.dispose();
      renderer.dispose();
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        overflow: 'hidden',
        ...style,
      }}
    />
  );
};

export default AuroraBorealis;