// Builds the soundtrack from code: a 3-voice chiptune score, synchronized
// SFX, and the narration clips from out/vo. Writes:
//   out/bed.wav   music + SFX, ducked where narration sits (for re-voicing)
//   out/mix.wav   bed + narration
//   out/vo/scene-N.wav  narration per scene, scene-relative
import fs from 'node:fs';
import path from 'node:path';
import {
  DURATION, SCENES, S1_COUNT, s1BubbleTime, s1FallStart, S1_FALL_DUR, S2, s2IncomingTimes,
  S3, s3PileTimes, S4, S4_FLOW, S4_FLOW_TRAVEL, S5, S6,
} from '../src/timeline.js';
import { WARUNGS, litAt } from '../src/scenes.js';
import { readWav, resample, writeWav } from './wav.mjs';

const SR = 44100;
const N = Math.ceil((DURATION + 0.5) * SR);
const OUT = path.resolve('out');
const timing = JSON.parse(fs.readFileSync(path.join(OUT, 'timing.json'), 'utf8'));

const music = new Float32Array(N);
const sfx = new Float32Array(N);
const vo = new Float32Array(N);

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 12345;
const noise = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return (seed / 0x7fffffff) * 2 - 1;
};

// ---- oscillators -----------------------------------------------------
function tone(buf, t0, dur, freq, o = {}) {
  const { wave = 'square', vol = 0.1, duty = 0.25, attack = 0.004, release = 0.05, slide = null, vib = 0, decay = 0 } = o;
  const s0 = Math.floor(t0 * SR);
  const len = Math.floor((dur + release) * SR);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const idx = s0 + i;
    if (idx < 0 || idx >= N) continue;
    const t = i / SR;
    let f = slide ? freq * Math.pow(slide / freq, Math.min(1, t / dur)) : freq;
    if (vib) f *= 1 + Math.sin(t * 2 * Math.PI * 6) * vib;
    ph += f / SR;
    ph -= Math.floor(ph);
    let v;
    if (wave === 'square') v = ph < duty ? 1 : -1;
    else if (wave === 'triangle') v = 4 * Math.abs(ph - 0.5) - 1;
    else v = Math.sin(ph * 2 * Math.PI);
    let env = Math.min(1, t / attack);
    if (decay) env *= Math.exp(-t / decay);
    if (t > dur) env *= Math.max(0, 1 - (t - dur) / release);
    buf[idx] += v * env * vol;
  }
}

function hiss(buf, t0, dur, o = {}) {
  const { vol = 0.05, lp = 0.5, decay = 0, sweep = null, mod = 0 } = o;
  const s0 = Math.floor(t0 * SR);
  const len = Math.floor(dur * SR);
  let y = 0;
  for (let i = 0; i < len; i++) {
    const idx = s0 + i;
    if (idx < 0 || idx >= N) continue;
    const t = i / SR;
    const a = sweep ? sweep[0] + (sweep[1] - sweep[0]) * (t / dur) : lp;
    y += a * (noise() - y);
    let env = Math.min(1, t / 0.005) * Math.min(1, (dur - t) / 0.02);
    if (decay) env *= Math.exp(-t / decay);
    if (mod) env *= 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * mod);
    buf[idx] += y * env * vol;
  }
}

// ---- SFX vocabulary ---------------------------------------------------
const fx = {
  blip: (t, m = 72, v = 0.07) => tone(sfx, t, 0.05, mtof(m), { duty: 0.25, vol: v, slide: mtof(m + 5), release: 0.03 }),
  tap: (t, v = 0.06) => hiss(sfx, t, 0.025, { vol: v, lp: 0.9, decay: 0.008 }),
  thud: (t, v = 0.16) => {
    tone(sfx, t, 0.09, 110, { wave: 'sine', vol: v, slide: 50, release: 0.04 });
    hiss(sfx, t, 0.04, { vol: v * 0.3, lp: 0.2, decay: 0.02 });
  },
  pop: (t, v = 0.08) => tone(sfx, t, 0.05, 420, { wave: 'sine', vol: v, slide: 900, release: 0.03 }),
  plip: (t, v = 0.08) => tone(sfx, t, 0.06, 880, { wave: 'sine', vol: v, slide: 1400, release: 0.04 }),
  klik: (t, v = 0.05) => tone(sfx, t, 0.012, 1900, { duty: 0.5, vol: v, release: 0.01 }),
  ting: (t, v = 0.07) => {
    tone(sfx, t, 0.02, 2093, { wave: 'sine', vol: v, decay: 0.25, release: 0.5 });
    tone(sfx, t, 0.02, 3136, { wave: 'sine', vol: v * 0.4, decay: 0.15, release: 0.4 });
  },
  coin: (t, v = 0.06) => {
    tone(sfx, t, 0.06, 988, { duty: 0.5, vol: v, release: 0.01 });
    tone(sfx, t + 0.06, 0.04, 1319, { duty: 0.5, vol: v, decay: 0.12, release: 0.2 });
  },
  buzz: (t, v = 0.08) => tone(sfx, t, 0.36, 98, { duty: 0.5, vol: v, vib: 0.03, release: 0.05 }),
  scan: (t, dur, v = 0.025) => {
    for (let k = 0; k < dur / 0.125; k++) tone(sfx, t + k * 0.125, 0.06, k % 2 ? 784 : 659, { duty: 0.5, vol: v, release: 0.02 });
  },
  pencil: (t, dur, v = 0.035) => hiss(sfx, t, dur, { vol: v, lp: 0.6, mod: 9 }),
  whoosh: (t, dur, v = 0.05, up = true) => hiss(sfx, t, dur, { vol: v, sweep: up ? [0.02, 0.4] : [0.4, 0.02] }),
  bell: (t, v = 0.06) => {
    for (const [dt, f] of [[0, 1568], [0.14, 1319]]) tone(sfx, t + dt, 0.02, f, { wave: 'sine', vol: v, decay: 0.3, release: 0.6 });
  },
  clink: (t, v = 0.05) => tone(sfx, t, 0.02, 2637, { wave: 'sine', vol: v, decay: 0.08, release: 0.2 }),
  chirp: (t, v = 0.025) => {
    tone(sfx, t, 0.05, 2600, { wave: 'sine', vol: v, slide: 3400, release: 0.02 });
    tone(sfx, t + 0.09, 0.05, 2800, { wave: 'sine', vol: v, slide: 3600, release: 0.02 });
  },
  sparkle: (t, m = 84, v = 0.04) => tone(sfx, t, 0.08, mtof(m), { wave: 'triangle', vol: v, decay: 0.1, release: 0.15 }),
};

// ---- SFX timeline -----------------------------------------------------
// Scene 1
for (let n = 0; n < S1_COUNT; n++) fx.blip(s1BubbleTime(n), 67 + Math.floor(n / 3), 0.07 - n * 0.0006);
fx.thud(7.05, 0.12);
for (let n = 0; n < S1_COUNT; n += 2) fx.tap(s1FallStart(n) + S1_FALL_DUR, 0.05);
// Scene 2
fx.whoosh(10.0, 1.2, 0.03);
for (const t of [10.4, 10.7, 11.0]) fx.thud(t, 0.08);
for (let i = 0; i < 13; i++) fx.klik(11.2 + i * 0.06 + 0.15, 0.03);
fx.thud(12.15, 0.08);
fx.pop(12.0);
for (let j = 0; j < 6; j++) fx.klik(12.2 + j * 0.08, 0.025);
fx.pop(13.0, 0.1);
fx.whoosh(13.0, 0.8, 0.03);
for (const t of [12.4, 15.4, 18.9]) fx.chirp(t);
for (const it of s2IncomingTimes()) {
  fx.blip(it, 79, 0.05);
  fx.plip(it + 0.45, 0.05);
}
for (let t = S2.typeA[0]; t < S2.typeA[1]; t += 0.17) if (Math.sin(t * 37) > -0.3) fx.tap(t, 0.025);
fx.pencil(S2.write[0] + 0.1, S2.flip - S2.write[0] - 0.1);
fx.whoosh(S2.flip, 0.4, 0.03);
fx.whoosh(S2.pageFly[0], 0.8, 0.04);
fx.klik(S2.pageFly[1], 0.05);
// Scene 3
for (let t = S2.pageFly[1]; t < 25; t += 0.09) fx.klik(t, 0.018);
fx.whoosh(S3.night[0], 1.2, 0.03, false);
fx.klik(S3.lamp, 0.06);
s3PileTimes().forEach((t, k) => fx.blip(t, 76 - Math.floor(k / 2), 0.04));
fx.whoosh(S3.grayIn, 0.3, 0.03);
fx.buzz(S3.grayTurn);
fx.whoosh(S3.bookIn, 0.3, 0.03);
for (const t of [30.2, 30.45, 30.7]) fx.blip(t, 52, 0.04);
fx.pencil(30.6, 0.2, 0.05);
fx.whoosh(S3.fall[0], 0.8, 0.04, false);
fx.whoosh(S3.zoom[0], 1.4, 0.06);
// Scene 4
for (const t of S4.unfold) {
  fx.klik(t, 0.05);
  fx.thud(t + 0.35, 0.05);
}
fx.plip(S4.msgIn, 0.09);
fx.scan(S4.read[0], S4.read[1] - S4.read[0] - 0.3);
fx.klik(S4.match, 0.07);
fx.klik(S4.match + 0.12, 0.05);
fx.ting(S4.reply);
fx.thud(S4.drop + 0.3, 0.08);
for (const [st] of S4_FLOW) {
  fx.plip(st, 0.025);
  fx.klik(st + S4_FLOW_TRAVEL + 0.3, 0.035);
}
fx.sparkle(S4.moon, 88, 0.04);
fx.whoosh(S4.fold[0], 0.5, 0.03);
// Scene 5
fx.whoosh(S5.morph[0], 1.0, 0.04);
for (let k = 0; k < 10; k++) fx.klik(S5.morph[0] + 0.5 + k * 0.1, 0.03);
for (const [at] of S5.drops) fx.coin(at + 0.35);
for (let k = 0; k < 4; k++) fx.sparkle(S5.highlight + k * 0.07, [72, 76, 79, 84][k], 0.05);
for (let j = 0; j < 3; j++) fx.blip(S5.peak + j * 0.12, 74 + j * 2, 0.04);
fx.whoosh(S5.out[0] + 0.3, 1.2, 0.04);
// Scene 6
fx.whoosh(S6.keloFly[0], 0.9, 0.03);
for (const t of S6.place) fx.clink(t);
fx.bell(S6.custIn[0]);
fx.whoosh(S6.hand[0], 0.5, 0.03);
fx.sparkle(S6.heart, 84, 0.05);
fx.sparkle(S6.heart + 0.08, 88, 0.05);
for (const t of S6.checks) fx.ting(t, 0.025);
fx.whoosh(S6.pull[0], 2.0, 0.05, false);
// Scene 7
WARUNGS.forEach((p, i) => {
  if (i > 0 && i % 9 === 0) fx.sparkle(litAt(i), [72, 74, 76, 79, 81, 84][i % 6], 0.02);
});
const iconTimes = [timing[21].at, timing[22].at, timing[23].at];
iconTimes.forEach((t, i) => fx.sparkle(t, [72, 76, 79][i], 0.06));
const logoStart = timing[24].at - 0.7;
fx.whoosh(logoStart, 1.3, 0.05);
const chime = logoStart + 1.4;
[84, 88, 91, 96].forEach((m, i) => tone(sfx, chime + i * 0.06, 0.02, mtof(m), { wave: 'triangle', vol: 0.05, decay: 0.4, release: 0.8 }));

// ---- music ------------------------------------------------------------
const CH = {
  C: [48, 52, 55], Am: [45, 48, 52], F: [41, 45, 48], G: [43, 47, 50], Dm: [38, 41, 45], E: [40, 44, 47], Em: [40, 43, 47],
};
const BEAT = 60 / 96;
const BAR = BEAT * 4;

function section(start, end, prog, o) {
  for (let b = 0; start + b * BAR < end; b++) {
    const t0 = start + b * BAR;
    const ch = CH[prog[b % prog.length]];
    // bass
    for (const [beat, len, oct] of o.bass)
      if (t0 + beat * BEAT < end) tone(music, t0 + beat * BEAT, len * BEAT * 0.9, mtof(ch[0] - 12 + oct), { wave: 'triangle', vol: o.bassVol ?? 0.2, release: 0.06 });
    // arpeggio
    const tones = [ch[0], ch[1], ch[2], ch[0] + 12].map((m) => m + 12);
    const stepLen = o.arpStep * BEAT;
    for (let k = 0; k * stepLen < BAR - 1e-6; k++) {
      const at = t0 + k * stepLen;
      if (at >= end) break;
      const m = tones[o.arpPat[k % o.arpPat.length]];
      tone(music, at, stepLen * 0.55, mtof(m), { duty: o.duty ?? 0.125, vol: o.arpVol ?? 0.035, release: 0.05, decay: 0.25 });
    }
    // hats + kick
    if (o.hats)
      for (let k = 0; k < 8; k++) {
        const at = t0 + k * BEAT * 0.5;
        if (at >= end) break;
        if (k % 2) hiss(music, at, 0.03, { vol: 0.03, lp: 0.95, decay: 0.01 });
        if (o.kick && k % 4 === 0) tone(music, at, 0.1, 130, { wave: 'sine', vol: 0.14, slide: 45, release: 0.03 });
      }
    // lead melody
    if (o.lead) {
      o.lead.forEach((deg, k) => {
        if (deg === null) return;
        const at = t0 + k * BEAT;
        if (at >= end) return;
        const m = [ch[0], ch[1], ch[2], ch[0] + 12, ch[1] + 12][deg] + 24;
        tone(music, at, BEAT * 0.8, mtof(m), { duty: 0.25, vol: 0.03, vib: 0.006, release: 0.08 });
      });
    }
  }
}

// scene 1: one low note lands with the ground
tone(music, 7.05, 2.6, mtof(36), { wave: 'triangle', vol: 0.22, release: 0.4 });
// scene 2: gentle major
section(10.0, 22.0, ['C', 'Am', 'F', 'G'], { bass: [[0, 2, 0], [2, 2, 12]], arpStep: 0.5, arpPat: [0, 1, 2, 3, 2, 1, 2, 1] });
// scene 3: minor, slower arpeggio
section(22.0, 33.9, ['Am', 'F', 'Dm', 'E'], { bass: [[0, 3.5, 0]], arpStep: 1, arpPat: [0, 2, 1, 2], arpVol: 0.03, bassVol: 0.18 });
// scene 4: rhythmic, pulsing
section(34.0, 50.0, ['C', 'G', 'Am', 'F'], { bass: [[0, 0.5, 0], [0.5, 0.5, 12], [1, 0.5, 0], [1.5, 0.5, 12], [2, 0.5, 0], [2.5, 0.5, 12], [3, 0.5, 0], [3.5, 0.5, 12]], bassVol: 0.14, arpStep: 0.5, arpPat: [0, 1, 2, 3, 0, 1, 2, 3], hats: true, kick: true });
// scene 5: same energy; a breath before "data"
section(50.0, 62.0, ['F', 'G', 'Am', 'C'], { bass: [[0, 0.5, 0], [0.5, 0.5, 12], [1, 0.5, 0], [1.5, 0.5, 12], [2, 0.5, 0], [2.5, 0.5, 12], [3, 0.5, 0], [3.5, 0.5, 12]], bassVol: 0.14, arpStep: 0.5, arpPat: [0, 2, 1, 3, 0, 2, 1, 3], hats: true, kick: true });
// scene 6: warm, with melody
section(62.0, 74.0, ['C', 'Em', 'F', 'G'], { bass: [[0, 1.5, 0], [1.5, 0.5, 7], [2, 2, 12]], arpStep: 0.5, arpPat: [0, 1, 2, 3, 2, 1, 2, 1], arpVol: 0.03, hats: true, lead: [2, 1, 0, 1] });
// scene 7: lift and resolve
section(74.0, 84.0, ['F', 'G', 'Am', 'G'], { bass: [[0, 2, 0], [2, 2, 12]], arpStep: 0.5, arpPat: [0, 1, 2, 3, 2, 1, 2, 1], arpVol: 0.03, lead: [3, 2, 1, null] });
for (const m of [48, 52, 55, 60]) tone(music, 84.0, 2.2, mtof(m + 12), { wave: 'triangle', vol: 0.05, release: 1.4 });
tone(music, 84.0, 2.2, mtof(36), { wave: 'triangle', vol: 0.18, release: 1.4 });

// The breath before "data": silence the score, then a rising run.
const dataLine = timing[14];
const pauseA = dataLine.at + dataLine.dur - 0.75;
const pauseB = dataLine.at + dataLine.dur + 0.15;
for (let i = Math.floor(pauseA * SR); i < Math.floor(pauseB * SR); i++) {
  const t = i / SR;
  const g = Math.min(1, Math.min(t - pauseA, pauseB - t) / 0.03);
  music[i] *= 1 - Math.max(0, g);
}
[60, 62, 64, 65, 67, 69, 71, 72].forEach((m, k) => tone(music, pauseB + k * 0.075, 0.06, mtof(m + 12), { duty: 0.25, vol: 0.035, release: 0.03 }));

// ---- narration ----------------------------------------------------------
const clips = timing.map((c) => {
  const w = readWav(path.join(OUT, c.file));
  let s = resample(w.samples, w.rate, SR);
  let peak = 0;
  for (const v of s) peak = Math.max(peak, Math.abs(v));
  const g = 0.8 / (peak || 1);
  s = s.map((v) => v * g);
  return { ...c, s, offset: Math.round((c.at - c.trim) * SR) };
});
for (const c of clips) for (let i = 0; i < c.s.length; i++) if (c.offset + i < N && c.offset + i >= 0) vo[c.offset + i] += c.s[i];

// per-scene clips (scene-relative)
for (const sc of SCENES) {
  const len = Math.ceil((sc.end - sc.start) * SR);
  const buf = new Float32Array(len);
  for (const c of clips.filter((c) => c.scene === sc.id)) {
    const off = Math.round((c.at - c.trim - sc.start) * SR);
    for (let i = 0; i < c.s.length; i++) if (off + i < len && off + i >= 0) buf[off + i] += c.s[i];
  }
  writeWav(path.join(OUT, 'vo', `scene-${sc.id}.wav`), [buf], SR);
}

// ---- duck music under narration ----------------------------------------
const want = new Float32Array(N);
for (const c of timing) {
  const a = Math.floor((c.at - 0.1) * SR);
  const b = Math.floor((c.at + c.dur + 0.15) * SR);
  for (let i = Math.max(0, a); i < Math.min(N, b); i++) want[i] = 1;
}
let env = 0;
const att = 1 / (0.08 * SR);
const rel = 1 / (0.35 * SR);
for (let i = 0; i < N; i++) {
  env += want[i] > env ? att : -rel;
  env = Math.max(0, Math.min(1, env));
  music[i] *= 1 - 0.68 * env;
}

// ---- master -------------------------------------------------------------
function master(parts) {
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let v = 0;
    for (const [buf, g] of parts) v += buf[i] * g;
    out[i] = Math.tanh(v * 1.1) / Math.tanh(1.1);
  }
  // fade tail
  for (let i = Math.floor((DURATION - 1.2) * SR); i < N; i++) out[i] *= Math.max(0, (DURATION - i / SR) / 1.2);
  return out;
}
const bed = master([[music, 1.0], [sfx, 1.0]]);
const mix = master([[music, 1.0], [sfx, 0.9], [vo, 0.85]]);
writeWav(path.join(OUT, 'bed.wav'), [bed, bed], SR);
writeWav(path.join(OUT, 'mix.wav'), [mix, mix], SR);
console.log('audio ->', path.join(OUT, 'mix.wav'));
