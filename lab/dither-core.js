// Shared plumbing for the hero lab variants. Plain ES module, no Babel.
// Handles: palette from CSS vars, low-res sizing, in-view + tab-visibility
// gating, reduced motion, eased pointer.

export const BAYER_GLSL = `
float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a){ return bayer4(0.5 * a) * 0.25 + bayer2(a); }
// Three-tone riso print: espresso shadow dots, paper highlight dots,
// everything in between left transparent so the orange field shows through.
vec4 riso(float lum, vec2 fc, vec3 ink, vec3 hi){
  float b = bayer4(fc);
  if (lum > 0.58 + b * 0.38) return vec4(hi, 1.0);
  if (lum < 0.08 + b * 0.42) return vec4(ink, 1.0);
  return vec4(0.0);
}
`;

export function cssColor(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const m = v.replace('#', '');
  const n = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Runs `frame(t, dt)` only while the element is on screen and the tab is visible.
export function gatedLoop(el, frame) {
  let raf = 0, inView = false, last = 0, t = 0, dead = false;
  const tick = now => {
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now; t += dt;
    frame(t, dt);
    raf = requestAnimationFrame(tick);
  };
  const sync = () => {
    const run = inView && !document.hidden && !dead;
    if (run && !raf) { last = 0; raf = requestAnimationFrame(tick); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); });
  io.observe(el);
  document.addEventListener('visibilitychange', sync);
  return () => { dead = true; sync(); io.disconnect(); document.removeEventListener('visibilitychange', sync); };
}

// Pointer position relative to the window centre, -1..1, eased toward target.
export function easedPointer() {
  const target = [0, 0], cur = [0, 0];
  const onMove = e => {
    target[0] = (e.clientX / innerWidth) * 2 - 1;
    target[1] = (e.clientY / innerHeight) * 2 - 1;
  };
  // Only fine pointers steer it; touch would fight scrolling.
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) addEventListener('pointermove', onMove, { passive: true });
  return {
    step(dt) { const k = 1 - Math.exp(-dt * 4); cur[0] += (target[0] - cur[0]) * k; cur[1] += (target[1] - cur[1]) * k; return cur; },
    destroy() { removeEventListener('pointermove', onMove); }
  };
}

// Internal resolution: one canvas pixel per dither cell. CSS upscales with
// image-rendering: pixelated, so the dots stay crisp and fragment cost stays tiny.
export function fitCanvas(canvas, cell) {
  const w = Math.max(32, Math.round(canvas.clientWidth / cell));
  const h = Math.max(32, Math.round(canvas.clientHeight / cell));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
  return false;
}
