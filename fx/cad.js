// Hero mark: raymarched SDF shapes drawn as CAD line work, no dependencies.
// One fullscreen triangle per canvas. Draws silhouette, crease and depth
// edges solid, surface contour lines lighter, plus faint construction axes.
// Reused for the hero (cycles the four site motifs) and for project preview
// cards (call show(i) on hover).
import { cssColor, reducedMotion, gatedLoop, easedPointer } from './core.js';

export const SHAPES = {
  sphere: 0, orbit: 1, starburst: 2, compass: 3, tiles: 4, cassette: 5,
  rings: 6, bars: 7, stairs: 8, target: 9, door: 10, stack: 11,
  cursor: 12, pen: 13, layers: 14, component: 15, toggle: 16, device: 17,
  slider: 18, checkbox: 19, radio: 20, button: 21, dial: 22, segments: 23,
  cube: 24, network: 25, spiral: 26, poly: 27,
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

float sdCapsule2(vec2 p, vec2 a, vec2 b, float r){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
float pill2(vec2 p, float halfLen, float r){ return length(vec2(max(abs(p.x) - halfLen, 0.0), p.y)) - r; }
// Smooth step through n stops: holds on each, then glides to the next.
float stops(float t, float n){ float s = mod(t, n); return floor(s) + smoothstep(0.7, 1.0, fract(s)); }

// UI controls with moving parts. All front-facing; they sway rather than spin.
float shapeUI(vec3 p, float i){
  float t = uTime;
  if (i < 18.5) {                                  // slider: track, fill, knob, ticks
    float k = sin(t * 0.9) * 0.62;
    float d = extrude(pill2(p.xy, 0.72, 0.035), p.z, 0.035);
    d = min(d, extrude(sdBox2(p.xy - vec2((k - 0.72) * 0.5, 0.0), vec2((k + 0.72) * 0.5, 0.055)) - 0.01, p.z, 0.06));
    d = min(d, sdCylZ(p - vec3(k, 0.0, 0.02), 0.15, 0.1) - 0.02);
    vec2 q = p.xy - vec2(0.0, -0.3); q.x = q.x - clamp(floor(q.x / 0.36 + 0.5), -2.0, 2.0) * 0.36;
    return min(d, extrude(sdBox2(q, vec2(0.012, 0.05)), p.z, 0.02));
  }
  if (i < 19.5) {                                  // checkbox row: box, tick that pops in, label
    float c = fract(t * 0.35);
    float on = smoothstep(0.1, 0.22, c) - smoothstep(0.75, 0.87, c);
    vec3 b = p - vec3(-0.42, 0.0, 0.0);
    float d = sdRBox(b, vec3(0.26, 0.26, 0.07), 0.05);
    d = max(d, -sdBox(b - vec3(0.0, 0.0, 0.07), vec3(0.19, 0.19, 0.04)));
    vec2 q = (b.xy - vec2(0.0, 0.0)) / max(on, 0.001);
    float tick = min(sdCapsule2(q, vec2(-0.12, 0.0), vec2(-0.03, -0.1), 0.035), sdCapsule2(q, vec2(-0.03, -0.1), vec2(0.15, 0.13), 0.035)) * max(on, 0.001);
    d = min(d, extrude(tick, b.z - 0.08 * on, 0.04) + (1.0 - on) * 0.3);
    d = min(d, extrude(pill2(p.xy - vec2(0.38, 0.08), 0.3, 0.035), p.z, 0.025));
    return min(d, extrude(pill2(p.xy - vec2(0.26, -0.1), 0.18, 0.035), p.z, 0.025));
  }
  if (i < 20.5) {                                  // radio group: three rings, dot moves
    float sel = stops(t * 0.7, 3.0);
    float y = 0.42 - 0.42 * (sel > 2.0 ? 2.0 * (3.0 - sel) : sel);   // glide back to the top
    vec3 r = p - vec3(-0.45, 0.0, 0.0); r.y = r.y - clamp(floor(r.y / 0.42 + 0.5), -1.0, 1.0) * 0.42;
    float d = sdTorus(r.xzy, vec2(0.13, 0.03));
    d = min(d, sdSphere(p - vec3(-0.45, y, 0.0), 0.075));
    vec2 l = p.xy - vec2(0.2, 0.0); l.y = l.y - clamp(floor(l.y / 0.42 + 0.5), -1.0, 1.0) * 0.42;
    return min(d, extrude(pill2(l, 0.3, 0.035), p.z, 0.025));
  }
  if (i < 21.5) {                                  // button + cursor that clicks it
    float c = fract(t * 0.45);
    float press = smoothstep(0.38, 0.46, c) - smoothstep(0.55, 0.68, c);
    float hover = smoothstep(0.05, 0.35, c) - smoothstep(0.75, 0.95, c);
    vec3 b = p - vec3(0.0, -0.12, -press * 0.05);
    float d = sdRBox(b, vec3(0.66, 0.24, 0.1 - press * 0.04), 0.1);
    d = min(d, extrude(pill2(b.xy, 0.26, 0.035), b.z - 0.1 + press * 0.04, 0.03));
    vec3 a = p - vec3(0.28 + (1.0 - hover) * 0.35, 0.02 + (1.0 - hover) * 0.3, 0.2 - press * 0.08);
    vec2 q = a.xy * 1.9;
    float cur = sdTri(q, vec2(-0.32, 0.66), vec2(-0.32, -0.22), vec2(0.3, 0.1));
    vec2 st = q - vec2(-0.02, -0.24); st *= rot(0.5);
    cur = min(cur, sdBox2(st, vec2(0.075, 0.3))) / 1.9;
    return min(d, extrude(cur, a.z, 0.04));
  }
  if (i < 22.5) {                                  // dial: knob turns, ticks around
    float ang = sin(t * 0.8) * 2.2;
    vec3 k = p; k.xy *= rot(ang);
    float d = sdCylZ(p, 0.42, 0.12) - 0.02;
    d = max(d, -sdCylZ(p - vec3(0.0, 0.0, 0.14), 0.34, 0.03));        // dished top
    d = min(d, sdRBox(k - vec3(0.0, 0.22, 0.1), vec3(0.03, 0.1, 0.04), 0.02));
    float a = atan(p.y, p.x), sec = 6.2831853 / 16.0;
    float am = mod(a + sec * 0.5, sec) - sec * 0.5;
    vec2 q = length(p.xy) * vec2(cos(am), sin(am)) - vec2(0.62, 0.0);
    return min(d, extrude(sdBox2(q, vec2(0.05, 0.012)), p.z, 0.03));
  }
  // segmented control: outline track, sliding selection, three labels
  float sel = stops(t * 0.6, 3.0);
  float x = -0.5 + 0.5 * (sel > 2.0 ? 2.0 * (3.0 - sel) : sel);
  float d = extrude(abs(pill2(p.xy, 0.62, 0.22)) - 0.025, p.z, 0.05);
  d = min(d, sdRBox(p - vec3(x, 0.0, 0.0), vec3(0.27, 0.16, 0.07), 0.07));
  vec2 l = p.xy; l.x = l.x - clamp(floor(l.x / 0.5 + 0.5), -1.0, 1.0) * 0.5;
  return min(d, extrude(pill2(l, 0.09, 0.025), p.z - 0.06, 0.03));
}

float sdCap3(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }

// More site motifs, from assets/motifs: open cube, network, spiral, mesh-poly.
float shapeMotif(vec3 p, float i){
  if (i < 24.5) {                                  // open cube frame around a turned cube
    float d = sdFrame(p, vec3(0.6), 0.03);
    vec3 q = p; q.xz *= rot(0.785398); q.xy *= rot(0.615);
    return min(d, sdBox(q, vec3(0.24)) - 0.01);
  }
  if (i < 25.5) {                                  // network: nodes and edges
    vec3 A = vec3(0.0, 0.62, 0.1), B = vec3(-0.6, 0.12, 0.3), C = vec3(0.55, 0.22, -0.25);
    vec3 D = vec3(-0.3, -0.5, -0.3), E = vec3(0.4, -0.45, 0.35), F = vec3(0.0, 0.0, 0.0);
    float d = min(min(sdSphere(p - A, 0.09), sdSphere(p - B, 0.09)), min(sdSphere(p - C, 0.09), sdSphere(p - D, 0.09)));
    d = min(d, min(sdSphere(p - E, 0.09), sdSphere(p - F, 0.14)));
    float r = 0.018;
    d = min(d, min(sdCap3(p, F, A, r), sdCap3(p, F, B, r))); d = min(d, min(sdCap3(p, F, C, r), sdCap3(p, F, D, r)));
    d = min(d, min(sdCap3(p, F, E, r), sdCap3(p, A, C, r))); d = min(d, min(sdCap3(p, B, D, r), sdCap3(p, D, E, r)));
    return min(d, sdCap3(p, A, B, r));
  }
  if (i < 26.5) {                                  // spiral: a coiled tube
    float pitch = 0.3, a = atan(p.z, p.x);
    float y = p.y - a / 6.2831853 * pitch;
    y = mod(y + pitch * 0.5, pitch) - pitch * 0.5;
    float R = 0.55 - p.y * 0.18;                   // tapers like the motif
    float d = length(vec2(length(p.xz) - R, y)) - 0.045;
    return max(d * 0.7, abs(p.y) - 0.7);
  }
  // mesh-poly: faceted icosahedron
  vec3 q = abs(p);
  const float G = 1.618034;
  float d = dot(q, normalize(vec3(1.0)));
  d = max(d, dot(q, normalize(vec3(0.0, 1.0 / G, G))));
  d = max(d, dot(q, normalize(vec3(1.0 / G, G, 0.0))));
  d = max(d, dot(q, normalize(vec3(G, 0.0, 1.0 / G))));
  return d - 0.62;
}

float shape(vec3 p, float i){
  if (i > 23.5) return shapeMotif(p, i);
  if (i > 17.5) return shapeUI(p, i);
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
  if (i < 3.5 || abs(i - 6.0) < 0.5 || abs(i - 9.0) < 0.5 || abs(i - 11.0) < 0.5 || abs(i - 16.0) < 0.5 || abs(i - 26.0) < 0.5) return 1.0;
  return 0.0;
}
float sway(float i){ return step(11.5, i) * step(i, 23.5); }   // flat UI-ish shapes face the viewer
vec3 obj(vec3 p){
  float sw = mix(sway(uFrom), sway(uTo), uMix);
  p.xz *= rot(mix(uTime * uSpin, sin(uTime * 0.6) * 0.5, sw) + uMouse.x * 0.9);
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
// One compiled program per GL context. Library tiles share a single hidden
// context and copy each frame into their own 2D canvas, so a page full of
// tiles never hits the browser's ~16 WebGL context limit.
function setup(gl) {
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['uRes', 'uTime', 'uMouse', 'uFrom', 'uTo', 'uMix', 'uLine', 'uLW', 'uGuides', 'uSpin'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  return U;
}
const GL_OPTS = { alpha: true, premultipliedAlpha: false, antialias: false, powerPreference: 'low-power', preserveDrawingBuffer: true };
let shared;
function getShared() {
  if (shared !== undefined) return shared;
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl', GL_OPTS);
  const U = setup(gl);
  return shared = U ? { c, gl, U } : null;
}

export function mount(canvas, {
  shapes = ['sphere', 'orbit', 'starburst', 'compass'], autoplay = true, start, period = 4.2,
  color = '--paper', guides = true, spin = 0.35, morph = 0.9, playing = true, t0 = 0, share = false, onReady,
} = {}) {
  let gl, U, glCanvas = canvas, ctx2d = null;
  if (share) {
    const sh = getShared(); if (!sh) return null;
    ({ gl, U } = sh); glCanvas = sh.c; ctx2d = canvas.getContext('2d');
  } else {
    gl = canvas.getContext('webgl', GL_OPTS); U = setup(gl); if (!U) return null;
  }
  const line = cssColor(color, '#ECEAE4');
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
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
    if (glCanvas !== canvas && (glCanvas.width !== w || glCanvas.height !== h)) { glCanvas.width = w; glCanvas.height = h; }
    gl.uniform3fv(U.uLine, line);
    gl.uniform1f(U.uGuides, guides ? 1 : 0);
    gl.uniform1f(U.uSpin, spin);
    gl.uniform1f(U.uLW, 1.25 * dpr);                 // ~1.25 CSS px lines at any DPR
    if (autoplay && shapes.length > 1) {
      const c = Math.floor(t / period);
      if (c !== cycle) { cycle = c; show(shapes[c % shapes.length]); }
    }
    mixT = Math.min(1, (t - mixStart) / morph);
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.uRes, w, h);
    gl.uniform1f(U.uTime, t + t0);
    const m = ptr.step(dt); gl.uniform2f(U.uMouse, m[0], m[1]);
    gl.uniform1f(U.uFrom, from); gl.uniform1f(U.uTo, to); gl.uniform1f(U.uMix, ease(mixT));
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (ctx2d) { ctx2d.clearRect(0, 0, w, h); ctx2d.drawImage(glCanvas, 0, 0); }
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
    destroy() { stop(); ptr.destroy(); canvas.removeEventListener('webglcontextlost', lost); if (!ctx2d) gl.getExtension('WEBGL_lose_context')?.loseContext(); },
  };
}

window.HeroCad = { mount, SHAPES };
