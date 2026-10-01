// Chapter 2: no cloud bursts. A storm is a pump that holds water aloft, then lets it fall.
// A column of air over one square kilometre, 12 km tall (1 unit = 1 km).
// Model (simple, and stated as such in the readout):
// - Vapour in the whole column (precipitable water) from the dew point at the ground (burst.js).
//   Monsoon air holds about 50 to 70 mm; the atmosphere's world average is about 25 mm.
// - Vapour flowing up through cloud base, averaged over the storm: C = a · ρ · w · q, with the
//   updraft core covering a = 20% of the storm's base, ρ = 1.0 kg/m³ at cloud base.
// - Water held aloft S (mm, the same as kg per m²; radar meteorologists call it vertically integrated
//   liquid, and 40 to 70 kg/m² is seen in the most intense storms). Big raindrops fall at about 8 m/s
//   through the air (Gunn and Kinzer 1949: 6.5 m/s for a 2 mm drop, 9 m/s for a 5 mm drop), so in an
//   updraft of w they sink at only (8 − w) m/s and take τ = 6 km ÷ (8 − w) to fall out. In an updraft
//   near 8 m/s or more they hang, and the load builds until its weight forces it out at about 60 mm.
// - Rain at the ground R = E · S / τ with E = 0.8 (some evaporates on the way down).
// One second of the model is three minutes.
import { THREE, M, clamp, COL, HEX, IMD_BURST, mixQ, precipWater, fmt, compact, fitNarrow, inReel, board, panelBg, title, axes, curve, dot, placeBoard, makeRain, makeCloud, dots, house, tree, rng } from '../burst.js';

const AFRAC = 0.2, RHO = 1.0, VT = 8, DEPTH = 6000, EFF = 0.8, SMAX = 60, MPS = 3;
const inflow = (s) => AFRAC * RHO * s.w * mixQ(s.td) * 3600;                       // mm an hour
const tauMin = (w) => DEPTH / Math.max(0.5, VT - w) / 60;                          // minutes for the load to fall out

export default {
  id: 'myth',
  short: 'No cloud bursts',
  title: 'No cloud bursts',
  subtitle: 'A cloud is not a bag of water. It is a storm whose rising air holds a huge load aloft, and then lets it fall.',
  view: { pos: [-4.2, 5.2, 19.5], target: [-4.2, 4.8, 0] },
  learn: `<p>The old picture is a cloud like a <b>water balloon</b> that splits open. It is wrong. A cloud has no skin. It is made of tiny droplets, each far too light to fall, floating in rising air.</p>
    <p>Here is what really happens. Warm, very moist air rises fast in the storm's <b>updraft</b>. As it rises it cools, and its invisible vapour turns into droplets, which join into raindrops. A big raindrop falls through air at about <b>8 metres a second</b>. If the air itself is rising at 8 metres a second or more, the drop <b>hangs there</b>, or even goes up. So a strong updraft holds a great load of water in the sky: tens of millimetres, which is <b>tens of thousands of tonnes over every square kilometre</b>.</p>
    <p>Then one of two things happens. The updraft <b>weakens</b>, or the load becomes <b>too heavy</b> for it. Either way, the water that built up over half an hour comes down in minutes, with the cold air it drags along. From the ground it feels as if the sky has split. That is the "burst".</p>
    <p>There is a second surprise. Squeeze <b>all</b> the vapour out of the whole column of air above you and you get only about <b>50 to 70 mm</b> in the wettest monsoon air. Meteorologists call this the <b>precipitable water</b>. So to rain 100 mm in an hour, a storm cannot just empty the air overhead. It must keep <b>pulling in moist air from all around</b>, like a pump. The physics of the rising air itself is in ${'<a style="color:inherit;text-decoration:underline" href="https://glassbox.how/stormclear/">StormClear</a>'}.</p>
    <p class="tip"><b>Try it:</b> build a strong updraft and watch the blue load grow with almost no rain below. Then let the updraft weaken. Then try it again in drier air.</p>`,
  terms: [
    { t: 'Updraft', d: 'The rising current of warm, moist air inside a storm. In strong storms it rises at 10 metres a second or more.' },
    { t: 'Precipitable water', d: 'The depth of water you would get by condensing all the vapour in the column of air above a place.' },
    { t: 'Dew point', d: 'The temperature to which air must cool for its vapour to start condensing. A high dew point means very moist air.' },
    { t: 'Terminal speed', d: 'The steady speed at which a drop falls through air: about 8 metres a second for a big raindrop.' },
    { t: 'Water loading', d: 'The weight of drops held in an updraft. Enough of it slows the updraft and turns it into a downdraft.' },
    { t: 'Downburst', d: 'The blast of cold air that comes down with the falling rain and spreads along the ground.' },
  ],
  defaults: { td: 25, w: 11 },
  controls: [
    { key: 'td', type: 'range', label: 'Moisture in the air (dew point at the ground)', min: 8, max: 27, step: 0.5, fmt: (v) => `${v.toFixed(1)} °C · ${precipWater(v).toFixed(0)} mm in the column`, ends: ['Dry', 'Monsoon'] },
    { key: 'w', type: 'range', label: 'Updraft in the core of the storm', min: 0, max: 14, step: 0.1, fmt: (v) => `${v.toFixed(1)} m/s (${Math.round(v * 3.6)} km/h)`, ends: ['Still air', 'Violent'], hint: 'Big raindrops fall at about 8 m/s. Above that, the updraft holds them up.' },
    { type: 'buttons', label: 'Try', items: [
      { label: 'Build a strong updraft', act: (s, inst) => { s.w = 11; inst.preload?.(0); } },
      { label: 'Let the updraft weaken', act: (s) => { s.w = 1.5; } },
      { label: 'Empty the cloud', act: (s, inst) => { inst.preload?.(0); } },
    ] },
  ],
  quiz: [
    { q: 'Does a cloud burst open like a bag of water?', options: ['Yes, the skin of the cloud tears', 'No. A cloud has no skin. Rising air holds the water up, and it falls when the updraft weakens or the load gets too heavy', 'Only over mountains', 'Only at night'], answer: 1, why: 'A cloud is droplets floating in rising air. A strong updraft can hold tens of millimetres of water aloft, and it comes down together when the updraft can no longer hold it.' },
    { q: 'A big raindrop falls at about 8 m/s through air. The air in the storm is rising at 10 m/s. What does the drop do?', options: ['Falls at 18 m/s', 'Falls at 8 m/s', 'Rises slowly, at about 2 m/s', 'Vanishes'], answer: 2, why: 'The drop falls through the air, but the air is rising faster. Seen from the ground the drop goes up at about 2 m/s, and keeps growing.' },
    { q: 'All the vapour in a column of monsoon air makes about 60 mm of water. How can a storm rain 100 mm in an hour?', options: ['It cannot', 'It keeps drawing in moist air from all around and wrings that out too', 'The rain comes from the sea directly', 'The drops split into more drops'], answer: 1, why: 'A storm is a pump, not a tank. Moist air flows in at the bottom the whole time, which is why moisture supply matters so much.' },
  ],
  reel: [
    { ms: 5500, caption: 'No cloud bursts like a bag. Fast rising air holds tens of thousands of tonnes of water in the sky.', set: { td: 25, w: 11 }, act: (s, inst) => inst.preload?.(14), view: { pos: [0, 6.4, 27], target: [0, 5.9, 0] }, spin: 0.2 },
    { ms: 5500, caption: 'When the updraft weakens, the water it was holding falls together, in minutes, on one small place.', set: { td: 25 }, anim: { w: [11, 1.5] }, act: (s, inst) => inst.preload?.(58), view: { pos: [0, 6.4, 27], target: [0, 5.9, 0] }, spin: 0.2 },
  ],

  build({ stage }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 56), M.matte(0x2c4a31)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
    const rnd = rng(5);
    for (let i = 0; i < 12; i++) { const a = rnd() * 6.283, r = 0.4 + rnd() * 1.6, h = house(0.3 + rnd() * 0.12); h.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); h.rotation.y = rnd() * 3; root.add(h); }
    for (let i = 0; i < 30; i++) { const a = rnd() * 6.283, r = 2.2 + rnd() * 6, t = tree(0.5 + rnd() * 0.3); t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); root.add(t); }
    // The column: one square kilometre, drawn 3 units wide so you can see inside it.
    const W = 3, H = 12;
    const col = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, W)), new THREE.LineBasicMaterial({ color: 0x8ef0ff, transparent: true, opacity: 0.55 })); col.position.y = H / 2; root.add(col);
    const puffs = [[0, 2.6, 2.0], [0.2, 4.4, 2.3], [-0.2, 6.3, 2.4], [0.1, 8.2, 2.3], [0, 10, 2.2]].map(([x, y, sc], i) => { const c = makeCloud(root, [x, y, 0], sc * 0.62, 10, 11 + i, 0.95); c.mat.opacity = 0.3; c.mat.depthWrite = false; return c; });
    const anvil = makeCloud(root, [0.6, 11.5, 0], 2.1, 12, 31, 0.3); anvil.mat.opacity = 0.5; anvil.mat.depthWrite = false;
    const NV = 130, ND = 220;
    const vap = dots(root, NV, HEX.vap, 0.09), drops = dots(root, ND, HEX.rain, 0.085);
    const ph = Array.from({ length: Math.max(NV, ND) }, () => [rnd(), rnd(), rnd(), rnd()]);
    const rain = makeRain(root, 500, [-1.4, 1.4, 1.9, -1.4, 1.4], 0.5);
    const hist = [];
    const chart = board(root, 9, 6.4, 600, 426, (g, w, h, st) => {
      panelBg(g, w, h); if (!st) return;
      title(g, 'Held in the sky, then let go');
      const A = axes(g, w, h, { xMin: -90, xMax: 0, yMin: 0, yMax: 240, xTicks: [-90, -60, -30, 0], yTicks: [0, 60, 120, 180, 240], xFmt: (v) => (v ? `${-v}` : 'now'), yFmt: String, xLabel: 'minutes ago', y1: 150, x0: 70 });
      curve(g, [[A.x0, A.Y(IMD_BURST)], [A.x1, A.Y(IMD_BURST)]], COL.bad, 2, [10, 8]);
      g.font = '20px sans-serif'; g.fillStyle = COL.bad; g.fillText('cloudburst rate: 100 mm an hour', A.x0 + 10, A.Y(IMD_BURST) - 8);
      const n = st.hist.length;
      if (n > 1) { curve(g, st.hist.map((q, i) => [A.X(i - (n - 1)), A.Y(clamp(q[1], 0, 240))]), COL.bad, 4); curve(g, st.hist.map((q, i) => [A.X(i - (n - 1)), A.Y(q[0])]), COL.rain, 4); }
      dot(g, A.X(0), A.Y(clamp(st.R, 0, 240)), COL.bad, 8); dot(g, A.X(0), A.Y(st.S), COL.rain, 8);
      g.font = 'bold 24px sans-serif'; g.fillStyle = COL.rain; g.fillText(`■ water held aloft: ${st.S.toFixed(0)} mm`, 24, 86); g.fillStyle = COL.bad; g.fillText(`■ rain at the ground: ${st.R.toFixed(0)} mm an hour`, 24, 120);
    });
    const lTop = stage.label('Anvil: about 12 km up', [3.6, 11.6, 0], root), lBase = stage.label('Cloud base', [2.6, 2.0, 0], root), lCol = stage.label('A column of air over 1 km²', [1.2, 12.9, 0], root);
    const lUp = stage.label('', [2.9, 4.4, 1.5], root, 'hot'), lLoad = stage.label('', [3.0, 7.6, 1.5], root), lRain = stage.label('', [3.2, 0.8, 1.5], root, 'hot');
    lUp.element.style.setProperty('--c', COL.vap); lLoad.element.style.color = '#9fd2ff'; lRain.element.style.setProperty('--c', COL.bad);
    const minor = [lTop, lBase, lCol, lLoad];
    let S = 0, R = 0, clock = 0, sink = 0, acc = 0;
    const api = {
      preload(v) { S = v; hist.length = 0; R = 0; },
      update(dt, s) {
        dt = Math.max(0, dt); clock += dt;
        const narrow = fitNarrow(stage, minor), sx = narrow && !inReel() ? -0.24 : 0;
        if (stage.shift && stage.shift[0] !== sx) stage.setShift(sx, stage.shift[1]);   // on a phone the chart is hidden, so centre the column
        placeBoard(chart, [[-8.6, 2.7, 0], 0, 1], [[0, -4.7, 2.5], 0, 1]); chart.mesh.visible = !narrow;
        // step the bucket: dS/dt = C − S/τ
        const dm = dt * MPS, C = inflow(s), tau = tauMin(s.w);
        let out = (S / tau) * dm; S += (C / 60) * dm - out;
        if (S > SMAX) { out += S - SMAX; S = SMAX; }
        S = Math.max(0, S);
        const Rnow = dm > 0 ? (EFF * out * 60) / dm : R; R += (Rnow - R) * Math.min(1, dt * 6);
        acc += dm; while (acc >= 1) { acc -= 1; hist.push([S, R]); if (hist.length > 91) hist.shift(); }
        chart.redraw({ hist, S, R });
        // vapour: in along the ground, up the core
        const on = clamp(s.w / 2, 0, 1), sp = 0.035 + s.w * 0.012;
        for (let i = 0; i < NV; i++) {
          const [a, b, d] = ph[i], p = (a + clock * sp) % 1, ang = b * 6.283; let x, y, z;
          if (p < 0.3) { const k = p / 0.3, r = 6 - 5.4 * k; x = Math.cos(ang) * r; z = Math.sin(ang) * r; y = 0.25 + 0.5 * k * k; }
          else { const k = (p - 0.3) / 0.7, r = 0.25 + d * 0.5; x = Math.cos(ang + k * 2) * r; z = Math.sin(ang + k * 2) * r; y = 0.75 + k * 10.4; }
          vap.put(i, x, y, z, on * (y > 2.2 ? 0.75 : 1) * (i / NV < 0.25 + s.w / 14 ? 1 : 0));
        }
        vap.done();
        // drops held aloft: they hang in a strong updraft and sink when it weakens
        sink += dt * Math.max(0, VT - s.w) * 0.28;
        const shown = Math.round((ND * S) / SMAX);
        for (let i = 0; i < ND; i++) {
          const [a, b, d, e] = ph[i], y0 = 2.4 + a * 7.2, y = 2.2 + ((((y0 - 2.2 - sink * (0.6 + e * 0.8)) % 7.6) + 7.6) % 7.6);
          drops.put(i, (b - 0.5) * 2.5, y + Math.sin(clock * 2 + i) * 0.08, (d - 0.5) * 2.5, i < shown ? 1 : 0, i < shown ? 1.5 : 0);
        }
        drops.done();
        rain.step(dt, clamp(R / 180, 0, 1), () => 0, 10);
        const dark = clamp(S / SMAX, 0, 1); puffs.forEach((c) => c.dark(0.15 + 0.6 * dark)); anvil.dark(0.1 + 0.3 * dark);
        lUp.element.innerHTML = s.w < 0.3 ? 'No updraft' : `Updraft <b>${s.w.toFixed(0)} m/s</b>`;
        lLoad.element.innerHTML = `Held aloft: <b>${S.toFixed(0)} mm</b>`;
        lRain.element.innerHTML = `Rain <b>${R.toFixed(0)} mm an hour</b>`; lRain.visible = R > 2;
        api.state = { S, R };
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        const pw = precipWater(s.td), C = inflow(s), holding = s.w >= VT - 0.5 && S < SMAX - 1;
        return compact(`<div class="big ${R >= IMD_BURST ? 'no' : ''}">${R >= IMD_BURST ? 'Cloudburst rate at the ground' : holding ? 'The updraft is holding the water up' : R > 5 ? 'The load is coming down' : S > 2 ? 'Water gathering aloft' : 'Clear air'}</div>
          <div class="row"><span>Held aloft: ${S.toFixed(0)} litres over each m²</span><b>${fmt(Math.round(S) * 1000)} tonnes per km²</b></div>
          <div class="row"><span>Rain at the ground</span><b>${R.toFixed(0)} mm an hour</b></div>
          <div class="row"><span>Vapour in the whole column, if all condensed</span><b>${pw.toFixed(0)} mm</b></div>
          <div class="row"><span>Vapour flowing up through cloud base</span><b>${C.toFixed(0)} mm an hour</b></div>
          <div class="row"><span>Raindrops in the core</span><b>${s.w >= VT ? 'hang or rise' : `sink at ${(VT - s.w).toFixed(1)} m/s`}</b></div>
          <small>${R > pw ? `An hour at this rate is ${(R / pw).toFixed(1)} times all the vapour overhead. The storm must keep pulling moist air in from around it.` : 'A storm is a pump, not a tank: moist air flows in at the bottom the whole time.'} A simple model: the core fills 20% of the storm, and 80% of the falling water reaches the ground.</small>`);
      },
    };
    return api;
  },
};
