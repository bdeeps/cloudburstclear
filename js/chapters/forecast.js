// Chapter 5: hard to see coming. A map 120 km across (1 unit = 10 km) with rain gauges on a grid,
// a forecast model's grid, a Doppler weather radar and small storms that pop up at random.
// Model:
// - A gauge "catches" a storm if it stands under it. For gauges s km apart on a square grid and a
//   storm of diameter d, the chance is the share of a grid square within d/2 of a corner:
//   π (d/2)² / s² while the circles do not overlap; worked out by counting points otherwise.
// - A forecast model can only draw weather that is several grid lengths wide: about 6 to 7 of them
//   (Skamarock 2004, "Evaluating mesoscale NWP models using kinetic energy spectra"). So a 12 km global
//   model handles features wider than about 70 km, and a 1 km model about 6 km.
// - The radars IMD has put in the Himalaya (Mukteshwar and Kufri, January 2021; Jammu, September 2021;
//   Leh, January 2022; Surkanda Devi, Murari Devi, Jot and Banihal Top, January 2023) are X-band sets
//   that watch about 100 km around, scanning every 10 minutes or so. Mountains block the low beams.
// - Mumbai, 26 July 2005: 944 mm in 24 hours at Santacruz, more than 190 mm of it in one hour (NIDM).
// - South Lhonak lake, Sikkim, burst on the night of 3 to 4 October 2023.
import { THREE, M, clamp, COL, HEX, compact, fitNarrow, inReel, board, panelBg, wrap, terrain, bumps, mixHex, makeRain, makeCloud, rng } from '../burst.js';
import { swarm } from '../kit.js';

const HALF = 6, RADAR = [-1.6, 1.4], RIDGE = [3.0, -2.6], PERIOD = 2.4, CX = 34;
const MODELS = [{ v: 12, label: '12 km (global)' }, { v: 4, label: '4 km (regional)' }, { v: 1, label: '1 km (research)' }];
export function gaugeChance(d, s) {
  const r = d / 2; if (r <= s / 2) return (Math.PI * r * r) / (s * s);
  let hit = 0; const N = 40;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = ((i + 0.5) / N) * s, y = ((j + 0.5) / N) * s; if (Math.min(Math.hypot(x, y), Math.hypot(s - x, y), Math.hypot(x, s - y), Math.hypot(s - x, s - y)) <= r) hit++; }
  return hit / (N * N);
}
const rd = Math.hypot(RIDGE[0] - RADAR[0], RIDGE[1] - RADAR[1]), ra = Math.atan2(RIDGE[1] - RADAR[1], RIDGE[0] - RADAR[0]), RW = 0.3;
const shadowed = (x, z) => { const d = Math.hypot(x - RADAR[0], z - RADAR[1]), a = Math.atan2(z - RADAR[1], x - RADAR[0]); return d > rd + 0.3 && Math.abs(a - ra) < RW; };
const VIEWS = { map: { pos: [0.4, 13.5, 12], target: [0.4, 0, -0.6] }, compare: { pos: [CX, 4, 12.8], target: [CX, 4, 0] } };
const TABLE = [
  ['', 'Cloudburst', 'Glacial lake outburst', 'Widespread extreme rain'],
  ['Where the water comes from', 'A storm raining 100 mm or more in an hour', 'A lake held by ice or loose moraine breaks out', 'Rain bands that last many hours or days'],
  ['How big', 'A few kilometres: one valley', 'One valley, but the flood runs far downstream', 'Hundreds of kilometres: a city, a state'],
  ['How long', 'Under an hour or so', 'Minutes to hours. It can come under a clear sky', 'A day or more'],
  ['What can warn', 'Radar nowcasts, an hour or two ahead', 'Watching the lake; sirens downstream', 'Forecasts, days ahead'],
  ['An example', 'Leh, August 2010', 'South Lhonak lake, Sikkim, October 2023', 'Mumbai, 26 July 2005: 944 mm in a day'],
];

export default {
  id: 'forecast',
  short: 'Hard to see coming',
  title: 'Hard to see coming',
  subtitle: 'A cloudburst is a few kilometres wide and lasts under an hour, so it slips between rain gauges and between forecast grid points.',
  view: VIEWS.map,
  learn: `<p>A cyclone is hundreds of kilometres wide and lasts for days. Forecasters watch it for a week. A cloudburst is <b>a few kilometres wide</b> and <b>over in an hour</b>. That makes it one of the hardest things in weather to predict. IMD itself says so.</p>
    <p><b>It slips between gauges.</b> A rain gauge measures only the rain that falls into it. In the mountains gauges can be tens of kilometres apart, so most small storms hit no gauge at all. Some floods called cloudbursts were never measured. Others, when measured, turned out to be less than 100 mm an hour.</p>
    <p><b>It slips between grid points.</b> A forecast model divides the air into boxes. A global model with points 12 km apart cannot draw a storm 5 km wide. It can say that <b>conditions favour</b> very heavy rain over a district tomorrow, and IMD's colour-coded warnings do that. It cannot say which valley, or which hour.</p>
    <p><b>What helps.</b> A <b>Doppler weather radar</b> sends out pulses and listens for echoes from raindrops, sweeping the sky every few minutes out to about 100 km. It sees the storm itself, wherever it forms, and how hard it is raining. Since 2021 IMD has put radars at Mukteshwar, Kufri, Jammu, Leh, Surkanda Devi and other Himalayan sites. With <b>automatic rain gauges</b> that report every few minutes, they allow a <b>nowcast</b>: a warning for the next one to three hours. Mountains still block radar beams and hide some valleys.</p>
    <p><b>Not every mountain flood is a cloudburst.</b> A <b>glacial lake outburst flood</b> comes from a lake breaking out, sometimes under a clear sky. <b>Widespread extreme rain</b>, like Mumbai's 944 mm on 26 July 2005, covers a whole region for a day. That day Santacruz also had more than 190 mm in one hour, well past the cloudburst mark, but it was a huge, long-lived system and not a small mountain storm. And Kedarnath in 2013 was both: days of extreme rain and a lake breach.</p>
    <p class="tip"><b>Try it:</b> set the gauges 30 km apart and count how many storms they catch. Switch the radar on. Then open the comparison of three kinds of flood.</p>`,
  terms: [
    { t: 'Doppler weather radar', d: 'A radar that sees raindrops in the air, how heavy the rain is and how it is moving.' },
    { t: 'Nowcast', d: 'A forecast for the next few hours, made from what radars, satellites and gauges see right now.' },
    { t: 'Grid spacing', d: 'The distance between the points where a forecast model works out the weather.' },
    { t: 'Automatic rain gauge', d: 'A gauge that measures rain by itself and sends the reading every few minutes.' },
    { t: 'GLOF', d: 'Glacial lake outburst flood: a flood from a lake dammed by ice or loose rock that suddenly breaks out.' },
    { t: 'Red alert', d: 'IMD\'s highest warning colour. It means: take action.' },
  ],
  defaults: { focus: 'map', spacing: 30, size: 5, radar: false, grid: 12 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'map', label: 'Gauges, grid and radar' }, { v: 'compare', label: 'Three kinds of flood' }] },
    { key: 'spacing', type: 'range', label: 'Distance between rain gauges', min: 5, max: 60, step: 1, fmt: (v) => `${v} km` },
    { key: 'size', type: 'range', label: 'How wide the storm is', min: 2, max: 30, step: 1, fmt: (v) => `${v} km` },
    { key: 'grid', type: 'seg', label: 'Forecast model grid', options: MODELS, fmt: (v) => `draws weather wider than about ${v * 6} km` },
    { key: 'radar', type: 'toggle', label: 'Doppler weather radar', hint: 'It watches about 100 km around, but a ridge hides the valley behind it.' },
  ],
  quiz: [
    { q: 'Why do rain gauges miss most cloudbursts in the mountains?', options: ['Gauges do not work in heavy rain', 'The storm is only a few kilometres wide and the gauges are much further apart', 'Cloudbursts happen only at night', 'The rain is too warm'], answer: 1, why: 'A gauge measures only what falls into it. With gauges 30 km apart, a 5 km storm lands on one only about 2 times in 100.' },
    { q: 'What can a Doppler weather radar do that a rain gauge cannot?', options: ['Stop the rain', 'See heavy rain anywhere within about 100 km, every few minutes, wherever the storm forms', 'Measure the soil', 'Forecast a week ahead'], answer: 1, why: 'A radar scans the whole sky around it. That allows a nowcast for the next hour or two. Mountains can still block its beam.' },
    { q: 'A valley floods on a clear, dry night after a lake high above it breaks out. What was it?', options: ['A cloudburst', 'A glacial lake outburst flood', 'A cyclone', 'A drizzle'], answer: 1, why: 'A cloudburst is rain. A glacial lake outburst flood comes from stored water breaking out, and needs no rain at all.' },
  ],
  reel: [
    { ms: 6000, caption: 'It is a few kilometres wide and over in an hour, so it slips between rain gauges. Doppler radar sees it forming.', set: { focus: 'map', spacing: 30, size: 5, grid: 12, radar: true }, act: (s, inst) => inst.seek?.(0), view: { pos: [0, 15.5, 12], target: [0, 0, 0.6] }, spin: 0.3 },
  ],

  build({ stage }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const hT = (x, z) => 0.9 * Math.exp(-(((x - RIDGE[0]) * 0.5 + (z - RIDGE[1]) * 0.86) ** 2) / 0.3 - (((x - RIDGE[0]) * 0.86 - (z - RIDGE[1]) * 0.5) ** 2) / 4) + 0.05 * (bumps(x, z) + 1);
    root.add(terrain(HALF * 2, HALF * 2, 80, 80, hT, (x, z, y) => mixHex(0x24382b, 0x6d7466, clamp(y / 0.8, 0, 1))));
    const posts = swarm(600, new THREE.CylinderGeometry(0.035, 0.035, 0.34, 8), M.glow(0xffffff)); posts.frustumCulled = false; root.add(posts);
    const hitPost = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 10), M.glow(HEX.bad)); root.add(hitPost);
    let grid = null;
    const cloud = makeCloud(root, [0, 0, 0], 1, 8, 5, 0.7), rain = makeRain(root, 160, [0, 1, 1.2, 0, 1], 0.25);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 40), M.ghost(HEX.rain, 0.45)); disc.rotation.x = -Math.PI / 2; root.add(disc);
    // radar: a tower with a dome, a sweeping beam and the shadow behind the ridge
    const radar = new THREE.Group(); { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.6, 10), M.metal()); t.position.y = 0.3; const d = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), M.plastic(0xf2f4f8)); d.position.y = 0.72; radar.add(t, d); } radar.position.set(RADAR[0], hT(...RADAR), RADAR[1]); root.add(radar);
    const sweep = new THREE.Mesh(new THREE.CircleGeometry(10, 24, 0, 0.5), M.ghost(0x8ef0ff, 0.2)); sweep.rotation.x = -Math.PI / 2; sweep.position.set(RADAR[0], 0.16, RADAR[1]); root.add(sweep);
    const sg = new THREE.Shape(); sg.moveTo(Math.cos(ra - RW) * rd, Math.sin(ra - RW) * rd); sg.lineTo(Math.cos(ra - RW) * 12, Math.sin(ra - RW) * 12); sg.lineTo(Math.cos(ra + RW) * 12, Math.sin(ra + RW) * 12); sg.lineTo(Math.cos(ra + RW) * rd, Math.sin(ra + RW) * rd);
    const shade = new THREE.Mesh(new THREE.ShapeGeometry(sg), M.ghost(0x000000, 0.5)); shade.rotation.x = Math.PI / 2; shade.position.set(RADAR[0], 0.2, RADAR[1]); root.add(shade);
    const clip = [new THREE.Plane(new THREE.Vector3(1, 0, 0), HALF), new THREE.Plane(new THREE.Vector3(-1, 0, 0), HALF), new THREE.Plane(new THREE.Vector3(0, 0, 1), HALF), new THREE.Plane(new THREE.Vector3(0, 0, -1), HALF)];
    [sweep, shade].forEach((m) => { m.material.clippingPlanes = clip; }); const hadClip = stage.renderer.localClippingEnabled; stage.renderer.localClippingEnabled = true;
    const table = board(root, 13.2, 7.6, 1320, 760, (g, w, h) => {
      panelBg(g, w, h); g.fillStyle = '#e8eef8'; g.font = 'bold 34px sans-serif'; g.fillText('Three floods that are not the same', 26, 50);
      const cx = [26, 260, 610, 965], cw = [220, 330, 335, 330], cols = ['#e8eef8', COL.rain, COL.e, COL.warn];
      let y = 110;
      TABLE.forEach((row, r) => {
        let yMax = y;
        row.forEach((cell, c) => { g.font = r === 0 ? 'bold 28px sans-serif' : c === 0 ? 'bold 22px sans-serif' : '23px sans-serif'; g.fillStyle = r === 0 ? cols[c] : c === 0 ? COL.soft : '#e8eef8'; yMax = Math.max(yMax, wrap(g, cell, cx[c], y, cw[c], 29)); });
        y = yMax + 16; g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1; g.beginPath(); g.moveTo(26, y - 26); g.lineTo(w - 26, y - 26); g.stroke(); y += 6;
      });
      g.fillStyle = COL.soft; g.font = '22px sans-serif'; wrap(g, 'Kedarnath, June 2013, was two of these at once: days of extreme rain, and the breach of the small Chorabari lake above the town.', 26, y + 8, w - 60, 29);
    }, [CX, 4, 0]);
    const lR = stage.label('Doppler radar', [RADAR[0], 1.35, RADAR[1]], root), lSh = stage.label('Hidden behind the ridge', [4.6, 0.7, -4.6], root), lSt = stage.label('', null, root, 'hot'), lG = stage.label('Rain gauges', [-4.6, 0.75, 4.9], root), lSc = stage.label('120 km across', [0, 0.3, 6.5], root);
    const minor = [lG, lSc, lSh];
    const rnd = rng(77), SEQ = Array.from({ length: 64 }, () => [(rnd() * 2 - 1) * (HALF - 0.8), (rnd() * 2 - 1) * (HALF - 0.8)]);
    let clock = 0, n = -1, key = '', tally = { n: 0, g: 0, r: 0 }, cur = null, focus = '', gridKey = 0;
    const nearest = (x, z, sp) => { const u = sp / 10, o = -HALF + u / 2, gx = clamp(Math.round((x - o) / u), 0, Math.floor((HALF * 2 - u / 2) / u)) * u + o, gz = clamp(Math.round((z - o) / u), 0, Math.floor((HALF * 2 - u / 2) / u)) * u + o; return [gx, gz, Math.hypot(x - gx, z - gz)]; };
    const api = {
      seek(v) { clock = v; n = -1; tally = { n: 0, g: 0, r: 0 }; },
      update(dt, s) {
        dt = Math.max(0, dt); clock += dt;
        const narrow = fitNarrow(stage, minor, -0.16, s.focus === 'map' ? -0.13 : 0);
        if (s.focus !== focus) { if (focus && !inReel()) stage.setView(VIEWS[s.focus].pos, VIEWS[s.focus].target, 1); focus = s.focus; }
        table.mesh.scale.setScalar(narrow ? 0.5 : 1);
        const k2 = `${s.spacing}|${s.size}|${s.radar}`;
        if (k2 !== key) {
          key = k2; tally = { n: 0, g: 0, r: 0 }; n = -1; clock = 0;
          const u = s.spacing / 10, o = -HALF + u / 2; let i = 0;
          for (let x = o; x < HALF && i < 600; x += u) for (let z = o; z < HALF && i < 600; z += u) posts.place(i++, [x, hT(x, z) + 0.17, z]);
          for (; i < 600; i++) posts.place(i, [0, -50, 0], null, 0.0001);
          posts.done();
        }
        if (s.grid !== gridKey) {
          gridKey = s.grid; if (grid) { root.remove(grid); grid.geometry.dispose(); grid.material.dispose(); }
          const pts = [], u = s.grid / 10; for (let v = -HALF; v <= HALF + 1e-6; v += u) pts.push(v, 0.13, -HALF, v, 0.13, HALF, -HALF, 0.13, v, HALF, 0.13, v);
          const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
          grid = new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: 0xffd35a, transparent: true, opacity: s.grid === 1 ? 0.16 : 0.4 })); root.add(grid);
        }
        const idx = Math.floor(clock / PERIOD), f = (clock % PERIOD) / PERIOD;
        if (idx !== n) {
          n = idx; const [x, z] = SEQ[idx % SEQ.length], [gx, gz, d] = nearest(x, z, s.spacing), r = s.size / 20;
          cur = { x, z, r, gauge: d <= r, gx, gz, radar: s.radar && !shadowed(x, z) };
          tally.n++; if (cur.gauge) tally.g++; if (cur.radar) tally.r++;
        }
        const life = Math.min(1, f * 5) * Math.min(1, (1 - f) * 5), y0 = hT(cur.x, cur.z);
        disc.position.set(cur.x, y0 + 0.24, cur.z); disc.scale.setScalar(Math.max(0.01, cur.r * life)); disc.material.opacity = 0.5 * life;
        const cs = clamp(cur.r * 0.75, 0.22, 1.2) * (0.4 + 0.6 * life); cloud.position.set(cur.x, 1.7 + cs, cur.z); cloud.scale.setScalar(cs); cloud.dark(0.8);
        rain.box = [cur.x - cur.r, cur.x + cur.r, 1.6 + cs * 0.4, cur.z - cur.r, cur.z + cur.r]; rain.step(dt, life, () => y0, 6);
        hitPost.visible = cur.gauge; if (cur.gauge) hitPost.position.set(cur.gx, hT(cur.gx, cur.gz) + 0.3, cur.gz);
        sweep.visible = shade.visible = lR.visible = lSh.visible = s.radar; lSh.visible = s.radar && !narrow; radar.visible = s.radar;
        sweep.rotation.z = -clock * 1.6;
        lSt.position.set(cur.x, 2.3 + cs * 1.7, cur.z);
        lSt.element.innerHTML = cur.gauge ? 'Caught by a gauge' : cur.radar ? 'Missed by every gauge. <b>The radar sees it</b>' : s.radar ? 'Missed by gauges, and hidden from the radar' : 'Missed by every gauge';
        lSt.element.style.setProperty('--c', cur.gauge || cur.radar ? COL.ok : COL.bad); lSt.visible = s.focus === 'map';
        api.state = { tally, cur };
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); stage.renderer.localClippingEnabled = hadClip; },
      readout: (s) => {
        if (s.focus === 'compare') return '';
        const p = gaugeChance(s.size, s.spacing), need = s.grid * 6;
        return compact(`<div class="big ${p < 0.5 ? 'no' : 'ok'}">Gauges catch ${p >= 0.995 ? 'every storm' : p < 0.01 ? 'fewer than 1 storm in 100' : `about ${Math.round(p * 100)} storms in 100`}</div>
          <div class="row"><span>Storm ${s.size} km wide, gauges ${s.spacing} km apart</span><b>${(p * 100).toFixed(p < 0.1 ? 1 : 0)}% chance</b></div>
          <div class="row"><span>Storms so far: ${tally.n}</span><b>${tally.g} on a gauge${s.radar ? ` · ${tally.r} seen by radar` : ''}</b></div>
          <div class="row"><span>A ${s.grid} km model draws weather wider than</span><b>about ${need} km</b></div>
          <div class="row"><span>This storm, to that model</span><b>${s.size >= need ? 'it can draw it' : 'falls between its points'}</b></div>
          <small>${s.radar ? 'The radar sees rain wherever it forms, except in the shadow behind the ridge. That gives a nowcast for the next hour or two.' : 'Without a radar, a storm that misses every gauge is not measured at all.'} Even a fine model that can draw such a storm cannot place it in the right valley at the right hour.</small>`);
      },
    };
    return api;
  },
};
