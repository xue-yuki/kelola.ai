// Frame-by-frame capture of index.html with headless Chromium, piped to
// ffmpeg. render(t) in the page is a pure function of time.
//   node scripts/render.mjs                 full render (+ mux if out/audio.wav)
//   node scripts/render.mjs --stills 2,6,10 PNG stills
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/opt/node-tools/node_modules/playwright'));
}

const FPS = 60;
const OUT = path.resolve('out');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.resolve('index.html')).href);
await page.evaluate(() => window.__ready);
const duration = await page.evaluate(() => window.DURATION);

const shot = async (t) => {
  await page.evaluate((t) => window.render(t), t);
  return page.screenshot({ type: 'png' });
};

const ffmpeg = (args) => {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  return { p, done: new Promise((res, rej) => p.on('close', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res()))) };
};

const si = process.argv.indexOf('--stills');
if (si > 0) {
  const dir = path.join(OUT, process.env.STILLS_DIR || 'stills');
  fs.mkdirSync(dir, { recursive: true });
  for (const t of process.argv[si + 1].split(',').map(Number)) {
    fs.writeFileSync(path.join(dir, `t${t.toFixed(2).padStart(5, '0')}.png`), await shot(t));
  }
  await browser.close();
  console.log('stills ->', dir);
  process.exit(0);
}

const video = path.join(OUT, 'video.mp4');
const enc = ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', video]);
const total = Math.round(duration * FPS);
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const buf = await shot(i / FPS);
  if (!enc.p.stdin.write(buf)) await new Promise((r) => enc.p.stdin.once('drain', r));
  if (i % 150 === 0) console.log(`frame ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
enc.p.stdin.end();
await enc.done;
await browser.close();

const audio = path.join(OUT, 'audio.wav');
if (fs.existsSync(audio)) {
  await ffmpeg(['-i', video, '-i', audio, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart',
    path.join(OUT, 'kelola-satu-titik.mp4')]).done;
  console.log('done ->', path.join(OUT, 'kelola-satu-titik.mp4'));
} else console.log('video only ->', video);
