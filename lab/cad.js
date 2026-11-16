// "Draft": raymarched SDF shapes drawn as CAD line work, no dependencies.
// One fullscreen triangle per canvas. Draws silhouette, crease and depth
// edges solid, surface contour lines lighter, plus faint construction axes.
// Reused for the hero (cycles the four site motifs) and for project preview
// cards (call show(i) on hover).
import { cssColor, reducedMotion, gatedLoop, easedPointer } from './dither-core.js';

export const SHAPES = {
  sphere: 0, orbit: 1, starburst: 2, compass: 3, tiles: 4, cassette: 5,
  rings: 6, bars: 7, stairs: 8, target: 9, door: 10, stack: 11,
  cursor: 12, pen: 13, layers: 14, component: 15, toggle: 16, device: 17,
};

const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `
#extension GL_OES_standard_derivatives : enable
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;
uniform float uFrom; uniform float uTo; uniform float uMix;
uniform vec3 uLine; uniform float uLW; uniform float uGuides; uniform float uSpin;

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sdSphere(vec3 p, float r){ return length(p) - r; }
float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float sdRBox(vec3 p, vec3 b, float r){ return sdBox(p, b - r) - r; }
float sdCylZ(vec3 p, float r, float h){ vec2 d = abs(vec2(length(p.xy), p.z)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
float sdCylY(vec3 p, float r, float h){ return sdCylZ(p.xzy, r, h); }
float sdOcta(vec3 p, float s){ p = abs(p); return (p.x + p.y + p.z - s) * 0.57735027; }
float sdSpike(vec3 p, vec3 d, float len, float r){ float h = clamp(dot(p, d) / len, 0.0, 1.0); return length(p - d * len * h) - r * (1.0 - h); }
float sdFrame(vec3 p, vec3 b, float e){
  p = abs(p) - b; vec3 q = abs(p + e) - e;
  return min(min(
    length(max(vec3(p.x, q.y, q.z), 0.0)) + min(max(p.x, max(q.y, q.z)), 0.0),
    length(max(vec3(q.x, p.y, q.z), 0.0)) + min(max(q.x, max(p.y, q.z)), 0.0)),
    length(max(vec3(q.x, q.y, p.z), 0.0)) + min(max(q.x, max(q.y, p.z)), 0.0));
}

float sdTri(vec2 p, vec2 p0, vec2 p1, vec2 p2){
  vec2 e0 = p1 - p0, e1 = p2 - p1, e2 = p0 - p2, v0 = p - p0, v1 = p - p1, v2 = p - p2;
  vec2 q0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0);
  vec2 q1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0);
  vec2 q2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
  float s = sign(e0.x * e2.y - e0.y * e2.x);
  vec2 d = min(min(vec2(dot(q0, q0), s * (v0.x * e0.y - v0.y * e0.x)), vec2(dot(q1, q1), s * (v1.x * e1.y - v1.y * e1.x))), vec2(dot(q2, q2), s * (v2.x * e2.y - v2.y * e2.x)));
  return -sqrt(d.x) * sign(d.y);
}
float sdBox2(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
float extrude(float d2, float z, float h){ vec2 w = vec2(d2, abs(z) - h); return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)); }

float shapeUX(vec3 p, float i){
  if (i < 12.5) {                                  // cursor
    vec2 q = p.xy;
    float d = sdTri(q, vec2(-0.32, 0.66), vec2(-0.32, -0.22), vec2(0.3, 0.1));
    vec2 s = q - vec2(-0.02, -0.24); s *= rot(0.5);
    d = min(d, sdBox2(s, vec2(0.075, 0.3)));
    return extrude(d + 0.015, p.z, 0.07) - 0.015;
  }
  if (i < 13.5) {                                  // pen nib
    vec2 q = p.xy * rot(-0.65);
    float d = min(sdTri(q, vec2(0.0, -0.78), vec2(-0.36, 0.06), vec2(0.36, 0.06)), sdBox2(q - vec2(0.0, 0.2), vec2(0.36, 0.16)));
    d = max(d, -(length(q - vec2(0.0, -0.12)) - 0.08));
    d = max(d, -sdBox2(q - vec2(0.0, -0.46), vec2(0.014, 0.3)));
    d = min(d, sdBox2(q - vec2(0.0, 0.56), vec2(0.3, 0.07)));
    return extrude(d, p.z, 0.06);
  }
  if (i < 14.5) {                                  // layers: three UI panels stacked
    float d = 1e5;
    for (int k = 0; k < 3; k++) { float f = float(k) - 1.0;
      d = min(d, sdRBox(p - vec3(f * 0.08, f * 0.3, -f * 0.08), vec3(0.62, 0.022, 0.44), 0.02)); }
    vec3 t = p - vec3(0.08, 0.33, 0.0);              // UI blocks on the top panel
    d = min(d, sdBox(t - vec3(-0.18, 0.0, -0.22), vec3(0.3, 0.02, 0.06)));
    d = min(d, sdBox(t - vec3(-0.1, 0.0, 0.0), vec3(0.38, 0.02, 0.1)));
    return min(d, sdCylY(t - vec3(0.38, 0.0, 0.24), 0.1, 0.03));
  }
  if (i < 15.5) {                                  // component: four diamonds
    vec2 q = abs(p.xy);
    q = (q.x > q.y) ? q - vec2(0.4, 0.0) : q - vec2(0.0, 0.4);
    q *= rot(0.785398);
    return extrude(sdBox2(q, vec2(0.2)) + 0.02, p.z, 0.08) - 0.02;
  }
  if (i < 16.5) {                                  // toggle: track outline + sliding knob
    float k = (smoothstep(-0.35, 0.35, sin(uTime * 1.3)) - 0.5) * 0.68;
    vec2 q = p.xy;
    float cap = length(vec2(max(abs(q.x) - 0.34, 0.0), q.y)) - 0.34;
    float d = extrude(abs(cap) - 0.035, p.z, 0.07);
    return min(d, sdSphere(p - vec3(k, 0.0, 0.0), 0.24));
  }
  // device: phone with UI cards on screen
  float d = sdRBox(p, vec3(0.44, 0.86, 0.05), 0.1);
  d = max(d, -sdBox(p - vec3(0.0, 0.0, 0.05), vec3(0.38, 0.78, 0.022)));
  vec3 s = p - vec3(0.0, 0.0, 0.035);
  d = min(d, sdRBox(s - vec3(0.0, 0.62, 0.0), vec3(0.09, 0.025, 0.015), 0.015));
  d = min(d, sdRBox(s - vec3(0.0, 0.3, 0.0), vec3(0.3, 0.16, 0.012), 0.012));
  d = min(d, sdRBox(s - vec3(0.0, -0.06, 0.0), vec3(0.3, 0.12, 0.012), 0.012));
  d = min(d, sdRBox(s - vec3(0.0, -0.58, 0.0), vec3(0.24, 0.07, 0.014), 0.06));
  return d;
}

float shape(vec3 p, float i){
  if (i > 11.5) return shapeUX(p, i);
  if (i < 0.5) return sdSphere(p, 0.78);
  if (i < 1.5) {                                   // orbit
    vec3 q = p; q.xy *= rot(0.42);
    float d = min(sdSphere(p, 0.46), sdTorus(q, vec2(0.86, 0.035)));
    q.yz *= rot(1.1);
    return min(d, sdTorus(q, vec2(0.66, 0.03)));
  }
  if (i < 2.5) {                                   // starburst
    float d = sdSphere(p, 0.24);
    d = min(d, sdSpike(p, vec3( 1,0,0), 0.95, 0.12)); d = min(d, sdSpike(p, vec3(-1,0,0), 0.95, 0.12));
    d = min(d, sdSpike(p, vec3(0, 1,0), 0.95, 0.12)); d = min(d, sdSpike(p, vec3(0,-1,0), 0.95, 0.12));
    d = min(d, sdSpike(p, vec3(0,0, 1), 0.95, 0.12)); d = min(d, sdSpike(p, vec3(0,0,-1), 0.95, 0.12));
    return min(d, sdSpike(abs(p), normalize(vec3(1.0)), 0.7, 0.1));
  }
  if (i < 3.5) {                                   // compass
    float d = sdOcta(p * vec3(0.35, 1.0, 2.6), 0.32) / 2.6;
    d = min(d, sdOcta(p * vec3(1.0, 0.35, 2.6), 0.32) / 2.6);
    d = min(d, sdOcta(p, 0.34));
    return min(d, sdTorus(p.xzy, vec2(0.6, 0.022)));
  }
  if (i < 4.5) {                                   // three letter tiles
    vec3 q = p; q.x = p.x - clamp(floor(p.x / 0.6 + 0.5), -1.0, 1.0) * 0.6;
    return sdRBox(q, vec3(0.25, 0.25, 0.1), 0.05);
  }
  if (i < 5.5) {                                   // cassette
    float d = sdRBox(p, vec3(0.86, 0.54, 0.12), 0.05);
    vec3 q = p; q.x = abs(q.x) - 0.33; q.y -= 0.04;
    d = max(d, -sdCylZ(q, 0.13, 0.3));             // spool holes
    d = max(d, -sdBox(p - vec3(0.0, 0.04, 0.12), vec3(0.52, 0.2, 0.03)));   // window
    return min(d, sdCylZ(q, 0.06, 0.14));          // hubs
  }
  if (i < 6.5) {                                   // interlocked rings
    float d = sdTorus((p - vec3(-0.25, 0.0, 0.0)).xzy, vec2(0.46, 0.06));
    return min(d, sdTorus(p - vec3(0.25, 0.0, 0.0), vec2(0.46, 0.06)));
  }
  if (i < 7.5) {                                   // bar chart on a plate
    float d = sdBox(p - vec3(0.0, -0.5, 0.0), vec3(0.8, 0.03, 0.35));
    d = min(d, sdBox(p - vec3(-0.54, -0.3, 0.0), vec3(0.14, 0.17, 0.14)));
    d = min(d, sdBox(p - vec3(-0.18, -0.12, 0.0), vec3(0.14, 0.35, 0.14)));
    d = min(d, sdBox(p - vec3( 0.18, -0.22, 0.0), vec3(0.14, 0.25, 0.14)));
    return min(d, sdBox(p - vec3( 0.54, 0.08, 0.0), vec3(0.14, 0.55, 0.14)));
  }
  if (i < 8.5) {                                   // stairs (guided steps)
    float d = 1e5;
    for (int k = 0; k < 4; k++) { float f = float(k);
      d = min(d, sdBox(p - vec3(-0.54 + f * 0.36, -0.55 + f * 0.17 + 0.0, 0.0), vec3(0.18, 0.17 + f * 0.17, 0.32) * vec3(1.0, 1.0, 1.0) - vec3(0.0, 0.0, 0.0)));
    }
    return d;
  }
  if (i < 9.5) {                                   // target: stepped discs
    float d = sdCylY(p + vec3(0.0, 0.3, 0.0), 0.85, 0.06);
    d = min(d, sdCylY(p + vec3(0.0, 0.14, 0.0), 0.6, 0.1));
    d = min(d, sdCylY(p - vec3(0.0, 0.04, 0.0), 0.35, 0.1));
    return min(d, sdCylY(p - vec3(0.0, 0.26, 0.0), 0.12, 0.14));
  }
  if (i < 10.5) {                                  // door frame, ajar
    float d = sdFrame(p, vec3(0.42, 0.72, 0.08), 0.035);
    vec3 q = p - vec3(-0.4, 0.0, 0.0); q.xz *= rot(0.7); q -= vec3(0.39, 0.0, 0.0);
    return min(d, sdBox(q, vec3(0.37, 0.69, 0.025)));
  }
  float d = sdTorus(p + vec3(0.0, 0.42, 0.0), vec2(0.72, 0.07));  // treble stack
  d = min(d, sdTorus(p, vec2(0.52, 0.07)));
  return min(d, sdTorus(p - vec3(0.0, 0.42, 0.0), vec2(0.32, 0.07)));
}

float roundness(float i){
  // sphere, orbit, starburst, compass, rings, target, stack, toggle
  if (i < 3.5 || abs(i - 6.0) < 0.5 || abs(i - 9.0) < 0.5 || abs(i - 11.0) < 0.5 || abs(i - 16.0) < 0.5) return 1.0;
  return 0.0;
}
vec3 obj(vec3 p){
  p.xz *= rot(uTime * uSpin + uMouse.x * 0.9);
  p.yz *= rot(0.32 + uMouse.y * 0.6);
  return p;
}
float map(vec3 p){
  vec3 q = obj(p);
  return mix(shape(q, uFrom), shape(q, uTo), uMix);
}
vec3 normal(vec3 p){
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}
float isoline(float x, float w){ return 1.0 - min(abs(fract(x - 0.5) - 0.5) / (fwidth(x) * w), 1.0); }

void main(){
  float px = 1.0 / min(uRes.x, uRes.y);
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) * px;
  const float F = 1.55;
  vec3 ro = vec3(0.0, 0.0, 3.2), rd = normalize(vec3(uv, -F));
  float t = 0.0, d = 1.0, minD = 1e5, tMin = 0.0;
  for (int k = 0; k < 72; k++) {
    d = map(ro + rd * t);
    if (d < minD) { minD = d; tMin = t; }
    if (d < 0.0008 || t > 6.0) break;
    t += d * 0.9;
  }
  // Derivatives must run in uniform control flow, so shade every pixel and
  // mask by hit afterwards.
  float hit = 1.0 - step(0.004, d);
  vec3 p = ro + rd * t, n = normal(p), q = obj(p);
  // Round shapes get globe lines (latitude + meridians); flat, boxy shapes
  // get a planar grid on each face, so flat faces don't show a radial fan.
  float lat = isoline(q.y * 9.0, uLW);
  float mer = isoline(atan(q.z, q.x) * 2.546, uLW);             // 16 meridians
  vec3 no = abs(obj(n));
  float grid = max(max(isoline(q.x * 7.0, uLW) * step(no.x, 0.7), isoline(q.y * 7.0, uLW) * step(no.y, 0.7)), isoline(q.z * 7.0, uLW) * step(no.z, 0.7));
  float round = mix(roundness(uFrom), roundness(uTo), uMix);
  float contour = mix(grid, max(lat, mer), round);
  float crease = smoothstep(0.35, 0.8, length(fwidth(n)));
  float depth = smoothstep(0.02, 0.05, fwidth(t) / max(t, 0.001));
  float rim = 1.0 - smoothstep(0.0, 0.11 * uLW, dot(n, -rd));
  float a = hit * max(contour * 0.42, max(max(crease, depth), rim));
  // Silhouette: the ray passed close to the surface without hitting it.
  float w = tMin * px / F * uLW;
  a = max(a, (1.0 - hit) * (1.0 - smoothstep(w * 0.4, w * 1.4, minD)));
  // Construction guides: dashed centre axes and a tick every 0.1.
  if (uGuides > 0.5) {
    vec2 g = abs(uv) / (px * uLW);
    float dash = step(0.45, fract(length(uv) * 22.0));
    float axes = (1.0 - min(min(g.x, g.y), 1.0)) * dash * step(max(abs(uv.x), abs(uv.y)), 0.62);
    vec2 tk = abs(fract(uv * 10.0 + 0.5) - 0.5) / (px * 10.0 * uLW);
    float ticks = (1.0 - min(tk.x, 1.0)) * step(g.y, 5.0) + (1.0 - min(tk.y, 1.0)) * step(g.x, 5.0);
    a = max(a, (1.0 - hit) * max(axes * 0.22, min(ticks, 1.0) * 0.3 * step(max(abs(uv.x), abs(uv.y)), 0.62)));
  }
  gl_FragColor = vec4(uLine, a);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

/**
 * mount(canvas, opts)
 *  shapes:   shape names to cycle when autoplay is on
 *  autoplay: cycle through shapes every `period` seconds (hero)
 *  start:    initial shape name (cards)
 *  color:    CSS variable for line colour
 *  guides:   draw construction axes
 *  spin:     idle rotation speed (rad/s)
 * Returns { show(name), destroy() } or null without WebGL.
 */
export function mount(canvas, {
  shapes = ['sphere', 'orbit', 'starburst', 'compass'], autoplay = true, start, period = 4.2,
  color = '--paper', guides = true, spin = 0.35, morph = 0.9, playing = true, onReady,
} = {}) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['uRes', 'uTime', 'uMouse', 'uFrom', 'uTo', 'uMix', 'uLine', 'uLW', 'uGuides', 'uSpin'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  gl.uniform3fv(U.uLine, cssColor(color, '#ECEAE4'));
  gl.uniform1f(U.uGuides, guides ? 1 : 0);
  gl.uniform1f(U.uSpin, spin);

  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  gl.uniform1f(U.uLW, 1.25 * dpr);                   // ~1.25 CSS px lines at any DPR
  const ptr = easedPointer();
  const id = n => SHAPES[n] ?? 0;
  let from = id(start || shapes[0]), to = from, mixT = 1, mixStart = 0, cycle = 0, clock = 0, first = true;

  const show = name => {
    const next = id(name);
    if (next === to) return;
    from = mixT < 0.5 ? from : to;                     // snap to whichever is dominant
    to = next; mixT = 0; mixStart = clock;
  };

  let drawn = false;
  const draw = (t, dt) => {
    if (!playing && drawn) return;                   // idle tiles: one still frame, no GPU work
    drawn = true;
    clock = t;
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    if (autoplay && shapes.length > 1) {
      const c = Math.floor(t / period);
      if (c !== cycle) { cycle = c; show(shapes[c % shapes.length]); }
    }
    mixT = Math.min(1, (t - mixStart) / morph);
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.uRes, w, h);
    gl.uniform1f(U.uTime, t);
    const m = ptr.step(dt); gl.uniform2f(U.uMouse, m[0], m[1]);
    gl.uniform1f(U.uFrom, from); gl.uniform1f(U.uTo, to); gl.uniform1f(U.uMix, ease(mixT));
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (first) { first = false; onReady && onReady(); }
  };

  let stop = () => {};
  const still = reducedMotion();
  if (still) { draw(1.2, 0); }
  else stop = gatedLoop(canvas, draw);
  const lost = e => { e.preventDefault(); stop(); canvas.dispatchEvent(new CustomEvent('herofallback')); };
  canvas.addEventListener('webglcontextlost', lost);
  return {
    play(on) { playing = on; },
    show(name) { show(name); if (still) { mixT = 1; from = to; draw(1.2, 0); } },
    destroy() { stop(); ptr.destroy(); canvas.removeEventListener('webglcontextlost', lost); gl.getExtension('WEBGL_lose_context')?.loseContext(); },
  };
}

window.HeroCad = { mount, SHAPES };
