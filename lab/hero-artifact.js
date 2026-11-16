// Variant "Artifact": a mesh generated with Artlist (Tripo H3.1, one prompt),
// rendered by Three.js through the same riso dither as "Signal".
// Three.js is only fetched when this variant mounts, after first paint.
import { BAYER_GLSL, cssColor, reducedMotion, gatedLoop, easedPointer, fitCanvas } from './dither-core.js';

// jsDelivr's +esm builds are minified and rewrite GLTFLoader's bare 'three'
// import to the same URL, so there is one Three.js instance and no import map.
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.187.0/+esm';
const GLTF_URL = 'https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/loaders/GLTFLoader.js/+esm';

const VS = `
varying vec3 vP;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vP = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const FS = `
precision mediump float;
uniform vec3 uInk; uniform vec3 uHi; uniform vec3 uLight;
varying vec3 vP;
${BAYER_GLSL}
void main(){
  // Flat normal from screen-space derivatives: faceted, print-like shading,
  // and the GLB needs no normal attribute at all.
  vec3 n = normalize(cross(dFdx(vP), dFdy(vP)));
  float diff = max(dot(n, normalize(uLight)), 0.0);
  float rim = pow(1.0 - max(dot(n, normalize(-vP)), 0.0), 3.0);
  float lum = 0.18 + diff * 0.8 + rim * 0.3;
  vec4 c = riso(lum, gl_FragCoord.xy, uInk, uHi);
  if (c.a < 0.5) discard;
  gl_FragColor = c;
}`;

export async function mount(canvas, { cell = 4, src, onReady } = {}) {
  const test = document.createElement('canvas').getContext('webgl');
  if (!test) return null;
  const [THREE, { GLTFLoader }] = await Promise.all([import(THREE_URL), import(GLTF_URL)]);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(1);                          // canvas pixels == dither cells
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.set(0, 0, 4.2);

  const material = new THREE.ShaderMaterial({
    vertexShader: VS, fragmentShader: FS, side: THREE.DoubleSide,
    uniforms: {
      uInk: { value: new THREE.Color(...cssColor('--espresso', '#1A1310')) },
      uHi: { value: new THREE.Color(...cssColor('--paper', '#ECEAE4')) },
      uLight: { value: new THREE.Vector3(-0.6, 0.7, 0.55) },
    },
  });

  const gltf = await new GLTFLoader().loadAsync(src);
  const root = gltf.scene;
  root.traverse(o => { if (o.isMesh) o.material = material; });
  // Normalise: centre it and fit it into a unit-ish sphere.
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3()).length();
  root.position.sub(box.getCenter(new THREE.Vector3()));
  const pivot = new THREE.Group(); pivot.add(root); pivot.scale.setScalar(2.9 / size);
  scene.add(pivot);

  const ptr = easedPointer();
  let first = true;
  const draw = (t, dt) => {
    if (fitCanvas(canvas, cell)) {
      renderer.setSize(canvas.width, canvas.height, false);
      camera.aspect = canvas.width / canvas.height; camera.updateProjectionMatrix();
    }
    const m = ptr.step(dt);
    pivot.rotation.set(0.25 + m[1] * 0.6, t * 0.35 + m[0] * 0.9, 0);
    material.uniforms.uLight.value.set(-0.6 + m[0] * 0.8, 0.7 - m[1] * 0.6, 0.55);
    renderer.render(scene, camera);
    if (first) { first = false; onReady && onReady(); }
  };

  let stop = () => {};
  if (reducedMotion()) draw(1.2, 0); else stop = gatedLoop(canvas, draw);
  return { destroy() { stop(); ptr.destroy(); material.dispose(); renderer.dispose(); renderer.forceContextLoss(); } };
}

window.HeroArtifact = { mount };
