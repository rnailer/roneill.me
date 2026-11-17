// Shared plumbing for the fx/ effects. Plain ES modules, loaded outside Babel.
// Palette from CSS vars, in-view + tab-visibility gating, reduced motion,
// eased pointer.

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
