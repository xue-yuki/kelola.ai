// Synthesizes the scratch narration (espeak-ng + MBROLA Indonesian voice)
// one clip per line, then writes out/timing.json and out/voiceover.srt.
// Swap out/vo/*.wav for real recordings and re-run `npm run audio`.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { VO } from '../src/timeline.js';
import { readWav } from './wav.mjs';

const OUT = path.resolve('out');
const VODIR = path.join(OUT, 'vo');
fs.mkdirSync(VODIR, { recursive: true });

const voice = process.env.VOICE || 'mb-id1';
const speed = process.env.SPEED || '140';

const timing = [];
VO.forEach((line, i) => {
  const file = path.join(VODIR, `line-${String(i + 1).padStart(2, '0')}.wav`);
  if (!process.env.KEEP_VO || !fs.existsSync(file))
    execFileSync('espeak-ng', ['-v', voice, '-s', speed, '-w', file, line.tts || line.text]);
  const { rate, samples } = readWav(file);
  // trim leading/trailing silence so `at` lands on the first syllable
  let a = 0;
  let b = samples.length - 1;
  while (a < b && Math.abs(samples[a]) < 0.01) a++;
  while (b > a && Math.abs(samples[b]) < 0.01) b--;
  timing.push({
    i,
    scene: line.scene,
    at: line.at,
    file: path.relative(OUT, file),
    trim: a / rate,
    dur: (b - a) / rate,
    text: line.text,
  });
});

let ok = true;
for (let i = 0; i < timing.length - 1; i++) {
  const end = timing[i].at + timing[i].dur;
  if (end > timing[i + 1].at - 0.1) {
    ok = false;
    console.warn(`overlap: line ${i + 1} ends ${end.toFixed(2)} > next ${timing[i + 1].at}  "${timing[i].text}"`);
  }
}

fs.writeFileSync(path.join(OUT, 'timing.json'), JSON.stringify(timing, null, 2));

const ts = (s) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(r).padStart(3, '0')}`;
};
const srt = timing
  .map((t, k) => {
    const next = timing[k + 1];
    const end = Math.min(t.at + t.dur + 0.4, next ? next.at - 0.05 : t.at + t.dur + 1.5);
    return `${k + 1}\n${ts(t.at)} --> ${ts(end)}\n${t.text}\n`;
  })
  .join('\n');
fs.writeFileSync(path.join(OUT, 'voiceover.srt'), srt);

for (const t of timing) console.log(`${t.at.toFixed(1).padStart(5)} +${t.dur.toFixed(2)}  ${t.text}`);
console.log(ok ? 'timing ok' : 'timing has overlaps');
