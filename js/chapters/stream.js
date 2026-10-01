// Chapter 4: from sky to stream. What a cloudburst does to a small, steep catchment.
// Model (burst.js): rain that falls faster than the ground can soak it up runs off (Horton 1933).
// Peak flow by the rational method, Q = (i − f) A / 3.6; the time for the whole catchment to feed
// the outlet from Kirpich (1940) with the stream length from Hack's law; the rise and fall by a
// simple time-area model. Soak-in rates f are typical values, not measurements: deep forest soil
// about 40 mm/h (the value LandslideClear uses), thin soil or grazed pasture about 15, bare rock or
// ground already soaked by days of monsoon rain about 4.
// Debris flows usually start in channels steeper than about 15° (Takahashi 1981; USGS).
// A water tanker lorry carries about 10,000 litres (10 m³). Six minutes of the storm pass each second.
// The terrain is a sketch: changing the area changes the numbers, not the picture.
import { THREE, clamp, smooth, COL, HEX, IMD_BURST, kirpich, peakFlow, flowAt, streamLen, fmt, link, compact, fitNarrow, inReel, board, panelBg, title, axes, curve, dot, placeBoard, terrain, bumps, mixHex, stream, makeRain, makeCloud, house, tree, boulder, rng } from '../burst.js';

const GROUND = [{ v: 'forest', label: 'Deep forest soil', f: 40 }, { v: 'thin', label: 'Thin soil, pasture', f: 15 }, { v: 'rock', label: 'Bare rock or soaked ground', f: 4 }];
const soak = (v) => (GROUND.find((g) => g.v === v) || GROUND[1]).f;
const D2R = Math.PI / 180, MPS = 6, REF = 15;
export function catchment(s) {
  const f = soak(s.ground), S = Math.tan(s.slope * D2R), tc = kirpich(s.area, S), run = Math.max(0, s.rain - f);
  const Qp = peakFlow(s.rain, f, s.area) * Math.min(1, s.dur / tc), tPeak = Math.min(tc, s.dur), end = Math.max(90, s.dur + tc + 15);
  const vol = (run * s.dur / 60) * s.area * 1000;                               // m³
  return { f, S, tc, run, Qp, tPeak, end, vol, debris: s.slope >= 15 && Qp > 5, Q: (t) => flowAt(t, s.rain, f, s.area, tc, s.dur) };
}
const fmtQ = (q) => (q < 10 ? q.toFixed(1) : fmt(Math.round(q)));

export default {
  id: 'stream',
  short: 'From sky to stream',
  title: 'From sky to stream',
  subtitle: 'Rain that the ground cannot drink runs downhill, and a small steep valley gathers it into a wall of water in minutes.',
  view: { pos: [0, 6.6, 18], target: [0, -0.3, 0.8] },
  learn: `<p>Soil is a sponge, but a slow one. Deep forest soil can soak up perhaps 40 mm of rain an hour. Thin soil manages 15. Bare rock, or ground already soaked by days of monsoon rain, takes almost none. Whatever falls faster than the ground can drink <b>runs off</b> over the surface.</p>
    <p>In a cloudburst that is most of the rain. Every slope in the <b>catchment</b> sheds water into its gully, and every gully into the stream. On steep ground the water moves fast, so it all arrives at the mouth of the valley <b>at almost the same time</b>. A stream you could step across becomes a torrent of hundreds of cubic metres a second, within <b>half an hour</b> of the first heavy drops. This is a <b>flash flood</b>.</p>
    <p>In steep channels the flood picks up soil, gravel, trees and boulders the size of cars. The mix turns thick, like wet concrete, and travels as a <b>debris flow</b>: a roaring front of mud and rock, often arriving in surges. It does far more damage than water alone. Villages, roads and camps are often built on the flat <b>fan</b> where the stream leaves the hills, which is exactly where it spreads out. How debris flows move is in ${link('landslideclear', 'LandslideClear')}, and river floods are the subject of FloodClear.</p>
    <p>Three things set how bad it is. <b>Area</b>: a bigger catchment gathers more water. <b>Slope</b>: a steeper one delivers it sooner, so the warning is shorter. <b>Ground</b>: the less it soaks up, the more runs off.</p>
    <p class="tip"><b>Try it:</b> run a cloudburst over thin soil. Then switch to deep forest soil. Then drop the rain to 30 mm an hour and see when the stream stops noticing.</p>`,
  terms: [
    { t: 'Catchment', d: 'All the land that drains to one point on a stream. Also called a watershed or basin.' },
    { t: 'Infiltration', d: 'Rain soaking into the ground. Each soil has a top speed for it.' },
    { t: 'Run-off', d: 'Rain that cannot soak in and flows over the surface to the stream.' },
    { t: 'Flash flood', d: 'A flood that rises within minutes to a few hours of the rain that causes it.' },
    { t: 'Hydrograph', d: 'A graph of a stream\'s flow against time. A flash flood makes a sharp spike.' },
    { t: 'Debris flow', d: 'A fast flow of water thick with mud, rock and wood, usually down a steep gully.' },
    { t: 'Cumec', d: 'One cubic metre of water a second: 1,000 litres every second.' },
  ],
  defaults: { rain: 100, dur: 60, area: 10, slope: 15, ground: 'thin' },
  controls: [
    { key: 'rain', type: 'range', label: 'How hard it rains', min: 0, max: 150, step: 5, fmt: (v) => `${v} mm an hour${v >= IMD_BURST ? ' · cloudburst' : ''}` },
    { key: 'dur', type: 'range', label: 'For how long', min: 10, max: 90, step: 5, fmt: (v) => `${v} minutes` },
    { key: 'ground', type: 'seg', label: 'The ground', options: GROUND.map((g) => ({ v: g.v, label: g.label })), fmt: (v) => `soaks up ${soak(v)} mm an hour` },
    { key: 'area', type: 'range', label: 'Size of the catchment', min: 1, max: 50, step: 1, fmt: (v) => `${v} km² · stream about ${streamLen(v).toFixed(1)} km long` },
    { key: 'slope', type: 'range', label: 'Steepness of the stream', min: 2, max: 30, step: 1, fmt: (v) => `${v}°`, ends: ['Gentle', 'Himalayan gully'] },
    { type: 'buttons', label: 'The storm', items: [{ label: 'Start the storm again', act: (s, inst) => inst.seek?.(0) }] },
  ],
  quiz: [
    { q: 'It rains at 100 mm an hour on ground that can soak up 15 mm an hour. What happens to the rest?', options: ['It evaporates', 'It runs off over the surface into gullies and the stream', 'It waits on the slope', 'It soaks in later'], answer: 1, why: 'Rain faster than the soil can drink becomes run-off: 85 mm an hour here, which on 10 square kilometres is more than 200 cubic metres every second.' },
    { q: 'Why do steep mountain streams rise so fast?', options: ['The water is colder', 'Water runs quickly down steep ground, so the whole catchment reaches the stream mouth within minutes of each other', 'Mountains have more soil', 'They do not'], answer: 1, why: 'Steep slopes mean short travel times. The flood peak can arrive well under an hour after the rain begins, which leaves very little warning.' },
    { q: 'Why is the flat fan where a stream leaves the hills a risky place to build?', options: ['It is too windy', 'It is where the flood and debris spread out when they leave the gully', 'The soil is poor', 'It is too far from water'], answer: 1, why: 'The fan was built by earlier floods and debris flows. It is flat and tempting, and it is in the path.' },
  ],
  reel: [
    { ms: 5500, caption: 'The ground can soak up only so much. In a cloudburst most of the rain runs straight off the slopes.', set: { rain: 100, dur: 60, area: 10, slope: 15, ground: 'thin' }, act: (s, inst) => inst.seek?.(0), view: { pos: [0, 6.6, 18], target: [0, -0.3, 0.8] }, spin: 0 },
    { ms: 6000, caption: 'A stream you could step across carries 200 tonnes of water a second within half an hour, with mud and boulders.', set: { rain: 100, dur: 60, area: 10, slope: 15, ground: 'thin' }, act: (s, inst) => inst.seek?.(8), view: { pos: [0, 6.6, 18], target: [0, -0.3, 0.8] }, spin: 0 },
  ],

  build({ stage }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const landG = new THREE.Group(); root.add(landG);
    const xc = (z) => 0.5 * Math.sin(z * 0.7);
    const TR = [[[-3.6, -3.4], [xc(-0.5), -0.5]], [[3.5, -1.8], [xc(1.2), 1.2]]];
    const dSeg = (x, z, [a, b]) => { const vx = b[0] - a[0], vz = b[1] - a[1], k = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz), 0, 1); return Math.hypot(x - a[0] - vx * k, z - a[1] - vz * k); };
    const hC = (x, z) => {
      const d = Math.abs(x - xc(z)), fan = smooth((3.5 - z) / 1.3);
      let y = Math.max(0, 3.3 - z) * 0.4 + 0.4 * Math.pow(d, 1.25) * fan + 0.22 * Math.pow(Math.max(0, -z - 2), 1.5);
      TR.forEach((t) => { y -= 0.3 * Math.exp(-((dSeg(x, z, t) / 0.38) ** 2)) * fan; });
      if (d < 0.24) y -= 0.1 * (1 - (d / 0.24) ** 2);
      return y + 0.05 * bumps(x * 1.6, z * 1.6) * fan * smooth(d);
    };
    const cC = (x, z, y) => { const d = Math.abs(x - xc(z)); return d < 0.2 ? 0x6b6557 : z > 3.3 ? mixHex(0x8f8a6c, 0x6f9a55, clamp(d / 2.5, 0, 1)) : y > 3.4 ? mixHex(0x66705f, HEX.rock, (y - 3.4) / 1) : mixHex(0x5f9a4d, 0x3f7240, clamp(y / 3, 0, 1)); };
    landG.add(terrain(10, 10, 90, 90, hC, cC, { cz: -0.4 }));
    const main = stream(70), tribs = TR.map(() => stream(30)); landG.add(main, ...tribs);
    const mainPath = (t) => { const z = -4.6 + 9.2 * t; return [xc(z), hC(xc(z), z), z]; };
    const tribPath = (tr) => (t) => { const x = tr[0][0] + (tr[1][0] - tr[0][0]) * t, z = tr[0][1] + (tr[1][1] - tr[0][1]) * t; return [x, hC(x, z), z]; };
    const rnd = rng(4);
    const trees = Array.from({ length: 60 }, () => { const x = -4.6 + rnd() * 9.2, z = -5 + rnd() * 8, t = tree(0.32 + rnd() * 0.2); root.add(t); return { o: t, x, z }; }).filter((t) => { const ok = Math.abs(t.x - xc(t.z)) > 0.45 && hC(t.x, t.z) < 3.3; if (!ok) root.remove(t.o); return ok; });
    [[-0.9, 3.9], [-1.5, 4.2], [0.9, 3.8], [1.4, 4.25], [-0.75, 4.4], [0.8, 4.4], [2.0, 3.9], [-2.2, 3.9]].forEach(([x, z], i) => { const h = house(0.3, i % 2 ? 0xe2d6bd : 0xd3c3a0); h.position.set(x, hC(x, z), z); h.rotation.y = i; root.add(h); });
    const rocks = Array.from({ length: 16 }, () => { const b = boulder(0.07 + rnd() * 0.08, 0x5d5346); landG.add(b); return { o: b, p: rnd(), z: (rnd() - 0.5) }; });
    const rain = makeRain(root, 900, [-4.6, 4.6, 6.2, -5, 3.2]);
    const clouds = [[-2.6, 6.5, -3, 1.5], [0.6, 6.8, -1.6, 1.8], [3, 6.5, -2.6, 1.5], [-0.8, 6.5, 0.8, 1.3]].map(([x, y, z, sc], i) => makeCloud(root, [x, y, z], sc, 9, 40 + i));
    const chart = board(root, 10, 4.25, 800, 340, (g, w, h, st) => {
      panelBg(g, w, h); if (!st) return;
      const m = st.m; g.fillStyle = '#e8eef8'; g.font = 'bold 26px sans-serif'; g.fillText('The stream at the valley mouth, in cubic metres a second', 20, 36);
      const yMax = Math.max(20, Math.ceil((m.Qp * 1.7) / 50) * 50), step = yMax <= 100 ? 20 : yMax <= 300 ? 50 : yMax <= 1000 ? 200 : 500, ticks = []; for (let v = 0; v <= yMax; v += step) ticks.push(v);
      const xt = []; for (let v = 0; v <= m.end; v += 30) xt.push(v);
      const A = axes(g, w, h, { xMin: 0, xMax: m.end, yMin: 0, yMax, xTicks: xt, yTicks: ticks, xFmt: (v) => `${v}`, xLabel: 'minutes since the rain began', y1: 62, y0: h - 64, x0: 80 });
      // the rain, hanging from the top: what soaks in (green) and what runs off (blue)
      const top = 62, hh = 62, x1 = A.X(st.s.dur), kf = st.s.rain > 0 ? Math.min(1, m.f / st.s.rain) : 0;
      if (st.s.rain > 0) { g.fillStyle = 'rgba(163,230,53,.55)'; g.fillRect(A.x0, top, x1 - A.x0, hh * kf * (st.s.rain / 150)); g.fillStyle = 'rgba(106,184,255,.8)'; g.fillRect(A.x0, top + hh * kf * (st.s.rain / 150), x1 - A.x0, hh * (1 - kf) * (st.s.rain / 150)); }
      g.font = '20px sans-serif'; const lx = Math.min(x1 + 12, w - 230); g.fillStyle = COL.ok; g.fillText(`rain that soaks in: ${Math.min(m.f, st.s.rain)} mm/h`, lx, top + 20); g.fillStyle = COL.rain; g.fillText(`rain that runs off: ${m.run} mm/h`, lx, top + 46);
      const pts = []; for (let t = 0; t <= m.end; t += m.end / 160) pts.push([A.X(t), A.Y(m.Q(t))]);
      g.fillStyle = 'rgba(255,90,138,.16)'; g.beginPath(); g.moveTo(A.x0, A.y0); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(A.x1, A.y0); g.closePath(); g.fill();
      curve(g, pts, COL.bad, 4);
      if (m.Qp > 0.5) { g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.fillText(`peak ${fmtQ(m.Qp)} m³/s`, A.x0 + 14, A.Y(m.Qp) + 30); }
      dot(g, A.X(clamp(st.t, 0, m.end)), A.Y(m.Q(st.t)), '#fff', 9);
    });
    const lFan = stage.label('Village on the fan, at the valley mouth', [0, 0.95, 4.5], root), lC = stage.label('', [3.4, 3.6, -3.4], root), lNow = stage.label('', [1.5, 1.5, 2.6], root, 'hot'), lDeb = stage.label('Mud and boulders: a debris flow', [-1.9, 1.6, 1.4], root, 'hot');
    lDeb.element.style.setProperty('--c', COL.mud);
    const minor = [lC, lFan, lDeb];
    let tm = 0, hold = 0, kY = -1;
    const api = {
      seek(v) { tm = v; hold = 0; },
      update(dt, s, time) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, minor), m = catchment(s);
        placeBoard(chart, [[0, -2.3, 4.7], 0, 1], [[0, -2.3, 4.7], 0, 1]);
        if (tm >= m.end) { hold += dt; if (hold > 2.5 && !inReel()) { tm = 0; hold = 0; } } else tm = Math.min(m.end, tm + dt * MPS);
        const k = clamp(Math.tan(s.slope * D2R) / Math.tan(REF * D2R), 0.3, 1.9);
        if (k !== kY) { kY = k; landG.scale.y = k; trees.forEach((t) => t.o.position.set(t.x, hC(t.x, t.z) * k, t.z)); }
        const Q = m.Q(tm), raining = tm < s.dur && s.rain > 0, wide = clamp(Math.sqrt(Q / 400), 0, 1), mud = clamp(Q / 60, 0, 1) * (m.debris ? 1.2 : 0.7);
        main.set(mainPath, (t) => 0.05 + 0.5 * wide * (0.35 + 0.65 * t) * (t > 0.86 ? 1 + (t - 0.86) * 9 : 1), 0.03 + 0.1 * wide); main.tint(mud);
        tribs.forEach((tb, i) => { tb.set(tribPath(TR[i]), (t) => 0.03 + 0.24 * wide * t, 0.03 + 0.05 * wide); tb.tint(mud); });
        rocks.forEach((r, i) => { const t = (r.p + time * 0.22 * (0.8 + (i % 3) * 0.2)) % 1, p = mainPath(0.25 + 0.75 * t), on = m.debris && Q > 0.25 * m.Qp && Q > 5; r.o.position.set(p[0] + r.z * wide * 0.6, p[1] + 0.12 * wide + 0.05, p[2]); r.o.rotation.set(time * 3 + i, i, time * 2); r.o.visible = on; r.o.scale.set(1, 1 / k, 1); });
        rain.step(dt, raining ? clamp(0.08 + 0.92 * Math.pow(s.rain / 110, 0.6), 0, 1) : 0, (x, z) => hC(x, z) * k, 10);
        clouds.forEach((c, i) => { c.dark(raining ? 0.3 + 0.7 * clamp(s.rain / 100, 0, 1) : 0.15); c.position.x += Math.sin(time * 0.2 + i * 2) * 0.0012; });
        chart.redraw({ m, s, t: tm });
        lC.element.textContent = `Catchment: ${s.area} km²`;
        lNow.element.innerHTML = `${Math.round(tm)} min: <b>${fmtQ(Q)} m³/s</b>`; lNow.element.style.setProperty('--c', Q > 20 ? COL.bad : COL.e);
        lDeb.visible = lDeb.visible && m.debris && Q > 0.25 * m.Qp;
        api.state = { tm, Q };
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        const m = catchment(s), Q = m.Q(tm);
        return compact(`<div class="big ${m.Qp > 20 ? 'no' : 'ok'}">${m.Qp < 0.05 ? 'The ground soaks it all up' : `Peak ${fmtQ(m.Qp)} m³/s, ${Math.round(m.tPeak)} minutes after the rain starts`}</div>
          <div class="row"><span>Now, at ${Math.round(tm)} minutes</span><b>${fmtQ(Q)} m³/s</b></div>
          <div class="row"><span>Rain ${s.rain} − soaks in ${Math.min(m.f, s.rain)} = runs off</span><b>${m.run} mm an hour</b></div>
          <div class="row"><span>Whole catchment reaches the mouth in</span><b>${Math.round(m.tc)} minutes</b></div>
          <div class="row"><span>The peak, in 10,000 litre water tankers</span><b>${m.Qp / 10 < 10 ? (m.Qp / 10).toFixed(1) : fmt(Math.round(m.Qp / 10))} every second</b></div>
          <small>${m.run <= 0 ? 'Rain this gentle soaks in. The stream barely notices.' : m.debris ? 'A channel this steep can pick up mud, trees and boulders and run as a debris flow, which is denser and far more destructive than water.' : 'On a gentler channel this stays a flash flood of muddy water.'} Typical soak-in rates and textbook formulas (rational method, Kirpich): real valleys differ.</small>`);
      },
    };
    return api;
  },
};
