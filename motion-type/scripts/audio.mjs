// Score + SFX for the typography piece, synthesized in code. 120 BPM so
// every slam, wipe and card beat lands on the grid used in index.html.
import fs from 'node:fs';
import path from 'node:path';
import { writeWav } from '../../motion/scripts/wav.mjs';

const SR = 44100;
const DUR = 28;
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

// intro
pad(0, 4, 0.03);
plucks(1.0, 4, 0.03, BEAT);
for (let t = 2; t < 4; t += BEAT) hat(t + BEAT / 2, 0.03);
riser(3.0, 4.0);
// main
pad(4, 22, 0.022);
bass(4, 22);
drums(4, 22, {});
plucks(4, 8, 0.045);
plucks(8, 12, 0.04, BEAT / 4);
plucks(12, 16, 0.045);
plucks(16, 20, 0.04, BEAT / 4);
plucks(20, 22, 0.05);
// breakdown for the tagline
pad(22, 24, 0.04);
plucks(22.25, 23.5, 0.035, BEAT);
riser(23.0, 24.0, 0.09);
// end chord
for (const m of [41, 53, 57, 60, 64, 72]) osc(music, 24, 2.6, mtof(m), { type: 'saw', detune: 0.005, vol: m < 50 ? 0.09 : 0.03, a: 0.01, r: 1.3, lp: 0.08 });
osc(music, 24, 2.6, mtof(29), { vol: 0.18, a: 0.005, r: 1.3 });
kick(24, 0.6);
noise(music, 24, 2.0, { vol: 0.07, lp: 0.95, hp: 1, decay: 0.6 });

// sidechain duck for pads/bass
const duck = new Float32Array(N).fill(1);
for (const k of kicks) {
  const s = Math.floor(k * SR);
  for (let i = 0; i < 0.3 * SR && s + i < N; i++) duck[s + i] = Math.min(duck[s + i], 0.35 + 0.65 * Math.pow(i / (0.3 * SR), 0.6));
}
for (let i = 0; i < N; i++) music[i] += duckable[i] * duck[i];

// ---- SFX ----------------------------------------------------------------
const fx = {
  tick: (t, m = 84, v = 0.05) => osc(sfx, t, 0.012, mtof(m), { type: 'tri', vol: v, decay: 0.02, r: 0.03 }),
  click: (t, v = 0.06) => noise(sfx, t, 0.02, { vol: v, lp: 0.9, hp: 1, decay: 0.006 }),
  pop: (t, v = 0.07) => osc(sfx, t, 0.06, 500, { vol: v, slide: 1100, r: 0.04 }),
  whoosh: (t, d = 0.3, v = 0.07) => noise(sfx, t, d, { vol: v, sweep: [0.03, 0.55] }),
  swish: (t, d = 0.25, v = 0.045) => noise(sfx, t, d, { vol: v, sweep: [0.5, 0.05] }),
  impact: (t, v = 0.3) => {
    osc(sfx, t, 0.35, 90, { vol: v, slide: 38, a: 0.001, r: 0.2 });
    noise(sfx, t, 0.4, { vol: v * 0.25, lp: 0.3, decay: 0.12 });
  },
  ding: (t, m = 88, v = 0.05) => {
    osc(sfx, t, 0.02, mtof(m), { vol: v, decay: 0.3, r: 0.6 });
    osc(sfx, t, 0.02, mtof(m + 7), { vol: v * 0.4, decay: 0.2, r: 0.5 });
  },
  coin: (t, v = 0.045) => {
    osc(sfx, t, 0.05, mtof(88), { type: 'square', vol: v * 0.6, r: 0.01, lp: 0.4 });
    osc(sfx, t + 0.05, 0.03, mtof(93), { type: 'square', vol: v * 0.6, decay: 0.12, r: 0.25, lp: 0.4 });
  },
  rise: (t, d, v = 0.03) => osc(sfx, t, d, 400, { type: 'tri', slide: 1200, vol: v, a: 0.05, r: 0.05 }),
};

// guides + hero
[0.1, 0.22, 0.34, 0.46].forEach((t) => fx.swish(t, 0.5, 0.025));
fx.click(0.8, 0.04);
for (let i = 0; i < 6; i++) fx.click(1.0 + i * 0.09, 0.05);
fx.swish(3.35, 0.3, 0.04);
// wipes + slams
for (const T of [4, 8, 12, 16, 20]) fx.whoosh(T - 0.3, 0.32);
fx.whoosh(23.7, 0.3, 0.08);
const SECTIONS = [
  { s: 4, n: 6 },
  { s: 8, n: 6 },
  { s: 12, n: 7 },
  { s: 16, n: 9 },
];
for (const { s, n } of SECTIONS) {
  fx.impact(s + 0.06);
  for (let i = 0; i < n; i++) fx.tick(s + 0.06 + i * 0.075, 76 + i * 2, 0.04);
  fx.swish(s + 0.95, 0.4, 0.035);
  fx.swish(s + 1.15, 0.45, 0.025);
}
// balas
fx.pop(5.75);
for (let t = 6.2; t < 6.75; t += 0.11) fx.click(t, 0.025);
fx.pop(6.75, 0.08);
fx.ding(7.15, 91, 0.04);
// catat
fx.click(9.5, 0.04);
fx.click(9.6, 0.04);
[9.85, 10.1, 10.35].forEach((t) => fx.click(t, 0.06));
for (let t = 10.35; t < 10.95; t += 0.05) fx.tick(t, 96, 0.012);
fx.coin(10.9);
// hitung
[13.7, 13.88, 14.06].forEach((t) => fx.click(t, 0.06));
for (let t = 14.3; t < 14.8; t += 0.05) fx.tick(t, 96, 0.012);
fx.click(14.55, 0.06);
fx.rise(14.7, 0.7);
fx.ding(15.4, 86, 0.04);
// prediksi
for (let t = 17.6; t < 18.6; t += 0.05) fx.tick(t, 96, 0.012);
fx.rise(17.7, 1.0, 0.025);
for (let i = 0; i < 6; i++) fx.tick(17.7 + i * 0.2, 84 + i, 0.03);
fx.swish(18.75, 0.4, 0.04);
fx.ding(19.2, 93, 0.05);
// stack + tagline
for (let i = 0; i < 4; i++) {
  fx.impact(20.08 + i * 0.5, 0.16);
  fx.click(20.25 + i * 0.5, 0.03);
}
fx.swish(22.05, 0.35, 0.04);
for (let i = 0; i < 6; i++) fx.click(22.3 + i * 0.08, 0.045);
// end
fx.impact(24.0, 0.35);
for (let i = 0; i < 9; i++) fx.tick(24.12 + i * 0.05, 84 + i, 0.03);
fx.click(24.9, 0.04);
fx.pop(25.4, 0.08);
fx.ding(26.45, 96, 0.04);

// ---- master -------------------------------------------------------------
const out = new Float32Array(N);
for (let i = 0; i < N; i++) out[i] = 0.89 * Math.tanh((music[i] + sfx[i]) * 0.95);
for (let i = Math.floor(26.6 * SR); i < N; i++) out[i] *= Math.max(0, (DUR - i / SR) / 1.4);
for (let i = 0; i < 0.02 * SR; i++) out[i] *= i / (0.02 * SR);
writeWav(path.join(OUT, 'audio.wav'), [out, out], SR);
console.log('audio ->', path.join(OUT, 'audio.wav'));
