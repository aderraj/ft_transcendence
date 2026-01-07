/* eslint-disable no-restricted-globals */

// Shader Sources (Same as your original)
const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 vUv;
  void main() {
    vUv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform float iTime;
  uniform vec3 iResolution;
  varying vec2 vUv;

  #define time iTime
  #define AURORA_STEPS 32
  #define STAR_LAYERS 3

  mat2 mm2(in float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, s, -s, c);
  }

  const mat2 m2 = mat2(0.95534, 0.29552, -0.29552, 0.95534);

  float tri(in float x) {
    return clamp(abs(fract(x) - 0.5), 0.01, 0.49);
  }

  vec2 tri2(in vec2 p) {
    return vec2(tri(p.x) + tri(p.y), tri(p.y + tri(p.x)));
  }

  float triNoise2d(in vec2 p, float spd) {
    float z = 1.8;
    float z2 = 2.5;
    float rz = 0.0;
    p *= mm2(p.x * 0.06);
    vec2 bp = p;
    for (int i = 0; i < 4; i++) {
        vec2 dg = tri2(bp * 1.85) * 0.75;
        dg *= mm2(time * spd);
        p -= dg / z2;
        if (i < 3) bp *= 1.3;
        z2 *= 0.45;
        z *= 0.42;
        p *= 1.21 + (rz - 1.0) * 0.02;
        rz += tri(p.x + tri(p.y)) * z;
        if (i < 3) p *= -m2;
    }
    return clamp(1.0 / pow(rz * 29.0, 1.3), 0.0, 0.55);
  }

  float hash21(in vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }

  vec4 aurora(vec3 ro, vec3 rd) {
    vec4 col = vec4(0);
    vec4 avgCol = vec4(0);
    float rdyFactor = 1.0 / (rd.y * 2.0 + 0.4);
    vec2 fragHash = gl_FragCoord.xy;
    float hashVal = hash21(fragHash);

    for (int i = 0; i < AURORA_STEPS; i++) {
      float fi = float(i);
      float of = 0.006 * hashVal * smoothstep(0.0, 15.0, fi);
      float pt = ((0.8 + pow(fi, 1.4) * 0.002) - ro.y) * rdyFactor;
      pt -= of;
      vec3 bpos = ro + pt * rd;
      vec2 p = bpos.zx;
      float rzt = triNoise2d(p, 0.06);
      vec4 col2 = vec4(0, 0, 0, rzt);
      col2.rgb = (sin(1.0 - vec3(2.15, -0.5, 1.2) + fi * 0.043) * 0.5 + 0.5) * rzt;
      avgCol = mix(avgCol, col2, 0.5);
      col += avgCol * exp2(-fi * 0.065 - 2.5) * smoothstep(0.0, 5.0, fi);
    }
    col *= clamp(rd.y * 15.0 + 0.4, 0.0, 1.0);
    return col * 1.8;
  }

  vec3 hash33(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yxz + 19.19);
    return fract((p.xxy + p.yxx) * p.zyx);
  }

  vec3 stars(in vec3 p) {
    vec3 c = vec3(0.0);
    float res = iResolution.x;
    for (int i = 0; i < STAR_LAYERS; i++) {
      float fi = float(i);
      vec3 q = fract(p * (0.15 * res)) - 0.5;
      vec3 id = floor(p * (0.15 * res));
      vec2 rn = hash33(id).xy;
      float c2 = 1.0 - smoothstep(0.0, 0.6, length(q));
      c2 *= step(rn.x, 0.0005 + fi * fi * 0.001);
      c += c2 * (mix(vec3(1.0, 0.49, 0.1), vec3(0.75, 0.9, 1.0), rn.y) * 0.1 + 0.9);
      p *= 1.3;
    }
    return c * c * 0.8;
  }

  vec3 bg(in vec3 rd) {
    float sd = dot(normalize(vec3(-0.5, -0.6, 0.9)), rd) * 0.5 + 0.5;
    sd = pow(sd, 5.0);
    vec3 col = mix(vec3(0.05, 0.1, 0.2), vec3(0.1, 0.05, 0.2), sd);
    return col * 0.63;
  }

  void main() {
    vec2 q = vUv;
    vec2 p = q - 0.5;
    p.x *= iResolution.x / iResolution.y;
    vec3 ro = vec3(0.0, 0.0, -6.7);
    vec3 rd = normalize(vec3(p, 1.3));
    const vec2 fixedAngle = vec2(0.0, 0.25);
    rd.yz *= mm2(fixedAngle.y);
    rd.xz *= mm2(fixedAngle.x);
    vec3 col = vec3(0.0);
    vec3 brd = rd;
    float fade = smoothstep(0.0, 0.01, abs(brd.y)) * 0.1 + 0.9;
    col = bg(rd) * fade;
    if (rd.y > 0.0) {
      vec4 aur = smoothstep(0.0, 1.5, aurora(ro, rd)) * fade;
      col += stars(rd);
      col = col * (1.0 - aur.a) + aur.rgb;
    } else {
      rd.y = abs(rd.y);
      col = bg(rd) * fade * 0.6;
      vec4 aur = smoothstep(0.0, 2.5, aurora(ro, rd));
      col += stars(rd) * 0.1;
      col = col * (1.0 - aur.a) + aur.rgb;
      vec3 pos = ro + ((0.5 - ro.y) / rd.y) * rd;
      float nz2 = triNoise2d(pos.xz * vec2(0.5, 0.7), 0.0);
      col += mix(vec3(0.2, 0.25, 0.5) * 0.08, vec3(0.3, 0.3, 0.5) * 0.7, nz2 * 0.4);
    }
    gl_FragColor = vec4(col, 1.0);
  }
`;

let canvas, gl, program, positionLocation, timeLocation, resolutionLocation, positionBuffer;
let startTime;
let size = { w: 0, h: 0, dpr: 1 };
let isRunning = false;
const resolutionScale = 0.75;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function initWebGL() {
  // Try WebGL 1 first, then 2
  gl = canvas.getContext('webgl', { 
    antialias: false, alpha: false, powerPreference: 'high-performance' 
  });
  if (!gl) gl = canvas.getContext('webgl2', { 
    antialias: false, alpha: false, powerPreference: 'high-performance' 
  });

  if (!gl) return false;

  const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vs || !fs) return false;

  program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;

  gl.useProgram(program);

  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);

  positionLocation = gl.getAttribLocation(program, 'a_position');
  timeLocation = gl.getUniformLocation(program, 'iTime');
  resolutionLocation = gl.getUniformLocation(program, 'iResolution');

  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  startTime = performance.now();
  return true;
}

function resize(w, h, dpr) {
  size.w = w;
  size.h = h;
  size.dpr = dpr;
  
  // Important: The worker actually resizes the internal offscreen buffer here
  const effectiveDpr = Math.min(dpr, 1.5) * resolutionScale;
  canvas.width = Math.floor(w * effectiveDpr);
  canvas.height = Math.floor(h * effectiveDpr);
  
  if (gl) {
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
}

function render() {
  if (!isRunning || !gl) return;

  const currentTime = performance.now();
  const elapsed = (currentTime - startTime) / 1000;
  
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.uniform1f(timeLocation, elapsed);
  gl.uniform3f(resolutionLocation, canvas.width, canvas.height, 1.0);
  
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  
  if (isRunning) {
    setTimeout(render, 1000 / 60);
  }
}

self.onmessage = function(e) {
  const { type } = e.data;
  
  if (type === 'init') {
    if (isRunning) return;
    
    canvas = e.data.canvas;
    size.w = e.data.width;
    size.h = e.data.height;
    size.dpr = e.data.dpr;
    
    if (initWebGL()) {
      resize(size.w, size.h, size.dpr);
      isRunning = true;
      render();
    }
  }
  else if (type === 'resize') {
    resize(e.data.width, e.data.height, e.data.dpr);
  }
  else if (type === 'stop') {
    isRunning = false;
  }
};