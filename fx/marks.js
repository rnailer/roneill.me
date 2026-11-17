// Work preview: draws a project's own mark SVG as a 3D CAD drawing.
// Every path is traced as a line; paths are split into layers (document
// order) that pull apart along Z like an exploded assembly, with dashed
// leader lines at the corners. Three.js loads only when this mounts.
import { cssColor, reducedMotion, gatedLoop, easedPointer } from './core.js';

const V = '0.187.0';
const CDN = `https://cdn.jsdelivr.net/npm/three@${V}`;
let libs;
const load = () => libs ??= Promise.all([
  import(`${CDN}/+esm`),
  import(`${CDN}/examples/jsm/loaders/SVGLoader.js/+esm`),
  import(`${CDN}/examples/jsm/lines/LineSegments2.js/+esm`),
  import(`${CDN}/examples/jsm/lines/LineSegmentsGeometry.js/+esm`),
  import(`${CDN}/examples/jsm/lines/LineMaterial.js/+esm`),
]).then(([THREE, { SVGLoader }, { LineSegments2 }, { LineSegmentsGeometry }, { LineMaterial }]) =>
  ({ THREE, SVGLoader, LineSegments2, LineSegmentsGeometry, LineMaterial }));

const svgCache = new Map();
const fetchSvg = src => { if (!svgCache.has(src)) svgCache.set(src, fetch(src).then(r => r.text())); return svgCache.get(src); };

// Masks, clip paths and defs are drawing helpers, not artwork: strip them
// before tracing, or their rectangles show up as stray outlines.
function clean(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  doc.querySelectorAll('mask, clipPath, defs, filter, symbol, title, desc, metadata').forEach(n => n.remove());
  return new XMLSerializer().serializeToString(doc);
}

// SVG → layers of line segments in normalised units (fits a 2-unit box,
// centred, y up). Depth comes from nesting, not file order: a path sits one
// layer in front of every larger path whose bounds contain it. So a tile's
// glyph floats above its tile, a word stays on one plane, and a frame sits
// at the back.
function trace(L, text, maxLayers) {
  const data = new L.SVGLoader().parse(clean(text));
  const paths = [];
  for (const p of data.paths) {
    const segs = [];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const sp of p.subPaths) {
      const pts = sp.getPoints(5);                      // 5 points per curve segment
      for (let i = 0; i < pts.length; i++) {
        const q = pts[i];
        x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
        if (i) segs.push(pts[i - 1].x, pts[i - 1].y, q.x, q.y);
      }
    }
    if (segs.length) paths.push({ segs, box: [x0, y0, x1, y1], area: (x1 - x0) * (y1 - y0) });
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const { box } of paths) { minX = Math.min(minX, box[0]); minY = Math.min(minY, box[1]); maxX = Math.max(maxX, box[2]); maxY = Math.max(maxY, box[3]); }
  const span = Math.max(maxX - minX, maxY - minY), eps = span * 0.004;
  const inside = (a, b) => a.area > b.area * 1.3 && a.box[0] <= b.box[0] + eps && a.box[1] <= b.box[1] + eps && a.box[2] >= b.box[2] - eps && a.box[3] >= b.box[3] - eps;
  for (const p of paths) p.depth = paths.reduce((n, o) => n + (o !== p && inside(o, p) ? 1 : 0), 0);
  // Compress depths to consecutive layers, capped.
  const levels = [...new Set(paths.map(p => p.depth))].sort((a, b) => a - b);
  const n = Math.min(maxLayers, levels.length);
  const layerOf = d => Math.min(n - 1, levels.indexOf(d));      // with 2 layers: outer shapes back, all detail front
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, k = 2 / span;
  const layers = Array.from({ length: n }, () => []);
  for (const p of paths) { const out = layers[layerOf(p.depth)];
    for (let j = 0; j < p.segs.length; j += 2) out.push((p.segs[j] - cx) * k, -(p.segs[j + 1] - cy) * k); }
  return { layers, half: [(maxX - minX) * k / 2, (maxY - minY) * k / 2] };
}

export async function mount(canvas, { src, color = '--paper', layers = 2, spread = 0.22, onReady } = {}) {
  if (!document.createElement('canvas').getContext('webgl2')) return null;
  const L = await load();
  const { THREE } = L;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  const dpr = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr); renderer.setClearColor(0, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
  camera.position.set(0, 0, 5.6);
  const pivot = new THREE.Group(); scene.add(pivot);
  const col = new THREE.Color(...cssColor(color, '#ECEAE4'));
  const mats = [];
  const mat = (opacity, width, dashed = false) => {
    const m = new L.LineMaterial({ color: col, linewidth: width, transparent: true, opacity, dashed, dashSize: 0.04, gapSize: 0.04, worldUnits: false });
    mats.push(m); return m;
  };

  let parts = [], explode = 0, target = 1, assembled = 0;
  const clear = () => { parts.forEach(p => { pivot.remove(p.obj); p.obj.geometry.dispose(); p.obj.material.dispose(); }); parts = []; mats.length = 0; };

  async function show(nextSrc) {
    const text = await fetchSvg(nextSrc);
    const { layers: ls, half } = trace(L, text, layers);
    clear();
    canvas.dataset.segs = ls.reduce((n, l) => n + l.length / 4, 0);
    ls.forEach((segs, i) => {
      const pos = new Float32Array(segs.length / 2 * 3);
      for (let j = 0, k = 0; j < segs.length; j += 2, k += 3) { pos[k] = segs[j]; pos[k + 1] = segs[j + 1]; pos[k + 2] = 0; }
      const g = new L.LineSegmentsGeometry().setPositions(pos);
      const front = i === ls.length - 1;
      const obj = new L.LineSegments2(g, mat(front ? 1 : 0.55, front ? 1.4 : 1.1));
      pivot.add(obj); parts.push({ obj, z: i - (ls.length - 1) / 2 });
    });
    // leader lines: bounding-box corners, back layer to front layer
    const [hx, hy] = half, zb = -(ls.length - 1) / 2, zf = -zb, lead = [];
    for (const [x, y] of [[-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy]]) lead.push(x, y, zb, x, y, zf);
    const box = []; for (const z of [zb, zf]) for (const [a, b] of [[[-hx, -hy], [hx, -hy]], [[hx, -hy], [hx, hy]], [[hx, hy], [-hx, hy]], [[-hx, hy], [-hx, -hy]]]) box.push(a[0], a[1], z, b[0], b[1], z);
    const lg = new L.LineSegmentsGeometry().setPositions([...lead, ...box]);
    const leaders = new L.LineSegments2(lg, mat(0.35, 1, true)); leaders.computeLineDistances();
    pivot.add(leaders); parts.push({ obj: leaders, z: 1, scaleZ: true });
    mats.forEach(m => m.resolution.set(canvas.clientWidth || 1, canvas.clientHeight || 1));
    explode = 0; assembled = 0;
  }

  const ptr = easedPointer();
  let first = true, lastW = 0, lastH = 0;
  const draw = (t, dt) => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w !== lastW || h !== lastH) { lastW = w; lastH = h;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      mats.forEach(m => m.resolution.set(w, h));
    }
    assembled = Math.min(1, assembled + dt / 1.1);
    explode = 1 - Math.pow(1 - assembled, 3);          // ease-out pull-apart
    for (const p of parts) {
      if (p.scaleZ) p.obj.scale.set(1, 1, Math.max(0.001, explode * spread));
      else p.obj.position.z = p.z * spread * explode;
    }
    const m = ptr.step(dt);
    pivot.rotation.set(-0.42 + m[1] * 0.35, 0.55 + Math.sin(t * 0.4) * 0.18 + m[0] * 0.5, 0);
    renderer.render(scene, camera);
    if (first && parts.length) { first = false; onReady && onReady(); }
  };

  await show(src);
  let stop = () => {};
  const still = reducedMotion();
  if (still) { assembled = 1; draw(0, 1); } else stop = gatedLoop(canvas, draw);
  return {
    show: s => show(s).then(() => { if (still) { assembled = 1; draw(0, 1); } }),
    destroy() { stop(); ptr.destroy(); clear(); mats.forEach(m => m.dispose()); renderer.dispose(); renderer.forceContextLoss(); },
  };
}

window.HeroMarks = { mount };
