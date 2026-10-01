// Shared parts for CloudburstClear: the small physics models every chapter uses, plus drawing
// helpers (chart boards, a mountain terrain, streams, rain, clouds, houses and trees).
//
// Physics and where it comes from:
// - Saturation vapour pressure: Bolton (1980), es = 6.112 exp(17.67 T / (T + 243.5)) hPa, T in °C.
// - Mixing ratio q = 0.622 e / (p − e).
// - Rain rate at the ground R = E · ρ · w · q (Doswell, Brooks and Maddox 1996, "Flash flood
//   forecasting: an ingredients-based methodology"): the upward flow of water vapour through cloud
//   base, times the share E of it that reaches the ground as rain.
// - Rain at one place = average rate × how long the storm stays over it (same paper).
// - Precipitable water: vapour density falls off with height with a scale height of about 2.3 km,
//   so PW = ρ0 q0 Hv (1 − e^(−D/Hv)). At a 25 °C dew point this gives 54 mm, close to Reitan's
//   (1963) fit ln PW(cm) = 0.110 + 0.0614 Td = 52 mm.
// - Run-off: rain that falls faster than the ground can soak it up runs off (Horton 1933).
//   Peak flow by the rational method Q = (i − f) A / 3.6 (Q in m³/s, i and f in mm/h, A in km²).
// - Time for the whole catchment to reach the outlet: Kirpich (1940), tc = 0.0195 L^0.77 S^−0.385
//   minutes (L in m, S the channel slope), with stream length from Hack's law (1957), L ≈ 1.27 A^0.6 km.
// - Flow depth and speed in a stream: Manning's equation, v = R^(2/3) S^(1/2) / n, with n = 0.06 for
//   a steep, bouldery mountain stream (Chow 1959 gives 0.04 to 0.07).
import { THREE, M, box, sphere, canvasTexture, clamp, lerp, smooth } from './kit.js';

export { THREE, M, box, sphere, clamp, lerp, smooth };

// ---------------------------------------------------------------- physics
export const IMD_BURST = 100;                                    // mm in an hour: IMD's cloudburst mark
export const HV = 2300;                                          // m, scale height of water vapour
export const satVP = (T) => 6.112 * Math.exp((17.67 * T) / (T + 243.5));               // hPa
export const mixQ = (Td, p = 1000) => { const e = satVP(Td); return (0.622 * e) / (p - e); };   // kg of vapour per kg of air
export const airRho = (p, T) => (p * 100) / (287 * (T + 273.15));                       // kg/m³
// Water vapour in a column D km deep, as a depth of water in mm (1 kg/m² = 1 mm).
export const precipWater = (Td, depthKm = 12, p = 1000, T = 30) => airRho(p, T) * mixQ(Td, p) * HV * (1 - Math.exp((-depthKm * 1000) / HV));
// mm an hour reaching the ground: efficiency × air density × updraft (m/s) × vapour (kg/kg).
export const rainRate = (E, rho, w, q) => E * rho * w * q * 3600;
// Catchment
export const streamLen = (A) => 1.27 * Math.pow(A, 0.6);                                 // km
export const kirpich = (A, S) => 0.0195 * Math.pow(streamLen(A) * 1000, 0.77) * Math.pow(S, -0.385);   // minutes
export const peakFlow = (i, f, A) => (Math.max(0, i - f) * A) / 3.6;                     // m³/s once the whole catchment feeds the outlet
// Flow at the outlet t minutes after the rain starts: rain of D minutes on a catchment that takes
// tc minutes to drain (a simple time-area model: the share of the catchment feeding the outlet grows evenly).
export const flowAt = (t, i, f, A, tc, D) => peakFlow(i, f, A) * (clamp(t / tc, 0, 1) - clamp((t - D) / tc, 0, 1));
// Manning: depth (m) and speed (m/s) for a flow Q in a channel with a flat bed b metres wide and
// banks that go out z metres for every metre up.
export function manning(Q, { b = 6, z = 1.5, S = 0.08, n = 0.06 } = {}) {
  const q = (y) => { const A = (b + z * y) * y, P = b + 2 * y * Math.sqrt(1 + z * z); return (A * Math.pow(A / P, 2 / 3) * Math.sqrt(S)) / n; };
  let lo = 0, hi = 30;
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (q(m) < Q) lo = m; else hi = m; }
  const y = (lo + hi) / 2, A = (b + z * y) * y;
  return { y, v: A > 1e-6 ? Q / A : 0, top: b + 2 * z * y };
}

// ---------------------------------------------------------------- small helpers
export const COL = { rain: '#6ab8ff', vap: '#ff9d5c', ok: '#a3e635', bad: '#ff5a8a', warn: '#ffd35a', mud: '#b98a5a', e: '#8ef0ff', soft: 'rgba(255,255,255,.62)', dim: 'rgba(255,255,255,.35)' };
export const HEX = { rain: 0x6ab8ff, vap: 0xff9d5c, ok: 0xa3e635, bad: 0xff5a8a, warn: 0xffd35a, water: 0x3d97e8, mud: 0x8a623c, rock: 0x6b6f78, soil: 0x7d5c3e, grass: 0x4f8a45, snow: 0xeef3f8 };
export const inReel = () => document.body.classList.contains('gb-reel');
export const fmt = (v, d = 0) => v.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });
export const link = (slug, t) => `<a style="color:inherit;text-decoration:underline" href="https://glassbox.how/${slug}/">${t}</a>`;
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
// On a phone the stage is small, so the readout keeps its headline and first two rows only.
export function compact(html) {
  if (window.innerWidth >= 560 || inReel()) return html;
  let n = 0;
  return html.replace(/<small[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (n++ < 2 ? m : ''));
}
// On a squarish stage the readout covers the upper left, so the picture slides down a little there too.
export function fitNarrow(stage, minor = [], ny = -0.16, sq = -0.13) {
  const w = stage.host.clientWidth, narrow = w < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = inReel() ? 0 : narrow ? ny : w / Math.max(1, stage.host.clientHeight) < 1.3 ? sq : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}

// ---------------------------------------------------------------- boards (charts drawn on a canvas in the scene)
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); }
export function board(root, w, h, pxW, pxH, draw, pos = [0, 0, 0]) {
  const tex = canvasTexture(pxW, pxH, draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return Object.assign(tex, { mesh: m });
}
export function title(g, text, sub = '') {
  g.textAlign = 'left'; g.fillStyle = '#e8eef8'; g.font = 'bold 32px sans-serif'; g.fillText(text, 22, 44);
  if (sub) { g.font = '23px sans-serif'; g.fillStyle = COL.soft; g.fillText(sub, 22, 76); }
}
// [position, yRotation, scale] for a wide screen, and another for the tall reel video.
export function placeBoard(b, wide, reel) {
  const [p, r = 0, s = 1] = inReel() && reel ? reel : wide;
  b.mesh.position.set(...p); b.mesh.rotation.set(0, r, 0); b.mesh.scale.setScalar(s);
}
export function axes(g, w, h, { x0 = 84, x1 = w - 26, y0 = h - 74, y1 = 100, xMin = 0, xMax, yMin = 0, yMax, xTicks = [], yTicks = [], xFmt = String, yFmt = String, xLabel = '', yLabel = '' }) {
  const X = (v) => x0 + ((x1 - x0) * (v - xMin)) / (xMax - xMin), Y = (v) => y0 + ((y1 - y0) * (v - yMin)) / (yMax - yMin);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = COL.soft; g.font = '22px sans-serif';
  g.textAlign = 'center'; xTicks.forEach((v) => { g.beginPath(); g.moveTo(X(v), y0); g.lineTo(X(v), y1); g.stroke(); g.fillText(xFmt(v), X(v), y0 + 28); });
  g.textAlign = 'right'; yTicks.forEach((v) => { g.beginPath(); g.moveTo(x0, Y(v)); g.lineTo(x1, Y(v)); g.stroke(); g.fillText(yFmt(v), x0 - 10, Y(v) + 8); });
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = COL.soft; g.textAlign = 'center'; g.fillText(xLabel, (x0 + x1) / 2, h - 14);
  if (yLabel) { g.save(); g.translate(26, (y0 + y1) / 2); g.rotate(-Math.PI / 2); g.fillText(yLabel, 0, 0); g.restore(); }
  g.textAlign = 'left';
  return { X, Y, x0, x1, y0, y1 };
}
export function curve(g, pts, col, wdt = 4, dash = null) {
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.lineJoin = 'round'; g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.setLineDash([]);
}
export function dot(g, x, y, col, r = 9) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
// Wrap text on a canvas. Returns the y after the last line.
export function wrap(g, text, x, y, maxW, lh) {
  let line = '';
  text.split(' ').forEach((wd) => { const t = line ? line + ' ' + wd : wd; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = wd; } else line = t; });
  if (line) { g.fillText(line, x, y); y += lh; }
  return y;
}

// ---------------------------------------------------------------- land
const tint = new THREE.Color();
// A terrain sheet from a height function h(x, z) and a colour function c(x, z, y) → hex.
export function terrain(w, d, nx, nz, h, c, { cx = 0, cz = 0 } = {}) {
  const g = new THREE.PlaneGeometry(w, d, nx, nz); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + cx, z = p.getZ(i) + cz, y = h(x, z);
    p.setXYZ(i, x, y, z); tint.setHex(c(x, z, y)); col.set([tint.r, tint.g, tint.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, flatShading: true, side: THREE.DoubleSide }));
  m.receiveShadow = true; m.castShadow = true;
  return m;
}
// Smooth lumps for hillsides, the same every time.
export const bumps = (x, z) => 0.5 * Math.sin(x * 1.7 + z * 0.9) * Math.cos(z * 1.3 - x * 0.4) + 0.3 * Math.sin(x * 3.1 - z * 2.3) + 0.2 * Math.cos(x * 5.3 + z * 4.1);
export const mixHex = (a, b, k) => tint.setHex(a).lerp(new THREE.Color(b), clamp(k, 0, 1)).getHex();

// A stream: a strip that follows path(t) → [x, y, z] for t in 0..1, with a half-width you can change every frame.
export function stream(n = 60, color = HEX.water) {
  const pos = new Float32Array((n + 1) * 6), idx = [];
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0, side: THREE.DoubleSide });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  m.set = (path, half, lift = 0.03) => {
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = path(t), b = path(Math.min(1, t + 0.01)), c0 = path(Math.max(0, t - 0.01));
      let dx = b[0] - c0[0], dz = b[2] - c0[2]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
      const hw = typeof half === 'function' ? half(t) : half;
      pos.set([a[0] - dz * hw, a[1] + lift, a[2] + dx * hw, a[0] + dz * hw, a[1] + lift, a[2] - dx * hw], i * 6);
    }
    g.attributes.position.needsUpdate = true; g.computeVertexNormals();
  };
  m.tint = (k) => mat.color.setHex(HEX.water).lerp(new THREE.Color(HEX.mud), clamp(k, 0, 1));   // clear water to muddy flood
  return m;
}

// Rain: streaks falling inside a box [xa, xb, top, za, zb]. step(dt, k, floor) with k from 0 (dry) to 1 (cloudburst).
export function makeRain(root, count = 600, box3 = [-5, 5, 6, -4, 4], len = 0.34) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(count * 6), seed = rng(7);
  const p = Array.from({ length: count }, () => ({ x: seed(), y: seed(), z: seed(), v: 0.7 + seed() * 0.6 }));
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xa8d6ff, transparent: true, opacity: 0.75 })); m.frustumCulled = false; root.add(m);
  let t = 0;
  m.box = box3;
  m.step = (dt, k, floorY = () => 0, speed = 9) => {
    t += dt; const nShow = Math.round(count * clamp(k, 0, 1)), [xa, xb, yt, za, zb] = m.box;
    geo.setDrawRange(0, nShow * 2); m.visible = nShow > 0;
    for (let i = 0; i < nShow; i++) {
      const q = p[i], x = xa + (xb - xa) * q.x, z = za + (zb - za) * q.z, f = floorY(x, z), y = yt - ((q.y * (yt + 1) + t * speed * q.v) % Math.max(0.05, yt - f));
      pos.set([x, y, z, x - 0.02, y + len, z], i * 6);
    }
    geo.attributes.position.needsUpdate = true;
  };
  return m;
}
// A cloud of puffs. dark(k) turns it from white (0) to storm grey (1).
export function makeCloud(root, pos, s = 1, n = 9, seed = 3, flat = 0.6) {
  const r = rng(seed), g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0xdfe6f0, roughness: 1, transparent: true, opacity: 0.94 });
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.55 + r() * 0.45, 14, 10), mat); m.position.set((r() - 0.5) * 2.6, (r() - 0.3) * 0.7, (r() - 0.5) * 1.6); m.scale.y = flat; g.add(m); }
  g.position.set(...pos); g.scale.setScalar(s); g.mat = mat; root.add(g);
  g.dark = (k) => mat.color.setScalar(0.92 - 0.6 * clamp(k, 0, 1));
  return g;
}
// Many small glowing dots (air, vapour, drops).
export function dots(root, count, color, r = 0.06, opacity = 1) {
  const mat = M.glow(color, opacity < 1 ? { transparent: true, opacity, depthWrite: false } : {});
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 8, 6), mat, count);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false;
  const o = new THREE.Object3D();
  m.put = (i, x, y, z, sc = 1, sy = sc) => { o.position.set(x, y, z); o.scale.set(sc, sy, sc); o.updateMatrix(); m.setMatrixAt(i, o.matrix); };
  m.done = () => { m.instanceMatrix.needsUpdate = true; };
  for (let i = 0; i < count; i++) m.put(i, 0, -50, 0, 0);
  root.add(m);
  return m;
}

// ---------------------------------------------------------------- things that stand on the land
export function house(w = 0.3, color = 0xe2d6bd, roof = 0x9a4a36) {
  const g = new THREE.Group(), b = box(w, w * 0.62, w * 0.8, M.matte(color)); b.position.y = w * 0.31;
  const r = new THREE.Mesh(new THREE.ConeGeometry(w * 0.74, w * 0.38, 4), M.matte(roof)); r.rotation.y = Math.PI / 4; r.position.y = w * 0.81; r.castShadow = true; g.add(b, r); return g;
}
export function tree(h = 0.4, color = 0x2f6f43) {                                 // a conifer, like a deodar or pine
  const g = new THREE.Group(), tr = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * h, 0.045 * h, h * 0.5, 6), M.matte(0x6b4a2e)); tr.position.y = h * 0.25;
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.2 * h, h * 0.55, 7), M.matte(color)), c2 = new THREE.Mesh(new THREE.ConeGeometry(0.14 * h, h * 0.4, 7), M.matte(color));
  c1.position.y = h * 0.62; c2.position.y = h * 0.88; [tr, c1, c2].forEach((m) => { m.castShadow = true; }); g.add(tr, c1, c2); return g;
}
export function tent(s = 0.2, color = 0xff9933) {
  const g = new THREE.Group(), m = new THREE.Mesh(new THREE.ConeGeometry(s, s * 0.9, 4), M.matte(color)); m.rotation.y = Math.PI / 4; m.position.y = s * 0.45; m.castShadow = true; g.add(m); return g;
}
export function person(color = 0xffd35a, h = 0.2) {
  const g = new THREE.Group(), b = new THREE.Mesh(new THREE.CapsuleGeometry(h * 0.16, h * 0.5, 4, 8), M.plastic(color)), hd = sphere(h * 0.14, M.plastic(0xe0b48c), 12);
  b.position.y = h * 0.42; hd.position.y = h * 0.88; g.add(b, hd); return g;
}
export function boulder(r = 0.12, color = 0x7b7f88) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), new THREE.MeshStandardMaterial({ color, roughness: 0.95 })); m.castShadow = true; return m; }
export const rockMat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, side: THREE.DoubleSide, ...o });

// A cross-section slab between z0 and z1 whose top and bottom outlines are functions of x.
export function slab(n, z0, z1, mats) {
  const pos = new Float32Array((n + 1) * 6 * 3), idx = [[], [], []];
  for (let i = 0; i < n; i++) {
    const a = i * 6, b = a + 6;
    idx[0].push(a + 1, b + 1, b, a + 1, b, a);
    idx[1].push(a + 2, b + 2, b + 3, a + 2, b + 3, a + 3);
    idx[2].push(b + 5, a + 5, a + 4, b + 5, a + 4, b + 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx.flat());
  if (Array.isArray(mats)) idx.forEach((k, i) => g.addGroup(i * n * 6, n * 6, Math.min(i, mats.length - 1)));
  const m = new THREE.Mesh(g, mats); m.frustumCulled = false; m.receiveShadow = true;
  m.set = (x0, x1, top, bot) => {
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, t = top(x), b = Math.min(t, bot(x)), o = i * 18;
      pos.set([x, t, z1, x, b, z1, x, t, z1, x, t, z0, x, t, z0, x, b, z0], o);
    }
    g.attributes.position.needsUpdate = true; g.computeVertexNormals();
  };
  return m;
}

// A rain gauge drawn far larger than life: a glass tube with a funnel, and water that rises to `mm`.
export function gauge(H = 2.2, R = 0.22, full = 100) {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 28, 1, true), M.clear(0xcfe8ff, 0.2)); glass.position.y = H / 2;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.25, R * 1.35, 0.08, 28), M.metal(0x8a93a3)); base.position.y = 0.04;
  const fun = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.5, R * 0.9, 0.22, 28, 1, true), M.metal(0xb9bec8, { side: THREE.DoubleSide })); fun.position.y = H + 0.1;
  const water = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.94, R * 0.94, 1, 28), new THREE.MeshStandardMaterial({ color: 0x3d97e8, roughness: 0.2, transparent: true, opacity: 0.9 }));
  g.add(base, water, glass, fun);
  for (let i = 1; i <= 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(R * 1.01, 0.008, 6, 28), M.glow(0xffffff)); t.rotation.x = Math.PI / 2; t.position.y = 0.08 + ((H - 0.1) * i) / 4; g.add(t); }
  g.set = (mm) => { const k = clamp(mm / full, 0, 1), h = Math.max(0.004, k * (H - 0.1)); water.scale.y = h; water.position.y = 0.08 + h / 2; };
  g.set(0); g.H = H;
  return g;
}
