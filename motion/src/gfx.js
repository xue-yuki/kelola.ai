// Tiny indexed-free pixel raster for the 320x180 art canvas.
// Every drawing call snaps to whole art-pixels; the final frame is
// upscaled 6x with nearest-neighbor, so nothing here ever anti-aliases.
import { FONT } from './font.js';

export const W = 320;
export const H = 180;

// Brand palette (8 core colors) plus a few shades used for depth.
export const P = {
  k: 0x1a1a2e, // arang
  o: 0xff6b2b, // oranye kelola
  O: 0xff9b5e, // oranye muda
  c: 0xfff8f4, // krem
  g: 0x6b7280, // abu
  t: 0x2a9d8f, // teal
  m: 0xe9b44c, // mustard
  w: 0x8c5a3c, // kayu
  // shades
  d: 0xd9541e, // oranye gelap
  C: 0xeadccf, // krem gelap
  T: 0x1f7a70, // teal gelap
  W: 0x5e3b28, // kayu gelap
  M: 0xc28a2c, // mustard gelap (teh)
  n: 0x23233d, // malam
  N: 0x34344f, // malam terang
  G: 0xa3a9b5, // abu terang
  s: 0xe8b48a, // kulit
  S: 0xc98f66, // kulit gelap
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x, y) => (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
export const easeIn = (t) => t * t;
export const easeOut = (t) => 1 - (1 - t) * (1 - t);
export const backOut = (t) => {
  const s = 1.7;
  const u = t - 1;
  return 1 + u * u * ((s + 1) * u + s);
};

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(x, y, z = 0) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const col = (c) => (typeof c === 'string' ? P[c] : c);

export class Surface {
  constructor(w = W, h = H) {
    this.w = w;
    this.h = h;
    this.d = new Uint32Array(w * h);
  }

  clear(c) {
    this.d.fill(col(c));
  }

  px(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = col(c);
  }

  get(x, y) {
    return this.d[y * this.w + x];
  }

  rect(x, y, w, h, c) {
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    const x0 = Math.max(0, x);
    const y0 = Math.max(0, y);
    const x1 = Math.min(this.w, x + w);
    const y1 = Math.min(this.h, y + h);
    const v = col(c);
    for (let j = y0; j < y1; j++) this.d.fill(v, j * this.w + x0, j * this.w + Math.max(x0, x1));
  }

  // Filled rect with 1px outline.
  box(x, y, w, h, fill, line = 'k') {
    this.rect(x, y, w, h, line);
    if (w > 2 && h > 2) this.rect(x + 1, y + 1, w - 2, h - 2, fill);
  }

  // Box with clipped corners (reads rounder at pixel scale).
  rbox(x, y, w, h, fill, line = 'k') {
    this.rect(x + 1, y, w - 2, h, line);
    this.rect(x, y + 1, w, h - 2, line);
    if (w > 2 && h > 2) this.rect(x + 1, y + 1, w - 2, h - 2, fill);
  }

  // Ordered-dither blend between two colors. p=0 -> a, p=1 -> b.
  dither(x, y, w, h, a, b, p) {
    x = Math.round(x);
    y = Math.round(y);
    const ca = col(a);
    const cb = col(b);
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++)
        this.d[j * this.w + i] = bayer(i, j) < p ? cb : ca;
  }

  // Sprinkle color c over a region where the Bayer threshold is below p
  // (a dithered tint that keeps what is underneath).
  speck(x, y, w, h, c, p) {
    if (p <= 0) return;
    x = Math.round(x);
    y = Math.round(y);
    const v = col(c);
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) if (bayer(i, j) < p) this.d[j * this.w + i] = v;
  }

  // Vertical gradient made of dithered bands.
  vgrad(x, y, w, h, a, b) {
    for (let j = 0; j < h; j++) this.dither(x, y + j, w, 1, a, b, j / Math.max(1, h - 1));
  }

  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  circle(cx, cy, r, c) {
    cx = Math.round(cx);
    cy = Math.round(cy);
    const rr = r * r + r * 0.8;
    for (let j = -Math.ceil(r); j <= Math.ceil(r); j++)
      for (let i = -Math.ceil(r); i <= Math.ceil(r); i++) if (i * i + j * j <= rr) this.px(cx + i, cy + j, c);
  }

  ring(cx, cy, r, fill, line = 'k') {
    this.circle(cx, cy, r + 1, line);
    this.circle(cx, cy, r, fill);
  }

  // sprite: array of equal-length strings; '.' or ' ' is transparent.
  sprite(rows, x, y, opt = {}) {
    const { flip = false, map = null, scale = 1 } = opt;
    x = Math.round(x);
    y = Math.round(y);
    const h = rows.length;
    const w = rows[0].length;
    for (let j = 0; j < h; j++) {
      const r = rows[j];
      for (let i = 0; i < w; i++) {
        let ch = r[flip ? w - 1 - i : i];
        if (ch === '.' || ch === ' ') continue;
        if (map && map[ch] !== undefined) ch = map[ch];
        if (ch === '.') continue;
        if (scale === 1) this.px(x + i, y + j, ch);
        else this.rect(x + i * scale, y + j * scale, scale, scale, ch);
      }
    }
  }

  textWidth(str, scale = 1) {
    let w = 0;
    for (const ch of str) {
      const g = FONT[ch] || FONT['?'];
      w += (g[0].length + 1) * scale;
    }
    return Math.max(0, w - scale);
  }

  text(str, x, y, c, scale = 1) {
    let cx = Math.round(x);
    for (const ch of str) {
      const g = FONT[ch] || FONT['?'];
      for (let j = 0; j < 7; j++)
        for (let i = 0; i < g[j].length; i++)
          if (g[j][i] === '#') this.rect(cx + i * scale, y + j * scale, scale, scale, c);
      cx += (g[0].length + 1) * scale;
    }
    return cx;
  }

  // Text with a 1px charcoal outline so it reads on any background.
  textOutlined(str, x, y, c, outline = 'k', scale = 1) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]])
      this.text(str, x + dx * scale, y + dy * scale, outline, scale);
    this.text(str, x, y, c, scale);
  }

  copyFrom(src) {
    this.d.set(src.d);
  }

  // Bayer-dissolve another surface on top: p=0 keeps this, p=1 is src.
  dissolve(src, p) {
    if (p <= 0) return;
    if (p >= 1) return this.copyFrom(src);
    for (let j = 0; j < this.h; j++)
      for (let i = 0; i < this.w; i++) if (bayer(i, j) < p) this.d[j * this.w + i] = src.d[j * this.w + i];
  }

  // Nearest-neighbor draw of src into the dest rectangle (dx,dy,dw,dh).
  drawScaled(src, dx, dy, dw, dh) {
    const x0 = Math.max(0, Math.floor(dx));
    const y0 = Math.max(0, Math.floor(dy));
    const x1 = Math.min(this.w, Math.ceil(dx + dw));
    const y1 = Math.min(this.h, Math.ceil(dy + dh));
    for (let j = y0; j < y1; j++) {
      const sy = Math.floor(((j - dy + 0.5) / dh) * src.h);
      if (sy < 0 || sy >= src.h) continue;
      for (let i = x0; i < x1; i++) {
        const sx = Math.floor(((i - dx + 0.5) / dw) * src.w);
        if (sx < 0 || sx >= src.w) continue;
        this.d[j * this.w + i] = src.d[sy * src.w + sx];
      }
    }
  }

  // Sparse speckle texture that re-rolls every 3 frames: the pixel
  // equivalent of a stop-motion "boil" on large flat surfaces.
  boil(x, y, w, h, c, frame, density = 0.02, seed = 1) {
    const f = Math.floor(frame / 3);
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++)
        if (hash(i, j, f * 31 + seed) < density) this.px(i, j, c);
  }

  toRGB(out) {
    const n = this.w * this.h;
    for (let i = 0; i < n; i++) {
      const v = this.d[i];
      out[i * 3] = (v >> 16) & 255;
      out[i * 3 + 1] = (v >> 8) & 255;
      out[i * 3 + 2] = v & 255;
    }
    return out;
  }
}
