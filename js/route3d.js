// ASMI export route: realistic 3D journey from mine to client warehouse.
// Everything is procedural (no images or videos). Three.js r160.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';

const stage = document.getElementById('route-stage');
const canvas = document.getElementById('route-canvas');
const labelsEl = document.getElementById('route-labels');
const playBtn = document.getElementById('route-play');
const progress = document.getElementById('route-progress');
const stepBtns = [...document.querySelectorAll('#route-steps [data-step]')];
const MOBILE = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || Math.min(screen.width, screen.height) < 700;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { stage.classList.add('no3d'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.55;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#c4d0dc', 0.0011);
const camera = new THREE.PerspectiveCamera(38, 2, 1.5, 6000);

/* ---------------- helpers ---------------- */
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const lerp = (a, b, k) => a + (b - a) * k, clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => (x = clamp(x), x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
function tex(w, h, draw, rep = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function noiseTex(base, spread, n, rep, size = 512, alpha = 0.18, blob = 4) {
  return tex(size, size, (g, w) => {
    g.fillStyle = base; g.fillRect(0, 0, w, w);
    for (let i = 0; i < n; i++) { const v = rnd() * spread - spread / 2; g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255 * alpha})`; const s = 1 + rnd() * blob; g.fillRect(rnd() * w, rnd() * w, s, s); }
  }, rep);
}
const std = (o) => new THREE.MeshStandardMaterial(o);
const G = {};
const add = (parent, geo, mat, x = 0, y = 0, z = 0, cast = true, recv = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; parent.add(m); return m; };
const box = (p, w, h, d, mat, x, y, z) => add(p, new THREE.BoxGeometry(w, h, d), mat, x, y + h / 2, z);
const cyl = (p, rt, rb, h, mat, x, y, z, seg = 24) => add(p, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y + h / 2, z);

/* ---------------- textures & materials ---------------- */
const T = {
  concrete: noiseTex('#8d8f92', 90, 26000, [40, 40]),
  asphalt: noiseTex('#3b3d41', 60, 30000, [60, 60]),
  dirt: noiseTex('#8a5a3c', 120, 30000, [8, 8], 512, 0.5, 6),
  gravel: noiseTex('#6f6a63', 120, 30000, [30, 30]),
  rust: noiseTex('#5b4637', 110, 16000, [3, 3], 256, 0.6, 6),
  steelShell: noiseTex('#3d4148', 70, 12000, [4, 4], 256),
  wood: tex(256, 64, (g, w, h) => { g.fillStyle = '#8b6b46'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(70,48,28,${0.2 + rnd() * 0.3})`; g.lineWidth = 1 + rnd() * 2; const y = rnd() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w / 3, y + rnd() * 6 - 3, 2 * w / 3, y + rnd() * 6 - 3, w, y); g.stroke(); } }),
  corrugated: tex(256, 64, (g, w, h) => { for (let x = 0; x < w; x++) { const v = 128 + Math.sin(x / w * Math.PI * 2 * 18) * 90; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, 0, 1, h); } }, [1, 1], false),
  cladding: tex(128, 128, (g, w, h) => { for (let x = 0; x < w; x++) { const v = 140 + Math.sin(x / w * Math.PI * 2 * 10) * 60; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, 0, 1, h); } }, [12, 1], false),
  windows: tex(256, 128, (g, w, h) => { g.fillStyle = '#20262e'; g.fillRect(0, 0, w, h); for (let y = 10; y < h; y += 28) for (let x = 8; x < w; x += 24) { g.fillStyle = rnd() > 0.35 ? '#ffd9a0' : '#3a4656'; g.fillRect(x, y, 14, 14); } }),
  strip: tex(512, 16, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#fff3c0'); gr.addColorStop(0.25, '#ff9a2a'); gr.addColorStop(0.6, '#b23a0c'); gr.addColorStop(1, '#5d5f62'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, [1, 1]),
};
T.corrugated.repeat.set(4, 1);
const M = {
  concrete: std({ map: T.concrete, roughness: 0.92 }),
  asphalt: std({ map: T.asphalt, roughness: 0.95 }),
  dirt: std({ map: T.dirt, roughness: 1 }),
  ore: std({ map: T.dirt, color: '#7a4530', roughness: 1 }),
  coal: std({ color: '#1c1c1e', roughness: 0.85 }),
  gravel: std({ map: T.gravel, roughness: 1 }),
  shell: std({ map: T.steelShell, metalness: 0.6, roughness: 0.6 }),
  rust: std({ map: T.rust, metalness: 0.4, roughness: 0.8 }),
  frame: std({ color: '#5b6573', metalness: 0.6, roughness: 0.5 }),
  darkSteel: std({ color: '#2b3036', metalness: 0.7, roughness: 0.5 }),
  yellow: std({ color: '#e0a21c', metalness: 0.3, roughness: 0.45 }),
  craneBlue: std({ color: '#2e5d93', metalness: 0.4, roughness: 0.45 }),
  white: std({ color: '#e9ecef', roughness: 0.55 }),
  glass: std({ color: '#1d2a38', metalness: 0.9, roughness: 0.08 }),
  rubber: std({ color: '#141414', roughness: 0.9 }),
  wood: std({ map: T.wood, roughness: 0.85 }),
  cladGrey: std({ color: '#9aa3ad', metalness: 0.5, roughness: 0.5, bumpMap: T.cladding, bumpScale: 0.4 }),
  cladBlue: std({ color: '#3a5f8a', metalness: 0.45, roughness: 0.5, bumpMap: T.cladding, bumpScale: 0.4 }),
  roof: std({ color: '#7d858f', metalness: 0.5, roughness: 0.55 }),
  coil: new THREE.MeshPhysicalMaterial({ color: '#cfd6de', metalness: 1, roughness: 0.28, anisotropy: 0.4 }),
  coilGI: new THREE.MeshPhysicalMaterial({ color: '#dde2e7', metalness: 1, roughness: 0.38 }),
  coilHR: std({ color: '#2d3137', metalness: 0.3, roughness: 0.75 }),
  hullBlue: std({ color: '#1e3553', metalness: 0.3, roughness: 0.55 }),
  hullRed: std({ color: '#7d2220', metalness: 0.2, roughness: 0.6 }),
  deck: std({ color: '#4c5a4a', roughness: 0.8 }),
  rail: std({ color: '#8a8f96', metalness: 0.9, roughness: 0.35 }),
  sleeper: std({ color: '#5a5550', roughness: 0.95 }),
  molten: new THREE.MeshStandardMaterial({ color: '#ff8a1e', emissive: '#ff6a00', emissiveIntensity: 3.2, roughness: 0.4 }),
  hot: new THREE.MeshStandardMaterial({ map: T.strip, emissive: '#ffffff', emissiveMap: T.strip, emissiveIntensity: 1.6, roughness: 0.5, metalness: 0.4 }),
  green: std({ color: '#1fbf5a', emissive: '#1fbf5a', emissiveIntensity: 2 }),
  red: std({ color: '#d43a2a', emissive: '#d43a2a', emissiveIntensity: 2 }),
  stripeRW: std({ map: tex(128, 16, (g, w, h) => { for (let x = 0; x < w; x += 16) { g.fillStyle = (x / 16) % 2 ? '#d33' : '#f2f2f2'; g.fillRect(x, 0, 16, h); } }), roughness: 0.6 }),
};
const containerColors = ['#9c2b23', '#1f5a8f', '#2f7a4e', '#c58a1b', '#6b7480', '#7a3f8c', '#b04d1c'];
const contMats = containerColors.map(c => std({ color: c, metalness: 0.4, roughness: 0.55, bumpMap: T.corrugated, bumpScale: 0.8 }));

/* ---------------- sky, sun, environment ---------------- */
const sky = new Sky(); sky.scale.setScalar(4500); scene.add(sky);
const su = sky.material.uniforms; su.turbidity.value = 6; su.rayleigh.value = 1.6; su.mieCoefficient.value = 0.005; su.mieDirectionalG.value = 0.8;
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(62), THREE.MathUtils.degToRad(215));
su.sunPosition.value.copy(sunDir);
{
  const pm = new THREE.PMREMGenerator(renderer); const envScene = new THREE.Scene(); const s2 = new Sky(); s2.scale.setScalar(1000);
  Object.assign(s2.material.uniforms.sunPosition.value, sunDir); ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG'].forEach(k => s2.material.uniforms[k].value = su[k].value);
  envScene.add(s2); scene.environment = pm.fromScene(envScene).texture;
}
const sun = new THREE.DirectionalLight('#fff1dc', 3.2); sun.castShadow = true;
sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 500 }); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.12;
scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight('#cfe0f5', '#5a5246', 0.6));

/* ---------------- ground & water ---------------- */
const land = (x0, x1, mat, y = 0) => { const g = new THREE.PlaneGeometry(x1 - x0, 900); const m = add(scene, g, mat, (x0 + x1) / 2, y, 0, false, true); m.rotation.x = -Math.PI / 2; return m; };
land(-400, 372, M.gravel); land(812, 1400, M.gravel);
const waterNormals = tex(256, 256, (g, w) => {
  const img = g.createImageData(w, w);
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    let nx = 0, ny = 0;
    for (let k = 1; k <= 4; k++) { const f = k * 2 * Math.PI / w * (k + 1); nx += Math.cos(x * f + k * 1.7 + Math.sin(y * f * 0.7) * 1.3) / k; ny += Math.cos(y * f + k * 2.3 + Math.sin(x * f * 0.6) * 1.1) / k; }
    const i = (y * w + x) * 4; img.data[i] = 128 + nx * 40; img.data[i + 1] = 128 + ny * 40; img.data[i + 2] = 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}, [1, 1], false);
const water = new Water(new THREE.PlaneGeometry(2400, 2400), { textureWidth: MOBILE ? 256 : 512, textureHeight: MOBILE ? 256 : 512, waterNormals, sunDirection: sunDir.clone(), sunColor: 0xfff1dc, waterColor: 0x0f3550, distortionScale: 2.2, fog: true });
water.rotation.x = -Math.PI / 2; water.position.set(600, -1.2, 0); water.material.uniforms.size.value = 2.5; scene.add(water);

/* ---------------- reusable models ---------------- */
function coil(mat = M.coil, R = 0.9, L = 1.2) {
  const g = new THREE.Group(), r = R * 0.33;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 48, 1, true), mat);
  const eye = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 24, 1, true), std({ color: '#3a3f46', metalness: 0.8, roughness: 0.4, side: THREE.BackSide }));
  const face = new THREE.RingGeometry(r, R, 48);
  const f1 = new THREE.Mesh(face, mat); f1.rotation.x = -Math.PI / 2; f1.position.y = L / 2;
  const f2 = new THREE.Mesh(face, mat); f2.rotation.x = Math.PI / 2; f2.position.y = -L / 2;
  g.add(body, eye, f1, f2); g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
  g.rotation.z = Math.PI / 2; const w = new THREE.Group(); w.add(g); w.userData.R = R; return w;
}
function skidCoil(mat, R = 0.9) { const w = new THREE.Group(); const c = coil(mat, R); c.position.y = R + 0.18; w.add(c); for (const z of [-0.5, 0.5]) box(w, 1.5, 0.32, 0.22, M.wood, 0, 0, z); return w; }
function container(mat, open = false) {
  const g = new THREE.Group(); const L = 12.2, W = 2.44, H = 2.6;
  const side = (z) => { const m = add(g, new THREE.BoxGeometry(L, H, 0.06), mat, 0, H / 2, z); };
  side(-W / 2); side(W / 2);
  add(g, new THREE.BoxGeometry(L, 0.08, W), mat, 0, H, 0); add(g, new THREE.BoxGeometry(L, 0.12, W), M.darkSteel, 0, 0.06, 0);
  add(g, new THREE.BoxGeometry(0.06, H, W), mat, -L / 2, H / 2, 0);
  for (const [x, z] of [[-L / 2, -W / 2], [-L / 2, W / 2], [L / 2, -W / 2], [L / 2, W / 2]]) add(g, new THREE.BoxGeometry(0.16, H, 0.16), M.darkSteel, x, H / 2, z);
  if (!open) add(g, new THREE.BoxGeometry(0.06, H, W), mat, L / 2, H / 2, 0);
  else { for (const s of [-1, 1]) { const d = add(g, new THREE.BoxGeometry(0.06, H, W / 2), mat, L / 2 + W / 4 * 0.05, H / 2, s * (W / 2 + W / 4)); d.rotation.y = s * 0.0; d.position.set(L / 2 + W / 4, H / 2, s * (W / 2 + 0.03)); d.rotation.y = s * Math.PI / 2; } }
  g.userData.size = [L, H, W]; return g;
}
function truck(color = '#d9dde2', trailerContainer = null) {
  const g = new THREE.Group(); const cabM = std({ color, metalness: 0.4, roughness: 0.4 });
  box(g, 2.4, 2.6, 2.5, cabM, 5.6, 1.0, 0); add(g, new THREE.BoxGeometry(0.05, 1.0, 2.2), M.glass, 6.82, 2.9, 0);
  box(g, 13, 0.3, 2.4, M.darkSteel, -1.6, 0.95, 0);
  for (const x of [5.9, 2.8, 1.6, -4.4, -5.6, -6.8]) for (const z of [-1.05, 1.05]) { const w = add(g, new THREE.CylinderGeometry(0.52, 0.52, 0.4, 20), M.rubber, x, 0.52, z); w.rotation.x = Math.PI / 2; }
  if (trailerContainer) { const c = container(trailerContainer); c.position.set(-1.6, 1.25, 0); g.add(c); }
  return g;
}
function gantryCrane() {
  const g = new THREE.Group(); const m = M.craneBlue; const H = 32;
  for (const x of [-8, 8]) for (const z of [-7, 7]) box(g, 1.1, H, 1.1, m, x, 0, z);
  for (const x of [-8, 8]) box(g, 1.2, 1.6, 15, m, x, H - 6, 0);
  box(g, 18, 2.2, 2.2, m, 0, H, -4.5); box(g, 18, 2.2, 2.2, m, 0, H, 4.5);
  const boom = new THREE.Group(); g.add(boom); boom.position.y = H + 1.1;
  box(boom, 2.2, 1.8, 74, m, 0, 0, 24); box(boom, 0.3, 9, 0.3, m, 0, 0, -6);
  for (let k = 0; k < 7; k++) box(boom, 0.25, 0.25, 12, m, 0, 3 + k * 0.6, -6 + k * 10);
  box(g, 4, 3.5, 6, M.white, 0, H - 4, -9);
  const trolley = new THREE.Group(); boom.add(trolley); box(trolley, 3, 1.2, 3.2, M.yellow, 0, -1.2, 0);
  const cable = add(trolley, new THREE.CylinderGeometry(0.05, 0.05, 1, 6), M.darkSteel, 0, 0, 0, false, false);
  const spreader = new THREE.Group(); trolley.add(spreader); box(spreader, 2.6, 0.5, 12.4, M.yellow, 0, 0, 0);
  g.userData = { trolley, cable, spreader, boom }; return g;
}
function hullShape(L, B) { const s = new THREE.Shape(); s.moveTo(-L / 2, -B / 2); s.lineTo(L / 2 - 18, -B / 2); s.bezierCurveTo(L / 2 - 4, -B / 2, L / 2, -B / 4, L / 2 + 1, 0); s.bezierCurveTo(L / 2, B / 4, L / 2 - 4, B / 2, L / 2 - 18, B / 2); s.lineTo(-L / 2, B / 2); s.bezierCurveTo(-L / 2 - 2, B / 4, -L / 2 - 2, -B / 4, -L / 2, -B / 2); return s; }
function ship() {
  const g = new THREE.Group(); const L = 150, B = 24;
  const ex = (h, mat, y) => { const geo = new THREE.ExtrudeGeometry(hullShape(L, B), { depth: h, bevelEnabled: true, bevelSize: 0.6, bevelThickness: 0.6, bevelSegments: 2, curveSegments: 24 }); geo.rotateX(-Math.PI / 2); const m = add(g, geo, mat, 0, y, 0); return m; };
  ex(6, M.hullRed, -5.5); ex(7, M.hullBlue, 0.5);
  const deck = add(g, new THREE.ShapeGeometry(hullShape(L - 1, B - 1)), M.deck, 0, 7.6, 0); deck.rotation.x = -Math.PI / 2;
  const sup = new THREE.Group(); g.add(sup); sup.position.set(-L / 2 + 14, 7.6, 0);
  box(sup, 12, 16, 20, M.white, 0, 0, 0); add(sup, new THREE.BoxGeometry(12.1, 10, 20.1), std({ map: T.windows, roughness: 0.5, transparent: true, opacity: 0.85 }), 0, 9, 0, false, false);
  box(sup, 8, 2, 26, M.white, 0, 16, 0); cyl(sup, 2, 2.4, 7, std({ color: '#c94a2a', roughness: 0.5 }), -4, 16, 0);
  const inst = []; const geo = new THREE.BoxGeometry(12.2, 2.6, 2.44);
  for (const m of contMats) { const im = new THREE.InstancedMesh(geo, m, 260); im.castShadow = im.receiveShadow = true; im.count = 0; g.add(im); inst.push(im); }
  const o = new THREE.Object3D();
  for (let bay = 0; bay < 8; bay++) for (let row = 0; row < 8; row++) for (let tier = 0; tier < 4; tier++) {
    if (bay === 7 && Math.abs(row - 3.5) > 2) continue; const x = -L / 2 + 30 + bay * 13.2, z = (row - 3.5) * 2.6, y = 7.6 + 1.3 + tier * 2.62;
    if (tier === 3 && rnd() < 0.35) continue;
    o.position.set(x, y, z); o.updateMatrix(); const im = inst[(rnd() * inst.length) | 0]; im.setMatrixAt(im.count++, o.matrix);
  }
  return g;
}
function building(w, h, d, wallMat, openSide = true) {
  const g = new THREE.Group();
  for (let x = -w / 2; x <= w / 2 + 0.01; x += w / 8) for (const z of [-d / 2, d / 2]) box(g, 0.5, h, 0.5, M.frame, x, 0, z);
  add(g, new THREE.BoxGeometry(w, h, 0.2), wallMat, 0, h / 2, -d / 2);
  add(g, new THREE.BoxGeometry(0.2, h, d), wallMat, -w / 2, h / 2, 0); if (!openSide) add(g, new THREE.BoxGeometry(0.2, h, d), wallMat, w / 2, h / 2, 0);
  if (!openSide) add(g, new THREE.BoxGeometry(w, h, 0.2), wallMat, 0, h / 2, d / 2);
  const r1 = add(g, new THREE.BoxGeometry(w + 1, 0.25, d / 2 + 1.2), M.roof, 0, h + 1.6, -d / 4); r1.rotation.x = 0.12;
  const r2 = add(g, new THREE.BoxGeometry(w + 1, 0.25, d / 2 + 1.2), M.roof, 0, h + 1.6, d / 4); r2.rotation.x = -0.12;
  if (openSide) { r2.visible = false; }
  return g;
}

/* ---------------- stations ---------------- */
const S = []; // {pos, cam:[dx,dy,dz], look:[dx,dy,dz], update(t)}
const world = new THREE.Group(); scene.add(world);
function station(x, z, camOff, lookOff, label, update = () => {}) { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g); const s = { g, pos: new THREE.Vector3(x, 0, z), cam: new THREE.Vector3(...camOff), look: new THREE.Vector3(...lookOff), label, update }; S.push(s); return s; }

// 1 Mining
{
  const s = station(0, 0, [34, 26, 46], [0, 4, 0], 'Mining');
  const g = s.g;
  for (let k = 0; k < 6; k++) { const r = 30 - k * 4.2; const t = add(g, new THREE.CylinderGeometry(r, r + 2.2, 2.4, 48), M.dirt, -6, k * 2.4 + 1.2, -16); }
  const pile = add(g, new THREE.ConeGeometry(7, 6, 32), M.ore, 14, 3, 10); const coalPile = add(g, new THREE.ConeGeometry(5, 4.2, 32), M.coal, 24, 2.1, 2);
  const conv = new THREE.Group(); g.add(conv); conv.position.set(14, 0, 10);
  for (let i = 0; i < 6; i++) box(conv, 0.4, 2 + i * 1.1, 0.4, M.frame, 4 + i * 4, 0, 0);
  const belt = add(conv, new THREE.BoxGeometry(26, 0.4, 1.4), M.rubber, 14, 4.8, 0); belt.rotation.z = 0.26;
  const exc = new THREE.Group(); g.add(exc); exc.position.set(-2, 14.4, 2);
  box(exc, 5, 1.2, 4, M.rubber, 0, 0, 0); box(exc, 4.2, 2.6, 3.4, M.yellow, 0, 1.2, 0); box(exc, 1.6, 1.4, 1.6, M.glass, 1.2, 3.4, -0.7);
  const arm = new THREE.Group(); exc.add(arm); arm.position.set(1.8, 3, 0.6); box(arm, 7, 0.8, 0.8, M.yellow, 3.5, -0.4, 0); const bucket = box(arm, 1.4, 1.4, 1.6, M.darkSteel, 7, -1.6, 0);
  const haul = new THREE.Group(); g.add(haul);
  box(haul, 8, 1.6, 4.4, M.yellow, 0, 1.6, 0); box(haul, 6, 2.2, 4.6, M.yellow, -1, 3.2, 0); box(haul, 1.8, 1.6, 1.8, M.glass, 3.2, 3.2, 1.2); box(haul, 5.6, 0.6, 4, M.ore, -1, 5.3, 0);
  for (const x of [-2.6, 2.6]) for (const z of [-2.3, 2.3]) { const w = add(haul, new THREE.CylinderGeometry(1.4, 1.4, 1.2, 20), M.rubber, x, 1.4, z); w.rotation.x = Math.PI / 2; }
  s.update = t => { arm.rotation.z = -0.35 + Math.sin(t * 0.9) * 0.3; exc.rotation.y = Math.sin(t * 0.3) * 0.5; const a = t * 0.12; haul.position.set(-6 + Math.cos(a) * 36, 0, -16 + Math.sin(a) * 36 * 0.8 + 6); haul.rotation.y = -a - Math.PI / 2; };
}
// 2 Furnace
{
  const s = station(110, 0, [42, 22, 44], [0, 14, 0], 'Blast furnace');
  const g = s.g;
  const prof = [[7, 0], [7.6, 6], [9, 12], [8.2, 22], [6.2, 30], [4.4, 34], [2.6, 37], [0, 37.2]].map(([r, y]) => new THREE.Vector2(r, y));
  add(g, new THREE.LatheGeometry(prof, 40), M.shell, 0, 0, 0);
  for (const y of [8, 16, 24, 31]) { const ring = add(g, new THREE.TorusGeometry(y < 20 ? 10 : 7.5, 0.25, 6, 40), M.frame, 0, y, 0); ring.rotation.x = Math.PI / 2; const plat = add(g, new THREE.RingGeometry(y < 20 ? 8.4 : 6, y < 20 ? 10 : 7.5, 40), M.darkSteel, 0, y, 0); plat.rotation.x = -Math.PI / 2; }
  for (const [x, z] of [[-18, -8], [-18, 4], [-18, 16]]) { cyl(g, 4, 4, 30, M.rust, x, 0, z, 28); const dome = add(g, new THREE.SphereGeometry(4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.rust, x, 30, z); }
  for (const a of [0.5, 2.6, 4.7]) { const p = add(g, new THREE.CylinderGeometry(0.9, 0.9, 18, 12), M.shell, Math.cos(a) * 3, 44, Math.sin(a) * 3); p.rotation.z = 0.3 * Math.cos(a); p.rotation.x = 0.3 * Math.sin(a); }
  const cast = building(30, 9, 18, M.cladGrey, true); cast.position.set(16, 0, 10); g.add(cast);
  const stream = add(g, new THREE.CylinderGeometry(0.35, 0.25, 6, 12), M.molten, 9, 1, 12, false, false);
  const ladle = new THREE.Group(); g.add(ladle); ladle.position.set(12, 0, 14); cyl(ladle, 2.4, 2, 3.6, M.rust, 0, 0.8, 0); const melt = add(ladle, new THREE.CircleGeometry(2.25, 24), M.molten, 0, 4.35, 0, false, false); melt.rotation.x = -Math.PI / 2;
  const glow = new THREE.PointLight('#ff7a1a', 120, 40, 2); glow.position.set(11, 5, 13); g.add(glow);
  const smoke = []; const smokeMat = new THREE.SpriteMaterial({ map: tex(64, 64, (c, w) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(220,220,225,0.55)'); gr.addColorStop(1, 'rgba(220,220,225,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, w); }), transparent: true, depthWrite: false });
  for (let i = 0; i < 14; i++) { const sp = new THREE.Sprite(smokeMat.clone()); g.add(sp); smoke.push([sp, rnd() * 10]); }
  s.update = t => { glow.intensity = 100 + Math.sin(t * 13) * 20 + Math.sin(t * 7.3) * 15; stream.scale.x = stream.scale.z = 0.9 + Math.sin(t * 20) * 0.1;
    smoke.forEach(([sp, o]) => { const k = ((t * 0.12 + o / 10) % 1); sp.position.set(Math.sin(o) * 2 + k * 8, 40 + k * 30, Math.cos(o) * 2 + k * 4); const sc = 6 + k * 22; sp.scale.set(sc, sc, 1); sp.material.opacity = 0.7 * (1 - k); }); };
}
// 3 Rolling & coiling
{
  const s = station(205, 0, [30, 16, 36], [0, 3, 0], 'Rolling & coiling');
  const g = s.g;
  const hall = building(70, 14, 26, M.cladBlue, true); g.add(hall);
  for (let i = 0; i < 5; i++) { const st = new THREE.Group(); g.add(st); st.position.set(-20 + i * 7, 0, 0); for (const z of [-2.2, 2.2]) for (const x of [-0.7, 0.7]) box(st, 0.5, 6, 0.9, M.craneBlue, x, 0, z); box(st, 2, 1.0, 5.4, M.craneBlue, 0, 6, 0); cyl(st, 0.35, 0.35, 1.2, M.darkSteel, 0, 7, -1.4, 12); cyl(st, 0.35, 0.35, 1.2, M.darkSteel, 0, 7, 1.4, 12); for (const y of [2.1, 3.3]) { const r = add(st, new THREE.CylinderGeometry(0.55, 0.55, 5, 20), M.rail, 0, y, 0); r.rotation.x = Math.PI / 2; } }
  const strip = add(g, new THREE.BoxGeometry(52, 0.08, 2.2), M.hot, -2, 2.7, 0, false, true);
  box(g, 54, 2.2, 3, M.darkSteel, -2, 0, 0);
  const growing = coil(M.coil, 1.6, 2.2); growing.position.set(26, 2.4, 0); growing.rotation.y = Math.PI / 2; g.add(growing);
  for (let i = 0; i < 5; i++) { const c = skidCoil(i % 2 ? M.coil : M.coilHR, 1.2); c.position.set(14 + i * 3.6, 0, 9); c.rotation.y = Math.PI / 2; g.add(c); }
  const glow = new THREE.PointLight('#ff8a30', 40, 30, 2); glow.position.set(-18, 4, 0); g.add(glow);
  s.update = t => { T.strip.offset.x = -(t * 0.25 % 1); const k = 0.55 + ((t * 0.08) % 1) * 0.45; growing.scale.set(1, k, k); growing.children[0].rotation.y = -t * 2; };
}
// 4 Logistics warehouse
{
  const s = station(290, 0, [26, 18, 34], [0, 3, -2], 'Logistics warehouse');
  const g = s.g; const wh = building(56, 12, 30, M.cladGrey, true); g.add(wh); add(g, new THREE.PlaneGeometry(56, 30), M.concrete, 0, 0.08, 0, false, true).rotation.x = -Math.PI / 2;
  const mats = [M.coil, M.coilGI, M.coilHR];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) { const c = skidCoil(mats[(r + i) % 3], 1.05); c.position.set(-22 + i * 5, 0, -10 + r * 6); c.rotation.y = Math.PI / 2; g.add(c); }
  const bridge = new THREE.Group(); g.add(bridge); box(bridge, 1.2, 1.4, 30, M.yellow, 0, 10.4, 0);
  const hook = new THREE.Group(); bridge.add(hook); box(hook, 2, 0.8, 1.4, M.darkSteel, 0, 9.4, 0); const hc = add(hook, new THREE.CylinderGeometry(0.04, 0.04, 4, 6), M.darkSteel, 0, 7.4, 0, false, false); const carried = coil(M.coilGI, 1.05); carried.position.y = 4.4; carried.rotation.y = Math.PI / 2; hook.add(carried);
  for (const z of [-15, 15]) box(g, 56, 0.6, 0.6, M.frame, 0, 10, z);
  s.update = t => { bridge.position.x = Math.sin(t * 0.35) * 18; hook.position.z = Math.cos(t * 0.5) * 6; };
}
// 5 Container stuffing
{
  const s = station(350, 0, [14, 9, 18], [0, 1.6, 0], 'Container stuffing');
  const g = s.g; add(g, new THREE.PlaneGeometry(40, 30), M.asphalt, 0, 0.08, 0, false, true).rotation.x = -Math.PI / 2;
  const cont = container(contMats[1], true); g.add(cont); cont.position.set(-3, 0.12, 0);
  for (let i = 0; i < 3; i++) { const c = skidCoil(M.coil, 0.75); c.scale.setScalar(0.9); c.position.set(-7 + i * 2.6, 0.24, 0); c.rotation.y = Math.PI / 2; g.add(c); }
  const fork = new THREE.Group(); g.add(fork);
  box(fork, 3.2, 1.5, 1.8, M.yellow, 0, 0.5, 0); box(fork, 1.6, 1.4, 1.7, M.glass, -0.6, 2, 0); box(fork, 1.8, 0.2, 1.8, M.yellow, -0.6, 3.4, 0); box(fork, 0.2, 4, 1.4, M.darkSteel, 1.8, 0.3, 0);
  for (const x of [-1, 1]) for (const z of [-0.9, 0.9]) { const w = add(fork, new THREE.CylinderGeometry(0.45, 0.45, 0.35, 16), M.rubber, x, 0.45, z); w.rotation.x = Math.PI / 2; }
  const ram = add(fork, new THREE.CylinderGeometry(0.18, 0.18, 1.6, 10), M.darkSteel, 2.6, 1.6, 0); ram.rotation.z = Math.PI / 2;
  const fc = coil(M.coil, 0.75); fc.rotation.y = Math.PI / 2; fc.position.set(2.8, 1.6, 0); fork.add(fc);
  s.update = t => { const k = (t * 0.12) % 1; const p = k < 0.6 ? ease(k / 0.6) : 1 - ease((k - 0.6) / 0.4); fork.position.set(lerp(14, 4.2, p), 0, 0); fork.rotation.y = Math.PI; fc.visible = k < 0.6; };
}
// 6 Export port (quay + gantry crane + ship)
const shipA = ship();
{
  const s = station(470, 0, [-30, 34, 70], [10, 8, 0], 'Export port');
  const g = s.g; add(g, new THREE.BoxGeometry(110, 3, 70), M.concrete, -40, -1.38, 0, false, true);
  for (let z = -30; z <= 30; z += 10) { const b = cyl(g, 0.4, 0.5, 0.8, M.darkSteel, 14, 0, z, 10); }
  const crane = gantryCrane(); crane.position.set(0, 0, 0); crane.rotation.y = -Math.PI / 2; g.add(crane);
  const yard = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) for (let k = 0; k < 2 + (i + j) % 2; k++) { const c = container(contMats[(i * 5 + j + k) % contMats.length]); c.position.set(-60 + i * 14, k * 2.62, -24 + j * 3); g.add(c); }
  shipA.position.set(30, 0, 0); shipA.rotation.y = Math.PI / 2; g.add(shipA);
  const lift = container(contMats[3]); g.add(lift);
  const { trolley, cable, spreader } = crane.userData;
  s.update = t => {
    const k = (t * 0.1) % 1; const out = k < 0.5 ? ease(k / 0.5) : 1 - ease((k - 0.5) / 0.5);
    trolley.position.z = lerp(-2, 40, out); const drop = 6 + Math.sin(Math.min(1, Math.abs(out - 0.5) * 2) * Math.PI / 2) * 0;
    const h = 14 + 8 * Math.sin(out * Math.PI); spreader.position.y = -h; cable.scale.y = h; cable.position.y = -h / 2;
    const wp = new THREE.Vector3(); spreader.getWorldPosition(wp); lift.position.set(wp.x - g.position.x, wp.y - 2.9, wp.z); lift.rotation.y = 0; lift.visible = k < 0.5;
  };
}
// 7 Sea freight
const shipB = ship();
{
  const s = station(640, 0, [-120, 46, 120], [0, 6, 0], 'Sea freight');
  s.g.add(shipB); shipB.rotation.y = 0;
  const wake = add(s.g, new THREE.PlaneGeometry(160, 26), new THREE.MeshBasicMaterial({ map: tex(256, 32, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.55)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false }), -150, -1.0, 0, false, false); wake.rotation.x = -Math.PI / 2;
  s.update = t => { shipB.position.x = -90 + ((t * 6) % 180); shipB.position.y = Math.sin(t * 0.8) * 0.25; shipB.rotation.x = Math.sin(t * 0.6) * 0.008; wake.position.x = shipB.position.x - 155; s.follow = shipB.position; };
}
// 8 Arrival port Chattogram
{
  const s = station(830, 0, [40, 30, 64], [-10, 8, 0], 'Chattogram port');
  const g = s.g; add(g, new THREE.BoxGeometry(110, 3, 70), M.concrete, 40, -1.38, 0, false, true);
  const crane = gantryCrane(); crane.rotation.y = Math.PI / 2; g.add(crane);
  const sh = ship(); sh.position.set(-30, 0, 0); sh.rotation.y = -Math.PI / 2; g.add(sh);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 6; j++) for (let k = 0; k < 2; k++) { const c = container(contMats[(i + j * 2 + k) % contMats.length]); c.position.set(22 + i * 14, k * 2.62, -26 + j * 3); g.add(c); }
  const { trolley, cable, spreader } = crane.userData; const lift = container(contMats[1]); g.add(lift);
  s.update = t => { const k = (t * 0.1) % 1; const back = k < 0.5 ? ease(k / 0.5) : 1 - ease((k - 0.5) / 0.5); trolley.position.z = lerp(40, -2, back); const h = 14 + 8 * Math.sin(back * Math.PI); spreader.position.y = -h; cable.scale.y = h; cable.position.y = -h / 2; const wp = new THREE.Vector3(); spreader.getWorldPosition(wp); lift.position.set(wp.x - g.position.x, wp.y - 2.9, wp.z); lift.visible = k < 0.5; };
}
// 9 Inland rail
{
  const s = station(960, 0, [20, 14, 34], [0, 2, 0], 'Rail to ICD Kamalapur');
  const g = s.g; add(g, new THREE.BoxGeometry(150, 0.6, 5), M.gravel, 0, 0.3, 0, false, true);
  for (const z of [-0.72, 0.72]) add(g, new THREE.BoxGeometry(150, 0.18, 0.12), M.rail, 0, 0.75, z, false, true);
  const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.16, 2.6), M.sleeper, 226); const o = new THREE.Object3D(); for (let i = 0; i < 226; i++) { o.position.set(-75 + i * 0.66, 0.62, 0); o.updateMatrix(); sl.setMatrixAt(i, o.matrix); } sl.receiveShadow = true; g.add(sl);
  const train = new THREE.Group(); g.add(train);
  box(train, 18, 3.4, 3, std({ color: '#c0392b', metalness: 0.4, roughness: 0.45 }), 0, 1.6, 0); box(train, 3, 1.2, 3.02, M.glass, 7.5, 3.3, 0); box(train, 18, 0.3, 3.1, M.darkSteel, 0, 1.3, 0);
  for (let w = 0; w < 4; w++) { const wg = new THREE.Group(); train.add(wg); wg.position.x = -16 - w * 15; box(wg, 14, 0.5, 2.6, M.darkSteel, 0, 1.3, 0); const c = container(contMats[(w + 2) % contMats.length]); c.position.set(0, 1.8, 0); wg.add(c); for (const x of [-5, 5]) { const b = add(wg, new THREE.CylinderGeometry(0.45, 0.45, 2.4, 14), M.darkSteel, x, 1.0, 0); b.rotation.x = Math.PI / 2; } }
  for (const x of [-6, 6]) { const b = add(train, new THREE.CylinderGeometry(0.45, 0.45, 2.4, 14), M.darkSteel, x, 1.0, 0); b.rotation.x = Math.PI / 2; }
  s.update = t => { train.position.x = -10 + ((t * 6) % 60); };
}
// 10 Customs release
{
  const s = station(1060, 0, [16, 10, 26], [0, 3, 0], 'Customs release');
  const g = s.g; add(g, new THREE.PlaneGeometry(80, 40), M.asphalt, 0, 0.08, 0, false, true).rotation.x = -Math.PI / 2;
  box(g, 14, 0.5, 20, M.white, 0, 6.5, 0); for (const [x, z] of [[-6, -9], [6, -9], [-6, 9], [6, 9]]) box(g, 0.5, 6.5, 0.5, M.frame, x, 0, z);
  box(g, 3, 3, 3, M.white, 0, 0, -5.2); add(g, new THREE.BoxGeometry(3.05, 1.2, 3.05), M.glass, 0, 2.1, -5.2);
  const arm = new THREE.Group(); g.add(arm); arm.position.set(1.2, 1.1, -3.4); add(arm, new THREE.BoxGeometry(0.16, 0.16, 7), M.stripeRW, 0, 0, 3.5);
  const lamp = add(g, new THREE.SphereGeometry(0.25, 12, 8), M.red, 1.8, 2.4, -3.7, false, false);
  const tr = truck('#e3e6ea', contMats[1]); g.add(tr); tr.rotation.y = 0;
  s.update = t => { const k = (t * 0.1) % 1; const open = clamp((k - 0.35) / 0.12) * (1 - clamp((k - 0.8) / 0.12)); arm.rotation.x = -open * 1.45; lamp.material = open > 0.5 ? M.green : M.red; tr.position.set(k < 0.45 ? lerp(-34, -10, ease(k / 0.45)) : lerp(-10, 40, ease((k - 0.45) / 0.55)), 0, 0); };
}
// 11 Client warehouse
{
  const s = station(1150, 0, [22, 14, 34], [0, 3, 0], 'Client warehouse');
  const g = s.g; add(g, new THREE.PlaneGeometry(80, 50), M.concrete, 0, 0.08, 0, false, true).rotation.x = -Math.PI / 2;
  const wh = building(40, 10, 24, M.cladGrey, true); wh.position.set(0, 0, -6); g.add(wh);
  for (let i = 0; i < 6; i++) { const c = skidCoil(i % 2 ? M.coil : M.coilGI, 1.0); c.position.set(-15 + i * 4.2, 0, -10); c.rotation.y = Math.PI / 2; g.add(c); }
  const tr = truck('#2d4f7a', contMats[1]); g.add(tr); tr.rotation.y = Math.PI / 2;
  const unload = skidCoil(M.coil, 1.0); g.add(unload);
  s.update = t => { const k = (t * 0.1) % 1; tr.position.set(10, 0, lerp(30, 14, ease(clamp(k / 0.4)))); unload.position.set(lerp(10, 6, ease(clamp((k - 0.45) / 0.3))), 0, lerp(8, -4, ease(clamp((k - 0.45) / 0.3)))); unload.visible = k > 0.45; };
}

/* ---------------- labels ---------------- */
labelsEl.innerHTML = '';
const tags = S.map(s => { const el = document.createElement('span'); el.textContent = s.label; labelsEl.append(el); return el; });
const anchor = new THREE.Vector3();
function placeLabels(cur) {
  const w = stage.clientWidth, h = stage.clientHeight;
  S.forEach((s, i) => { anchor.copy(s.pos).add(s.look).setY(s.look.y + 14); const v = anchor.project(camera); const el = tags[i]; const vis = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 && Math.abs(i - cur) <= 1;
    el.style.display = vis ? '' : 'none'; if (vis) { el.style.left = ((v.x + 1) / 2 * w) + 'px'; el.style.top = ((1 - v.y) / 2 * h) + 'px'; } el.classList.toggle('on', i === cur); });
}

/* ---------------- camera & timeline ---------------- */
const DWELL = 6.5, MOVE = 2.2; const TOTAL = S.length * DWELL;
const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.enabled = false; controls.maxPolarAngle = Math.PI * 0.48; controls.minDistance = 8; controls.maxDistance = 400;
const tmpC = new THREE.Vector3(), tmpL = new THREE.Vector3(), prevC = new THREE.Vector3(), prevL = new THREE.Vector3();
function pose(i, t, outC, outL) {
  const s = S[i]; const base = s.follow ? tmpL.set(s.follow.x + s.pos.x, 0, s.follow.z) : s.pos;
  const drift = t * 0.035; const c = s.cam.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), drift);
  outL.copy(base).add(s.look); outC.copy(outL).sub(s.look).add(c);
}
let T0 = performance.now(), playing = !REDUCED, tNow = 0, lastStep = -1, userOrbit = false;
function timeAt() { return playing ? (performance.now() - T0) / 1000 : tNow; }
function setStep(i) { tNow = i * DWELL + MOVE + 0.01; T0 = performance.now() - tNow * 1000; userOrbit = false; controls.enabled = false; }
stepBtns.forEach(b => b.addEventListener('click', () => { setStep(+b.dataset.step); if (!playing) render(true); }));
playBtn.addEventListener('click', () => { playing = !playing; if (playing) { T0 = performance.now() - tNow * 1000; userOrbit = false; controls.enabled = false; } playBtn.textContent = playing ? 'Pause' : 'Play'; playBtn.setAttribute('aria-pressed', String(playing)); });
playBtn.textContent = playing ? 'Pause' : 'Play';
canvas.addEventListener('pointerdown', () => { if (!userOrbit) { tNow = timeAt(); playing = false; userOrbit = true; controls.enabled = true; controls.target.copy(prevL); playBtn.textContent = 'Play'; playBtn.setAttribute('aria-pressed', 'false'); } });

function resize() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < 600 ? 52 : 38; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(stage); resize();

const clock = new THREE.Clock(); let visible = true;
new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(stage);
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpA2 = new THREE.Vector3(), tmpB2 = new THREE.Vector3();
function render(force) {
  const dt = clock.getDelta(); const animT = clock.elapsedTime;
  if (!visible && !force) return;
  const T = ((timeAt() % TOTAL) + TOTAL) % TOTAL; if (playing) tNow = T;
  const i = Math.floor(T / DWELL), lt = T - i * DWELL;
  S.forEach((s, k) => { if (Math.abs(k - i) <= 1 || k === S.length - 1 && i === 0) s.update(animT); });
  if (!userOrbit) {
    pose(i, lt, tmpA, tmpB);
    if (lt < MOVE) { const p = ease(lt / MOVE); pose((i + S.length - 1) % S.length, DWELL, tmpA2, tmpB2); if (i === 0) { tmpA2.copy(tmpA).add(new THREE.Vector3(0, 40, 60)); tmpB2.copy(tmpB); }
      const lift = Math.sin(p * Math.PI) * Math.min(60, tmpA.distanceTo(tmpA2) * 0.18);
      camera.position.lerpVectors(tmpA2, tmpA, p).y += lift; prevL.lerpVectors(tmpB2, tmpB, p); }
    else { camera.position.copy(tmpA); prevL.copy(tmpB); }
    camera.lookAt(prevL);
  } else controls.update();
  const focus = userOrbit ? controls.target : prevL;
  sun.position.copy(focus).addScaledVector(sunDir, 200); sun.target.position.copy(focus);
  water.material.uniforms.time.value = animT * 0.5;
  if (i !== lastStep) { stepBtns.forEach((b, k) => b.toggleAttribute('aria-current', k === i) || (k === i && b.setAttribute('aria-current', 'step'))); stepBtns.forEach((b, k) => { if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }); lastStep = i; }
  progress.style.width = (T / TOTAL * 100) + '%';
  placeLabels(i);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(() => render(false));
window.__route = { S, setStep, pause: () => { tNow = timeAt(); playing = false; }, render: () => render(true), get i() { return lastStep; } };
