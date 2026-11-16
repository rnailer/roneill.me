// Variant "Signal": raw WebGL, zero dependencies.
// One fullscreen triangle; the fragment shader raymarches the four site
// motifs (sphere, orbit, starburst, compass) as SDFs, morphs between them
// on the existing 4.2s rhythm, and prints the result as a riso dither.
import { BAYER_GLSL, cssColor, reducedMotion, gatedLoop, easedPointer, fitCanvas } from './dither-core.js';

const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform float uMorph; uniform vec2 uMouse;
uniform vec3 uInk; uniform vec3 uHi;
${BAYER_GLSL}
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sdSphere(vec3 p, float r){ return length(p) - r; }
float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
float sdOcta(vec3 p, float s){ p = abs(p); return (p.x + p.y + p.z - s) * 0.57735027; }
float sdSpike(vec3 p, vec3 d, float len, float r){
  float h = clamp(dot(p, d) / len, 0.0, 1.0);
  return length(p - d * len * h) - r * (1.0 - h);
}
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

float motif(vec3 p, float i){
  if (i < 0.5) return sdSphere(p, 0.78);
  if (i < 1.5) {                                     // orbit: planet + tilted rings
    vec3 q = p; q.xy *= rot(0.42);
    float d = sdSphere(p, 0.46);
    d = min(d, sdTorus(q, vec2(0.86, 0.035)));
    q.yz *= rot(1.1);
    return min(d, sdTorus(q, vec2(0.66, 0.03)));
  }
  if (i < 2.5) {                                     // starburst: 14 tapered spikes
    float d = sdSphere(p, 0.24);
    d = smin(d, sdSpike(p, vec3( 1,0,0), 0.95, 0.12), 0.06); d = smin(d, sdSpike(p, vec3(-1,0,0), 0.95, 0.12), 0.06);
    d = smin(d, sdSpike(p, vec3(0, 1,0), 0.95, 0.12), 0.06); d = smin(d, sdSpike(p, vec3(0,-1,0), 0.95, 0.12), 0.06);
    d = smin(d, sdSpike(p, vec3(0,0, 1), 0.95, 0.12), 0.06); d = smin(d, sdSpike(p, vec3(0,0,-1), 0.95, 0.12), 0.06);
    vec3 a = abs(p);
    d = smin(d, sdSpike(a, normalize(vec3(1,1,1)), 0.7, 0.1), 0.06);
    return d;
  }
  // compass: long N-S / E-W diamond blades over a short octahedron core
  float d = sdOcta(p * vec3(0.35, 1.0, 2.6), 0.32) / 2.6;
  d = min(d, sdOcta(p * vec3(1.0, 0.35, 2.6), 0.32) / 2.6);
  d = min(d, sdOcta(p, 0.34));
  return min(d, sdTorus(p.xzy, vec2(0.6, 0.022)));
}

float map(vec3 p){
  p.xz *= rot(uTime * 0.35 + uMouse.x * 0.9);
  p.yz *= rot(0.25 + uMouse.y * 0.6);
  float i = floor(uMorph);
  float f = smoothstep(0.55, 1.0, fract(uMorph));    // hold, then morph
  return mix(motif(p, mod(i, 4.0)), motif(p, mod(i + 1.0, 4.0)), f);
}

vec3 normal(vec3 p){
  vec2 e = vec2(0.002, 0.0);
  return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec3 ro = vec3(0.0, 0.0, 3.0), rd = normalize(vec3(uv * 1.0, -1.45));
  float t = 0.0, d = 1.0;
  for (int k = 0; k < 48; k++) { d = map(ro + rd * t); if (d < 0.002 || t > 5.0) break; t += d * 0.85; }
  if (d > 0.01) { gl_FragColor = vec4(0.0); return; }
  vec3 p = ro + rd * t, n = normal(p);
  vec3 L = normalize(vec3(-0.6 + uMouse.x * 0.8, 0.7 - uMouse.y * 0.6, 0.55));
  float diff = max(dot(n, L), 0.0);
  float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
  float lum = 0.1 + diff * 0.85 + rim * 0.25;
  gl_FragColor = riso(lum, gl_FragCoord.xy, uInk, uHi);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

export function mount(canvas, { cell = 4, period = 4.2, onReady } = {}) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;                              // caller keeps the SVG fallback
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = n => gl.getUniformLocation(prog, n);
  const U = { res: u('uRes'), time: u('uTime'), morph: u('uMorph'), mouse: u('uMouse'), ink: u('uInk'), hi: u('uHi') };
  gl.uniform3fv(U.ink, cssColor('--espresso', '#1A1310'));
  gl.uniform3fv(U.hi, cssColor('--paper', '#ECEAE4'));
  const ptr = easedPointer();

  let first = true;
  const draw = (t, dt) => {
    fitCanvas(canvas, cell);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform1f(U.time, t);
    gl.uniform1f(U.morph, t / period);
    const m = ptr.step(dt); gl.uniform2f(U.mouse, m[0], m[1]);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (first) { first = false; onReady && onReady(); }
  };

  let stop = () => {};
  if (reducedMotion()) draw(1.2, 0);                 // one still frame, no loop
  else stop = gatedLoop(canvas, draw);
  const lost = e => { e.preventDefault(); stop(); canvas.dispatchEvent(new CustomEvent('herofallback')); };
  canvas.addEventListener('webglcontextlost', lost);
  return { destroy() { stop(); ptr.destroy(); canvas.removeEventListener('webglcontextlost', lost); gl.getExtension('WEBGL_lose_context')?.loseContext(); } };
}

window.HeroSignal = { mount };
