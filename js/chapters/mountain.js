// Chapter 3: why mountains make cloudbursts. A cross-section from the plains (left) into the hills (right).
// Model (the "upslope" model, Smith 1979, with the ingredients of Doswell, Brooks and Maddox 1996):
// - Wind U blowing at a slope of angle α is forced up at w = U sin α.
// - The air carries q kg of vapour per kg (from its dew point, at 900 hPa); air density ρ = 1.0 kg/m³.
// - Rain rate under the storm R = E ρ w q, with E = 0.5: about half the lifted vapour reaches the
//   ground as rain there (the rest blows on as cloud or evaporates). Real efficiencies vary widely.
// - Rain at one place = R × the time the storm spends overhead. A storm 6 km wide drifting at c km/h
//   is overhead for 6 ÷ c hours; a stalled storm, held by the valley and fed from below, stays the hour.
// - Cloud base (lifting condensation level): about 125 m for each °C between temperature and dew
//   point (Espy's rule), with the plains at 30 °C.
// The picture is not to scale: the slope rises over a fixed 6 units, and one cycle of 12 s is an hour.
import { THREE, M, clamp, smooth, COL, HEX, IMD_BURST, mixQ, rainRate, compact, fitNarrow, inReel, board, panelBg, title, placeBoard, slab, rockMat, makeRain, makeCloud, dots, house, tree, gauge, rng } from '../burst.js';
import { arrow } from '../kit.js';

const EFF = 0.5, RHO = 1.0, WIDTH = 6, CYCLE = 12, XV = 0.6, D2R = Math.PI / 180;
export function mountainModel(s) {
  const w = s.wind * Math.sin(s.slope * D2R), q = mixQ(s.td, 900), R = rainRate(EFF, RHO, w, q);
  const dur = s.drift < 6 ? 60 : (WIDTH / s.drift) * 60, total = (R * dur) / 60;
  return { w, q, R, dur, total, lcl: 0.125 * (30 - s.td) };
}

export default {
  id: 'mountain',
  short: 'Why mountains make them',
  title: 'Why mountains make them',
  subtitle: 'A steep slope forces moist air up fast, and a valley can hold the storm in one place.',
  view: { pos: [0, 2.6, 20.5], target: [0, 1.9, 0] },
  learn: `<p>Most of India's cloudbursts happen in the <b>Himalaya</b> and its foothills, in the monsoon months. Mountains supply the three things a cloudburst needs.</p>
    <p><b>1. Lift.</b> Monsoon wind from the plains meets a wall of hills and has nowhere to go but <b>up</b>. This is <b>orographic lift</b>. A wind of 10 m/s meeting a 20° slope rises at more than 3 m/s, far faster than air rises over flat land. Rising air cools, its vapour condenses, and the heat set free makes it rise faster still.</p>
    <p><b>2. Moisture.</b> The warmer and damper the air, the more vapour each kilogram carries up the slope. Monsoon air from the Bay of Bengal or the Arabian Sea holds close to 20 grams in every kilogram.</p>
    <p><b>3. Time.</b> Rain at one place is the <b>rate multiplied by how long it lasts</b>. On the plains a storm usually drifts on, and each village gets a few minutes of it. In the mountains, ridges block the storm, valley winds keep feeding it from below, and new cells grow where the old ones were. The storm <b>stalls</b>, and one valley takes the whole hour.</p>
    <p>That is the recipe: <b>fast lift, moist air, and a storm that stays put</b>. It also explains why cloudbursts are so local. The next valley, with a different slope and wind, may get almost nothing. Slopes also help start hailstorms: that story is in HailClear.</p>
    <p class="tip"><b>Try it:</b> start with the storm drifting at 30 km/h and note the rain at the village. Then slow it until it stalls. Then flatten the slope and see how much the mountain was doing.</p>`,
  terms: [
    { t: 'Orographic lift', d: 'Air forced to rise because a mountain is in its way.' },
    { t: 'Windward side', d: 'The side of a mountain the wind blows on to. It gets the lift and most of the rain.' },
    { t: 'Condensation level', d: 'The height at which rising air has cooled enough for cloud to form. It is the flat base of the cloud.' },
    { t: 'Stalled storm', d: 'A storm that stays over one place, often because new cells keep growing where the old ones were.' },
    { t: 'Precipitation efficiency', d: 'The share of the water vapour lifted into a storm that reaches the ground as rain.' },
    { t: 'Monsoon', d: 'The seasonal wind that brings moist air from the sea over India from June to September.' },
  ],
  defaults: { wind: 10, td: 22, slope: 20, drift: 30 },
  controls: [
    { key: 'wind', type: 'range', label: 'Wind blowing at the slope', min: 2, max: 16, step: 0.5, fmt: (v) => `${v.toFixed(1)} m/s (${Math.round(v * 3.6)} km/h)` },
    { key: 'td', type: 'range', label: 'Moisture in the air (dew point)', min: 10, max: 26, step: 0.5, fmt: (v) => `${v.toFixed(1)} °C · ${(mixQ(v, 900) * 1000).toFixed(1)} g of vapour per kg`, ends: ['Dry', 'Monsoon'] },
    { key: 'slope', type: 'range', label: 'How steep the slope is', min: 3, max: 35, step: 1, fmt: (v) => `${v}°`, ends: ['Gentle hills', 'Himalayan wall'] },
    { key: 'drift', type: 'range', label: 'How fast the storm drifts away', min: 0, max: 40, step: 1, fmt: (v) => (v < 6 ? `${v} km/h · it stalls over the valley` : `${v} km/h`), ends: ['Stalled', 'Moves on'], hint: 'A storm 6 km wide. Below 6 km/h it is still overhead when the hour ends.' },
  ],
  quiz: [
    { q: 'What is orographic lift?', options: ['Air rising because the ground is hot', 'Air forced upward because a mountain is in its way', 'Wind blowing down a valley at night', 'Rain lifting dust'], answer: 1, why: 'Wind cannot go through a mountain, so it climbs the slope. The steeper the slope and the stronger the wind, the faster the air rises.' },
    { q: 'Two storms rain at 120 mm an hour. One crosses a village in 10 minutes, the other sits over it for an hour. What does the village get?', options: ['120 mm from both', '20 mm from the first and 120 mm from the second', '120 mm from the first and 20 mm from the second', 'Nothing from either'], answer: 1, why: 'Rain at a place is rate times time. Ten minutes at 120 mm an hour is 20 mm. Only the stalled storm is a cloudburst for that village.' },
    { q: 'Why can one valley be devastated while the next is almost dry?', options: ['Cloudbursts are only a few kilometres wide, and each valley has its own slope and wind', 'Rain avoids some valleys', 'The next valley is always higher', 'It is never like that'], answer: 0, why: 'The storm is small and anchored to the terrain. IMD\'s definition speaks of a patch of only 20 to 30 square kilometres.' },
  ],
  reel: [
    { ms: 6000, caption: 'Mountains make them: moist monsoon wind is forced up a steep slope, and the valley holds the storm in place.', set: { wind: 10, td: 23, slope: 22 }, anim: { drift: [36, 0] }, act: (s, inst) => inst.seek?.(0), view: { pos: [0, 2.2, 24], target: [0, 1.2, 0] }, spin: 0 },
  ],

  build({ stage }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const Z0 = -1.5, Z1 = 1.5, X0 = -9, X1 = 9;
    let Hc = 2;
    const ter = (x) => (x < -3 ? 0 : x < 3 ? (Hc * (x + 3)) / 6 : Hc * (1 - 0.34 * smooth((x - 3) / 2.4) + 0.3 * smooth((x - 5.6) / 3)));
    const land = slab(180, Z0, Z1, [rockMat(HEX.soil), rockMat(0x4f8a45), rockMat(HEX.soil)]); root.add(land);
    const props = new THREE.Group(); root.add(props);
    const rnd = rng(9), spots = Array.from({ length: 26 }, () => [X0 + rnd() * 18, Z0 + 0.2 + rnd() * 2.6, 0.4 + rnd() * 0.25]);
    const trees = spots.map(([x, z, h]) => { const t = tree(h); props.add(t); return { o: t, x, z }; });
    const homes = [[XV - 0.5, 0.5], [XV + 0.1, -0.6], [XV + 0.6, 0.6], [XV - 0.1, 1.1], [-6.5, 0.3], [-5.6, -0.7]].map(([x, z]) => { const h = house(0.34); props.add(h); return { o: h, x, z }; });
    const gg = gauge(1.5, 0.16, IMD_BURST); root.add(gg);
    const NW = 170, vap = dots(root, NW, HEX.vap, 0.075), cld = dots(root, NW, 0xffffff, 0.085);
    const ph = Array.from({ length: NW }, () => [rnd(), 0.15 + rnd() * 2.6, Z0 + 0.2 + rnd() * 2.6]);
    const stack = [[0, 0, 1.25], [0.2, 1.3, 1.45], [-0.1, 2.7, 1.5], [0.3, 4.0, 1.9]].map(([x, y, sc], i) => { const c = makeCloud(root, [0, 0, 0], sc * 0.75, 9, 20 + i, 0.8); c.off = [x, y]; c.s0 = sc * 0.75; return c; });
    const rain = makeRain(root, 420, [0, 1, 3, Z0, Z1], 0.4);
    const aWind = arrow(HEX.vap, 2, 0.4, 0.07); aWind.rotation.z = -Math.PI / 2; root.add(aWind);
    const aUp = arrow(0x8ef0ff, 2, 0.4, 0.07); root.add(aUp);
    const lclLine = new THREE.Mesh(new THREE.PlaneGeometry(18, 0.03), M.glow(0xffffff, { transparent: true, opacity: 0.45 })); root.add(lclLine);
    const lWind = stage.label('', null, root, 'hot'), lUp = stage.label('', null, root, 'hot'), lLcl = stage.label('', null, root), lV = stage.label('', null, root, 'hot'), lPl = stage.label('Plains', [-7.6, -0.45, Z1], root), lSt = stage.label('', null, root);
    lWind.element.style.setProperty('--c', COL.vap); lUp.element.style.setProperty('--c', COL.e);
    const minor = [lPl, lLcl, lSt];
    const chart = board(root, 14, 4.2, 800, 240, (g, w, h, st) => {
      panelBg(g, w, h); if (!st) return;
      g.fillStyle = '#e8eef8'; g.font = 'bold 26px sans-serif'; g.fillText('Rain at one place = how hard × how long', 20, 36);
      const x0 = 330, x1 = w - 40, X = (v) => x0 + ((x1 - x0) * clamp(v, 0, 300)) / 300;
      g.font = '21px sans-serif';
      [['How hard: under the storm', st.R, 'mm an hour', COL.rain, 92], [`× ${Math.round(st.dur)} min overhead: village gets`, st.total, 'mm in the hour', st.total >= IMD_BURST ? COL.bad : COL.ok, 164]].forEach(([name, v, unit, col, y]) => {
        g.fillStyle = COL.soft; g.textAlign = 'left'; g.fillText(name, 20, y - 6);
        g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x0, y - 30, x1 - x0, 46); g.fillStyle = col; g.fillRect(x0, y - 30, X(v) - x0, 46);
        g.fillStyle = '#fff'; g.font = 'bold 28px sans-serif'; g.fillText(`${v.toFixed(0)}`, 20, y + 24); g.font = '21px sans-serif'; g.fillStyle = COL.soft; g.fillText(unit, 20 + 17 * String(v.toFixed(0)).length + 10, y + 24);
      });
      g.strokeStyle = COL.bad; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(X(100), 52); g.lineTo(X(100), 196); g.stroke(); g.setLineDash([]);
      g.fillStyle = COL.bad; g.font = '20px sans-serif'; g.textAlign = 'center'; g.fillText('100 mm: cloudburst', X(100), 224);
      g.fillStyle = COL.soft; [0, 200, 300].forEach((v) => g.fillText(String(v), X(v), 224)); g.textAlign = 'left';
    });
    let clock = 0, key = '';
    const api = {
      seek(v) { clock = v; },
      update(dt, s) {
        dt = Math.max(0, dt); clock += dt;
        fitNarrow(stage, minor);
        const m = mountainModel(s);
        placeBoard(chart, [[0, -2.75, Z1 + 0.4], 0, 1], [[0, -2.9, Z1 + 0.4], 0, 1]);
        if (key !== String(s.slope)) {
          key = String(s.slope); Hc = 6 * Math.tan(s.slope * D2R);
          land.set(X0, X1, ter, () => -0.5);
          trees.forEach((t) => t.o.position.set(t.x, ter(t.x), t.z)); homes.forEach((t) => t.o.position.set(t.x, ter(t.x), t.z));
          gg.position.set(XV + 1.35, ter(XV + 1.35), 1.0);
        }
        chart.redraw(m);
        // the hour, played in 12 seconds: the storm sits over the village for dur minutes, then drifts off
        const f = (clock % CYCLE) / CYCLE, fOver = m.dur / 60, over = f < fOver;
        const xs = over ? XV + (fOver < 1 ? (f / fOver - 0.5) * 1.6 : Math.sin(clock * 0.5) * 0.25) : XV + 0.8 + ((f - fOver) / Math.max(0.01, 1 - fOver)) * 9;
        const fade = over ? Math.min(1, (f / Math.max(0.02, fOver)) * 6 + (fOver >= 1 ? 1 : 0)) : 1, size = clamp(0.45 + m.R / 160, 0.45, 1.5) * (0.5 + 0.5 * fade);
        const base = Math.max(m.lcl, ter(xs) + 0.5);
        stack.forEach((c) => { c.position.set(xs + c.off[0] * size, base + 0.55 * size + c.off[1] * size * 0.8, 0); c.scale.setScalar(c.s0 * size * (0.75 + c.off[1] * 0.12)); c.dark(clamp(m.R / 120, 0.1, 1)); c.visible = xs < X1 - 0.5; });
        rain.box = [xs - 1.1 * size, xs + 1.1 * size, base + 0.3, Z0 + 0.2, Z1 - 0.2];
        rain.step(dt, xs < X1 - 0.5 ? clamp(m.R / 130, 0, 1) * fade : 0, (x) => ter(x), 9);
        const mmNow = (m.R * Math.min(f * 60, m.dur)) / 60;
        gg.set(mmNow);
        // air: along the plains, up the slope; vapour turns to cloud above the condensation level
        for (let i = 0; i < NW; i++) {
          const [a, h0, z] = ph[i], x = X0 + ((a + clock * s.wind * 0.0065) % 1) * 18, y = ter(x) * Math.exp(-h0 / 4.5) + h0, cloudy = y > m.lcl && x > -3.5;
          vap.put(i, x, y, z, cloudy ? 0 : 1); cld.put(i, x, y, z, cloudy ? 1 : 0);
        }
        vap.done(); cld.done();
        aWind.position.set(-8.6, 1.1, Z1 + 0.3); aWind.set(0.6 + s.wind * 0.16);
        aUp.position.set(-1.3, ter(-1.3) + 0.5, Z1 + 0.3); aUp.rotation.z = -(Math.PI / 2 - s.slope * D2R); aUp.set(0.5 + m.w * 0.3);
        lclLine.position.set(0, m.lcl, Z0 - 0.05);
        lWind.position.set(-7.4, 1.75, Z1 + 0.3); lWind.element.innerHTML = `Moist wind <b>${s.wind.toFixed(0)} m/s</b>`;
        lUp.position.set(-2.6, ter(-1.3) + 1.6 + m.w * 0.12, Z1 + 0.3); lUp.element.innerHTML = `Forced up at <b>${m.w.toFixed(1)} m/s</b>`;
        lLcl.position.set(7.2, m.lcl + 0.3, Z0); lLcl.element.textContent = `Cloud forms above ${m.lcl.toFixed(1)} km`;
        lV.position.set(XV + 1.35, ter(XV + 1.35) + 2.0, 1.0); lV.element.innerHTML = `Village gauge: <b>${mmNow.toFixed(0)} mm</b>`; lV.element.style.setProperty('--c', mmNow >= IMD_BURST ? COL.bad : COL.ok);
        lSt.position.set(Math.min(xs, 7.4), Math.min(base + 5.2 * size + 0.9, 8.2), 0); lSt.element.textContent = over ? (m.dur >= 60 ? 'The storm stalls over the valley' : 'Storm overhead') : 'It has moved on'; lSt.visible = lSt.visible && xs < X1 - 0.5;
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        const m = mountainModel(s), burst = m.total >= IMD_BURST;
        return compact(`<div class="big ${burst ? 'no' : 'ok'}">${burst ? 'Cloudburst' : m.R >= IMD_BURST ? 'Cloudburst rate, but it moves on' : 'Not a cloudburst'}: ${m.total.toFixed(0)} mm in the hour</div>
          <div class="row"><span>Rain rate under the storm</span><b>${m.R.toFixed(0)} mm an hour</b></div>
          <div class="row"><span>Storm stays over the village for</span><b>${m.dur >= 60 ? 'the whole hour' : `${Math.round(m.dur)} minutes`}</b></div>
          <div class="row"><span>Lift: ${s.wind.toFixed(1)} m/s wind on a ${s.slope}° slope</span><b>${m.w.toFixed(1)} m/s upward</b></div>
          <div class="row"><span>Vapour in each kilogram of air</span><b>${(m.q * 1000).toFixed(1)} g</b></div>
          <small>Rate = half of (air density × lift × vapour). Rain at the village = rate × time overhead. A simple model of a messy thing: real storms also draw extra lift from the heat set free as vapour condenses.</small>`);
      },
    };
    return api;
  },
};
