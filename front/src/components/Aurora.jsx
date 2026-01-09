// AuroraBackground.js
"use client";
import React, { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl';

const vertex = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
out vec4 fragColor;

mat2 mm2(in float a){float c = cos(a), s = sin(a);return mat2(c,s,-s,c);}
mat2 m2 = mat2(0.95534, 0.29552, -0.29552, 0.95534);
float tri(in float x){return clamp(abs(fract(x)-.5),0.01,0.49);}
vec2 tri2(in vec2 p){return vec2(tri(p.x)+tri(p.y),tri(p.y+tri(p.x)));}

float triNoise2d(in vec2 p, float spd) {
    float z=1.8; float z2=2.5; float rz = 0.;
    p *= mm2(p.x*0.06); vec2 bp = p;
    for (float i=0.; i<2.; i++ ) {
        vec2 dg = tri2(bp*1.85)*.75; dg *= mm2(uTime*spd);
        p -= dg/z2; bp *= 1.3; z2 *= .45; z *= .42;
        p *= 1.21 + (rz-1.0)*.02; rz += tri(p.x+tri(p.y))*z; p*= -m2;
    }
    return clamp(1./pow(rz*29., 1.3),0.,.55);
}

float hash21(in vec2 n){ return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }

vec4 aurora(vec3 ro, vec3 rd) {
    vec4 col = vec4(0); vec4 avgCol = vec4(0);
    for(float i=0.;i<14.;i++) {
        float of = 0.006*hash21(gl_FragCoord.xy)*smoothstep(0.,15., i);
        float pt = ((.8+pow(i,1.4)*.002)-ro.y)/(rd.y*2.+0.4);
        pt -= of; vec3 bpos = ro + pt*rd; vec2 p = bpos.zx;
        float rzt = triNoise2d(p, 0.06);
        vec4 col2 = vec4(0,0,0, rzt);
        col2.rgb = (sin(1.-vec3(2.15,-.5, 1.2)+i*0.043)*0.5+0.5)*rzt;
        avgCol =  mix(avgCol, col2, .5);
        col += avgCol*exp2(-i*0.065 - 2.5)*smoothstep(0.,5., i);
    }
    col *= (clamp(rd.y*15.+.4,0.,1.)); return col*1.8;
}

vec3 bg(in vec3 rd) {
    float sd = dot(normalize(vec3(-0.5, -0.6, 0.9)), rd)*0.5+0.5;
    sd = pow(sd, 5.);
    return mix(vec3(0.05,0.1,0.2), vec3(0.1,0.05,0.2), sd) * 0.63;
}

void main() {
    vec2 q = gl_FragCoord.xy / uResolution.xy;
    vec2 p = q - 0.5;
    p.x *= uResolution.x/uResolution.y;
    vec3 ro = vec3(0,0,-6.7); vec3 rd = normalize(vec3(p, 1.2)); 
    rd.yz *= mm2(0.3); 
    vec3 col = vec3(0.);
    float lightsFade = smoothstep(0.0, 0.05, abs(rd.y));
    
    if (rd.y > 0.){
        col = bg(rd);
        vec4 aur = smoothstep(0.,1.5,aurora(ro,rd)) * lightsFade;
        col = col*(1.-aur.a) + aur.rgb;
    } else {
        rd.y = abs(rd.y);
        float waterDarken = smoothstep(0.0, 0.6, rd.y);
        col = bg(rd) * mix(1.0, 0.4, waterDarken);
        vec4 aur = smoothstep(0.0,2.5,aurora(ro,rd)) * lightsFade;
        col = col*(1.-aur.a) + aur.rgb;
        vec3 pos = ro + ((0.5-ro.y)/rd.y)*rd;
        float nz2 = triNoise2d(pos.xz*vec2(.5,.7), 0.);
        float textureFade = smoothstep(0.0, 0.05, rd.y); 
        col += mix(vec3(0.2,0.25,0.5)*0.08, vec3(0.3,0.3,0.5)*0.7, nz2*0.4) * textureFade;
    }
    fragColor = vec4(col, 1.);
}
`;

export default function AuroraBackground({ speed = 1.0 }) {
  const ref = useRef(null);
  const speedRef = useRef(speed);
  
  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const renderer = new Renderer({ canvas, webgl: 2, dpr: 1, alpha: false, depth: false });
    const gl = renderer.gl;
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: { uTime: { value: 0 }, uResolution: { value: new Vec2(100, 100) } },
    });
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const resolutionScale = 0.5; 
      let drawWidth = width * resolutionScale;
      let drawHeight = height * resolutionScale;
      const MAX_WIDTH = 1000;
      if (drawWidth > MAX_WIDTH) {
          const aspect = drawWidth / drawHeight;
          drawWidth = MAX_WIDTH; drawHeight = drawWidth / aspect;
      }
      renderer.setSize(drawWidth, drawHeight);
      gl.canvas.style.width = "100%";
      gl.canvas.style.height = "100%";
      program.uniforms.uResolution.value.set(drawWidth, drawHeight);
    };
    
    window.addEventListener("resize", resize); resize();

    let animationId;
    const start = performance.now();
    const loop = () => {
      animationId = requestAnimationFrame(loop);
      program.uniforms.uTime.value = (performance.now() - start) * 0.001 * speedRef.current;
      renderer.render({ scene: mesh });
    };
    loop();

    return () => { cancelAnimationFrame(animationId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} className="fixed top-0 left-0 w-full h-full -z-20 pointer-events-none block object-cover" />;
}