// "Exploded mark": draws a project's own mark SVG as a 3D CAD drawing.
// Every path is traced as a line; paths are split into layers (document
// order) that pull apart along Z like an exploded assembly, with dashed
// leader lines at the corners. Three.js loads only when this mounts.
import { cssColor, reducedMotion, gatedLoop, easedPointer } from './dither-core.js';

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

// SVG → array of layers, each a flat [x1,y1,x2,y2,...] segment list in
// normalised units (fits a 2-unit box, centred, y up).
function trace(L, text, maxLayers) {
  const data = new L.SVGLoader().parse(text);
  const paths = data.paths.map(p => {
    const segs = [];
    for (const sp of p.subPaths) {
      const pts = sp.getPoints(5);                    // 5 points per curve segment
      for (let i = 1; i < pts.length; i++) segs.push(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    }
    return segs;
  }).filter(s => s.length);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of paths) for (let i = 0; i < s.length; i += 2) {
    minX = Math.min(minX, s[i]); maxX = Math.max(maxX, s[i]); minY = Math.min(minY, s[i + 1]); maxY = Math.max(maxY, s[i + 1]);
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, k = 2 / Math.max(maxX - minX, maxY - minY);
  const n = Math.min(maxLayers, paths.length), per = Math.ceil(paths.length / n);
  const layers = Array.from({ length: n }, () => []);
  paths.forEach((s, i) => { const out = layers[Math.min(n - 1, Math.floor(i / per))];
    for (let j = 0; j < s.length; j += 2) out.push((s[j] - cx) * k, -(s[j + 1] - cy) * k); });
  return { layers, half: [(maxX - minX) * k / 2, (maxY - minY) * k / 2] };
}

export async function mount(canvas, { src, color = '--paper', layers = 4, spread = 0.32, onReady } = {}) {
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
