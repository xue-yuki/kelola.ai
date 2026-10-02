// Minimal 16-bit PCM WAV read/write.
import fs from 'node:fs';

export function readWav(file) {
  const b = fs.readFileSync(file);
  let off = 12;
  let rate = 22050;
  let ch = 1;
  let bits = 16;
  let data = null;
  while (off < b.length - 8) {
    const id = b.toString('ascii', off, off + 4);
    let size = b.readUInt32LE(off + 4);
    const body = off + 8;
    if (id === 'fmt ') {
      ch = b.readUInt16LE(body + 2);
      rate = b.readUInt32LE(body + 4);
      bits = b.readUInt16LE(body + 14);
    } else if (id === 'data') {
      // espeak writes a placeholder size when streaming; trust the file length
      if (size === 0 || body + size > b.length) size = b.length - body;
      data = b.subarray(body, body + size);
      break;
    }
    off = body + size + (size & 1);
  }
  if (bits !== 16) throw new Error('only 16-bit wav supported: ' + file);
  const n = Math.floor(data.length / 2 / ch);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = data.readInt16LE(i * 2 * ch) / 32768;
  return { rate, samples: out };
}

export function resample(samples, from, to) {
  if (from === to) return samples;
  const n = Math.floor((samples.length * to) / from);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * from) / to;
    const i0 = Math.floor(x);
    const f = x - i0;
    out[i] = (samples[i0] || 0) * (1 - f) + (samples[i0 + 1] || 0) * f;
  }
  return out;
}

// Stereo or mono float channels -> 16-bit WAV.
export function writeWav(file, channels, rate) {
  const ch = channels.length;
  const n = channels[0].length;
  const b = Buffer.alloc(44 + n * ch * 2);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + n * ch * 2, 4);
  b.write('WAVE', 8);
  b.write('fmt ', 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(ch, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * ch * 2, 28);
  b.writeUInt16LE(ch * 2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(n * ch * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]));
      b.writeInt16LE(Math.round(v * 32767), o);
      o += 2;
    }
  fs.writeFileSync(file, b);
}
