// Renders the film. Pipes raw 320x180 frames into ffmpeg, which upscales
// 6x nearest-neighbor to 1920x1080. Two picture tracks are written in one
// pass: one with burned-in pixel captions and one clean.
//
//   node scripts/render.mjs                 full render + mux
//   node scripts/render.mjs --stills 3,15   PNG stills at those seconds
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Surface, W, H } from '../src/gfx.js';
import { renderFrame } from '../src/scenes.js';
import { FPS, DURATION } from '../src/timeline.js';

const OUT = path.resolve('out');
fs.mkdirSync(OUT, { recursive: true });
const timingFile = path.join(OUT, 'timing.json');
const timing = fs.existsSync(timingFile) ? JSON.parse(fs.readFileSync(timingFile, 'utf8')) : null;

// ---- captions --------------------------------------------------------
function wrap(text, max = 48) {
  const words = text.toUpperCase().split(' ');
  const lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ((cur + ' ' + w).trim().length > max) lines.push(w);
    else lines[lines.length - 1] = (cur + ' ' + w).trim();
  }
  return lines;
}

const captions = (timing || []).map((c, k, all) => {
  const next = all[k + 1];
  const end = Math.min(c.at + c.dur + 0.4, next ? next.at - 0.05 : c.at + c.dur + 1.5);
  return { start: c.at, end, lines: wrap(c.text.replace(' -', '')) };
});

function drawCaption(s, t) {
  const c = captions.find((c) => t >= c.start && t < c.end);
  if (!c) return;
  const lh = 9;
  const y0 = 166 - (c.lines.length - 1) * lh;
  const bw = Math.max(...c.lines.map((l) => s.textWidth(l))) + 8;
  s.rect(Math.round(160 - bw / 2), y0 - 3, bw, c.lines.length * lh + 4, 'k');
  c.lines.forEach((line, i) => {
    const w = s.textWidth(line);
    s.text(line, Math.round(160 - w / 2), y0 + i * lh, 'c');
  });
}

// ---- stills ----------------------------------------------------------
function ffmpeg(args) {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => p.on('close', (code) => (code ? rej(new Error('ffmpeg ' + code)) : res())));
  return { p, done };
}

const rawIn = ['-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-'];
const upscale = ['-vf', 'scale=1920:1080:flags=neighbor'];

const argi = process.argv.indexOf('--stills');
if (argi > 0) {
  const secs = process.argv[argi + 1].split(',').map(Number);
  const dir = path.join(OUT, process.env.STILLS_DIR || 'stills');
  fs.mkdirSync(dir, { recursive: true });
  const s = new Surface();
  const rgb = Buffer.alloc(W * H * 3);
  for (const sec of secs) {
    renderFrame(s, sec, timing);
    drawCaption(s, sec);
    s.toRGB(rgb);
    const { p, done } = ffmpeg(['-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-i', '-', '-vf', 'scale=960:540:flags=neighbor', path.join(dir, `t${String(sec).padStart(5, '0')}.png`)]);
    p.stdin.end(rgb);
    await done;
  }
  console.log('stills ->', dir);
  process.exit(0);
}

// ---- full render -----------------------------------------------------
const enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-tune', 'animation'];
const vCap = ffmpeg([...rawIn, ...upscale, ...enc, path.join(OUT, 'video-captions.mp4')]);
const vClean = ffmpeg([...rawIn, ...upscale, ...enc, path.join(OUT, 'video-clean.mp4')]);

const write = (proc, buf) =>
  new Promise((res) => {
    if (proc.p.stdin.write(buf)) res();
    else proc.p.stdin.once('drain', res);
  });

const total = Math.round(DURATION * FPS);
const s = new Surface();
const a = Buffer.alloc(W * H * 3);
const b = Buffer.alloc(W * H * 3);
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const t = i / FPS;
  renderFrame(s, t, timing);
  s.toRGB(b);
  drawCaption(s, t);
  s.toRGB(a);
  await Promise.all([write(vCap, Buffer.from(a)), write(vClean, Buffer.from(b))]);
  if (i % 240 === 0) console.log(`frame ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
vCap.p.stdin.end();
vClean.p.stdin.end();
await Promise.all([vCap.done, vClean.done]);

// ---- mux -------------------------------------------------------------
const mix = path.join(OUT, 'mix.wav');
const bed = path.join(OUT, 'bed.wav');
if (fs.existsSync(mix) && fs.existsSync(bed)) {
  const aac = ['-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart'];
  await ffmpeg(['-i', path.join(OUT, 'video-captions.mp4'), '-i', mix, ...aac, path.join(OUT, 'kelola-motion.mp4')]).done;
  await ffmpeg(['-i', path.join(OUT, 'video-clean.mp4'), '-i', bed, ...aac, path.join(OUT, 'kelola-motion-tanpa-narasi.mp4')]).done;
  console.log('done ->', path.join(OUT, 'kelola-motion.mp4'));
} else console.log('video rendered; run `npm run audio` then render again to mux sound');
