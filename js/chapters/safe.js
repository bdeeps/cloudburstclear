// Chapter 6: cloudbursts in India, and staying safe.
// Model: a stream valley seen in cross-section (1 unit = 4 m), with a camp at a height you choose
// above the stream bed. A flood of Q cubic metres a second comes down from where it rained.
// - Depth and speed from Manning's equation (burst.js): bed 6 m wide, banks rising 1 m for every
//   1.5 m out, bed slope 0.08, roughness n = 0.06 for a bouldery mountain stream (Chow 1959).
//   200 m³/s gives about 2.9 m of water moving at about 7 m/s. A debris-flow front can stand higher.
// - The front travels at about that speed. Its roar is taken to be heard when it is within 1 km:
//   an assumption, and a generous one in heavy rain.
// The people and tents are drawn about 1.7 times life size so that you can see them.
// - People need 30 s to wake and gather, then climb at 0.15 m of height a second (about 540 m an
//   hour: a family at night in the rain; a fit hiker in daylight gains 0.2 to 0.3 m a second).
//   They are safe once they stand 2 m above the flood level.
// Events (sources in history.json): Leh, 6 August 2010: at least 255 dead by the official count; the
// airport gauge read 12.8 mm while a few km away at least 75 mm fell in 30 minutes (Hobley et al.
// 2012). Kedarnath, 16 to 17 June 2013: 325 mm in 24 hours at Chorabari (Wadia Institute) and the
// breach of the lake; more than 5,700 presumed dead. Amarnath, 8 July 2022: at least 16 dead; IMD
// measured 31 mm in two hours at the shrine. Himachal Pradesh, monsoon 2023: more than 400 deaths by
// state figures. Dharali, 5 August 2025, and Chashoti, 14 August 2025: reported as cloudbursts.
// Safety advice: NDMA flood and flash-flood do's and don'ts, and IMD's colour-coded warnings.
import { THREE, M, clamp, smooth, COL, HEX, manning, fmt, link, compact, fitNarrow, inReel, board, panelBg, slab, rockMat, makeCloud, tent, person, tree, boulder, rng } from '../burst.js';

const U = 0.25, LOOP = 14, MX = 40, HEAR = 1000, REACT = 30, CLIMB = 0.15, MARGIN = 2, BASE = 0.3;
const prof = (x) => (Math.abs(x) <= 3 ? 0 : Math.min((Math.abs(x) - 3) / 1.5, 22));     // metres
const xAt = (h) => 3 + 1.5 * h;
export function plan(s) {
  const f = manning(s.q), warn = Math.min(s.dist * 1000, HEAR) / f.v, travel = (s.dist * 1000) / f.v;
  const goal = f.y + MARGIN, climb = Math.max(0, goal - s.camp), need = climb > 0 ? REACT + climb / CLIMB : 0;
  const dry = s.camp >= f.y + 0.5, safe = dry || s.when === 'alert' || (s.when === 'roar' && need <= warn);
  return { ...f, warn, travel, goal, climb, need, dry, safe };
}
const fmtT = (sec) => (sec < 90 ? `${Math.round(sec)} seconds` : `${(sec / 60).toFixed(sec < 600 ? 1 : 0)} minutes`);
const VIEWS = { valley: { pos: [0.6, 3.0, 13.4], target: [0.6, 1.7, 0] }, map: { pos: [MX, 3.6, 9.6], target: [MX, 3.6, 0] } };
// Only the sea coast of the peninsula is drawn, from Kutch round to the Sundarbans; no land boundary is shown.
const COAST = [[68.2, 23.6], [70.2, 22.9], [69.1, 22.3], [70.4, 20.8], [72.2, 21.2], [72.6, 22.2], [72.8, 21.1], [72.8, 19], [73.3, 17], [73.8, 15.5], [74.8, 12.9], [75.8, 11.2], [76.3, 9.9], [76.9, 8.5], [77.55, 8.08], [78.2, 8.9], [79.2, 9.3], [79.85, 10.77], [80.3, 13.1], [80.1, 15.2], [81.1, 15.9], [82.3, 16.7], [83.3, 17.7], [84.9, 19.3], [85.8, 19.8], [87, 20.7], [87, 21.5], [88, 21.7], [89.1, 21.8]];
const HIMALAYA = [[74, 34.4], [76, 32.6], [78.5, 30.7], [81, 29.6], [84, 28.4], [86.5, 27.8], [88.4, 27.2], [91, 27.4], [93.5, 27.8], [96, 28.4]];
const EVENTS = [
  { n: 1, at: [77.58, 34.16], t: 'Leh, Ladakh: 6 August 2010', lx: 430, ly: 96 },
  { n: 2, at: [75.5, 34.21], t: 'Amarnath: 8 July 2022', lx: 40, ly: 250 },
  { n: 3, at: [76.2, 33.35], t: 'Chashoti, Kishtwar: 14 August 2025', lx: 40, ly: 290 },
  { n: 4, at: [77.17, 31.1], t: 'Himachal Pradesh: monsoon 2023', lx: 40, ly: 330 },
  { n: 5, at: [78.78, 31.04], t: 'Dharali, Uttarkashi: 5 August 2025', lx: 560, ly: 150 },
  { n: 6, at: [79.07, 30.73], t: 'Kedarnath: June 2013 (rain and a lake breach)', lx: 530, ly: 190 },
  { n: 7, at: [79.33, 30.4], t: 'Alaknanda valley: 20 July 1970', lx: 560, ly: 230 },
  { n: 8, at: [72.85, 19.09], t: 'Mumbai: 26 July 2005 (extreme rain)', lx: 290, ly: 540 },
  { n: 9, at: [78.47, 17.38], t: 'Hyderabad, Musi flood: 1908', lx: 560, ly: 640 },
];

export default {
  id: 'safe',
  short: 'India and staying safe',
  title: 'Cloudbursts in India and staying safe',
  subtitle: 'What has happened, why more people are in the way, and what to do.',
  view: VIEWS.valley,
  learn: `<p><b>What has happened.</b> Every figure here is an official count or a careful estimate, and behind each one is a family.</p>
    <p><b>Leh, Ladakh, 6 August 2010.</b> Around midnight a storm broke over a cold desert that normally gets about 100 mm of rain in a year. Mud and boulders ran through Leh and nearby villages. The official count is at least 255 dead. The airport gauge, a few kilometres away, recorded only 12.8 mm: scientists later estimated at least 75 mm in half an hour where the storm sat.</p>
    <p><b>Kedarnath, Uttarakhand, 16 and 17 June 2013.</b> Days of extreme rain, 325 mm in 24 hours near the shrine, fell on melting snow. Then the small Chorabari lake above the town broke out. More than 5,700 people were presumed dead across the state. It was more than a cloudburst: extreme rain and a lake breach together.</p>
    <p><b>Amarnath, 8 July 2022.</b> A flash flood swept through a pilgrims' camp set near a stream bed below the cave. At least 16 people died. IMD measured 31 mm in two hours at the shrine, far below its cloudburst mark, and called it a highly localised rain event higher up the slopes. The lesson was about <b>where the camp stood</b>.</p>
    <p><b>Himachal Pradesh, monsoon 2023.</b> Repeated spells of extreme rain in July and August brought floods, landslides and reported cloudbursts across the state. State figures put the season's toll at more than 400.</p>
    <p><b>2025.</b> On 5 August a torrent of mud and rock hit Dharali in Uttarkashi. On 14 August another struck Chashoti in Kishtwar, at a halt on a pilgrimage route; official figures a week later were 65 dead with many more missing. Both were reported as cloudbursts. Nearby gauges at Dharali recorded only light rain, and its cause is still being studied.</p>
    <p><b>Why more people are in the way.</b> The storms are old. What is new is how much stands in their path: roads cut along rivers, hotels and homes on stream banks and fans, and camps for pilgrims and tourists in the flat, open places that streams made. Studies of India's rain records also find very intense short bursts becoming more frequent in recent decades along the Himalayan foothills and the west coast.</p>
    <p><b>What to do</b> (from NDMA and IMD guidance).<br>1. <b>Never camp, park or build in a stream bed, a dry gully or on the bank</b>, however dry it looks. It may be raining upstream, out of sight.<br>2. <b>Heed IMD warnings.</b> Orange means be prepared. Red means take action: put off travel in the hills.<br>3. At a <b>sudden roar</b>, or if the stream <b>turns muddy or rises quickly</b>, move <b>uphill at once</b>, away from the channel. Do not wait for instructions, and do not stop for belongings.<br>4. <b>Do not cross</b> flowing water on foot or in a vehicle. Fifteen centimetres of fast water can knock an adult over.<br>5. Stay up. Floods often come in <b>several surges</b>.<br>6. Emergency number: <b>112</b>. NDMA helpline: <b>1078</b>.</p>
    <p>Related boxes: ${link('stormclear', 'StormClear')} for how a thundercloud grows and makes rain, ${link('landslideclear', 'LandslideClear')} for debris flows and slopes, FloodClear for river floods, and the siblings HailClear and FogClear.</p>
    <p class="tip"><b>Try it:</b> put the camp on the stream bank and let the family wait for the roar. Then raise the camp 10 m. Then open the map.</p>`,
  terms: [
    { t: 'NDMA', d: 'National Disaster Management Authority. It writes India\'s national guidelines and safety advice.' },
    { t: 'Colour-coded warning', d: 'IMD\'s four levels: green (no action), yellow (watch), orange (be prepared), red (take action).' },
    { t: 'Stream bed', d: 'The channel a stream flows in. A dry one is still a channel, and water will use it again.' },
    { t: 'Fan', d: 'The flat spread of gravel where a steep stream leaves the hills. Floods and debris spread over it.' },
    { t: 'Surge', d: 'One pulse of a flood or debris flow. Several can follow each other minutes apart.' },
    { t: 'Flash flood guidance', d: 'Forecasts of flash-flood risk for small catchments, issued by IMD for India and its neighbours since 2020.' },
  ],
  defaults: { focus: 'valley', q: 200, camp: 1, dist: 3, when: 'roar' },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'valley', label: 'The stream and the camp' }, { v: 'map', label: 'Map of events' }] },
    { key: 'camp', type: 'range', label: 'Height of the camp above the stream bed', min: 0, max: 16, step: 0.5, fmt: (v) => (v < 0.5 ? 'in the stream bed' : `${v.toFixed(1)} m up the bank`) },
    { key: 'when', type: 'seg', label: 'When they move', options: [{ v: 'alert', label: 'On the red alert' }, { v: 'roar', label: 'At the roar' }, { v: 'stay', label: 'They stay' }], hint: 'Red alert: hours before. Roar: heard when the flood is within about a kilometre, then 30 seconds to wake and gather.' },
    { key: 'q', type: 'range', label: 'Size of the flood', min: 20, max: 600, step: 10, fmt: (v) => `${v} m³/s · ${manning(v).y.toFixed(1)} m deep here`, hint: 'A cloudburst on the 10 km² catchment of chapter 4 gives a little over 200 m³/s.' },
    { key: 'dist', type: 'range', label: 'How far upstream it rained', min: 0.5, max: 10, step: 0.5, fmt: (v) => `${v.toFixed(1)} km` },
  ],
  quiz: [
    { q: 'You are camping in the hills in the monsoon. Where should the tent NOT go?', options: ['On a ridge', 'In a dry stream bed or on its bank', 'On a high terrace well above the stream', 'Beside a building on high ground'], answer: 1, why: 'A dry channel is still a channel. Rain you cannot see, kilometres upstream, can fill it in minutes.' },
    { q: 'At night the stream beside you suddenly roars and turns muddy. What do you do?', options: ['Pack the bags first', 'Move uphill at once, away from the channel', 'Run down the valley along the stream', 'Go and look'], answer: 1, why: 'Height is safety. Nobody outruns a flood along its own valley, and there may be only a minute or two.' },
    { q: 'At Amarnath in 2022, IMD measured 31 mm of rain in two hours at the shrine. What does that tell us?', options: ['Nothing happened', 'A deadly flash flood does not need a full cloudburst where you stand: where people camp matters as much as the rain', 'The gauge was broken', 'It was a cyclone'], answer: 1, why: 'The heavy rain fell higher up, and the camp stood near the stream bed. Being out of the channel is what protects people.' },
  ],
  reel: [
    { ms: 6500, caption: 'Never camp in a stream bed. At a sudden roar or a muddy rise in the water, move uphill at once, away from the channel.', set: { focus: 'valley', q: 200, camp: 1, dist: 3, when: 'roar' }, act: (s, inst) => inst.seek?.(4), view: { pos: [0.6, 3.0, 14], target: [0.6, 1.7, 0] }, spin: 0 },
  ],

  build({ stage }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const Z0 = -2.2, Z1 = 2.2, XM = 40;
    const land = slab(240, Z0, Z1, [rockMat(HEX.soil), rockMat(0x55854a), rockMat(HEX.soil)]); land.set(-XM * U, XM * U, (x) => prof(x / U) * U, () => -1.2); root.add(land);
    const bed = slab(8, Z0, Z1, rockMat(0x77705f)); bed.set(-3 * U, 3 * U, () => 0.012, () => -0.05); root.add(bed);
    const waterMat = new THREE.MeshStandardMaterial({ color: HEX.water, roughness: 0.3, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
    const water = slab(60, Z0, Z1 + 0.01, waterMat); root.add(water);
    const rnd = rng(12);
    const rocks = Array.from({ length: 14 }, () => { const b = boulder(0.1 + rnd() * 0.12, 0x5d5346); root.add(b); return { o: b, x: rnd() * 2 - 1, p: rnd(), s: 0.6 + rnd() * 0.8 }; });
    [[-20, 0.9], [-27, -1.2], [-33, 0.2], [22, -1.5], [30, 1.2], [35, -0.4], [-14, -1.6]].forEach(([x, z]) => { const t = tree(0.9); t.position.set(x * U, prof(x) * U, z); root.add(t); });
    const tents = [0xff9933, 0x4aa8ff, 0xe8e8e8].map((c, i) => { const t = tent(0.4, c); root.add(t); return t; });
    const fam = [0xffd35a, 0xff7a59, 0x8ef0ff, 0xffffff].map((c, i) => { const p = person(c, i === 2 ? 0.5 : 0.7); root.add(p); return p; });
    const cloud = makeCloud(root, [8.5, 7.6, -9], 2.0, 12, 8); cloud.dark(0.9);
    const lvl = new THREE.Mesh(new THREE.PlaneGeometry(XM * U * 2, 0.025), M.glow(HEX.bad, { transparent: true, opacity: 0.8 })); lvl.position.z = Z1 + 0.03; root.add(lvl);
    const lCamp = stage.label('', null, root), lFam = stage.label('', null, root), lW = stage.label('', null, root, 'hot'), lState = stage.label('', [4.4, 4.5, 0], root, 'hot'), lUp = stage.label('It rained upstream, out of sight', [7.2, 5.9, -9], root), lBed = stage.label('Stream bed', [0, -0.45, Z1], root);
    lW.element.style.setProperty('--c', COL.bad);
    const minor = [lUp, lBed, lCamp];
    const map = board(root, 7.4, 7.4, 1000, 1000, (g, w, h) => {
      panelBg(g, w, h);
      const X = (lon) => 60 + (lon - 67) * 29.5, Y = (lat) => 965 - (lat - 6.5) * 29.5;
      g.font = 'bold 30px sans-serif'; g.fillStyle = '#e8eef8'; g.fillText('Cloudbursts and flash floods in this box', 30, 44);
      g.lineCap = g.lineJoin = 'round';
      g.strokeStyle = 'rgba(106,184,255,.4)'; g.lineWidth = 46; g.beginPath(); HIMALAYA.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke();
      g.strokeStyle = '#8ef0ff'; g.lineWidth = 3; g.beginPath(); COAST.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke();
      g.font = '20px sans-serif'; g.fillStyle = 'rgba(255,255,255,.5)'; [[88.4, 22.6, 'Kolkata'], [80.27, 13.08, 'Chennai']].forEach(([x, y, t]) => { g.beginPath(); g.arc(X(x), Y(y), 4, 0, 7); g.fill(); g.fillText(t, X(x) + 9, Y(y) + 7); });
      g.fillStyle = COL.rain; g.font = 'bold 21px sans-serif'; g.fillText('Himalaya', X(84.5), Y(29.6));
      g.fillStyle = 'rgba(255,255,255,.4)'; g.font = '19px sans-serif'; g.fillText('Arabian Sea', X(67.5), Y(14)); g.fillText('Bay of Bengal', X(85.5), Y(13.5));
      EVENTS.forEach((e) => { const x = X(e.at[0]), y = Y(e.at[1]); g.font = '19px sans-serif'; g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(e.lx + (e.lx < x ? g.measureText(`${e.n}  ${e.t}`).width + 26 : -6), e.ly - 6); g.stroke();
        g.fillStyle = COL.warn; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.strokeStyle = '#111'; g.lineWidth = 2; g.stroke();
        g.font = 'bold 19px sans-serif'; g.fillStyle = COL.warn; g.fillText(String(e.n), e.lx, e.ly); g.fillStyle = '#e8eef8'; g.font = '19px sans-serif'; g.fillText(e.t, e.lx + 22, e.ly); });
      g.fillStyle = COL.soft; g.font = '18px sans-serif'; g.fillText('Blue: the Himalayan belt, where most of India\'s cloudbursts are reported (rough sketch).', 30, 930); g.fillText('Not every event here met the 100 mm an hour test. Only the sea coast is drawn.', 30, 955); g.fillText('Not a map of boundaries.', 30, 980);
    }, [MX, 3.6, 0]);
    let td = 0, key = '', focus = '';
    return {
      seek(v) { td = v; },
      update(dt, s, time) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, minor, -0.16, s.focus === 'valley' ? -0.13 : 0);
        if (s.focus !== focus) { if (focus && !inReel()) stage.setView(VIEWS[s.focus].pos, VIEWS[s.focus].target, 1); focus = s.focus; }
        map.mesh.scale.setScalar(narrow ? 0.62 : 1);
        const p = plan(s), k2 = `${s.q}|${s.camp}|${s.dist}|${s.when}`;
        if (k2 !== key) { if (key) td = 0; key = k2; }
        td = (td + dt) % LOOP;
        const tt = clamp((td - 2) / (LOOP - 6), 0, 1) * (p.warn + 14);                    // seconds since the roar was first heard
        const rise = smooth((tt - p.warn) / 7), depth = BASE + (p.y - BASE) * rise;
        water.set(-(3 + 1.5 * depth) * U, (3 + 1.5 * depth) * U, () => depth * U, (x) => prof(x / U) * U - 0.01);
        waterMat.color.setHex(HEX.water).lerp(new THREE.Color(HEX.mud), clamp(rise * 1.3, 0, 1));
        rocks.forEach((r, i) => { const z = Z0 + (((r.p + time * 0.5 * r.s) % 1) * (Z1 - Z0)); r.o.position.set(r.x * (2.5 + depth) * U, depth * U + 0.02, z); r.o.rotation.set(time * 4 * r.s, i, time * 3); r.o.visible = rise > 0.15; });
        lvl.position.y = p.y * U; lvl.visible = rise < 0.95;
        const cx = xAt(s.camp);
        tents.forEach((t, i) => { const xm = s.camp < 0.5 ? -1.6 + i * 1.6 : cx + 0.9 + i * 1.9; t.position.set(xm * U, prof(xm) * U, 0.9 - i * 0.9); const hit = depth > prof(xm) + 0.4; t.rotation.z = hit ? 0.9 : 0; t.visible = !(hit && rise > 0.9); });
        const top = Math.max(s.camp, p.goal), moved = s.when === 'alert' ? top : s.when === 'roar' ? Math.min(top, s.camp + Math.max(0, tt - REACT) * CLIMB) : s.camp;
        const caught = !p.safe && depth > moved + 0.3;
        fam.forEach((q, i) => { const h = Math.max(0, moved - i * 0.12), x = (s.camp < 0.5 && h < 0.2 ? 1.2 + i * 0.5 : xAt(h) + 0.3 + i * 0.5) * U; q.position.set(x, prof(x / U) * U, 1.5 - i * 0.25); q.visible = !caught; });
        lFam.position.set(fam[0].position.x + 0.6, fam[0].position.y + 1.25, 1.5); 
        lFam.element.innerHTML = caught ? 'The water reached them first' : p.dry && s.when !== 'alert' ? '<b>Above the flood</b>' : moved >= p.goal - 0.05 ? '<b>Above the flood</b>' : s.when === 'roar' && tt > REACT ? 'Climbing, away from the channel' : 'At the camp';
        lFam.element.className = 'lbl' + (caught ? ' hot' : ''); if (caught) lFam.element.style.setProperty('--c', COL.bad);
        lCamp.position.set((cx + 2.6) * U + 1.3, prof(cx) * U + 0.75, 0); lCamp.element.textContent = s.camp < 0.5 ? 'Camp in the stream bed' : `Camp ${s.camp.toFixed(1)} m above the bed`;
        lW.position.set(-(3 + 1.5 * p.y) * U - 1.9, p.y * U + 0.3, Z1); lW.element.innerHTML = `Flood level: <b>${p.y.toFixed(1)} m</b>`;
        lState.element.innerHTML = td < 2 ? 'A calm stream, ankle deep' : tt < p.warn ? `A roar upstream: the flood is ${fmtT(Math.max(0, p.warn - tt))} away` : 'A wall of water, mud and boulders. More surges may follow';
        lState.element.style.setProperty('--c', td < 2 ? COL.ok : COL.warn); lState.position.x = narrow ? 0.6 : 4.4; lState.visible = s.focus === 'valley';
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        if (s.focus === 'map') return '';
        const p = plan(s), under = p.y - s.camp;
        return compact(`<div class="big ${p.safe ? 'ok' : 'no'}">${p.dry ? 'The camp is above the flood' : s.when === 'alert' ? 'Safe: they moved up hours ago' : p.safe ? 'They climb clear, just in time' : s.when === 'stay' ? 'The camp is swept away' : 'The flood arrives before they are clear'}</div>
          <div class="row"><span>Flood in the channel</span><b>${p.y.toFixed(1)} m deep at ${p.v.toFixed(1)} m/s (${Math.round(p.v * 3.6)} km/h)</b></div>
          <div class="row"><span>The camp would be</span><b>${under > 0 ? `${under.toFixed(1)} m under water` : `${(-under).toFixed(1)} m above it`}</b></div>
          <div class="row"><span>From the rain to the camp, ${s.dist.toFixed(1)} km</span><b>${fmtT(p.travel)}</b></div>
          <div class="row"><span>Roar heard before it arrives</span><b>${fmtT(p.warn)}</b></div>
          <div class="row"><span>Time they need to get ${MARGIN} m above the flood</span><b>${p.climb > 0 ? fmtT(p.need) : 'none'}</b></div>
          <small>${p.dry ? 'A few metres of height is the whole difference. A debris-flow front can stand higher than this water level, so more height is better.' : s.when === 'alert' ? 'Acting on the warning is the only plan that does not depend on luck.' : 'Height is safety: every step should be up and away from the channel, never along it.'} Manning\'s equation for a steep, bouldery stream. The roar is assumed to carry about a kilometre.</small>`);
      },
    };
  },
};
