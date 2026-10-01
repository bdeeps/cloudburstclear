// Chapter 1: what a cloudburst is, measured the way meteorologists measure it: with a rain gauge.
// The India Meteorological Department (IMD) calls it a cloudburst when a station gets 100 mm (10 cm)
// of rain or more in one hour (IMD Monsoon FAQ: "If 10 cm rainfall is received at a station in one hour,
// the rain event is termed as cloud burst"). The patch of about 20 to 30 square kilometres is the figure
// usually quoted with it; it is not in that FAQ.
// 1 mm of rain is 1 litre on every square metre, so 100 mm is 100 litres (100 kg) per square metre,
// and 100 mm over 25 km² is 2.5 million tonnes of water.
// The four kinds of rain compared: drizzle about 1 mm/h; a heavy monsoon day of 100 mm in 24 hours
// (IMD calls 64.5 to 115.5 mm in a day "heavy rain") = 4.2 mm/h; a heavy shower 20 mm/h; a cloudburst 100 mm/h.
// Leh's normal rainfall for a whole year is about 100 mm (IMD climatological normals).
// One second of the model is five minutes. The gauges are drawn far larger than life.
import { THREE, clamp, smooth, COL, HEX, IMD_BURST, fmt, compact, fitNarrow, inReel, board, panelBg, placeBoard, terrain, bumps, mixHex, stream, makeRain, makeCloud, house, tree, gauge } from '../burst.js';

const KINDS = [
  { v: 'drizzle', name: 'Drizzle', rate: 1 },
  { v: 'day', name: 'Heavy monsoon day', rate: 100 / 24 },
  { v: 'shower', name: 'Heavy shower', rate: 20 },
  { v: 'burst', name: 'Cloudburst', rate: 100 },
];
const kind = (v) => KINDS.find((k) => k.v === v) || KINDS[3];
const PATCH = 25;                                                  // km², the middle of IMD's 20 to 30
const fmtRate = (r) => (r < 10 ? r.toFixed(1) : r.toFixed(0));
const tonnes = (mm) => mm * PATCH * 1000;                          // 1 mm on 1 km² = 1,000 tonnes
const big = (t) => (t >= 1e6 ? `${(t / 1e6).toFixed(2)} million tonnes` : `${fmt(Math.round(t / 100) * 100)} tonnes`);
const need = (r) => { const h = IMD_BURST / r; return h <= 1 ? '1 hour' : h < 48 ? `${fmt(h, h < 10 ? 1 : 0)} hours` : `${fmt(h / 24, 1)} days`; };

export default {
  id: 'gauge',
  short: 'An hour of rain like a month',
  title: 'An hour of rain like a month',
  subtitle: 'A cloudburst is 100 mm of rain or more in a single hour, over a patch only a few kilometres wide.',
  view: { pos: [0, 4.4, 16.4], target: [0, 1.2, 0.6] },
  learn: `<p>Rain is measured as a <b>depth</b>: how deep the water would stand if none of it drained away. A <b>rain gauge</b> is just a tube that catches it. <b>One millimetre of rain is one litre of water on every square metre.</b></p>
    <p>The India Meteorological Department (IMD) calls it a <b>cloudburst</b> when a place gets <b>100 mm of rain or more in one hour</b>. That is 100 litres, ten full buckets, on every square metre. Such rain usually falls on a small patch, often quoted as about <b>20 to 30 square kilometres</b>: one valley gets it and the next stays almost dry.</p>
    <p>How much is 100 mm? <b>Leh</b>, in the cold desert of Ladakh, normally gets about that much in a <b>whole year</b>. Many towns get it in a rainy month. A heavy monsoon day can bring 100 mm too, but spread over 24 hours, the ground and the streams can carry it away. A cloudburst delivers it <b>24 times faster</b>.</p>
    <p>So a cloudburst is not a special kind of rain. It is ordinary rain at an <b>extraordinary rate</b>, on a small area. Over a 25 square kilometre patch, 100 mm is <b>2.5 million tonnes</b> of water, landing on steep ground in one hour. The rest of this box is about where that water comes from, why mountains bring it down, and what it does next.</p>
    <p class="tip"><b>Try it:</b> all four gauges fill at once. Pick each kind of rain and watch the valley. How long would a drizzle need to match one hour of cloudburst?</p>`,
  terms: [
    { t: 'Cloudburst', d: 'Rain of 100 mm or more in one hour at a place, usually over only 20 to 30 square kilometres (IMD).' },
    { t: 'Rain gauge', d: 'A tube that catches rain so its depth can be read in millimetres.' },
    { t: 'Millimetre of rain', d: 'One litre of water on every square metre of ground.' },
    { t: 'Rain rate', d: 'How fast rain is falling, in millimetres an hour. Also called intensity.' },
    { t: 'IMD', d: 'India Meteorological Department, the national weather service, founded in 1875.' },
    { t: 'Mini cloudburst', d: 'A name some Indian scientists use for 50 mm or more in two hours in a row. Far more common than a full cloudburst.' },
  ],
  defaults: { kind: 'burst', t: 0, play: true },
  controls: [
    { key: 'kind', type: 'seg', label: 'Rain over the valley', options: KINDS.map((k) => ({ v: k.v, label: k.name })), fmt: (v) => `${fmtRate(kind(v).rate)} mm an hour` },
    { key: 't', type: 'range', label: 'Minutes of rain', min: 0, max: 60, step: 0.5, fmt: (v) => `${Math.round(v)} min`, ends: ['Start', 'One hour'] },
    { key: 'play', type: 'toggle', label: 'Let time run', hint: 'One second here is five minutes.' },
  ],
  quiz: [
    { q: 'What does IMD call a cloudburst?', options: ['Any heavy rain with thunder', '100 mm of rain or more in one hour at a place', 'A cloud that splits in two', '100 mm of rain in a day'], answer: 1, why: 'The mark is 100 mm (10 cm) in an hour, usually over a patch of only 20 to 30 square kilometres.' },
    { q: 'How much water is 100 mm of rain on one square metre?', options: ['1 litre', '10 litres', '100 litres', '1,000 litres'], answer: 2, why: 'One millimetre of rain is one litre on a square metre. So 100 mm is 100 litres, which weighs 100 kg.' },
    { q: 'A heavy monsoon day and a cloudburst can both bring 100 mm. What is the difference?', options: ['The cloudburst rain is colder', 'The cloudburst brings it in one hour, not 24, so the ground and streams cannot carry it away', 'Monsoon rain is not real rain', 'There is no difference'], answer: 1, why: 'The total is the same. The rate is 24 times higher, and it is the rate that overwhelms soil and streams.' },
  ],
  reel: [
    { ms: 5500, caption: 'A cloudburst is 100 mm of rain in one hour, on a patch only a few kilometres wide.', set: { kind: 'burst', play: false }, anim: { t: [0, 34] }, view: { pos: [0.4, 6.4, 15.5], target: [0.4, 1.9, 0.6] }, spin: 0 },
    { ms: 5500, caption: 'That is 100 litres on every square metre. A drizzle would need four days to match it.', set: { kind: 'burst', play: false }, anim: { t: [34, 60] }, view: { pos: [0.4, 2.6, 13.5], target: [0.4, 0.9, 3.4] }, spin: 0 },
  ],

  build({ stage }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    // The valley: a stream winding towards you between two ridges.
    const xc = (z) => 0.65 * Math.sin(z * 0.55 + 0.4);
    const hV = (x, z) => {
      const d = Math.abs(x - xc(z)), down = (4 - z) * 0.075;
      const bed = d < 0.24 ? -0.11 * (1 - (d / 0.24) ** 2) : 0;
      const side = 0.62 * Math.pow(Math.max(0, d - 1.25), 1.3);
      return down + bed + side * (1 + 0.1 * bumps(x, z)) + 0.035 * bumps(x * 2, z * 2) * smooth((d - 0.5) / 1.2);
    };
    const cV = (x, z, y) => { const d = Math.abs(x - xc(z)); return d < 0.22 ? 0x6f6a5c : y > 3.5 ? HEX.snow : y > 2.2 ? mixHex(0x66705f, HEX.rock, (y - 2.2) / 1) : mixHex(0x5f9a4d, 0x3f7240, clamp((d - 1) / 2, 0, 1)); };
    root.add(terrain(11.6, 9, 96, 72, hV, cV, { cz: -0.3 }));
    const river = stream(70); root.add(river);
    const path = (t) => { const z = -4.8 + 9 * t; return [xc(z), hV(xc(z), z), z]; };
    const rnd = (i, k) => ((i * 0.618 + k * 0.371) % 1);
    for (let i = 0; i < 11; i++) { const z = -0.8 + rnd(i, 1) * 3.4, sd = i % 2 ? 1 : -1, x = xc(z) + sd * (0.5 + rnd(i, 2) * 0.65); const h = house(0.24 + rnd(i, 3) * 0.08, i % 3 ? 0xe2d6bd : 0xd3c3a0, i % 4 ? 0x9a4a36 : 0x51708a); h.position.set(x, hV(x, z), z); h.rotation.y = rnd(i, 4) * 3; root.add(h); }
    for (let i = 0; i < 46; i++) { const z = -4.3 + rnd(i, 5) * 8, sd = i % 2 ? 1 : -1, x = xc(z) + sd * (1.5 + rnd(i, 6) * 2.3), y = hV(x, z); if (y > 2.4) continue; const t = tree(0.34 + rnd(i, 7) * 0.22); t.position.set(x, y, z); root.add(t); }
    const rain = makeRain(root, 900, [-5, 5, 6.4, -4.6, 3.9]);
    const clouds = [[-3.2, 6.5, -2, 1.5], [0.2, 6.9, -0.6, 1.9], [3.3, 6.5, -1.8, 1.5], [-1.2, 6.6, 2, 1.4], [2.2, 6.7, 1.6, 1.4]].map(([x, y, z, sc], i) => makeCloud(root, [x, y, z], sc, 9, 3 + i));
    // Four gauges on a bench at the front.
    const GX = [-3.3, -1.1, 1.1, 3.3], GZ = 5.3;
    const bench = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.16, 1.0), new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.8 })); bench.position.set(0, -0.08, GZ); bench.receiveShadow = true; root.add(bench);
    const gs = KINDS.map((k, i) => { const g = gauge(2.3, 0.26); g.position.set(GX[i], 0, GZ); root.add(g); return g; });
    const mark = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.012, 0.012), new THREE.MeshBasicMaterial({ color: HEX.bad, toneMapped: false })); mark.position.set(0, 2.28, GZ); root.add(mark);
    const strip = board(root, 8.6, 1.5, 1376, 240, (g, w, h, st) => {
      panelBg(g, w, h); if (!st) return;
      KINDS.forEach((k, i) => {
        const x = 172 + i * 344, on = k.v === st.kind, mm = (k.rate * st.t) / 60;
        g.textAlign = 'center'; g.fillStyle = on ? COL.e : '#e8eef8'; g.font = 'bold 34px sans-serif'; g.fillText(k.name, x, 50);
        g.font = '26px sans-serif'; g.fillStyle = COL.soft; g.fillText(`${fmtRate(k.rate)} mm an hour`, x, 88);
        g.font = 'bold 58px sans-serif'; g.fillStyle = mm >= IMD_BURST ? COL.bad : COL.rain; g.fillText(`${mm < 10 ? mm.toFixed(1) : mm.toFixed(0)} mm`, x, 160);
        g.font = '24px sans-serif'; g.fillStyle = COL.soft; g.fillText(`after ${Math.round(st.t)} min`, x, 200);
        if (on) { g.strokeStyle = COL.e; g.lineWidth = 4; g.strokeRect(x - 164, 8, 328, 222); }
      });
      g.textAlign = 'left';
    });
    const lMark = stage.label('100 mm: the cloudburst mark', [4.55, 2.5, GZ], root, 'hot'); lMark.element.style.setProperty('--c', COL.bad);
    const lG = stage.label('Rain gauges, drawn far larger than life', [0, 3.05, GZ], root), lV = stage.label('Village', [1.6, 1.25, 1.2], root), lS = stage.label('Stream', [-0.9, 0.6, 3.4], root);
    const minor = [lG, lV, lS, lMark];
    let hold = 0;
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        fitNarrow(stage, minor);
        if (s.play && !inReel()) { if (s.t >= 60) { hold += dt; if (hold > 3.5) { s.t = 0; hold = 0; } } else s.t = Math.min(60, s.t + dt * 5); }
        const t = clamp(s.t, 0, 60), k = kind(s.kind), mm = (k.rate * t) / 60;
        placeBoard(strip, [[0, -0.95, GZ + 0.5], 0, 1], [[0, -0.95, GZ + 0.5], 0, 1]);
        KINDS.forEach((q, i) => gs[i].set((q.rate * t) / 60));
        strip.redraw({ kind: s.kind, t });
        const vis = t > 0.2 ? clamp(0.06 + 0.94 * Math.pow(k.rate / 100, 0.55), 0, 1) : 0;
        rain.step(dt, vis, hV, 8 + 5 * vis);
        clouds.forEach((c, i) => { c.dark(0.25 + 0.75 * Math.pow(k.rate / 100, 0.5)); c.position.x += Math.sin(time * 0.25 + i * 1.7) * 0.0012; });
        // The stream: a trickle, until rain falls faster than the ground can drink (about 25 mm an hour here).
        const flood = clamp(((k.rate - 25) / 75) * smooth(t / 35), 0, 1);
        river.set(path, 0.07 + 0.03 * Math.min(1, mm / 20) + 0.26 * flood, 0.05 + 0.09 * flood); river.tint(flood * 1.2);
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        const k = kind(s.kind), t = clamp(s.t, 0, 60), mm = (k.rate * t) / 60;
        return compact(`<div class="big ${mm >= IMD_BURST ? 'no' : ''}">${k.name}: ${fmtRate(k.rate)} mm an hour</div>
          <div class="row"><span>Rain after ${Math.round(t)} minutes</span><b>${mm < 10 ? mm.toFixed(1) : mm.toFixed(0)} mm</b></div>
          <div class="row"><span>On every square metre</span><b>${mm < 10 ? mm.toFixed(1) : mm.toFixed(0)} litres</b></div>
          <div class="row"><span>On a 25 km² patch</span><b>${big(tonnes(mm))}</b></div>
          <div class="row"><span>Time to reach 100 mm at this rate</span><b>${need(k.rate)}</b></div>
          <small>${k.v === 'burst' ? 'IMD calls 100 mm or more in an hour a cloudburst. Leh normally gets about this much in a year.' : k.v === 'day' ? 'The same 100 mm, spread over a day. Soil and streams can mostly keep up.' : k.v === 'shower' ? 'A heavy shower rarely lasts the hour. Even if it did, it would bring a fifth of a cloudburst.' : 'Drizzle soaks in as fast as it falls.'}</small>`);
      },
    };
  },
};
