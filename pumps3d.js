// Interactive 3D models of the four UDAY pump lines.
// Geometry follows BPPL product photos, the triplex sectional drawings and the UFF-30 dimension sheet.
// Illustrative, not to scale. Units are roughly metres.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ------------------------------------------------------------------ textures
function noiseTexture(size = 256, amp = 38) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), img = g.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * amp;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.filter = 'blur(1px)'; g.drawImage(c, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
  return t;
}
function brushedTexture(size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    const y = Math.random() * size, v = 110 + Math.random() * 40;
    g.strokeStyle = `rgb(${v},${v},${v})`; g.globalAlpha = 0.5; g.lineWidth = Math.random() * 1.2;
    g.beginPath(); g.moveTo(0, y); g.lineTo(size, y + (Math.random() - 0.5) * 2); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
  return t;
}
function decalTexture(draw, w = 512, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const castNoise = noiseTexture(), brushed = brushedTexture();

// UDAY oval logo (red on the paint colour, as on the pump castings)
const udayTex = decalTexture((g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = '#d8232a'; g.lineWidth = 16;
  g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 14, h / 2 - 14, 0, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#d8232a'; g.font = 'italic 900 132px Arial Black, Arial, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('UDAY', w / 2, h / 2 + 6);
});
// aluminium name plate
const plateTex = decalTexture((g, w, h) => {
  g.fillStyle = '#c9ccd0'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1d1d1f'; g.font = 'bold 44px Arial'; g.textAlign = 'center';
  g.fillText('BHAGYODAY PUMPS PVT. LTD.', w / 2, 64);
  g.font = '30px Arial'; g.fillText('UDAY  ·  AHMEDABAD  ·  INDIA', w / 2, 112);
  g.strokeStyle = '#8e9297'; g.lineWidth = 3;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(40, 150 + i * 24); g.lineTo(w - 40, 150 + i * 24); g.stroke(); }
}, 512, 256);
// round BPPL emblem used on the UFF-30 pump body
const emblemTex = decalTexture((g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = '#d8232a'; g.lineWidth = 22;
  g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 20, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#d8232a'; g.font = 'bold 220px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('B', w / 2, h / 2 + 10);
}, 256, 256);

// ------------------------------------------------------------------ materials
function paint(color) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, metalness: 0.06, clearcoat: 0.18, clearcoatRoughness: 0.5,
    bumpMap: castNoise, bumpScale: 0.35, roughnessMap: castNoise, envMapIntensity: 0.5 });
}
const M = {
  steel: new THREE.MeshPhysicalMaterial({ color: 0xc9cdd2, roughness: 0.3, metalness: 0.92, roughnessMap: brushed, bumpMap: brushed, bumpScale: 0.08 }),
  steelDark: new THREE.MeshStandardMaterial({ color: 0x5f656c, roughness: 0.42, metalness: 0.85, roughnessMap: castNoise }),
  bolt: new THREE.MeshStandardMaterial({ color: 0x3e4247, roughness: 0.45, metalness: 0.8 }),
  zinc: new THREE.MeshStandardMaterial({ color: 0xb9bcc0, roughness: 0.35, metalness: 0.85 }),
  motor: new THREE.MeshPhysicalMaterial({ color: 0x8a97a3, roughness: 0.5, metalness: 0.3, clearcoat: 0.2, roughnessMap: castNoise }),
  motorDark: new THREE.MeshStandardMaterial({ color: 0x4b545c, roughness: 0.55, metalness: 0.4 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xb8924f, roughness: 0.32, metalness: 0.95 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xe8f4f8, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.6 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf4f4f1, roughness: 0.55 }),
  beige: new THREE.MeshPhysicalMaterial({ color: 0xe6d8bf, roughness: 0.5, clearcoat: 0.25 }),
  black: new THREE.MeshStandardMaterial({ color: 0x1d1d1f, roughness: 0.6 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x232527, roughness: 0.85 }),
  maroon: paint(0x7a2228),
  red: new THREE.MeshStandardMaterial({ color: 0xc8312f, roughness: 0.45 }),
  yellow: paint(0xe0a526),
  frame: paint(0x3d4246),
};
const decal = tex => new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -2 });
const plateMat = new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.35, metalness: 0.7 });

// ------------------------------------------------------------------ geometry helpers
const shadowed = m => { m.castShadow = m.receiveShadow = true; return m; };
function box(w, h, d, mat, r = 0.01) {
  return shadowed(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.01, h / 2.01, d / 2.01)), mat));
}
// axis: direction the cylinder's length runs along
function cyl(r, len, mat, axis = 'y', seg = 40, rTop = r) {
  const m = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, len, seg), mat));
  if (axis === 'x') m.rotation.z = -Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  return m;
}
// hex nut / bolt head with a chamfered top, facing `axis`
function hex(r, len, mat = M.bolt, axis = 'y') {
  const g = new THREE.Group();
  g.add(shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len * 0.8, 6), mat)));
  const cap = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, len * 0.2, 6), mat)); cap.position.y = len * 0.5; g.add(cap);
  ({ x: () => g.rotation.z = -Math.PI / 2, '-x': () => g.rotation.z = Math.PI / 2, z: () => g.rotation.x = Math.PI / 2,
     '-z': () => g.rotation.x = -Math.PI / 2, '-y': () => g.rotation.z = Math.PI, y: () => 0 })[axis]();
  return g;
}
// threaded nipple: shank with thread rings
function threaded(r, len, mat = M.steel, axis = 'y') {
  const g = new THREE.Group();
  g.add(shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, len, 32), mat)));
  const n = Math.max(3, Math.round(len / (r * 0.35)));
  for (let i = 0; i < n; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r * 0.93, r * 0.09, 6, 32), mat);
    t.rotation.x = Math.PI / 2; t.position.y = -len / 2 + (i + 0.5) * len / n; g.add(t);
  }
  if (axis === 'x') g.rotation.z = -Math.PI / 2;
  if (axis === 'z') g.rotation.x = Math.PI / 2;
  return g;
}
function at(obj, x, y, z) { obj.position.set(x, y, z); return obj; }
function group(...children) { const g = new THREE.Group(); children.forEach(c => g.add(c)); return g; }
// ring of bolt heads on a circular cover facing `axis`
function boltCircle(n, rad, r, len, axis, offset = 0) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const a = offset + i / n * Math.PI * 2, u = Math.cos(a) * rad, v = Math.sin(a) * rad;
    const b = hex(r, len, M.bolt, axis);
    if (axis.endsWith('x')) b.position.set(0, u, v); else if (axis.endsWith('z')) b.position.set(u, v, 0); else b.position.set(u, 0, v);
    g.add(b);
  }
  return g;
}
// bolt heads along the edge of a rectangular cover lying in the x-z plane
function boltRect(w, d, nx, nz, r = 0.012, len = 0.012) {
  const g = new THREE.Group(), pts = [];
  for (let i = 0; i < nx; i++) { const x = -w / 2 + i * w / (nx - 1); pts.push([x, -d / 2], [x, d / 2]); }
  for (let j = 1; j < nz - 1; j++) { const z = -d / 2 + j * d / (nz - 1); pts.push([-w / 2, z], [w / 2, z]); }
  pts.forEach(([x, z]) => g.add(at(hex(r, len), x, 0, z)));
  return g;
}
// two circles joined by tangents (belt guard outline) in the x-y plane, extruded along z with rounded edges
function beltGuardGeometry(r1, r2, d, depth) {
  const th = Math.acos((r1 - r2) / d), s = new THREE.Shape();
  s.moveTo(r1 * Math.cos(th), r1 * Math.sin(th));
  s.lineTo(d + r2 * Math.cos(th), r2 * Math.sin(th));
  s.absarc(d, 0, r2, th, -th, true);
  s.lineTo(r1 * Math.cos(th), -r1 * Math.sin(th));
  s.absarc(0, 0, r1, -th, th - Math.PI * 2, true);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 4, curveSegments: 48 });
  geo.translate(0, 0, -depth / 2);
  return geo;
}
// V-belt pulley along x
function pulley(r, w, grooves = 3) {
  const g = group(cyl(r, w, M.steelDark, 'x', 56));
  for (let i = 0; i < grooves; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r * 0.97, w / (grooves * 4), 8, 56), M.bolt);
    t.rotation.y = Math.PI / 2; t.position.x = -w / 2 + (i + 0.5) * w / grooves; g.add(t);
  }
  g.add(cyl(r * 0.3, w * 1.3, M.steelDark, 'x'));
  return g;
}
// TEFC induction motor with radial cooling fins; axis along x, shaft end at +x
function motor(len, r, finish = M.motor) {
  const g = new THREE.Group();
  g.add(cyl(r, len * 0.86, finish, 'x', 56));
  const fins = 22;
  for (let i = 0; i < fins; i++) {
    const a = i / fins * Math.PI * 2;
    if (Math.sin(a) < -0.55) continue; // no fins over the feet
    const f = box(len * 0.74, r * 0.16, 0.006, finish, 0.002);
    f.position.set(-len * 0.02, Math.sin(a) * r * 1.05, Math.cos(a) * r * 1.05);
    f.rotation.x = -a + Math.PI / 2;
    g.add(f);
  }
  g.add(at(cyl(r * 1.06, len * 0.16, M.motorDark, 'x', 56), -len * 0.5, 0, 0));
  for (let i = 1; i < 4; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * i * 0.24, 0.004, 6, 40), M.bolt);
    ring.rotation.y = Math.PI / 2; ring.position.x = -len * 0.585; g.add(ring);
  }
  g.add(at(cyl(r * 1.04, 0.03, finish, 'x', 56), len * 0.44, 0, 0));
  g.add(at(box(r * 0.95, r * 0.42, r * 0.8, finish, 0.01), -len * 0.04, r * 1.18, 0));
  g.add(at(cyl(r * 0.12, r * 0.25, M.black, 'z'), -len * 0.04, r * 1.18, r * 0.5));
  g.add(at(cyl(r * 0.17, 0.09, M.steel, 'x'), len * 0.5 + 0.045, 0, 0));
  for (const s of [-1, 1]) g.add(at(box(len * 0.6, 0.025, r * 0.32, finish, 0.006), 0, -r * 0.94, s * r * 0.7));
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(r * 0.7, r * 0.35), plateMat);
  plate.position.set(len * 0.18, r * 0.35, r * 1.13); plate.rotation.x = -0.32; g.add(plate);
  return g;
}
// square-flanged valve cartridge (as on UDAY metering heads): flange, cage stack, tie rods, top flange, threaded port
function valveStack(dir = 1, s = 1) {
  const g = new THREE.Group(), y = v => v * dir * s, ax = dir > 0 ? 'y' : '-y';
  g.add(at(box(0.15 * s, 0.025 * s, 0.15 * s, M.steel, 0.006), 0, y(0.0125), 0));
  g.add(at(cyl(0.045 * s, 0.05 * s, M.steel), 0, y(0.05), 0));
  g.add(at(cyl(0.049 * s, 0.008 * s, M.steelDark), 0, y(0.078), 0));
  g.add(at(cyl(0.045 * s, 0.05 * s, M.steel), 0, y(0.105), 0));
  [-1, 1].forEach(a => [-1, 1].forEach(b => {
    g.add(at(cyl(0.008 * s, 0.13 * s, M.zinc), a * 0.058 * s, y(0.085), b * 0.058 * s));
    g.add(at(hex(0.014 * s, 0.02 * s, M.zinc, ax), a * 0.058 * s, y(0.165), b * 0.058 * s));
  }));
  g.add(at(box(0.16 * s, 0.03 * s, 0.16 * s, M.steel, 0.006), 0, y(0.145), 0));
  g.add(at(hex(0.036 * s, 0.028 * s, M.steel, ax), 0, y(0.176), 0));
  g.add(at(threaded(0.028 * s, 0.05 * s), 0, y(0.215), 0));
  return g;
}

// worm shaft with a helical thread along x
function worm(len, r, pitch, mat = M.steel) {
  const g = group(cyl(r * 0.55, len * 1.6, mat, 'x', 24));
  const turns = len / pitch, pts = [];
  for (let i = 0; i <= turns * 24; i++) {
    const a = i / 24 * Math.PI * 2;
    pts.push(new THREE.Vector3(-len / 2 + i / 24 * pitch, Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8));
  }
  g.add(shadowed(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.round(turns * 48), r * 0.28, 8), mat)));
  return g;
}
// spur / worm wheel with teeth, axis along `axis`
function gearWheel(r, w, teeth, mat = M.brass, axis = 'z') {
  const g = new THREE.Group();
  const core = cyl(r * 0.94, w, mat, 'y', 48); g.add(core);
  for (let i = 0; i < teeth; i++) {
    const a = i / teeth * Math.PI * 2, t = box(r * 0.12, w, r * 0.09, mat, 0.002);
    t.position.set(Math.cos(a) * r * 0.97, 0, Math.sin(a) * r * 0.97); t.rotation.y = -a; g.add(t);
  }
  g.add(cyl(r * 0.25, w * 1.4, M.steelDark, 'y', 24));
  if (axis === 'x') g.rotation.z = -Math.PI / 2;
  if (axis === 'z') g.rotation.x = Math.PI / 2;
  return g;
}
// tapered roller bearing (outer race, rollers ring, inner race), axis along x
function bearing(r, w) {
  return group(cyl(r, w, M.steel, 'x', 40), at(new THREE.Mesh(new THREE.TorusGeometry(r * 0.78, w * 0.32, 10, 28), M.steelDark), 0, 0, 0).rotateY(Math.PI / 2),
    cyl(r * 0.55, w * 1.1, M.steel, 'x', 32));
}
const ball = (r, mat = M.steelDark) => shadowed(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat));

// connecting rod drawn along +z from the big end (origin) to the small end (z = L), crank axis along x
function conrod(L, rb, rs, w, mat = M.steelDark) {
  return group(cyl(rb, w, mat, 'x', 32), at(cyl(rb * 0.55, w * 1.05, M.bolt, 'x', 20), 0, 0, 0),
    at(box(w * 0.55, rb * 0.75, L - rb, mat, 0.006), 0, 0, L / 2), at(cyl(rs, w * 0.9, mat, 'x', 24), 0, 0, L));
}
const deriv = (f, a, h = 1e-3) => (f(a + h) - f(a - h)) / (2 * h);   // d(position)/d(crank angle), metres per radian
// slider-crank: crank axis along x at (cy, cz), crank angle a, radius r, rod L, slide line at height ay pointing +z
function sliderCrank(cy, cz, a, r, L, ay) {
  const py = cy + r * Math.cos(a), pz = cz + r * Math.sin(a);
  const dy = ay - py, sz = pz + Math.sqrt(Math.max(1e-6, L * L - dy * dy));
  return { py, pz, sz, beta: Math.atan2(-dy, sz - pz) };
}

// ---- process piping, instruments and accessories
const NICE = [10, 16, 25, 40, 60, 100, 160, 250, 400, 600, 1000, 1600];
export const niceGaugeMax = p => NICE.find(n => n >= p * 1.5) || 1600;
// dial face drawn on a canvas so the scale can be re-ranged to suit the selected pressure
function dialCanvas(max) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d'), cx = 256, cy = 256;
  g.fillStyle = '#fbfbf8'; g.beginPath(); g.arc(cx, cy, 250, 0, Math.PI * 2); g.fill();
  const ang = f => (225 - f * 270) * Math.PI / 180;
  // red band above 80 % of scale
  g.strokeStyle = '#d8232a'; g.lineWidth = 16; g.beginPath(); g.arc(cx, cy, 196, -ang(0.8), -ang(1)); g.stroke();
  g.strokeStyle = '#1d1d1f';
  for (let i = 0; i <= 50; i++) {
    const a = ang(i / 50), major = i % 5 === 0, r0 = major ? 168 : 184;
    g.lineWidth = major ? 5 : 2;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy - Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * 206, cy - Math.sin(a) * 206); g.stroke();
    if (major) {
      g.fillStyle = '#1d1d1f'; g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(Math.round(max * i / 50)), cx + Math.cos(a) * 132, cy - Math.sin(a) * 132);
    }
  }
  g.fillStyle = '#1d1d1f'; g.font = '600 30px Arial'; g.fillText('kg/cm²', cx, cy + 92);
  g.fillStyle = '#d8232a'; g.font = 'italic 900 30px Arial'; g.fillText('UDAY', cx, cy - 70);
  return c;
}
// pressure gauge facing +z; returns { obj, needle, setMax(m) }
function pressureGauge(r = 0.09, max = 100) {
  const canvas = dialCanvas(max), tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const obj = group(cyl(r * 1.08, 0.045, M.steelDark, 'z', 56),
    at(new THREE.Mesh(new THREE.CircleGeometry(r, 64), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })), 0, 0, 0.0235),
    at(new THREE.Mesh(new THREE.TorusGeometry(r * 1.04, r * 0.07, 10, 64), M.steel), 0, 0, 0.026),
    at(new THREE.Mesh(new THREE.CircleGeometry(r * 1.01, 64), M.glass), 0, 0, 0.034),
    at(cyl(r * 0.18, 0.05, M.brass, 'y', 6), 0, -r * 1.2, -0.005), at(cyl(r * 0.12, 0.05, M.brass), 0, -r * 1.45, -0.005));
  const needle = group(at(box(r * 0.82, r * 0.05, 0.003, M.red, 0.001), r * 0.33, 0, 0), at(cyl(r * 0.09, 0.008, M.black, 'z', 16), 0, 0, 0));
  needle.position.z = 0.028; obj.add(needle);
  return { obj, needle, max, setMax(m) { if (m === this.max) return; this.max = m; const c2 = dialCanvas(m); canvas.getContext('2d').clearRect(0, 0, 512, 512); canvas.getContext('2d').drawImage(c2, 0, 0); tex.needsUpdate = true; },
    set(v) { const f = Math.min(1.02, Math.max(0, v / this.max)); needle.rotation.z = (225 - f * 270) * Math.PI / 180; } };
}
// straight pipe runs between points, with elbows at the bends
function pipeRun(pts, r, mat = M.zinc) {
  const g = new THREE.Group(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = new THREE.Vector3(...pts[i]), b = new THREE.Vector3(...pts[i + 1]), d = b.clone().sub(a);
    const m = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 24), mat));
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(up, d.normalize()); g.add(m);
    if (i > 0) g.add(at(ball(r * 1.12, mat), ...pts[i]));
  }
  return g;
}
// pipe flange facing along `axis`
const pipeFlange = (r, axis) => group(cyl(r, 0.022, M.steel, axis, 40), at(boltCircle(4, r * 0.72, r * 0.11, 0.012, axis.replace('-', '') === axis ? axis : axis, Math.PI / 4), 0, 0, 0));
// spring-loaded relief valve (brass body, cap and outlet), inlet along -y
function reliefValve(s = 1) {
  const g = group(cyl(0.026 * s, 0.07 * s, M.brass, 'y', 32), at(hex(0.032 * s, 0.025 * s, M.brass), 0, 0.045 * s, 0),
    at(cyl(0.018 * s, 0.06 * s, M.brass), 0, 0.085 * s, 0), at(cyl(0.022 * s, 0.012 * s, M.red, 'y', 6), 0, 0.12 * s, 0),
    at(cyl(0.012 * s, 0.07 * s, M.brass, 'x'), 0.045 * s, 0.01 * s, 0));
  return g;
}
// hydro-pneumatic pulsation dampener: bottle with domed ends on a stub
function dampener(s = 1) {
  const bottle = new THREE.Mesh(new THREE.CapsuleGeometry(0.05 * s, 0.14 * s, 10, 32), M.steel); shadowed(bottle);
  return group(at(cyl(0.012 * s, 0.05 * s, M.zinc), 0, 0.025 * s, 0), at(hex(0.024 * s, 0.022 * s, M.zinc), 0, 0.05 * s, 0), at(bottle, 0, 0.16 * s, 0),
    at(cyl(0.008 * s, 0.03 * s, M.steelDark), 0, 0.27 * s, 0), at(box(0.06 * s, 0.03 * s, 0.002, M.white, 0.001), 0, 0.16 * s, 0.052 * s));
}
// Y-type suction strainer along x
function yStrainer(r) {
  const leg = cyl(r * 0.9, r * 3.2, M.steelDark, 'y', 24); leg.rotation.z = -0.7;
  return group(cyl(r * 1.15, r * 4, M.steelDark, 'x', 24), at(leg, r * 0.6, -r * 1.4, 0), at(hex(r * 0.9, r * 0.6, M.steelDark), r * 1.6, -r * 2.6, 0));
}

// ------------------------------------------------------------------ model builders
// Each returns { parts, camera, target, update(angle, stroke), strokeAdjustable }
// part meta: code (BPPL part number), shell (fades in X-ray), internal (mechanism inside a casing)
function builder() {
  const P = [];
  const add = (obj, name, explode = [0, 0, 0], label = false, labelAt, meta = {}) => { P.push({ obj, name, explode, label, labelAt, ...meta }); return obj; };
  return { P, add };
}

// UT series high-pressure triplex plunger pump (photo + power-end and liquid-end sectional drawings, part codes from the BPPL part list)
function triplexPlunger() {
  const { P, add } = builder();
  const G = paint(0x4d7a3a);
  const ax = 0.3, cy = 0.3, cz = -0.33, L = 0.3;   // plunger axis, crank axis, connecting-rod length (m)
  let R = 0.0245;                                   // crank radius = stroke / 2 (UT-5000: 49 mm stroke from the BPPL chart)
  const xs = [-0.24, 0, 0.24];

  const base = new THREE.Group();
  [-0.42, 0.42].forEach(x => base.add(at(box(0.09, 0.1, 1.15, G, 0.01), x, 0.05, -0.12)));
  [-0.62, -0.2, 0.36].forEach(z => base.add(at(box(0.84, 0.08, 0.08, G, 0.01), 0, 0.05, z)));
  base.add(at(box(0.98, 0.07, 0.14, G, 0.012), 0, 0.035, 0.6));
  [-0.42, 0.42].forEach(x => [-0.6, 0.3].forEach(z => base.add(at(hex(0.016, 0.02), x, 0.11, z), at(cyl(0.024, 0.004, M.zinc), x, 0.1, z))));
  add(base, 'Base frame', [0, -0.12, 0]);

  // crankcase casting (501): body, foot flange, ribs, name plate, drain plug (505)
  const cc = new THREE.Group();
  cc.add(at(box(0.8, 0.36, 0.5, G, 0.035), 0, 0.3, -0.24));
  cc.add(at(box(0.88, 0.04, 0.58, G, 0.012), 0, 0.12, -0.24));
  [-0.2, 0.2].forEach(x => cc.add(at(box(0.03, 0.2, 0.06, G, 0.008), x, 0.22, -0.5)));
  [-0.4, 0.4].forEach(x => [-0.5, 0.02].forEach(z => cc.add(at(hex(0.016, 0.02), x, 0.15, z))));
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), plateMat);
  plate.position.set(-0.401, 0.33, -0.12); plate.rotation.y = -Math.PI / 2; cc.add(plate);
  add(cc, 'Main body (crankcase)', [0, 0, -0.08], true, [-0.42, 0.44, -0.3], { code: '501', shell: true });
  add(at(hex(0.016, 0.02, M.steel, '-z'), -0.28, 0.16, -0.495), 'Drain plug', [0, 0, -0.18], false, null, { code: '505' });

  // top cover (502) with bolts (523), lifting eye and air plug (522)
  const top = group(box(0.84, 0.03, 0.54, G, 0.01), at(boltRect(0.78, 0.48, 6, 4), 0, 0.018, 0));
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.009, 10, 32), M.steelDark); eye.position.set(0, 0.06, 0); top.add(eye);
  top.add(at(cyl(0.02, 0.03, M.steelDark), 0, 0.028, 0));
  add(at(top, 0, 0.495, -0.24), 'Top cover', [0, 0.32, 0], false, null, { code: '502', shell: true });
  add(at(group(hex(0.022, 0.03, M.steel), at(cyl(0.012, 0.03, M.steel), 0, 0.03, 0)), 0.26, 0.525, -0.38), 'Air plug', [0, 0.32, 0], false, null, { code: '522' });

  // window cover (516), gauge glass cover (517) and gauge glass (518) on the back face
  const win = group(box(0.42, 0.2, 0.022, G, 0.01));
  [[-0.18, -0.08], [0, -0.08], [0.18, -0.08], [-0.18, 0.08], [0, 0.08], [0.18, 0.08]].forEach(([x, y]) => win.add(at(hex(0.01, 0.012, M.bolt, '-z'), x, y, -0.014)));
  add(at(win, 0, 0.3, -0.5), 'Window cover', [0, 0, -0.2], false, null, { code: '516', shell: true });
  const gg = group(cyl(0.036, 0.016, M.steel, 'z'), at(cyl(0.028, 0.018, M.glass, 'z'), 0, 0, -0.004));
  const oil = cyl(0.026, 0.004, new THREE.MeshStandardMaterial({ color: 0xc28a1e, roughness: 0.2, metalness: 0.1 }), 'z'); oil.scale.y = 0.4; gg.add(at(oil, 0, -0.01, -0.014));
  add(at(gg, 0.1, 0.3, -0.518), 'Oil gauge glass', [0, 0, -0.26], true, [0.12, 0.45, -0.55], { code: '518' });

  // bearing covers (503/504) with oil seal (512)
  const brg = s => group(cyl(0.13, 0.045, G, 'x', 56), at(boltCircle(6, 0.1, 0.012, 0.014, s > 0 ? 'x' : '-x'), s * 0.028, 0, 0),
    at(cyl(0.05, 0.01, M.rubber, 'x', 32), s * 0.024, 0, 0));
  add(at(brg(-1), -0.42, cy, cz), 'Bearing cover (II)', [-0.18, 0, 0], false, null, { code: '504', shell: true });
  add(at(brg(1), 0.42, cy, cz), 'Bearing cover (I)', [0.18, 0, 0], false, null, { code: '503', shell: true });

  // ---- internals: crankshaft (506) with three throws at 120°, bearings (513), conrods (507), crossheads (508), pins (514), sleeves (510)
  const crank = new THREE.Group(), spin = new THREE.Group(); crank.add(at(spin, 0, cy, cz));
  spin.add(cyl(0.038, 0.86, M.steel, 'x', 32));
  spin.add(at(cyl(0.042, 0.2, M.steel, 'x', 32), 0.53, 0, 0), at(box(0.12, 0.012, 0.016, M.steelDark, 0.002), 0.55, 0.042, 0));
  const throws = xs.map((x, i) => {
    const pin = cyl(0.03, 0.08, M.steel, 'x', 28); spin.add(pin);
    const webs = [-1, 1].map(s => { const w = box(0.022, 0.15, 0.085, M.steelDark, 0.01); spin.add(w); return { w, s }; });
    return { x, ph: i * Math.PI * 2 / 3, pin, webs };
  });
  function layCrank() {
    throws.forEach(({ x, ph, pin, webs }) => {
      const yy = R * Math.cos(ph), zz = R * Math.sin(ph);
      pin.position.set(x, yy, zz);
      webs.forEach(({ w, s }) => { w.position.set(x + s * 0.05, yy / 2, zz / 2); w.rotation.x = ph; });
    });
  }
  layCrank();
  add(crank, 'Crank shaft', [0, 0, 0], false, null, { code: '506', internal: true });
  add(group(at(bearing(0.07, 0.04), -0.37, cy, cz), at(bearing(0.07, 0.04), 0.37, cy, cz)), 'Crank shaft bearings', [0, 0, 0], false, null, { code: '513', internal: true });
  const rods = new THREE.Group(), heads = new THREE.Group();
  const rodObjs = xs.map(x => { const r = conrod(L, 0.05, 0.03, 0.045); r.position.x = x; rods.add(r); return r; });
  const xhObjs = xs.map(x => {
    const g = group(cyl(0.058, 0.12, M.steel, 'z', 32), at(cyl(0.018, 0.12, M.bolt, 'x', 16), 0, 0, -0.03));
    g.position.x = x; heads.add(g); return g;
  });
  add(rods, 'Connecting rods (×3)', [0, 0, 0], false, null, { code: '507', internal: true });
  add(heads, 'Pistons / crossheads (×3)', [0, 0, 0], false, null, { code: '508', internal: true });

  // crosshead guide housing with sleeve nuts (509), plunger-side oil seals (511)
  const xh = group(box(0.72, 0.28, 0.2, G, 0.02), at(box(0.62, 0.02, 0.15, G, 0.008), 0, 0.15, 0), at(boltRect(0.56, 0.11, 5, 2, 0.009, 0.01), 0, 0.165, 0));
  add(at(xh, 0, ax, 0.11), 'Crosshead housing', [0, 0, 0.02], false, null, { shell: true });
  const seals = new THREE.Group();
  xs.forEach(x => { seals.add(at(hex(0.05, 0.03, M.steelDark, 'z'), x, ax, 0.225), at(cyl(0.04, 0.012, M.rubber, 'z', 24), x, ax, 0.245)); });
  add(seals, 'Sleeve nuts & oil seals', [0, 0, 0.06], false, null, { code: '509 / 511' });

  // distance piece: open frame with three windows exposing the plungers
  const dp = new THREE.Group();
  dp.add(at(box(0.76, 0.035, 0.18, G, 0.008), 0, 0.14, 0), at(box(0.76, 0.035, 0.18, G, 0.008), 0, -0.14, 0));
  [-0.36, -0.12, 0.12, 0.36].forEach(x => dp.add(at(box(0.035, 0.26, 0.035, G, 0.006), x, 0, -0.06)));
  add(at(dp, 0, ax, 0.3), 'Distance piece', [0, 0, 0.12]);

  // plungers (535): ride on the crossheads
  const pl = new THREE.Group();
  const plRods = [];
  const plObjs = xs.map(x => { const rod = cyl(0.032, 0.58, M.steel, 'z', 32); plRods.push(rod); const g = group(at(rod, 0, 0, 0.29), at(cyl(0.045, 0.03, M.steelDark, 'z', 24), 0, 0, 0.0)); g.position.set(x, ax, 0); pl.add(g); return g; });
  add(pl, 'Plungers (×3)', [0, 0, 0.26], true, [0.36, 0.43, 0.3], { code: '535' });
  // gland (531), gland nut (532), packing (533), round collar (534)
  const gl = new THREE.Group();
  xs.forEach(x => {
    gl.add(at(hex(0.065, 0.05, M.steel, '-z'), x, 0, 0));
    gl.add(at(cyl(0.05, 0.035, M.brass, 'z'), x, 0, -0.035));
    gl.add(at(cyl(0.07, 0.015, M.steelDark, 'z', 32), x, 0, 0.032));
  });
  add(at(gl, 0, ax, 0.45), 'Gland, gland nut & packing', [0, 0, 0.36], false, null, { code: '531–534' });

  // liquid end body (530) ×3 with holding flats (536) and bolts (537)
  const le = new THREE.Group();
  xs.forEach(x => {
    le.add(at(box(0.2, 0.2, 0.24, M.steel, 0.025), x, 0, 0));
    le.add(at(cyl(0.075, 0.03, M.steel, 'z', 48), x, 0, 0.13));
    le.add(at(boltCircle(4, 0.056, 0.011, 0.012, 'z', Math.PI / 4), x, 0, 0.15));
  });
  add(at(le, 0, ax, 0.6), 'Liquid end body (×3)', [0, 0, 0.5], true, [-0.45, 0.3, 0.74], { code: '530', shell: true });
  const flats = new THREE.Group();
  [-1, 1].forEach(s => { flats.add(at(box(0.8, 0.04, 0.025, G, 0.006), 0, s * 0.07, -0.135)); [-0.36, 0.36].forEach(x => flats.add(at(hex(0.015, 0.018, M.zinc, '-z'), x, s * 0.07, -0.152))); });
  add(at(flats, 0, ax, 0.6), 'Liquid end holding flats', [0, 0, 0.42], false, null, { code: '536 / 537' });

  // valves (542), seats (538–541), springs (549) sit in the headers — visible in X-ray
  const valves = new THREE.Group(), valveObjs = [];
  xs.forEach((x, i) => [1, -1].forEach(d => {
    const v = group(cyl(0.03, 0.012, M.steel, 'y', 24), at(new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 6, 20).rotateX(Math.PI / 2), M.zinc), 0, 0.02, 0),
      at(new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 6, 20).rotateX(Math.PI / 2), M.zinc), 0, 0.03, 0));
    const seat = cyl(0.036, 0.012, M.steelDark, 'y', 24);
    valves.add(at(seat, x, ax + d * 0.112, 0.6)); valves.add(at(v, x, ax + d * 0.124, 0.6));
    valveObjs.push({ v, base: ax + d * 0.124, i, d });
  }));
  add(valves, 'Valves, seats & springs', [0, 0, 0.5], false, null, { code: '538–542 / 549', internal: true });

  // discharge (544) and suction (545) headers with holding flats (546), studs (547) and nuts (548); red end flanges
  const header = (side, r) => {
    const g = group(box(0.98, 0.085, 0.2, M.steel, 0.015));
    [-0.44, -0.12, 0.12, 0.44].forEach(x => [-0.06, 0.06].forEach(z => g.add(at(hex(0.016, 0.018, M.zinc), x, 0.05, z), at(cyl(0.022, 0.004, M.zinc), x, 0.044, z))));
    g.add(at(box(0.9, 0.012, 0.03, M.steelDark, 0.003), 0, 0.048, 0));
    const fl = group(cyl(r, 0.05, M.maroon, 'x', 56), at(cyl(r * 0.45, 0.07, M.steel, 'x'), side * 0.04, 0, 0),
      at(boltCircle(6, r * 0.75, 0.011, 0.012, side > 0 ? 'x' : '-x'), side * 0.03, 0, 0), at(cyl(r * 1.02, 0.006, M.rubber, 'x', 56), -side * 0.028, 0, 0));
    g.add(at(fl, side * 0.52, 0, 0));
    return g;
  };
  add(at(header(1, 0.1), 0, ax + 0.143, 0.6), 'Discharge header', [0, 0.26, 0.5], true, [0.64, 0.56, 0.6], { code: '544', shell: true });
  const sh = header(1, 0.115); sh.rotation.z = Math.PI;
  add(at(sh, 0, ax - 0.143, 0.6), 'Suction header', [0, -0.12, 0.5], true, [-0.68, 0.1, 0.6], { code: '545', shell: true });
  const studs = new THREE.Group();
  [-0.36, -0.12, 0.12, 0.36].forEach(x => [-0.08, 0.08].forEach(z => studs.add(at(cyl(0.009, 0.38, M.zinc), x, 0, z))));
  add(at(studs, 0, ax, 0.6), 'Studs & nuts', [0, 0.12, 0.5], false, null, { code: '547 / 548' });

  // drive: V-belt pulley and oblong X-ribbed belt guard
  const pulleySpin = pulley(0.2, 0.1, 4);
  add(at(group(pulleySpin), 0.6, cy, cz), 'V-belt pulley', [0.42, 0, 0], true, [0.7, 0.56, -0.4]);
  const guard = new THREE.Group();
  const gm = shadowed(new THREE.Mesh(beltGuardGeometry(0.25, 0.2, 0.58, 0.14), G)); gm.rotation.y = Math.PI / 2; guard.add(gm);
  const rib = (len, a) => { const r = box(0.02, len, 0.025, G, 0.006); r.rotation.x = a; return r; };
  [0.62, -0.62].forEach(a => guard.add(at(rib(0.6, a), 0.085, 0, -0.29)));
  guard.add(at(rib(0.42, 0), 0.085, 0, -0.29));
  add(at(guard, 0.62, cy, cz), 'Belt guard', [0.62, 0, 0], true, [0.74, 0.62, -0.72], { shell: true });

  // process piping: discharge line with gauge, relief valve and dampener; suction line with Y-strainer
  const dG = pressureGauge(0.075, 1000), rv = reliefValve(1.1), damp = dampener(1.0);
  const disc = group(pipeRun([[0.58, ax + 0.143, 0.6], [0.98, ax + 0.143, 0.6]], 0.03), at(pipeFlange(0.065, 'x'), 0.99, ax + 0.143, 0.6),
    pipeRun([[0.72, ax + 0.143, 0.6], [0.72, 0.66, 0.6]], 0.016), at(dG.obj, 0.72, 0.63, 0.65));
  add(disc, 'Discharge line & pressure gauge', [0.2, 0.25, 0.5], true, [0.92, 0.78, 0.66], { shell: true });
  add(at(rv, 0.82, ax + 0.18, 0.6), 'Relief valve', [0.2, 0.3, 0.5], true, [0.86, 0.6, 0.6], { relief: true });
  add(at(damp, 0.9, ax + 0.17, 0.6), 'Pulsation dampener', [0.2, 0.36, 0.5], false, null, { accessory: 'dampener' });
  const suc = group(pipeRun([[-0.58, ax - 0.143, 0.6], [-1.02, ax - 0.143, 0.6]], 0.036), at(yStrainer(0.04), -0.78, ax - 0.143, 0.6),
    at(pipeFlange(0.075, 'x'), -1.03, ax - 0.143, 0.6));
  add(suc, 'Suction line & Y-strainer', [-0.2, -0.1, 0.5], true, [-0.92, 0.32, 0.62], { shell: true });

  const yS = ax - 0.143, yD = ax + 0.143;
  const flows = [];
  // liquid passages: common suction/discharge mains carry the summed flow, branches carry each cylinder's flow
  flows.push({ kind: 'suctionMain', r: 0.03, pts: [[-1.02, yS, 0.6], [0.3, yS, 0.6]] });
  flows.push({ kind: 'dischargeMain', r: 0.026, pts: [[-0.3, yD, 0.6], [0.98, yD, 0.6]] });
  xs.forEach((x, i) => {
    flows.push({ kind: 'suction', cyl: i, r: 0.022, pts: [[x, yS + 0.02, 0.6], [x, ax - 0.02, 0.6]] });
    flows.push({ kind: 'chamber', cyl: i, r: 0.034, pts: [[x, ax, 0.52], [x, ax, 0.69]] });
    flows.push({ kind: 'discharge', cyl: i, r: 0.02, pts: [[x, ax + 0.02, 0.6], [x, yD - 0.02, 0.6]] });
  });
  flows.push({ kind: 'relief', r: 0.012, pts: [[0.82, yD, 0.6], [0.82, yD + 0.12, 0.6], [0.95, yD + 0.12, 0.6], [0.95, 0.04, 0.6]] });
  const plungerPos = (a, i) => sliderCrank(cy, cz, a + i * Math.PI * 2 / 3, R, L, ax).sz;
  const velocity = a => xs.map((x, i) => deriv(t => plungerPos(t, i), a));   // m/rad, + = towards the liquid end (discharge)
  function setGeom({ stroke, d } = {}) {
    if (stroke) { R = Math.min(0.09, Math.max(0.008, stroke / 2)); layCrank(); }
    if (d) plRods.forEach(r => { const k = Math.min(0.05, d / 2) / 0.032; r.scale.set(k, 1, k); });
  }

  function update(a) {
    spin.rotation.x = a; pulleySpin.rotation.x = a;
    xs.forEach((x, i) => {
      const k = sliderCrank(cy, cz, a + i * Math.PI * 2 / 3, R, L, ax);
      rodObjs[i].position.set(x, k.py, k.pz); rodObjs[i].rotation.x = k.beta;
      xhObjs[i].position.set(x, ax, k.sz + 0.03);
      plObjs[i].position.z = k.sz + 0.08;
      const v = Math.sign(deriv(t => plungerPos(t, i), a));  // discharge stroke when the plunger moves forward
      valveObjs.filter(o => o.i === i).forEach(o => { o.v.position.y = o.base + 0.012 * Math.max(0, o.d > 0 ? v : -v); });
    });
  }
  return { parts: P, update, velocity, setGeom, cylinders: 3, flows, gauges: [dG], camera: [2.1, 1.3, 1.95], target: [0.0, 0.3, 0.1], rpm: 300, driveRatio: 1440 / 300 };
}

// BPPL metering pump: motor on pedestal, coupling, worm + worm wheel, polar crank, plunger liquid head with ball valves
function meteringPump() {
  const { P, add } = builder();
  const G = paint(0x3f7f2f);
  const ay = 0.27, wx = 0.1, wy = 0.32, Lr = 0.16;   // plunger axis, worm-wheel centre, rod length (m)
  let Emax = 0.02, wormRatio = 14.4;                  // max eccentricity = stroke/2 (BPPL 2250: 40 mm); worm ratio motor:crank

  const ped = group(box(0.56, 0.12, 0.28, G, 0.03), at(box(0.62, 0.025, 0.34, G, 0.01), 0, -0.05, 0));
  [-0.22, 0.22].forEach(x => [-0.13, 0.13].forEach(z => ped.add(at(hex(0.013, 0.016), x, 0.065, z))));
  add(at(ped, -0.38, 0.06, 0), 'Motor pedestal', [0, -0.1, 0]);
  add(at(motor(0.36, 0.105), -0.43, 0.23, 0), 'Electric motor', [-0.32, 0, 0], true, [-0.5, 0.44, 0]);
  add(at(group(cyl(0.1, 0.18, M.beige, 'x', 48), at(cyl(0.104, 0.012, M.beige, 'x', 48), 0.085, 0, 0)), -0.14, 0.23, 0),
    'Coupling guard', [-0.16, 0.14, 0], true, [-0.16, 0.38, 0.1], { shell: true });
  const cpl = group(cyl(0.045, 0.04, M.steelDark, 'x', 32), at(cyl(0.045, 0.04, M.steelDark, 'x', 32), 0.06, 0, 0), at(cyl(0.04, 0.02, M.rubber, 'x', 6), 0.03, 0, 0));
  const cplSpin = group(cpl); cpl.position.x = -0.03;
  add(at(cplSpin, -0.14, 0.23, 0), 'Flexible coupling', [-0.16, 0, 0], false, null, { internal: true });

  // gearbox casting
  const gb = new THREE.Group();
  gb.add(at(box(0.32, 0.34, 0.46, G, 0.03), 0, 0.23, -0.02));
  gb.add(at(box(0.32, 0.09, 0.26, G, 0.02), 0, 0.44, -0.12));
  [-0.18, 0.15].forEach(z => gb.add(at(box(0.38, 0.06, 0.08, G, 0.01), 0, 0.03, z), at(hex(0.014, 0.018), -0.16, 0.07, z), at(hex(0.014, 0.018), 0.16, 0.07, z)));
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.085), decal(udayTex)); logo.position.set(-0.02, 0.24, 0.212); gb.add(logo);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), plateMat); plate.position.set(-0.02, 0.34, 0.212); gb.add(plate);
  gb.add(at(box(0.012, 0.07, 0.09, M.black, 0.006), 0.162, 0.33, 0.08));
  add(at(gb, 0.12, 0, 0), 'Worm gearbox casing', [0, 0, 0], true, [0.0, 0.3, 0.26], { shell: true });
  add(at(group(hex(0.024, 0.03, M.steel), at(cyl(0.01, 0.025, M.steel), 0, 0.03, 0)), 0.17, 0.495, -0.03), 'Oil filler / breather', [0, 0.18, 0]);
  add(at(group(hex(0.016, 0.02, M.steel, '-z')), 0.2, 0.08, -0.255), 'Drain plug', [0, 0, -0.1]);

  // internals: worm on the motor axis, worm wheel, polar-crank plate, connecting rod, crosshead
  const wormSpin = worm(0.16, 0.032, 0.02);
  add(at(group(wormSpin), 0.1, 0.23, 0), 'Worm shaft', [0, 0, 0], false, null, { internal: true });
  const wheelSpin = gearWheel(0.06, 0.03, 30, M.brass, 'z');
  const crankPlate = group(cyl(0.05, 0.012, M.steel, 'z', 40));
  const pin = at(cyl(0.012, 0.03, M.steelDark, 'z', 20), 0, 0, 0.02); crankPlate.add(pin);
  const wheelGrp = group(wheelSpin, at(crankPlate, 0, 0, 0.022));
  add(at(wheelGrp, wx, wy, 0), 'Worm wheel & polar crank', [0, 0, 0], false, null, { internal: true });
  const rodG = new THREE.Group(); const rod = conrod(Lr, 0.022, 0.016, 0.02); rod.rotation.y = Math.PI / 2; rodG.add(rod);
  const xhead = group(cyl(0.035, 0.07, M.steel, 'x', 28));
  add(group(rodG), 'Connecting rod', [0, 0, 0], false, null, { internal: true });
  add(group(xhead), 'Crosshead', [0, 0, 0], false, null, { internal: true });

  // micrometer stroke knob (rotates with the stroke setting)
  const dial = group(at(cyl(0.05, 0.025, M.black, 'y', 48), 0, 0.03, 0), at(cyl(0.042, 0.004, M.white, 'y', 48), 0, 0.044, 0),
    at(box(0.03, 0.003, 0.004, M.red, 0.001), 0.02, 0.047, 0));
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, t = box(0.008, 0.002, 0.002, M.black, 0.0005); t.position.set(Math.cos(a) * 0.036, 0.047, Math.sin(a) * 0.036); t.rotation.y = -a; dial.add(t); }
  const knob = group(cyl(0.035, 0.04, M.steelDark), dial);
  const lever = group(at(cyl(0.006, 0.13, M.steel, 'x'), 0, 0, 0), at(ball(0.014, M.black), 0.07, 0, 0));
  lever.position.set(0, 0.02, 0); lever.rotation.y = 0.6; knob.add(lever);
  add(at(knob, 0.06, 0.505, -0.18), 'Stroke-length knob (0–100%)', [0, 0.18, 0], true, [0.06, 0.64, -0.18]);

  // crosshead nose with gland nut
  add(at(group(cyl(0.07, 0.07, G, 'x', 40), at(hex(0.055, 0.035, M.steel, 'x'), 0.05, 0, 0), at(cyl(0.045, 0.01, M.brass, 'x', 24), 0.07, 0, 0)), 0.31, ay, 0.02),
    'Crosshead nose & gland', [0.1, 0, 0]);
  const plRod = cyl(0.016, 0.12, M.steel, 'x', 24), plunger = group(plRod);
  add(group(plunger), 'Plunger', [0.2, 0, 0], false, null, { internal: true });

  // liquid head with ball check valves
  const head = new THREE.Group();
  head.add(box(0.11, 0.13, 0.13, M.steel, 0.012));
  [-1, 1].forEach(a => [-1, 1].forEach(b => head.add(at(hex(0.012, 0.016, M.zinc, 'x'), 0.06, a * 0.045, b * 0.045))));
  for (const d of [1, -1]) {
    head.add(at(cyl(0.04, 0.06, M.steel), 0, d * 0.095, 0));
    head.add(at(hex(0.05, 0.035, M.steel, d > 0 ? 'y' : '-y'), 0, d * 0.14, 0));
    const cone = cyl(0.03, 0.03, M.steel, 'y', 6, 0.012); if (d < 0) cone.rotation.x = Math.PI;
    head.add(at(cone, 0, d * 0.175, 0));
    head.add(at(threaded(0.014, 0.04), 0, d * 0.205, 0));
  }
  add(at(head, 0.41, ay, 0.02), 'Plunger liquid head', [0.26, 0, 0], true, [0.57, 0.3, 0.02], { shell: true });
  const balls = new THREE.Group(), bD = ball(0.016, M.steelDark), bS = ball(0.016, M.steelDark);
  balls.add(at(cyl(0.022, 0.008, M.steel, 'y', 24), 0, 0.08, 0), at(cyl(0.022, 0.008, M.steel, 'y', 24), 0, -0.09, 0), bD, bS);
  add(at(balls, 0.41, ay, 0.02), 'Ball check valves', [0.26, 0, 0], false, null, { internal: true });

  const mG = pressureGauge(0.06, 100);
  const mdisc = group(pipeRun([[0.41, ay + 0.225, 0.02], [0.41, 0.62, 0.02], [0.78, 0.62, 0.02]], 0.014), at(pipeFlange(0.03, 'x'), 0.79, 0.62, 0.02),
    pipeRun([[0.52, 0.62, 0.02], [0.52, 0.62, 0.09]], 0.009), at(mG.obj, 0.52, 0.62, 0.11));
  add(mdisc, 'Discharge line & pressure gauge', [0.3, 0.2, 0], true, [0.66, 0.78, 0.12], { shell: true });
  add(at(reliefValve(0.75), 0.6, 0.645, 0.02), 'Relief valve', [0.3, 0.3, 0], true, [0.62, 0.86, 0.02], { relief: true });
  add(at(dampener(0.7), 0.7, 0.632, 0.02), 'Pulsation dampener', [0.3, 0.34, 0], false, null, { accessory: 'dampener' });
  const msuc = group(pipeRun([[0.41, ay - 0.225, 0.02], [0.41, 0.03, 0.02], [0.8, 0.03, 0.02]], 0.015), at(pipeFlange(0.03, 'x'), 0.81, 0.03, 0.02));
  add(msuc, 'Suction line', [0.3, -0.05, 0], false, null, { shell: true });
  const flows = [
    { kind: 'suction', cyl: 0, r: 0.011, pts: [[0.8, 0.03, 0.02], [0.41, 0.03, 0.02], [0.41, ay - 0.03, 0.02]] },
    { kind: 'chamber', cyl: 0, r: 0.022, pts: [[0.36, ay, 0.02], [0.46, ay, 0.02]] },
    { kind: 'discharge', cyl: 0, r: 0.011, pts: [[0.41, ay + 0.03, 0.02], [0.41, 0.62, 0.02], [0.78, 0.62, 0.02]] },
    { kind: 'relief', r: 0.008, pts: [[0.6, 0.62, 0.02], [0.6, 0.76, 0.02], [0.92, 0.76, 0.02]] }];
  let strokeNow = 1;
  const plungerPos = a => { const e = Emax * strokeNow, py = wy + e * Math.sin(a), px = wx + e * Math.cos(a), dy = ay - py; return px + Math.sqrt(Math.max(1e-6, Lr * Lr - dy * dy)); };
  const velocity = a => [-deriv(plungerPos, a)];   // m/rad; plunger enters the head while the slider retracts here
  function setGeom({ stroke, d, ratio } = {}) {
    if (stroke) Emax = Math.min(0.045, Math.max(0.008, stroke / 2));
    if (d) { const k = Math.min(0.032, d / 2) / 0.016; plRod.scale.set(k, 1, k); }
    if (ratio) wormRatio = ratio;
  }

  function update(a, stroke) {
    strokeNow = stroke;
    const e = Emax * stroke;
    wormSpin.rotation.x = a * wormRatio; cplSpin.rotation.x = a * wormRatio;
    wheelSpin.rotation.y = a; crankPlate.rotation.z = a;
    pin.position.set(e, 0, 0.02);
    const py = wy + e * Math.sin(a), px = wx + e * Math.cos(a);
    const dy = ay - py, sx = px + Math.sqrt(Math.max(1e-6, Lr * Lr - dy * dy));
    rodG.position.set(px, py, 0.04); rodG.rotation.z = Math.atan2(dy, sx - px);
    xhead.position.set(sx + 0.03, ay, 0.04);
    plunger.position.set(sx + 0.11, ay, 0.02);
    dial.rotation.y = -stroke * Math.PI * 1.6;
    const v = -deriv(plungerPos, a);               // + when the plunger moves into the head (discharge)
    bD.position.set(0, 0.095 + 0.012 * Math.max(0, v), 0); bS.position.set(0, -0.075 + 0.012 * Math.max(0, -v), 0);
  }
  return { parts: P, update, velocity, setGeom, cylinders: 1, flows, gauges: [mG], strokeAdjustable: true, rpm: 100, camera: [1.05, 0.95, 1.5], target: [0.12, 0.33, 0],
    extraLabels: [['Discharge valve', [0.41, 0.52, 0.02]], ['Suction valve', [0.41, 0.04, 0.02]]], extraOwner: 'Plunger liquid head' };
}

// Triplex metering pump (from the UDAY 3D render): crankshaft with 3 throws, gear reduction, three plunger heads
function triplexMetering() {
  const { P, add } = builder();
  const G = paint(0x1f8a35);
  const H = 0.36, ccz = -0.12, Lr = 0.24, xs = [-0.3, 0, 0.3];
  let Rmax = 0.02, gearRatio = 14.4, strokeNow = 1;   // crank radius = stroke/2 (BPPL 2250: 40 mm)

  const gb = new THREE.Group();
  gb.add(at(box(1.0, 0.48, 0.56, G, 0.03), 0, 0.3, 0));
  gb.add(at(box(1.04, 0.05, 0.6, G, 0.015), 0, 0.085, 0));
  [-0.42, 0.42].forEach(x => [-0.24, 0.24].forEach(z => gb.add(at(box(0.16, 0.06, 0.12, G, 0.01), x, 0.03, z), at(hex(0.016, 0.02), x, 0.07, z))));
  gb.add(at(hex(0.04, 0.03, M.zinc, 'x'), 0.505, 0.3, 0.14), at(cyl(0.026, 0.035, M.glass, 'x'), 0.51, 0.3, 0.14));
  gb.add(at(cyl(0.15, 0.03, G, 'x', 56), 0.51, H, ccz), at(boltCircle(4, 0.12, 0.013, 0.014, 'x', Math.PI / 4), 0.53, H, ccz));
  gb.add(at(cyl(0.15, 0.03, G, 'x', 56), -0.51, H, ccz), at(boltCircle(4, 0.12, 0.013, 0.014, '-x', Math.PI / 4), -0.53, H, ccz));
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.13), decal(udayTex)); logo.position.set(0, 0.32, -0.282); logo.rotation.y = Math.PI; gb.add(logo);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.07), plateMat); plate.position.set(-0.3, 0.32, -0.282); plate.rotation.y = Math.PI; gb.add(plate);
  add(gb, 'Common gearbox casing', [0, 0, -0.06], true, [-0.3, 0.36, -0.32], { shell: true });

  const top = group(box(0.94, 0.03, 0.5, G, 0.01), at(boltRect(0.88, 0.44, 7, 4, 0.011, 0.01), 0, 0.017, 0), at(cyl(0.07, 0.02, G, 'y', 40), 0, 0.025, 0));
  add(at(top, 0, 0.555, 0), 'Top cover', [0, 0.28, 0], false, null, { shell: true });
  add(at(group(cyl(0.045, 0.025, M.white, 'y', 40), at(cyl(0.012, 0.02, M.white), 0, 0.02, 0)), 0, 0.595, 0), 'Oil filler cap', [0, 0.34, 0]);

  const adj = group(cyl(0.05, 0.05, M.yellow, 'x', 40), at(cyl(0.04, 0.09, M.white, 'x', 40), 0.07, 0, 0), at(boltCircle(3, 0.04, 0.008, 0.01, 'x'), 0.026, 0, 0));
  const tommy = at(cyl(0.006, 0.12, M.steel), 0.1, 0, 0); adj.add(tommy);
  add(at(adj, 0.53, 0.47, 0.17), 'Stroke adjuster', [0.18, 0, 0], true, [0.7, 0.56, 0.17]);

  add(at(group(cyl(0.13, 0.08, G, 'x', 56), at(boltCircle(6, 0.11, 0.011, 0.012, 'x'), 0.042, 0, 0)), 0.54, 0.24, ccz), 'Motor flange', [0.2, 0, 0]);
  add(at(motor(0.46, 0.13), 0.84, 0.24, ccz), 'Electric motor', [0.38, 0, 0], true, [0.92, 0.47, ccz]);

  // internals: pinion on the motor shaft, bull gear on the crankshaft, 3-throw crankshaft, rods, crossheads, plungers
  const pinion = gearWheel(0.035, 0.05, 12, M.steel, 'x'), bull = gearWheel(0.085, 0.05, 32, M.brass, 'x');
  add(at(group(pinion), 0.4, 0.24, ccz), 'Pinion', [0, 0, 0], false, null, { internal: true });
  const cspin = new THREE.Group(), crank = group(at(cspin, 0, H, ccz));
  cspin.add(cyl(0.028, 0.9, M.steel, 'x', 28), at(bull, 0.4, 0, 0));
  const pins = xs.map(x => { const p = cyl(0.022, 0.06, M.steel, 'x', 24); cspin.add(p); return { p, x }; });
  const webs = xs.map(x => [-1, 1].map(s => { const w = box(0.018, 0.1, 0.07, M.steelDark, 0.008); cspin.add(w); return { w, x, s }; })).flat();
  add(crank, 'Crankshaft & bull gear', [0, 0, 0], false, null, { internal: true });
  const rods = new THREE.Group(), xhs = new THREE.Group(), pls = new THREE.Group();
  const rodObjs = xs.map(x => { const r = conrod(Lr, 0.035, 0.02, 0.035); r.position.x = x; rods.add(r); return r; });
  const xhObjs = xs.map(x => { const g = group(cyl(0.045, 0.09, M.steel, 'z', 28)); g.position.x = x; xhs.add(g); return g; });
  const tmRods = [];
  const plObjs = xs.map(x => { const rod = cyl(0.016, 0.3, M.steel, 'z', 24); tmRods.push(rod); const g = group(at(rod, 0, 0, 0.15)); g.position.set(x, H, 0); pls.add(g); return g; });
  add(rods, 'Connecting rods (×3)', [0, 0, 0], false, null, { internal: true });
  add(xhs, 'Crossheads (×3)', [0, 0, 0], false, null, { internal: true });
  add(pls, 'Plungers (×3)', [0, 0, 0.34], false, null, { internal: true });

  const houses = new THREE.Group(), heads = new THREE.Group();
  xs.forEach(x => {
    houses.add(at(cyl(0.085, 0.13, G, 'z', 48), x, 0, 0));
    [-1, 1].forEach(s => { const b = box(0.02, 0.2, 0.12, G, 0.006); b.rotation.x = s * 0.5; houses.add(at(b, x + s * 0.07, s * 0.06, -0.02)); });
    houses.add(at(hex(0.06, 0.04, M.steel, 'z'), x, 0, 0.085), at(cyl(0.045, 0.012, M.brass, 'z', 24), x, 0, 0.108));
    const h = new THREE.Group();
    h.add(box(0.17, 0.17, 0.16, M.steel, 0.012));
    [-1, 1].forEach(a => [-1, 1].forEach(b => h.add(at(hex(0.012, 0.016, M.zinc, 'z'), a * 0.06, b * 0.06, 0.085))));
    h.add(at(valveStack(1), 0, 0.085, 0), at(valveStack(-1), 0, -0.085, 0));
    heads.add(at(h, x, 0, 0));
  });
  add(at(houses, 0, H, 0.34), 'Crosshead housings & glands', [0, 0, 0.1], false, null, { shell: true });
  add(at(heads, 0, H, 0.5), 'Liquid heads (×3)', [0, 0, 0.34], true, [0.47, 0.32, 0.62], { shell: true });

  const tG = pressureGauge(0.07, 100);
  const top_ = H + 0.325, bot_ = H - 0.325;
  const tdisc = group(pipeRun([[-0.42, top_ + 0.05, 0.5], [1.0, top_ + 0.05, 0.5]], 0.022), at(pipeFlange(0.045, 'x'), 1.01, top_ + 0.05, 0.5),
    ...xs.map(x => pipeRun([[x, top_, 0.5], [x, top_ + 0.05, 0.5]], 0.018)), pipeRun([[0.55, top_ + 0.05, 0.5], [0.55, top_ + 0.05, 0.6]], 0.01),
    at(tG.obj, 0.55, top_ + 0.05, 0.63));
  add(tdisc, 'Discharge manifold & gauge', [0, 0.2, 0.34], true, [0.85, top_ + 0.2, 0.6], { shell: true });
  add(at(reliefValve(0.9), 0.7, top_ + 0.075, 0.5), 'Relief valve', [0, 0.3, 0.34], true, [0.74, top_ + 0.26, 0.5], { relief: true });
  add(at(dampener(0.85), 0.85, top_ + 0.07, 0.5), 'Pulsation dampener', [0, 0.34, 0.34], false, null, { accessory: 'dampener' });
  const tsuc = group(pipeRun([[-0.45, bot_ - 0.01, 0.5], [0.45, bot_ - 0.01, 0.5]], 0.024), at(pipeFlange(0.05, 'x'), -0.46, bot_ - 0.01, 0.5));
  add(tsuc, 'Suction manifold', [0, -0.03, 0.34], false, null, { shell: true });
  const flows = [
    { kind: 'suctionMain', r: 0.018, pts: [[-0.45, bot_ - 0.01, 0.5], [0.45, bot_ - 0.01, 0.5]] },
    { kind: 'dischargeMain', r: 0.017, pts: [[-0.42, top_ + 0.05, 0.5], [1.0, top_ + 0.05, 0.5]] }];
  xs.forEach((x, i) => {
    flows.push({ kind: 'suction', cyl: i, r: 0.013, pts: [[x, bot_ + 0.01, 0.5], [x, H - 0.03, 0.5]] });
    flows.push({ kind: 'chamber', cyl: i, r: 0.024, pts: [[x, H, 0.44], [x, H, 0.56]] });
    flows.push({ kind: 'discharge', cyl: i, r: 0.013, pts: [[x, H + 0.03, 0.5], [x, top_ + 0.03, 0.5]] });
  });
  flows.push({ kind: 'relief', r: 0.009, pts: [[0.7, top_ + 0.05, 0.5], [0.7, top_ + 0.2, 0.5], [1.1, top_ + 0.2, 0.5]] });
  const plungerPos = (a, i) => sliderCrank(H, ccz, a + i * Math.PI * 2 / 3, Math.max(0.0005, Rmax * strokeNow), Lr, H).sz;
  const velocity = a => xs.map((x, i) => deriv(t => plungerPos(t, i), a));
  function setGeom({ stroke, d, ratio } = {}) {
    if (stroke) Rmax = Math.min(0.045, Math.max(0.008, stroke / 2));
    if (d) tmRods.forEach(r => { const k = Math.min(0.03, d / 2) / 0.016; r.scale.set(k, 1, k); });
    if (ratio) gearRatio = ratio;
  }

  function update(a, stroke) {
    strokeNow = stroke;
    const r = Math.max(0.0005, Rmax * stroke);
    cspin.rotation.x = a; pinion.rotation.x = -a * gearRatio;
    tommy.rotation.x = stroke * Math.PI;
    pins.forEach(({ p, x }, i) => { const ph = i * Math.PI * 2 / 3; p.position.set(x, r * Math.cos(ph), r * Math.sin(ph)); });
    webs.forEach(({ w, x, s }) => { const i = xs.indexOf(x), ph = i * Math.PI * 2 / 3; w.position.set(x + s * 0.04, r * Math.cos(ph) / 2, r * Math.sin(ph) / 2); w.rotation.x = ph; });
    xs.forEach((x, i) => {
      const k = sliderCrank(H, ccz, a + i * Math.PI * 2 / 3, r, Lr, H);
      rodObjs[i].position.set(x, k.py, k.pz); rodObjs[i].rotation.x = k.beta;
      xhObjs[i].position.set(x, H, k.sz + 0.03);
      plObjs[i].position.z = k.sz + 0.07;
    });
  }
  return { parts: P, update, velocity, setGeom, cylinders: 3, flows, gauges: [tG], strokeAdjustable: true, rpm: 100, camera: [1.7, 1.15, 2.05], target: [0.2, 0.36, 0.15],
    extraLabels: [['Discharge valve & port', [-0.3, 0.76, 0.5]], ['Suction valve & port', [-0.3, -0.06, 0.5]]], extraOwner: 'Liquid heads (×3)' };
}

// Well Test UFF-30 motorised hydraulic test pump (UFF-30 dimension sheet + photo)
function testPump() {
  const { P, add } = builder();
  const G = paint(0x5a8a52);
  const px = -0.15, py = 0.3, pz = -0.24, mx = 0.3, my = 0.2, r1 = 0.2, r2 = 0.065; // pump & motor pulley centres
  const base = group(box(1.02, 0.05, 0.46, M.frame, 0.008));
  [-0.44, 0.44].forEach(x => [-0.18, 0.18].forEach(z => base.add(at(cyl(0.03, 0.05, M.rubber), x, -0.045, z), at(hex(0.014, 0.016), x, 0.03, z))));
  add(at(base, 0.05, 0.075, 0), 'Common base plate', [0, -0.1, 0]);

  const pump = group(box(0.3, 0.29, 0.3, G, 0.025), at(box(0.33, 0.03, 0.33, G, 0.01), 0, 0.16, 0), at(boltRect(0.28, 0.28, 3, 3, 0.009, 0.01), 0, 0.176, 0));
  const em = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), decal(emblemTex)); em.position.set(0, 0.0, 0.151); pump.add(em);
  pump.add(at(hex(0.016, 0.02, M.steel, 'z'), 0.1, -0.11, 0.15), at(cyl(0.02, 0.004, M.glass, 'z'), -0.1, -0.06, 0.152));
  [-0.12, 0.12].forEach(x => [-0.12, 0.12].forEach(z => pump.add(at(hex(0.013, 0.016), x, -0.135, z))));
  add(at(pump, px, 0.245, 0), 'Pump body (oil bath)', [0, 0, 0], true, [-0.08, 0.3, 0.2], { shell: true });
  add(at(group(hex(0.018, 0.024, M.steel), at(cyl(0.008, 0.03, M.steel), 0, 0.03, 0)), px + 0.08, 0.44, -0.08), 'Oil filler / breather', [0, 0.16, 0]);

  add(at(motor(0.32, 0.1), mx, my, 0.02), 'Electric motor', [0.32, 0, 0], true, [0.36, 0.42, 0.04]);

  // drive: pump pulley, motor pulley, V-belt (inside the guard)
  const pp = pulley(r1, 0.06, 2); pp.rotation.y = Math.PI / 2;
  const ppSpin = group(pp);
  add(at(ppSpin, px, py, pz), 'Pump pulley', [0, 0, -0.18], false, null, { internal: true });
  const mp = pulley(r2, 0.06, 2); mp.rotation.y = Math.PI / 2;   // radius re-sized to the drive ratio in setGeom
  const mpSpin = group(mp);
  add(at(mpSpin, mx, my, pz), 'Motor pulley', [0, 0, -0.18], false, null, { internal: true });
  // V-belt wrapped on both pulleys (open belt: arcs joined by the outer tangents)
  function beltGeometry(rs) {
    const d = Math.hypot(mx - px, my - py), ang = Math.atan2(my - py, mx - px), th = Math.acos((r1 - rs) / d), bp = [];
    for (let i = 0; i <= 40; i++) { const t = th + i / 40 * (2 * Math.PI - 2 * th); bp.push(new THREE.Vector3(Math.cos(t + ang) * r1, Math.sin(t + ang) * r1, 0)); }
    for (let i = 0; i <= 20; i++) { const t = -th + i / 20 * 2 * th; bp.push(new THREE.Vector3(mx - px + Math.cos(t + ang) * rs, my - py + Math.sin(t + ang) * rs, 0)); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bp, true), 160, 0.012, 8, true);
  }
  let r2now = r2;
  const belt = shadowed(new THREE.Mesh(beltGeometry(r2), M.rubber));
  add(at(group(belt), px, py, pz), 'V-belt', [0, 0, -0.18], false, null, { internal: true });
  const gm = shadowed(new THREE.Mesh(beltGuardGeometry(0.25, 0.1, Math.hypot(0.45, 0.1), 0.09), G));
  gm.rotation.z = Math.atan2(-0.1, 0.45);
  add(at(group(gm), px, py, -0.25), 'Belt guard', [0, 0, -0.34], true, [0.08, 0.6, -0.26], { shell: true });

  // internals: crank disc on the pulley shaft, connecting rod, crosshead, plunger
  const crankDisc = group(cyl(0.05, 0.02, M.steel, 'z', 32)); const cpin = at(cyl(0.01, 0.03, M.steelDark, 'z', 16), 0.02, 0, 0.02); crankDisc.add(cpin);
  add(at(group(crankDisc), px, py, 0.0), 'Crank & eccentric', [0, 0, 0], false, null, { internal: true });
  const rodG = new THREE.Group(); const rod = conrod(0.11, 0.018, 0.012, 0.016); rod.rotation.y = -Math.PI / 2; rodG.add(rod);
  const xh = group(cyl(0.028, 0.05, M.steel, 'x', 24)), plunger = group(cyl(0.012, 0.18, M.steel, 'x', 20));
  add(group(rodG), 'Connecting rod', [0, 0, 0], false, null, { internal: true });
  add(group(xh), 'Crosshead', [0, 0, 0], false, null, { internal: true });
  add(group(plunger), 'Plunger', [-0.22, 0, 0], false, null, { internal: true });

  const le = new THREE.Group();
  le.add(at(cyl(0.05, 0.08, G, 'x'), 0.05, 0, 0), at(hex(0.045, 0.03, M.steel, '-x'), 0.0, 0, 0), at(cyl(0.035, 0.01, M.brass, 'x', 20), -0.018, 0, 0));
  le.add(at(box(0.1, 0.11, 0.11, M.steel, 0.01), -0.06, 0, 0));
  for (const dd of [1, -1]) { le.add(at(cyl(0.036, 0.07, M.steel), -0.06, dd * 0.09, 0)); le.add(at(hex(0.045, 0.03, M.steel, dd > 0 ? 'y' : '-y'), -0.06, dd * 0.14, 0)); }
  [-1, 1].forEach(a => [-1, 1].forEach(b => le.add(at(cyl(0.006, 0.26, M.zinc), -0.06 + a * 0.04, 0, b * 0.04), at(hex(0.011, 0.014, M.zinc), -0.06 + a * 0.04, 0.135, b * 0.04))));
  add(at(le, -0.33, py, 0.02), 'Plunger head & valves', [-0.22, 0, 0], true, [-0.56, 0.2, 0.05], { shell: true });

  // discharge line: riser, tee, relief valve and pressure gauge (needle pulses when running)
  const line = new THREE.Group();
  line.add(at(cyl(0.013, 0.26, M.zinc), 0, 0.13, 0), at(box(0.05, 0.05, 0.05, M.zinc, 0.006), 0, 0.27, 0), at(cyl(0.013, 0.12, M.zinc, 'x'), 0.07, 0.27, 0));
  line.add(at(group(cyl(0.024, 0.07, M.brass), at(hex(0.028, 0.025, M.brass), 0, 0.045, 0), at(cyl(0.006, 0.05, M.steel), 0, 0.075, 0), at(cyl(0.02, 0.008, M.red, 'x', 6), 0, 0.1, 0)), 0.14, 0.31, 0));
  line.add(at(cyl(0.013, 0.06, M.zinc), 0, 0.32, 0), at(hex(0.022, 0.025, M.zinc), 0, 0.35, 0));
  const hG = pressureGauge(0.092, 200);
  line.add(at(hG.obj, 0, 0.47, 0));
  // outlet to the vessel under test: nipple, isolation valve and hose
  line.add(at(cyl(0.013, 0.12, M.zinc, 'z'), 0, 0.27, 0.07), at(group(cyl(0.022, 0.05, M.brass, 'z', 24), at(cyl(0.006, 0.05, M.steel), 0, 0.035, 0),
    at(box(0.06, 0.006, 0.012, M.red, 0.002), 0, 0.06, 0)), 0, 0.27, 0.15));
  const hoseCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.27, 0.17), new THREE.Vector3(0, 0.27, 0.3), new THREE.Vector3(0.05, 0.05, 0.42), new THREE.Vector3(0.25, -0.42, 0.5)]);
  line.add(shadowed(new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 40, 0.016, 12), M.rubber)));
  add(at(line, -0.39, 0.47, 0.02), 'Pressure gauge & relief valve', [0, 0.22, 0], true, [-0.16, 1.06, 0.06], { relief: true });
  const flows = [
    { kind: 'suction', cyl: 0, r: 0.011, pts: [[-0.59, 0.08, 0.02], [-0.39, 0.08, 0.02], [-0.39, py - 0.03, 0.02]] },
    { kind: 'chamber', cyl: 0, r: 0.02, pts: [[-0.44, py, 0.02], [-0.34, py, 0.02]] },
    { kind: 'discharge', cyl: 0, r: 0.01, pts: [[-0.39, py + 0.03, 0.02], [-0.39, 0.74, 0.02], [-0.39, 0.74, 0.19], [-0.39, 0.74, 0.32], [-0.34, 0.52, 0.44], [-0.14, 0.05, 0.52]] },
    { kind: 'relief', r: 0.008, pts: [[-0.39, 0.74, 0.02], [-0.25, 0.74, 0.02], [-0.25, 0.86, 0.02], [-0.18, 0.86, 0.02]] }];
  let ecc = 0.0128;   // eccentric = stroke/2: UFF-30 displaces 12.5 cm³/rev with a 25 mm plunger → ≈ 25.5 mm stroke
  const plungerPos = a => { const cx = px + ecc * Math.cos(-a), cyy = py + ecc * Math.sin(-a), dy = py - cyy; return cx - Math.sqrt(Math.max(1e-6, 0.11 * 0.11 - dy * dy)); };
  const velocity = a => [-deriv(plungerPos, a)];  // + when the plunger moves (-x) into the head
  function setGeom({ stroke, d, ratio } = {}) {
    if (stroke) ecc = Math.min(0.03, Math.max(0.006, stroke / 2));
    if (d) { const k = Math.min(0.022, d / 2) / 0.012; plunger.children[0].scale.set(k, 1, k); }
    if (ratio) {   // motor pulley sized for the pump speed: r_motor = r_pump × N_pump / N_motor
      r2now = Math.min(0.12, Math.max(0.03, r1 / ratio));
      mp.scale.set(1, r2now / r2, r2now / r2);
      belt.geometry.dispose(); belt.geometry = beltGeometry(r2now);
    }
  }
  add(at(group(cyl(0.015, 0.08, M.zinc), at(cyl(0.015, 0.2, M.zinc, 'x'), -0.1, -0.04, 0), at(hex(0.022, 0.025, M.zinc, '-x'), -0.2, -0.04, 0)), -0.39, 0.12, 0.02),
    'Suction connection', [-0.1, -0.06, 0]);

  function update(a) {
    ppSpin.rotation.z = -a; mpSpin.rotation.z = -a * (r1 / r2now); crankDisc.rotation.z = -a;
    cpin.position.x = ecc;
    const e = ecc, cx = px + e * Math.cos(-a), cyy = py + e * Math.sin(-a), L = 0.11;
    const dy = py - cyy, sx = cx - Math.sqrt(Math.max(1e-6, L * L - dy * dy));
    rodG.position.set(cx, cyy, 0.03); rodG.rotation.z = Math.atan2(-dy, cx - sx);
    xh.position.set(sx - 0.02, py, 0.02); plunger.position.set(sx - 0.13, py, 0.02);
  }
  return { parts: P, update, velocity, setGeom, cylinders: 1, flows, gauges: [hG], rpm: 400, camera: [-1.2, 1.1, 1.8], target: [-0.05, 0.52, 0.05] };
}

export const MODELS = {
  triplex: { build: triplexPlunger },
  metering: { build: meteringPump },
  'triplex-metering': { build: triplexMetering },
  'test-pump': { build: testPump },
};

// ------------------------------------------------------------------ viewer
export function createViewer(el, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);

  const labels = new CSS2DRenderer();
  labels.domElement.className = 'v3d-labels';
  el.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.03).texture;

  const sun = new THREE.DirectionalLight(0xfff6ea, 1.75);
  sun.position.set(2.2, 4.2, 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: 0.5, far: 12 });
  sun.shadow.radius = 5;
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.5); fill.position.set(-3, 2, -1.5);
  scene.add(sun, fill, new THREE.HemisphereLight(0xffffff, 0xcfd2d6, 0.35));

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.2 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, minDistance: 0.4, maxDistance: 6, maxPolarAngle: Math.PI * 0.49,
    autoRotate: true, autoRotateSpeed: 0.8, enablePan: false });

  let composer = null;
  if (opts.ao !== false) {
    try {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const ao = new GTAOPass(scene, camera, 1, 1);
      ao.updateGtaoMaterial({ radius: 0.12, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 16 });
      ao.blendIntensity = 0.85;
      composer.addPass(ao);
      composer.addPass(new OutputPass());
    } catch (e) { composer = null; }
  }

  let current = null, explodeT = 0, explodeTarget = 0, showLabels = true;
  let xray = false, running = opts.run !== false, stroke = 1, angle = 0.6, hovered = null, pinned = null;
  // operating point supplied by the page's engineering model
  //  rpm: crank speed · timeScale: 1 real time, <1 slow motion · pressure: line pressure (kg/cm²) · pmax: rated pressure
  //  bypass: fraction of flow through the relief valve · cav: cavitation severity 0..1 · area: plunger area (m²)
  //  qMean: mean pumped flow (m³/s) · color: liquid colour · damp: pulsation dampener fitted · flow: show liquid · sound
  const op = { rpm: 0, timeScale: 1, pressure: 0, pmax: 100, bypass: 0, cav: 0, area: 1.26e-3, qMean: 0, color: 0x2f7fe0, damp: false, flow: true };
  let fluid = [], bubbles = null;
  // liquid streak texture: faint density variations so moving liquid is visible inside the translucent passages
  const streak = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 32;
    const g = c.getContext('2d'); g.fillStyle = '#d7e6f5'; g.fillRect(0, 0, 256, 32);
    for (let i = 0; i < 28; i++) {
      const x = Math.random() * 256, w = 6 + Math.random() * 26, y = Math.random() * 32;
      const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(x, y - 4, w, 8 + Math.random() * 8);
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  function liquidMaterial(kind, len) {
    const map = streak.clone(); map.needsUpdate = true; map.repeat.set(Math.max(1, len / 0.06), 1);
    const relief = kind === 'relief';
    return new THREE.MeshPhysicalMaterial({ color: relief ? 0xff8a50 : op.color, map, transparent: true, opacity: kind === 'chamber' ? 0.6 : 0.72,
      roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, depthWrite: false,
      emissive: relief ? 0x8a2a00 : op.color, emissiveIntensity: 0.16 });
  }
  function buildFluid(spec) {
    fluid.forEach(f => { scene.remove(f.mesh); f.mesh.geometry.dispose(); f.mesh.material.map.dispose(); f.mesh.material.dispose(); }); fluid = [];
    if (bubbles) { scene.remove(bubbles.mesh); bubbles = null; }
    (spec.flows || []).forEach(fl => {
      const path = new THREE.CurvePath();
      for (let i = 0; i < fl.pts.length - 1; i++) path.add(new THREE.LineCurve3(new THREE.Vector3(...fl.pts[i]), new THREE.Vector3(...fl.pts[i + 1])));
      const len = path.getLength(), r = fl.r || 0.015;
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(8, Math.round(len / 0.01)), r, 18, false), liquidMaterial(fl.kind, len));
      mesh.renderOrder = 2; scene.add(mesh);
      fluid.push({ mesh, path, len, r, kind: fl.kind, cyl: fl.cyl || 0 });
    });
    // cavitation vapour bubbles live in the suction branches and pumping chambers
    const homes = fluid.filter(f => f.kind === 'suction' || f.kind === 'chamber');
    if (homes.length) {
      const n = 90, mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.85 }), n);
      mesh.renderOrder = 3; mesh.frustumCulled = false; scene.add(mesh);
      bubbles = { mesh, homes, b: Array.from({ length: n }, () => ({ h: Math.floor(Math.random() * homes.length), t: Math.random(), life: Math.random(), off: new THREE.Vector3() })) };
    }
  }
  const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
  // vel[i]: plunger velocity in m/s (+ = discharge stroke). Liquid speed in a passage = flow / passage area.
  function updateFluid(dt, vel) {
    const show = op.flow && xray && explodeT < 0.04 && !!current;
    const A = op.area, sumD = vel.reduce((s, v) => s + Math.max(0, v), 0), sumS = vel.reduce((s, v) => s + Math.max(0, -v), 0);
    fluid.forEach(f => {
      f.mesh.visible = show && (f.kind !== 'relief' || op.bypass > 0.001);
      if (!f.mesh.visible) return;
      const v = vel[f.cyl] || 0;
      const q = { suction: Math.max(0, -v), discharge: Math.max(0, v), chamber: v, suctionMain: sumS, dischargeMain: sumD }[f.kind];
      const flowQ = f.kind === 'relief' ? op.bypass * op.qMean : (q || 0) * A * (1 - (f.kind.startsWith('discharge') ? op.bypass : 0));
      const speed = flowQ / (Math.PI * f.r * f.r);                     // m/s in the passage
      const drift = (f.kind === 'chamber' ? speed : speed) * dt * op.timeScale;
      f.mesh.material.map.offset.x -= drift / 0.06;
    });
    if (!bubbles) return;
    const cav = show ? op.cav : 0;
    bubbles.mesh.visible = cav > 0.01;
    if (!bubbles.mesh.visible) return;
    const suctionPhase = vel.some(v => v < 0) ? 1 : 0.3;
    bubbles.b.forEach((b, i) => {
      b.life += dt * op.timeScale * (2 + 4 * Math.random());
      if (b.life > 1) { b.life = 0; b.h = Math.floor(Math.random() * bubbles.homes.length); b.t = Math.random(); b.off.set((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)); }
      const home = bubbles.homes[b.h];
      home.path.getPointAt(b.t, _p); _p.addScaledVector(b.off, home.r * 1.2);
      const sz = (i / bubbles.b.length < cav ? 1 : 0) * Math.min(home.r * 0.45, 0.0035 + 0.006 * Math.sin(Math.PI * b.life)) * suctionPhase;   // vapour bubbles grow, then collapse
      _m.compose(_p, _q, _s.set(sz, sz, sz)); bubbles.mesh.setMatrixAt(i, _m);
    });
    bubbles.mesh.instanceMatrix.needsUpdate = true;
  }
  function setPartVisibility() {
    if (!current) return;
    current.parts.forEach(p => { if (p.accessory === 'dampener') p.obj.visible = !!op.damp; });
  }

  // ---- sound: motor hum, valve knock on every stroke, relief-valve hiss, cavitation crackle (Web Audio, off by default)
  let audio = null, soundOn = false, lastSign = [];
  function initAudio() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const hum = ctx.createOscillator(); hum.frequency.value = 100;           // magnetic hum at twice the 50 Hz supply
    const humG = ctx.createGain(); humG.gain.value = 0; hum.connect(humG).connect(master); hum.start();
    const rot = ctx.createOscillator(); rot.type = 'sawtooth'; rot.frequency.value = 24;   // 1440 rpm shaft
    const rotF = ctx.createBiquadFilter(); rotF.type = 'lowpass'; rotF.frequency.value = 180;
    const rotG = ctx.createGain(); rotG.gain.value = 0; rot.connect(rotF).connect(rotG).connect(master); rot.start();
    const hissSrc = ctx.createBufferSource(); hissSrc.buffer = noiseBuf; hissSrc.loop = true;
    const hissF = ctx.createBiquadFilter(); hissF.type = 'highpass'; hissF.frequency.value = 2200;
    const hissG = ctx.createGain(); hissG.gain.value = 0; hissSrc.connect(hissF).connect(hissG).connect(master); hissSrc.start();
    return { ctx, master, humG, rotG, hissG, noiseBuf };
  }
  function burst(freq, q, level, dur) {
    if (!audio) return;
    const { ctx, master, noiseBuf } = audio, t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(level, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  function updateSound(dt, vel) {
    if (!audio) return;
    const t = audio.ctx.currentTime, on = soundOn && running;
    audio.master.gain.setTargetAtTime(soundOn ? 0.55 : 0, t, 0.05);
    audio.humG.gain.setTargetAtTime(on ? 0.035 : 0, t, 0.1);
    audio.rotG.gain.setTargetAtTime(on ? 0.02 : 0, t, 0.1);
    audio.hissG.gain.setTargetAtTime(on ? 0.12 * op.bypass : 0, t, 0.05);
    if (!on || op.timeScale < 0.5) { lastSign = vel.map(v => Math.sign(v)); return; }   // knocks only at real speed
    const load = Math.min(1.2, op.pressure / Math.max(1, op.pmax));
    vel.forEach((v, i) => { const sg = Math.sign(v); if (lastSign[i] !== undefined && sg > 0 && lastSign[i] <= 0) burst(900 + 500 * load, 2.5, 0.08 + 0.22 * load, 0.07); lastSign[i] = sg; });
    if (op.cav > 0.05 && Math.random() < op.cav * dt * 60) burst(3500 + Math.random() * 2500, 4, 0.12 * op.cav, 0.02);
  }

  function clear() {
    if (!current) return;
    scene.remove(current.root);
    current.labelObjs.forEach(l => l.element.remove());
    current.root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
  }

  function load(key) {
    clear();
    const spec = MODELS[key].build();
    const root = new THREE.Group();
    const labelObjs = [];
    const mkLabel = (text, parent) => {
      const d = document.createElement('div');
      d.className = 'v3d-label'; d.innerHTML = `<span class="dot"></span>${text}`;
      const o = new CSS2DObject(d); parent.add(o); labelObjs.push(o); return o;
    };
    const holderFor = (part, worldPos) => {
      const h = new THREE.Group();
      h.position.copy(new THREE.Vector3(...worldPos).sub(part.base)).applyQuaternion(part.obj.quaternion.clone().invert());
      part.obj.add(h); return h;
    };
    spec.parts.forEach((p, i) => {
      p.index = i;
      p.base = p.obj.position.clone();
      p.offset = new THREE.Vector3(...p.explode);
      // own material copies per part so highlighting / X-ray never leaks onto other parts
      p.meshes = [];
      p.obj.traverse(o => {
        if (!o.isMesh) return;
        o.material = o.material.clone();
        o.userData.part = p;
        o.userData.baseOpacity = o.material.opacity; o.userData.baseTransparent = o.material.transparent;
        p.meshes.push(o);
      });
      root.add(p.obj);
      const title = p.code ? `${p.name}` : p.name;
      if (p.label) mkLabel(title, holderFor(p, p.labelAt || [p.base.x, p.base.y + 0.2, p.base.z]));
    });
    const owner = spec.parts.find(p => p.name === spec.extraOwner);
    (spec.extraLabels || []).forEach(([t, pos]) => owner && mkLabel(t, holderFor(owner, pos)));
    scene.add(root);
    current = { key, root, parts: spec.parts, labelObjs, spec };
    labelObjs.forEach(l => l.visible = showLabels);
    if (spec.update) spec.update(angle, stroke);
    applyXray(); applyHighlight(); setPartVisibility(); buildFluid(spec);
    reset();
  }

  function applyXray() {
    if (!current) return;
    current.parts.forEach(p => p.meshes.forEach(m => {
      const fade = xray && p.shell;
      m.material.transparent = fade || m.userData.baseTransparent;
      m.material.opacity = fade ? 0.14 : m.userData.baseOpacity;
      m.material.depthWrite = !fade;
      m.castShadow = !fade;
      m.material.needsUpdate = true;
    }));
  }
  function applyHighlight() {
    if (!current) return;
    const target = pinned ?? hovered;
    current.parts.forEach(p => p.meshes.forEach(m => {
      if (!m.material.emissive) return;
      const on = target === p;
      m.material.emissive.setHex(on ? 0x0066cc : 0x000000);
      m.material.emissiveIntensity = on ? 0.55 : 0;
    }));
  }

  function reset() {
    if (!current) return;
    const t = new THREE.Vector3(...current.spec.target).add(new THREE.Vector3(0, 0.06, 0));
    const k = 1.36 * Math.max(1, Math.pow(1.6 / camera.aspect, 0.8));
    camera.position.copy(new THREE.Vector3(...current.spec.camera).sub(t).multiplyScalar(k).add(t));
    controls.target.copy(t);
    controls.update();
  }

  function setAngle(az, elv, zoom = 1) {
    if (!current) return;
    reset();
    const t = controls.target.clone(), r = camera.position.distanceTo(t) * zoom;
    const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(elv);
    camera.position.set(t.x + r * Math.cos(e) * Math.sin(a), t.y + r * Math.sin(e), t.z + r * Math.cos(e) * Math.cos(a));
    controls.autoRotate = false;
    controls.update();
  }

  function resize() {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h); labels.setSize(w, h);
    if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); }
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  let lastAspect = camera.aspect;
  new ResizeObserver(() => { resize(); if (Math.abs(camera.aspect - lastAspect) > 0.15) { lastAspect = camera.aspect; reset(); } }).observe(el);

  // hover / tap to identify parts
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(ev) {
    if (!current) return null;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObject(current.root, true).filter(h => h.object.userData.part && h.object.userData.part.obj.visible && !(xray && h.object.userData.part.shell));
    return hits.length ? hits[0].object.userData.part : null;
  }
  const emit = (type, part, ev) => el.dispatchEvent(new CustomEvent(type, { detail: part ? { index: part.index, name: part.name, code: part.code || '', x: ev && ev.clientX, y: ev && ev.clientY } : null }));
  renderer.domElement.addEventListener('pointermove', ev => {
    if (ev.pointerType !== 'mouse' || ev.buttons) return;
    const p = pick(ev);
    if (p !== hovered) { hovered = p; applyHighlight(); }
    emit('v3d-hover', p, ev);
  });
  renderer.domElement.addEventListener('pointerleave', () => { hovered = null; applyHighlight(); emit('v3d-hover', null); });
  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', ev => { downAt = [ev.clientX, ev.clientY]; controls.autoRotate = false; el.dispatchEvent(new CustomEvent('v3d-interact')); });
  renderer.domElement.addEventListener('pointerup', ev => {
    if (!downAt || Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 6) return;  // ignore drags
    const p = pick(ev);
    pinned = p && p !== pinned ? p : null; applyHighlight();
    emit('v3d-select', pinned, ev);
  });

  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    explodeT += (explodeTarget - explodeT) * 0.12;
    if (current) {
      const e = ease(Math.min(1, Math.max(0, explodeT)));
      current.parts.forEach(p => p.obj.position.copy(p.base).addScaledVector(p.offset, e));
      const rpm = op.rpm || current.spec.rpm || 100, omega = 2 * Math.PI * rpm / 60;   // crank speed, rad/s
      if (running && current.spec.update) { angle += dt * op.timeScale * omega; current.spec.update(angle, stroke); }
      const velRad = current.spec.velocity ? current.spec.velocity(angle) : [];
      const vel = velRad.map(v => running ? v * omega : 0);                              // plunger velocity, m/s
      updateFluid(dt, vel);
      updateSound(dt, vel);
      // line pressure seen by the gauge: delivery flow pulsates with plunger velocity, so pressure ripples with it;
      // a gas-charged dampener absorbs ~90 % of the ripple; cavitation makes the needle flutter
      const qi = vel.reduce((s, v) => s + Math.max(0, v), 0), vMax = Math.max(1e-9, ...velRad.map(Math.abs)) * omega;
      const qMean = (current.spec.cylinders || 1) * vMax / Math.PI;                       // mean of half-wave rectified flow
      const ripple = running && qMean > 0 ? (qi / qMean - 1) * (op.damp ? 0.006 : 0.06) : 0;
      const flutter = op.cav > 0 ? (Math.random() - 0.5) * op.cav * 0.12 : 0;
      const target = op.pressure * (1 + ripple + flutter);
      (current.spec.gauges || []).forEach(g => {   // glycerine-filled gauge: second-order needle response
        g.st = g.st || { x: 0, v: 0 };
        for (let k = 0; k < 4; k++) { const h = dt / 4, w = 14, z = 0.65; g.st.v += (w * w * (target - g.st.x) - 2 * z * w * g.st.v) * h; g.st.x += g.st.v * h; }
        g.set(g.st.x);
      });
      const relieving = op.bypass > 0.001;
      current.parts.forEach(p => { if (p.relief && hovered !== p && pinned !== p) p.meshes.forEach(m => {
        if (!m.material.emissive) return;
        m.material.emissive.setHex(relieving ? 0xd8232a : 0x000000);
        m.material.emissiveIntensity = relieving ? 0.35 + 0.3 * Math.sin(clock.elapsedTime * 8) : 0;
      }); });
    }
    controls.update();
    if (composer) composer.render(); else renderer.render(scene, camera);
    labels.render(scene, camera);
  });

  return {
    load, reset, setAngle,
    setExploded(on) { explodeTarget = on ? 1 : 0; },
    setLabels(on) { showLabels = on; current && current.labelObjs.forEach(l => l.visible = on); },
    setAutoRotate(on) { controls.autoRotate = on; },
    setXray(on) { xray = on; applyXray(); },
    setRunning(on) { running = on; },
    setStroke(v) { stroke = Math.min(1, Math.max(0, v)); if (current && current.spec.update) current.spec.update(angle, stroke); },
    // { rpm, timeScale, pressure, pmax, bypass, cav, area, qMean, color, gaugeMax, damp, flow } — any subset
    setOperating(o) {
      const colorChanged = o.color !== undefined && o.color !== op.color;
      Object.assign(op, o);
      if (o.gaugeMax && current) (current.spec.gauges || []).forEach(g => g.setMax(o.gaugeMax));
      if (colorChanged) fluid.forEach(f => { if (f.kind !== 'relief') { f.mesh.material.color.setHex(op.color); f.mesh.material.emissive.setHex(op.color); } });
      setPartVisibility();
    },
    // real geometry of the selected pump: { stroke (m), d plunger diameter (m), ratio motor:crank }
    setGeom(g) { if (current && current.spec.setGeom) { current.spec.setGeom(g); current.spec.update && current.spec.update(angle, stroke); } },
    setSound(on) { soundOn = on; if (on && !audio) audio = initAudio(); if (audio) audio.ctx.resume(); },
    highlight(i, pin = false) {
      const p = i == null ? null : current.parts[i];
      if (pin) pinned = p && p !== pinned ? p : null; else hovered = p;
      applyHighlight(); return pinned ? pinned.index : null;
    },
    getParts() { return current ? current.parts.map(p => ({ index: p.index, name: p.name, code: p.code || '', internal: !!p.internal, shell: !!p.shell })) : []; },
    get strokeAdjustable() { return !!(current && current.spec.strokeAdjustable); },
    get autoRotate() { return controls.autoRotate; },
  };
}
