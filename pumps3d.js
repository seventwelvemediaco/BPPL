// Interactive 3D models of the four UDAY pump lines (illustrative, built from BPPL photos and sectional drawings).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ------------------------------------------------------------------ materials
const M = {
  green: new THREE.MeshStandardMaterial({ color: 0x3f8f4c, roughness: 0.42, metalness: 0.12 }),
  greenDark: new THREE.MeshStandardMaterial({ color: 0x2f6f3a, roughness: 0.5, metalness: 0.12 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xcfd3d8, roughness: 0.26, metalness: 0.9 }),
  steelDark: new THREE.MeshStandardMaterial({ color: 0x6b7178, roughness: 0.38, metalness: 0.8 }),
  frame: new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.6, metalness: 0.5 }),
  motor: new THREE.MeshStandardMaterial({ color: 0x8796a3, roughness: 0.45, metalness: 0.35 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xb08d57, roughness: 0.35, metalness: 0.9 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xd9ecf2, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.55 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf7f7f5, roughness: 0.6 }),
  black: new THREE.MeshStandardMaterial({ color: 0x1d1d1f, roughness: 0.5 }),
  red: new THREE.MeshStandardMaterial({ color: 0xc8312f, roughness: 0.45 }),
};

// ------------------------------------------------------------------ geometry helpers
function box(w, h, d, mat, r = 0.012) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function cyl(r, len, mat, axis = 'y', seg = 40, r2 = r) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r2, len, seg), mat);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.castShadow = m.receiveShadow = true;
  return m;
}
const hex = (r, len, mat, axis = 'y') => cyl(r, len, mat, axis, 6);
function at(obj, x, y, z) { obj.position.set(x, y, z); return obj; }
function group(...children) { const g = new THREE.Group(); children.forEach(c => g.add(c)); return g; }

// motor with cooling fins, fan cowl and terminal box, axis along x, shaft end at +x
function motor(len, r, flip = false) {
  const g = new THREE.Group();
  g.add(cyl(r, len, M.motor, 'x', 48));
  const fins = Math.round(len / 0.035);
  for (let i = 0; i < fins; i++) {
    const f = box(len * 0.82 / fins * 0.45, 0.02, r * 2.12, M.motor, 0.004);
    f.position.set(-len * 0.41 + (i + 0.5) * len * 0.82 / fins, 0, 0);
    g.add(f);
    const f2 = f.clone(); f2.rotation.x = Math.PI / 2; g.add(f2);
  }
  g.add(at(cyl(r * 1.02, len * 0.14, M.steelDark, 'x', 48), -len * 0.57, 0, 0));        // fan cowl
  g.add(at(cyl(r * 1.05, 0.03, M.motor, 'x', 48), len * 0.5, 0, 0));                    // drive-end shield
  g.add(at(box(r * 0.9, r * 0.45, r * 0.8, M.motor), -len * 0.05, r + r * 0.18, 0));     // terminal box
  g.add(at(cyl(r * 0.16, 0.08, M.steel, 'x'), len * 0.5 + 0.05, 0, 0));                  // shaft
  for (const s of [-1, 1]) g.add(at(box(len * 0.55, 0.03, 0.05, M.motor), 0, -r * 0.92, s * r * 0.7)); // feet
  if (flip) g.rotation.y = Math.PI;
  return g;
}

// ------------------------------------------------------------------ model builders
// each returns { root, parts:[{obj, name, label?, explode:[x,y,z], labelAt?:[x,y,z]}], camera:[x,y,z], target:[x,y,z] }
function triplexPlunger() {
  const P = [];
  const add = (obj, name, explode, label = false, labelAt) => { P.push({ obj, name, explode, label, labelAt }); return obj; };

  add(at(box(1.25, 0.06, 1.3, M.frame, 0.008), 0, 0.03, 0.03), 'Base frame', [0, -0.12, 0], false, [-0.55, 0.06, 0.6]);
  add(at(box(0.92, 0.42, 0.66, M.green, 0.03), 0, 0.27, -0.12), 'Crankcase (power end)', [0, 0, -0.1], true, [-0.3, 0.5, -0.45]);
  add(at(box(0.98, 0.04, 0.72, M.greenDark, 0.015), 0, 0.5, -0.12), 'Top cover', [0, 0.32, 0], false, [0.2, 0.55, -0.35]);
  add(at(cyl(0.035, 0.05, M.steelDark), 0.32, 0.54, -0.3), 'Breather / oil filler', [0, 0.32, 0]);
  const brg = group(at(cyl(0.14, 0.06, M.greenDark, 'x', 48), 0, 0, 0));
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; brg.add(at(hex(0.016, 0.03, M.steel, 'x'), 0.035, Math.sin(a) * 0.11, Math.cos(a) * 0.11)); }
  const brgL = brg.clone(); brgL.rotation.y = Math.PI;
  add(at(brg, 0.49, 0.27, -0.2), 'Bearing cover', [0.18, 0, 0], false, [0.56, 0.42, -0.2]);
  add(at(brgL, -0.49, 0.27, -0.2), 'Bearing cover (II)', [-0.18, 0, 0]);
  const shaft = group(at(cyl(0.045, 0.24, M.steel, 'x'), 0.12, 0, 0), at(cyl(0.24, 0.08, M.steelDark, 'x', 64), 0.2, 0, 0),
    at(cyl(0.07, 0.11, M.steelDark, 'x'), 0.2, 0, 0));
  for (let i = 0; i < 3; i++) { const g = box(0.06, 0.03, 0.4, M.steelDark, 0.005); g.rotation.x = i * Math.PI / 3; g.position.x = 0.2; shaft.add(g); }
  add(at(shaft, 0.52, 0.27, -0.2), 'Crankshaft & drive pulley', [0.45, 0, 0], true, [0.82, 0.55, -0.2]);
  const win = group(at(box(0.36, 0.2, 0.025, M.greenDark, 0.01), 0, 0, 0), at(cyl(0.04, 0.03, M.glass, 'z'), 0.1, 0, 0.015));
  add(at(win, -0.05, 0.27, -0.46), 'Oil gauge glass', [0, 0, -0.2], true, [-0.05, 0.42, -0.5]);
  add(at(box(0.78, 0.3, 0.2, M.green, 0.02), 0, 0.27, 0.3), 'Crosshead guide', [0, 0, 0.08], false, [-0.42, 0.45, 0.3]);

  const xs = [-0.24, 0, 0.24];
  const pl = new THREE.Group();
  xs.forEach(x => { pl.add(at(cyl(0.034, 0.3, M.steel, 'z'), x, 0, 0)); });
  add(at(pl, 0, 0.27, 0.52), 'Plungers (×3)', [0, 0, 0.22], true, [0.34, 0.36, 0.52]);
  const gl = new THREE.Group();
  xs.forEach(x => { gl.add(at(hex(0.075, 0.07, M.steelDark, 'z'), x, 0, 0)); gl.add(at(cyl(0.06, 0.04, M.brass, 'z'), x, 0, -0.05)); });
  add(at(gl, 0, 0.27, 0.62), 'Gland nuts & packing', [0, 0, 0.32], false, [-0.32, 0.18, 0.66]);

  const le = new THREE.Group();
  xs.forEach(x => {
    le.add(at(box(0.2, 0.26, 0.24, M.steel, 0.03), x, 0, 0));
    le.add(at(cyl(0.075, 0.03, M.steelDark, 'z', 40), x, 0, 0.13));
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; le.add(at(hex(0.012, 0.03, M.steel, 'z'), x + Math.cos(a) * 0.06, Math.sin(a) * 0.06, 0.15)); }
    le.add(at(cyl(0.045, 0.06, M.steelDark), x, 0.155, 0));
    le.add(at(cyl(0.045, 0.06, M.steelDark), x, -0.155, 0));
  });
  add(at(le, 0, 0.27, 0.8), 'Liquid end (3 cylinders)', [0, 0, 0.42], true, [0.42, 0.27, 0.98]);
  const dh = group(at(cyl(0.045, 0.92, M.steel, 'x'), 0, 0, 0), at(cyl(0.085, 0.03, M.steelDark, 'x'), 0.47, 0, 0), at(cyl(0.085, 0.03, M.steelDark, 'x'), -0.47, 0, 0));
  add(at(dh, 0, 0.47, 0.8), 'Discharge header', [0, 0.25, 0.42], true, [0.58, 0.58, 0.8]);
  const sh = group(at(cyl(0.05, 0.92, M.steel, 'x'), 0, 0, 0), at(cyl(0.09, 0.03, M.steelDark, 'x'), 0.47, 0, 0), at(cyl(0.09, 0.03, M.steelDark, 'x'), -0.47, 0, 0));
  add(at(sh, 0, 0.085, 0.8), 'Suction header', [0, -0.1, 0.42], true, [-0.58, 0.02, 0.8]);
  const studs = new THREE.Group();
  [-0.36, -0.12, 0.12, 0.36].forEach(x => [-0.07, 0.07].forEach(z => { studs.add(at(cyl(0.01, 0.4, M.steelDark), x, 0, z)); studs.add(at(hex(0.018, 0.02, M.steelDark), x, 0.2, z)); }));
  add(at(studs, 0, 0.28, 0.8), 'Header studs', [0, 0.1, 0.42]);
  return { parts: P, camera: [2.05, 1.3, 1.75], target: [0, 0.25, 0.15] };
}

function meteringPump() {
  const P = [];
  const add = (obj, name, explode, label = false, labelAt) => { P.push({ obj, name, explode, label, labelAt }); return obj; };
  add(at(box(1.3, 0.04, 0.42, M.frame, 0.006), 0.05, 0.02, 0), 'Base plate', [0, -0.1, 0], false, [-0.55, 0.04, 0.25]);
  add(at(motor(0.4, 0.12), -0.42, 0.17, 0), 'Electric motor', [-0.35, 0, 0], true, [-0.45, 0.4, 0]);
  add(at(cyl(0.1, 0.09, M.greenDark, 'x', 48), -0.15, 0.17, 0), 'Motor flange & coupling', [-0.18, 0, 0]);
  const gb = group(box(0.34, 0.36, 0.32, M.green, 0.03), at(cyl(0.035, 0.04, M.steelDark), -0.09, 0.2, -0.08),
    at(box(0.12, 0.08, 0.012, M.greenDark, 0.004), 0, -0.06, 0.163), at(cyl(0.022, 0.012, M.glass, 'z'), 0, -0.06, 0.17));
  add(at(gb, 0.05, 0.22, 0), 'Worm gearbox (polar crank)', [0, 0, 0], true, [-0.02, 0.3, 0.2]);
  const knob = group(at(cyl(0.045, 0.08, M.greenDark), 0, 0, 0), at(cyl(0.075, 0.03, M.steelDark, 'y', 48), 0, 0.055, 0),
    at(cyl(0.06, 0.008, M.white, 'y', 48), 0, 0.074, 0), at(box(0.05, 0.006, 0.008, M.red, 0.002), 0.03, 0.08, 0));
  add(at(knob, 0.08, 0.44, 0.04), 'Stroke-length knob (0–100%)', [0, 0.2, 0], true, [0.12, 0.58, 0.06]);
  add(at(cyl(0.075, 0.2, M.green, 'x', 40), 0.32, 0.3, 0), 'Crosshead housing', [0.12, 0, 0], false, [0.3, 0.43, 0.1]);
  add(at(hex(0.06, 0.05, M.steelDark, 'x'), 0.445, 0.3, 0), 'Gland nut', [0.24, 0, 0]);

  const head = new THREE.Group();
  head.add(box(0.13, 0.15, 0.15, M.steel, 0.012));
  for (const s of [1, -1]) {
    head.add(at(cyl(0.045, 0.1, M.steel), 0, s * 0.11, 0));
    head.add(at(hex(0.055, 0.03, M.steelDark), 0, s * 0.175, 0));
    head.add(at(cyl(0.018, 0.06, M.steelDark), 0, s * 0.215, 0));
  }
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => head.add(at(hex(0.014, 0.02, M.steelDark, 'x'), 0.07, sx * 0.05, sz * 0.05))));
  add(at(head, 0.54, 0.3, 0), 'Plunger liquid head', [0.3, 0, 0], true, [0.68, 0.36, 0]);
  return { parts: P, camera: [0.9, 0.75, 1.35], target: [0.05, 0.25, 0],
    extraLabels: [['Discharge valve', [0.54, 0.55, 0.02]], ['Suction valve', [0.54, 0.07, 0.02]]] };
}

function triplexMetering() {
  const P = [];
  const add = (obj, name, explode, label = false, labelAt) => { P.push({ obj, name, explode, label, labelAt }); return obj; };
  add(at(box(1.55, 0.05, 0.85, M.frame, 0.008), 0.15, 0.025, 0.1), 'Skid base', [0, -0.12, 0], false, [-0.6, 0.05, 0.5]);
  add(at(box(0.95, 0.46, 0.5, M.green, 0.035), 0, 0.3, 0), 'Common gearbox (power end)', [0, 0, -0.08], true, [-0.38, 0.42, -0.26]);
  add(at(box(0.98, 0.035, 0.53, M.greenDark, 0.012), 0, 0.545, 0), 'Top cover', [0, 0.25, 0]);
  add(at(motor(0.5, 0.15), 0.85, 0.24, 0), 'Electric motor', [0.35, 0, 0], true, [0.9, 0.5, 0]);
  add(at(cyl(0.13, 0.09, M.greenDark, 'x', 48), 0.52, 0.24, 0), 'Motor flange', [0.18, 0, 0]);
  const knobs = new THREE.Group(), heads = new THREE.Group(), houses = new THREE.Group();
  const xs = [-0.3, 0, 0.3];
  xs.forEach(x => {
    knobs.add(at(cyl(0.04, 0.07, M.greenDark), x, 0, 0));
    knobs.add(at(cyl(0.065, 0.028, M.steelDark, 'y', 48), x, 0.045, 0));
    knobs.add(at(cyl(0.052, 0.008, M.white, 'y', 48), x, 0.062, 0));
    houses.add(at(cyl(0.07, 0.16, M.green, 'z', 40), x, 0, 0));
    houses.add(at(hex(0.055, 0.05, M.steelDark, 'z'), x, 0, 0.1));
    const h = new THREE.Group();
    h.add(box(0.15, 0.17, 0.15, M.steel, 0.012));
    for (const s of [1, -1]) {
      h.add(at(cyl(0.05, 0.1, M.steel), 0, s * 0.13, 0));
      h.add(at(hex(0.06, 0.035, M.steelDark), 0, s * 0.2, 0));
      h.add(at(cyl(0.02, 0.06, M.steelDark), 0, s * 0.245, 0));
    }
    heads.add(at(h, x, 0, 0));
  });
  add(at(knobs, 0, 0.58, 0.08), 'Stroke knobs (one per head)', [0, 0.32, 0], true, [0.3, 0.7, 0.08]);
  add(at(houses, 0, 0.36, 0.33), 'Crosshead housings', [0, 0, 0.12], false, [-0.45, 0.42, 0.36]);
  add(at(heads, 0, 0.36, 0.52), 'Liquid heads (×3)', [0, 0, 0.32], true, [0.44, 0.36, 0.6]);
  const dm = group(at(cyl(0.025, 0.75, M.steel, 'x'), 0, 0, 0));
  xs.forEach(x => dm.add(at(cyl(0.025, 0.04, M.steel), x, -0.03, 0)));
  add(at(dm, 0, 0.66, 0.52), 'Discharge manifold', [0, 0.18, 0.32], true, [-0.45, 0.7, 0.52]);
  add(at(cyl(0.025, 0.75, M.steel, 'x'), 0, 0.075, 0.52), 'Suction manifold', [0, -0.05, 0.32], false, [-0.45, 0.1, 0.56]);
  return { parts: P, camera: [1.5, 1.1, 1.85], target: [0.15, 0.3, 0.15] };
}

function testPump() {
  const P = [];
  const add = (obj, name, explode, label = false, labelAt) => { P.push({ obj, name, explode, label, labelAt }); return obj; };
  const base = new THREE.Group();
  base.add(at(box(1.15, 0.06, 0.5, M.frame, 0.008), 0, 0, 0));
  [-0.42, 0.42].forEach(x => [-0.18, 0.18].forEach(z => base.add(at(cyl(0.035, 0.06, M.black), x, -0.06, z))));
  add(at(base, 0.05, 0.08, 0), 'Common base plate', [0, -0.12, 0], false, [-0.5, 0.12, 0.3]);
  const pump = group(box(0.32, 0.3, 0.3, M.green, 0.025), at(box(0.34, 0.03, 0.32, M.greenDark, 0.01), 0, 0.165, 0));
  const emblem = at(cyl(0.06, 0.006, M.red, 'z', 40), 0, 0.02, 0.153);
  pump.add(emblem);
  add(at(pump, -0.22, 0.26, 0), 'Pump body (oil bath)', [0, 0, 0], true, [-0.12, 0.3, 0.2]);
  add(at(motor(0.34, 0.11), 0.33, 0.22, 0.02), 'Electric motor', [0.3, 0, 0], true, [0.36, 0.42, 0.05]);
  // belt guard: large pulley cover + small + bridge
  const guard = new THREE.Group();
  guard.add(at(cyl(0.27, 0.1, M.green, 'z', 56), -0.22, 0.28, 0));
  guard.add(at(cyl(0.11, 0.1, M.green, 'z', 40), 0.33, 0.22, 0));
  const bridge = box(0.58, 0.2, 0.1, M.green, 0.02); bridge.position.set(0.05, 0.27, 0); bridge.rotation.z = -0.1; guard.add(bridge);
  add(at(guard, 0, 0.12, -0.21), 'Belt guard', [0, 0, -0.3], true, [0.05, 0.62, -0.25]);
  const le = new THREE.Group();
  le.add(at(cyl(0.05, 0.12, M.green, 'x'), 0.06, 0, 0));
  le.add(at(box(0.11, 0.13, 0.11, M.steel, 0.01), 0, 0, 0));
  for (const s of [1, -1]) { le.add(at(cyl(0.04, 0.12, M.steel), 0, s * 0.12, 0)); le.add(at(hex(0.05, 0.03, M.steelDark), 0, s * 0.19, 0)); }
  add(at(le, -0.44, 0.32, 0.05), 'Plunger head & valves', [-0.25, 0, 0], true, [-0.6, 0.2, 0.1]);
  const gauge = new THREE.Group();
  gauge.add(at(cyl(0.015, 0.24, M.steel), 0, 0.12, 0));
  gauge.add(at(cyl(0.1, 0.045, M.steelDark, 'z', 56), 0, 0.33, 0));
  gauge.add(at(cyl(0.086, 0.01, M.white, 'z', 56), 0, 0.33, 0.024));
  const needle = box(0.075, 0.006, 0.004, M.red, 0.002); needle.position.set(0.02, 0.34, 0.032); needle.rotation.z = 0.6; gauge.add(needle);
  add(at(gauge, -0.44, 0.52, 0.05), 'Pressure gauge', [0, 0.3, 0], true, [-0.3, 0.95, 0.08]);
  add(at(group(at(cyl(0.025, 0.1, M.brass), 0, 0, 0), at(hex(0.03, 0.03, M.brass), 0, 0.06, 0)), -0.34, 0.6, 0.1), 'Relief valve', [0.12, 0.2, 0.1], false, [-0.26, 0.66, 0.12]);
  return { parts: P, camera: [-1.0, 1.05, 1.6], target: [-0.05, 0.44, 0] };
}

export const MODELS = {
  triplex: { build: triplexPlunger },
  metering: { build: meteringPump },
  'triplex-metering': { build: triplexMetering },
  'test-pump': { build: testPump },
};

// ------------------------------------------------------------------ viewer
export function createViewer(el) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);

  const labels = new CSS2DRenderer();
  labels.domElement.className = 'v3d-labels';
  el.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(2.5, 4, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 12 });
  sun.shadow.radius = 6;
  scene.add(sun, new THREE.HemisphereLight(0xffffff, 0xd8d8dc, 0.5));

  // soft product shadow on an invisible floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.18 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, minDistance: 0.6, maxDistance: 5, maxPolarAngle: Math.PI * 0.49,
    autoRotate: true, autoRotateSpeed: 0.9, enablePan: false });

  let current = null, explodeT = 0, explodeTarget = 0, showLabels = true;

  function clear() {
    if (!current) return;
    scene.remove(current.root);
    current.labelObjs.forEach(l => l.element.remove());
    current.root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }

  function load(key) {
    clear();
    const spec = MODELS[key].build();
    const root = new THREE.Group();
    const labelObjs = [];
    const mkLabel = (text, pos, parent) => {
      const d = document.createElement('div');
      d.className = 'v3d-label'; d.innerHTML = `<span class="dot"></span>${text}`;
      const o = new CSS2DObject(d); o.position.set(...pos);
      (parent || root).add(o); labelObjs.push(o); return o;
    };
    spec.parts.forEach(p => {
      p.base = p.obj.position.clone();
      p.offset = new THREE.Vector3(...p.explode);
      root.add(p.obj);
      if (p.label) {
        // label is placed in model space and travels with its part when exploded
        const local = new THREE.Vector3(...(p.labelAt || [p.base.x, p.base.y + 0.2, p.base.z])).sub(p.base);
        const holder = new THREE.Group(); holder.position.copy(local);
        p.obj.add(holder);
        // express the world-axis offset in the part's own (possibly rotated) frame
        holder.position.applyQuaternion(p.obj.quaternion.clone().invert());
        mkLabel(p.name, [0, 0, 0], holder);
      }
    });
    (spec.extraLabels || []).forEach(([t, pos]) => {
      const owner = spec.parts.find(p => p.name === 'Plunger liquid head');
      if (owner) {
        const holder = new THREE.Group();
        holder.position.copy(new THREE.Vector3(...pos).sub(owner.base));
        owner.obj.add(holder); mkLabel(t, [0, 0, 0], holder);
      } else mkLabel(t, pos);
    });
    scene.add(root);
    current = { key, root, parts: spec.parts, labelObjs, spec };
    labelObjs.forEach(l => l.visible = showLabels);
    reset();
  }

  function reset() {
    if (!current) return;
    const t = new THREE.Vector3(...current.spec.target).add(new THREE.Vector3(0, 0.06, 0));
    // narrow (portrait) screens see less of the model side to side, so step back further
    const k = 1.28 * Math.max(1, Math.pow(1.6 / camera.aspect, 0.8));
    const c = new THREE.Vector3(...current.spec.camera).sub(t).multiplyScalar(k).add(t);
    camera.position.copy(c);
    controls.target.copy(t);
    controls.update();
  }

  function resize() {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h); labels.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = 35;
    camera.updateProjectionMatrix();
  }
  let lastAspect = 0;
  new ResizeObserver(() => { resize(); if (Math.abs(camera.aspect - lastAspect) > 0.15) { lastAspect = camera.aspect; reset(); } }).observe(el);
  resize();

  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  renderer.setAnimationLoop(() => {
    explodeT += (explodeTarget - explodeT) * 0.12;
    if (current) {
      const e = ease(Math.min(1, Math.max(0, explodeT)));
      current.parts.forEach(p => p.obj.position.copy(p.base).addScaledVector(p.offset, e));
    }
    controls.update();
    renderer.render(scene, camera);
    labels.render(scene, camera);
  });

  // stop auto-rotate once the visitor takes control
  renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; el.dispatchEvent(new CustomEvent('v3d-interact')); });

  return {
    load,
    reset,
    setExploded(on) { explodeTarget = on ? 1 : 0; },
    setLabels(on) { showLabels = on; current && current.labelObjs.forEach(l => l.visible = on); },
    setAutoRotate(on) { controls.autoRotate = on; },
    get autoRotate() { return controls.autoRotate; },
  };
}
