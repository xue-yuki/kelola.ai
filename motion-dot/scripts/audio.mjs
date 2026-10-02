// Score + SFX for "Satu Titik", synthesized in code. 120 BPM; every
// bounce, morph and zoom in index.html has a matching cue here.
import fs from 'node:fs';
import path from 'node:path';
import { writeWav } from '../../motion/scripts/wav.mjs';

const SR = 44100;
const DUR = 45;
const N = DUR * SR;
const BEAT = 0.5;
const BAR = 2;
const OUT = path.resolve('out');
fs.mkdirSync(OUT, { recursive: true });

const music = new Float32Array(N);
const duckable = new Float32Array(N); // pads + bass, sidechained to the kick
const sfx = new Float32Array(N);
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;

function osc(buf, t0, dur, freq, o = {}) {
  const { type = 'sine', vol = 0.1, a = 0.005, r = 0.08, decay = 0, slide = null, lp = 1, detune = 0 } = o;
  const s0 = Math.floor(t0 * SR);
  const len = Math.floor((dur + r) * SR);
  let ph = 0;
  let ph2 = 0.3;
  let y = 0;
  for (let i = 0; i < len; i++) {
    const k = s0 + i;
    if (k < 0 || k >= N) continue;
    const t = i / SR;
    const f = slide ? freq * Math.pow(slide / freq, Math.min(1, t / dur)) : freq;
    ph = (ph + f / SR) % 1;
    ph2 = (ph2 + (f * (1 + detune)) / SR) % 1;
    const wave = (p) =>
      type === 'saw' ? 2 * p - 1 : type === 'square' ? (p < 0.5 ? 1 : -1) : type === 'tri' ? 4 * Math.abs(p - 0.5) - 1 : Math.sin(2 * Math.PI * p);
    let v = detune ? (wave(ph) + wave(ph2)) * 0.5 : wave(ph);
    y += lp * (v - y);
    let env = Math.min(1, t / a);
    if (decay) env *= Math.exp(-t / decay);
    if (t > dur) env *= Math.max(0, 1 - (t - dur) / r);
    buf[k] += y * env * vol;
  }
}

function noise(buf, t0, dur, o = {}) {
  const { vol = 0.05, lp = 0.5, hp = 0, decay = 0, sweep = null } = o;
  const s0 = Math.floor(t0 * SR);
  const len = Math.floor(dur * SR);
  let y = 0;
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const k = s0 + i;
    if (k < 0 || k >= N) continue;
    const t = i / SR;
    const a = sweep ? sweep[0] + (sweep[1] - sweep[0]) * Math.pow(t / dur, 2) : lp;
    y += a * (rnd() - y);
    let v = y;
    if (hp) {
      v = y - prev;
      prev = y;
    }
    let env = Math.min(1, t / 0.003) * Math.min(1, (dur - t) / 0.01);
    if (decay) env *= Math.exp(-t / decay);
    buf[k] += v * env * vol;
  }
}

// ---- drums --------------------------------------------------------------
const kick = (t, v = 0.5) => {
  osc(music, t, 0.16, 150, { vol: v, slide: 42, r: 0.05, a: 0.001 });
  noise(music, t, 0.012, { vol: 0.08, lp: 0.9 });
};
const clap = (t, v = 0.12) => {
  for (const d of [0, 0.011, 0.022]) noise(music, t + d, 0.12, { vol: v, lp: 0.7, hp: 1, decay: 0.035 });
};
const hat = (t, v = 0.05, open = false) => noise(music, t, open ? 0.18 : 0.04, { vol: v, lp: 0.98, hp: 1, decay: open ? 0.06 : 0.012 });
const kicks = [];

// ---- harmony ------------------------------------------------------------
const PROG = [
  [53, 57, 60, 64], // Fmaj7
  [55, 59, 62, 67], // G
  [52, 55, 59, 62], // Em7
  [57, 60, 64, 69], // Am
];
const chordAt = (t) => PROG[Math.floor(t / BAR) % 4];

function pad(t0, t1, vol = 0.035) {
  for (let b = Math.floor(t0 / BAR); b * BAR < t1; b++) {
    const s = Math.max(t0, b * BAR);
    const e = Math.min(t1, (b + 1) * BAR);
    for (const m of chordAt(b * BAR)) osc(duckable, s, e - s, mtof(m), { type: 'saw', detune: 0.004, vol, a: 0.25, r: 0.35, lp: 0.06 });
  }
}
function bass(t0, t1, vol = 0.16) {
  for (let t = t0; t < t1 - 1e-6; t += BEAT / 2) {
    const root = chordAt(t)[0] - 24;
    osc(duckable, t, BEAT / 2 - 0.03, mtof(root), { type: 'tri', vol, r: 0.02, lp: 0.5 });
    osc(duckable, t, BEAT / 2 - 0.03, mtof(root), { type: 'sine', vol: vol * 0.8, r: 0.02 });
  }
}
function plucks(t0, t1, vol = 0.05, step = BEAT / 2) {
  const pat = [0, 2, 1, 3, 2, 1, 3, 2];
  let k = 0;
  for (let t = t0; t < t1 - 1e-6; t += step, k++) {
    const ch = chordAt(t);
    const m = ch[pat[k % pat.length]] + 12;
    osc(music, t, 0.03, mtof(m), { type: 'tri', vol, decay: 0.16, r: 0.25, lp: 0.6 });
    osc(music, t, 0.03, mtof(m + 12), { vol: vol * 0.25, decay: 0.08, r: 0.15 });
  }
}
function drums(t0, t1, o = {}) {
  for (let t = t0; t < t1 - 1e-6; t += BEAT) {
    const beat = Math.round(t / BEAT) % 4;
    if (o.kick !== false) {
      kick(t);
      kicks.push(t);
    }
    if (o.clap !== false && (beat === 1 || beat === 3)) clap(t);
    hat(t + BEAT / 2, 0.05, beat === 3);
    if (o.busy) hat(t + BEAT / 4, 0.025);
  }
}
const riser = (t0, t1, v = 0.07) => {
  noise(music, t0, t1 - t0, { vol: v, sweep: [0.01, 0.6] });
  osc(music, t0, t1 - t0, 220, { type: 'saw', slide: 880, vol: v * 0.25, lp: 0.08, a: 0.5, r: 0.02 });
};


// ---- score --------------------------------------------------------------
pad(0, 4, 0.02);
for (let t = 2; t < 4; t += BEAT) hat(t + BEAT / 2, 0.025);
riser(3.0, 4.0, 0.05);
// groove while the dot works
pad(4, 24, 0.02);
bass(4, 24);
drums(4, 14, {});
drums(14, 24, { busy: true });
plucks(4, 14, 0.04);
plucks(14, 24, 0.035, BEAT / 4);
// breakdown: the zoom out
pad(24, 33, 0.045);
for (const m of [29, 41]) osc(music, 24.2, 8.6, mtof(m), { type: 'saw', detune: 0.006, vol: 0.05, a: 2.5, r: 1.5, lp: 0.03 });
plucks(28.6, 33, 0.022, BEAT);
// build: the swarm
pad(33, 36.5, 0.04);
plucks(33, 36.5, 0.04, BEAT / 4);
for (let t = 34.5, i = 0; t < 36.45; i++) {
  noise(music, t, 0.06, { vol: 0.03 + i * 0.002, lp: 0.6, hp: 1, decay: 0.03 });
  t += t < 35.5 ? BEAT / 2 : BEAT / 4;
}
riser(34.5, 36.5, 0.09);
// drop: logo lands
pad(36.5, 44, 0.022);
bass(36.5, 44);
drums(36.5, 44, {});
plucks(36.5, 44, 0.04);
for (const m of [41, 53, 57, 60, 64, 72]) osc(music, 44, 0.6, mtof(m), { type: 'saw', detune: 0.005, vol: m < 50 ? 0.08 : 0.028, a: 0.01, r: 0.9, lp: 0.08 });
kick(44, 0.5);

const duck = new Float32Array(N).fill(1);
for (const k of kicks) {
  const s = Math.floor(k * SR);
  for (let i = 0; i < 0.3 * SR && s + i < N; i++) duck[s + i] = Math.min(duck[s + i], 0.35 + 0.65 * Math.pow(i / (0.3 * SR), 0.6));
}
for (let i = 0; i < N; i++) music[i] += duckable[i] * duck[i];

// ---- SFX ----------------------------------------------------------------
const fx = {
  boop: (t, v = 0.2, f = 220) => osc(sfx, t, 0.12, f, { vol: v, slide: f * 0.45, a: 0.001, r: 0.08 }),
  tick: (t, m = 84, v = 0.05) => osc(sfx, t, 0.012, mtof(m), { type: 'tri', vol: v, decay: 0.02, r: 0.03 }),
  click: (t, v = 0.05) => noise(sfx, t, 0.02, { vol: v, lp: 0.9, hp: 1, decay: 0.006 }),
  pop: (t, v = 0.07, f = 500) => osc(sfx, t, 0.06, f, { vol: v, slide: f * 2.2, r: 0.04 }),
  bloop: (t, d, up = true, v = 0.08) => osc(sfx, t, d, up ? 260 : 700, { vol: v, slide: up ? 700 : 240, a: 0.01, r: 0.05 }),
  whoosh: (t, d = 0.3, v = 0.06, up = true) => noise(sfx, t, d, { vol: v, sweep: up ? [0.03, 0.55] : [0.55, 0.03] }),
  impact: (t, v = 0.3) => {
    osc(sfx, t, 0.35, 90, { vol: v, slide: 38, a: 0.001, r: 0.2 });
    noise(sfx, t, 0.5, { vol: v * 0.3, lp: 0.35, decay: 0.15 });
  },
  ding: (t, m = 88, v = 0.05) => {
    osc(sfx, t, 0.02, mtof(m), { vol: v, decay: 0.3, r: 0.6 });
    osc(sfx, t, 0.02, mtof(m + 7), { vol: v * 0.4, decay: 0.2, r: 0.5 });
  },
  coin: (t, v = 0.05) => {
    osc(sfx, t, 0.05, mtof(88), { type: 'square', vol: v * 0.6, r: 0.01, lp: 0.4 });
    osc(sfx, t + 0.05, 0.03, mtof(93), { type: 'square', vol: v * 0.6, decay: 0.12, r: 0.25, lp: 0.4 });
  },
  sweep: (t, d, f0, f1, v = 0.03) => osc(sfx, t, d, f0, { type: 'tri', slide: f1, vol: v, a: 0.05, r: 0.05 }),
};

// 1. drop + bounces
fx.whoosh(0.4, 0.6, 0.03);
[[1.0, 0.24, 200], [1.75, 0.15, 240], [2.25, 0.09, 280], [2.5, 0.05, 320], [2.62, 0.03, 360]].forEach(([t, v, f]) => fx.boop(t, v, f));
// 2. chat
fx.sweep(3.9, 0.7, 300, 900, 0.025);
fx.click(4.5, 0.04);
fx.pop(4.55, 0.07);
[4.6, 4.65, 4.7].forEach((t, i) => fx.tick(t, 84 + i * 3, 0.04));
for (let t = 4.85; t < 5.5; t += 0.11) fx.click(t, 0.022);
fx.bloop(5.75, 0.4, true, 0.09);
fx.tick(6.5, 91, 0.03);
fx.pop(7.1, 0.06, 420);
// 3. receipt
fx.bloop(8.0, 0.4, false, 0.07);
fx.whoosh(8.4, 0.85, 0.05, false);
fx.click(8.6, 0.05);
fx.coin(9.25);
for (let t = 9.3; t < 10.3; t += 0.034) noise(sfx, t, 0.012, { vol: 0.03, lp: 0.8, hp: 1, decay: 0.004 });
[9.7, 9.9].forEach((t) => fx.tick(t, 86, 0.04));
for (let t = 10.2; t < 10.9; t += 0.05) fx.tick(t, 96, 0.012);
fx.impact(11.0, 0.12);
// 4. hop to donut
fx.bloop(12.5, 0.2, true, 0.07);
fx.boop(13.25, 0.15, 230);
fx.boop(13.9, 0.1, 280);
fx.sweep(14.0, 0.5, 200, 600, 0.04);
fx.sweep(14.6, 0.9, 700, 420, 0.025);
fx.click(15.5, 0.04);
fx.click(15.6, 0.04);
// 5. chart
fx.pop(18.0, 0.07, 600);
fx.whoosh(18.4, 0.6, 0.03);
[19.1, 19.75, 20.4, 21.05, 21.7, 22.35].forEach((t, i) => fx.tick(t, [72, 74, 76, 79, 81, 84][i], 0.06));
fx.whoosh(22.55, 0.8, 0.05);
fx.ding(23.35, 91, 0.06);
fx.click(23.4, 0.04);
// 6. zoom out
fx.whoosh(23.8, 1.0, 0.04, false);
noise(sfx, 25.2, 5.8, { vol: 0.06, sweep: [0.45, 0.01] });
fx.sweep(25.2, 5.8, 900, 90, 0.03);
for (let i = 0; i < 40; i++) {
  const t = 28.7 + i * 0.09 + (i % 3) * 0.02;
  fx.tick(t, [76, 79, 81, 84, 86, 88, 91][i % 7], 0.018);
}
// 7. swarm + landing
noise(sfx, 33.0, 2.5, { vol: 0.05, sweep: [0.02, 0.5] });
fx.whoosh(35.8, 0.7, 0.05);
fx.impact(36.5, 0.38);
fx.boop(36.85, 0.08, 300);
// 8. flood + end card
fx.whoosh(37.4, 0.6, 0.08);
fx.impact(38.0, 0.3);
for (let i = 0; i < 9; i++) fx.tick(38.1 + i * 0.045, 84 + i, 0.03);
fx.whoosh(38.7, 0.4, 0.03);
fx.click(39.2, 0.04);
fx.pop(39.8, 0.08);

// ---- master -------------------------------------------------------------
const out = new Float32Array(N);
for (let i = 0; i < N; i++) out[i] = 0.89 * Math.tanh((music[i] + sfx[i]) * 0.95);
for (let i = Math.floor(44.3 * SR); i < N; i++) out[i] *= Math.max(0, (DUR - i / SR) / 0.7);
for (let i = 0; i < 0.02 * SR; i++) out[i] *= i / (0.02 * SR);
writeWav(path.join(OUT, 'audio.wav'), [out, out], SR);
console.log('audio ->', path.join(OUT, 'audio.wav'));
