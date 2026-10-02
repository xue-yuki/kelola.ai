// The whole film as a pure function of time: renderFrame(surface, t).
// Art space is 320x180; the renderer upscales 6x.
import {
  Surface, W, H, P, clamp, lerp, seg, smooth, easeIn, easeOut, backOut, rng, hash,
} from './gfx.js';
import { KELO, SARI, SARI_FACE, CUSTOMER, ICON, PRODUCTS } from './sprites.js';
import {
  FPS, S1_COUNT, s1BubbleTime, s1FallStart, S1_FALL, S1_FALL_DUR, S2, s2IncomingTimes,
  S3, s3PileTimes, S4, S4_FLOW, S4_FLOW_TRAVEL, S5, S6,
} from './timeline.js';

const step = (t, fps = 8) => Math.floor(t * fps);

// ---------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------
export function drawKelo(s, x, y, o = {}) {
  const t = o.t ?? 0;
  x = Math.round(x);
  y = Math.round(y);
  if (o.thrust) {
    const f = step(t, 12) % 2;
    s.px(x + 5, y + 13 + f, 'm');
    s.px(x + 6, y + 13 + f, 'm');
    s.px(x + 9, y + 14 - f, 'm');
    s.px(x + 10, y + 14 - f, 'm');
  }
  s.sprite(KELO, x, y);
  let eyes = o.eyes || 'normal';
  if (eyes === 'normal' && step(t + (o.seed || 0)) % 29 === 0) eyes = 'blink';
  const lk = o.look || 0;
  const lx = x + 5 + lk;
  const rx = x + 9 + lk;
  const ey = y + 5;
  if (eyes === 'normal') {
    s.rect(lx, ey, 2, 2, 'k');
    s.rect(rx, ey, 2, 2, 'k');
  } else if (eyes === 'blink' || eyes === 'closed') {
    s.rect(lx, ey + 1, 2, 1, 'k');
    s.rect(rx, ey + 1, 2, 1, 'k');
  } else if (eyes === 'wide') {
    s.rect(lx - 1, ey - 1, 3, 3, 'k');
    s.rect(rx, ey - 1, 3, 3, 'k');
  } else if (eyes === 'happy') {
    for (const ex of [lx, rx]) {
      s.px(ex - 1, ey + 1, 'k');
      s.px(ex, ey, 'k');
      s.px(ex + 1, ey, 'k');
      s.px(ex + 2, ey + 1, 'k');
    }
  } else if (eyes === 'worried') {
    s.rect(lx, ey + 1, 2, 1, 'k');
    s.rect(rx, ey + 1, 2, 1, 'k');
    s.px(lx + 1, ey - 1, 'k');
    s.px(rx, ey - 1, 'k');
  }
  const arm = o.arm;
  if (arm === 'wave') {
    const up = step(t, 6) % 2 === 0;
    s.box(x + 13, y + (up ? 1 : 4), 3, 5, 'o');
  } else if (arm === 'point') {
    s.box(x + 13, y + 6, 6, 3, 'o');
    s.px(x + 19, y + 7, 'k');
  } else if (arm === 'pointL') {
    s.box(x - 3, y + 6, 6, 3, 'o');
    s.px(x - 4, y + 7, 'k');
  } else if (arm === 'cover') {
    s.box(x + 3, y + 4, 5, 4, 'o');
    s.box(x + 8, y + 4, 5, 4, 'o');
  }
}

export function drawSari(s, x, y, o = {}) {
  const t = o.t ?? 0;
  let face = o.face || 'normal';
  if (face !== 'sad' && step(t + 1.3) % 31 === 0) face = 'blink';
  const rows = SARI.slice();
  const fr = SARI_FACE[face];
  for (let i = 0; i < 4; i++) rows[4 + i] = fr[i];
  s.sprite(rows, x, y + (o.slump ? 1 : 0));
}

// Props in Sari's hands, drawn after the counter so they sit in front.
function drawSariHands(s, x, y, o = {}) {
  const t = o.t ?? 0;
  if (o.pose === 'phone' || o.pose === 'type') {
    const px = x + 3;
    const py = y + 10;
    const glow = o.glow;
    s.rbox(px, py, 6, 9, glow ? 'O' : 'c');
    s.rect(px + 1, py + 1, 4, 1, 'k');
    if (!glow) {
      s.rect(px + 1, py + 3, 3, 1, 'G');
      s.rect(px + 1, py + 5, 2, 1, 'G');
    }
    s.px(x + 2, py + 6, 's');
    s.px(x + 9, py + 6, 's');
    if (o.pose === 'type') {
      const f = step(t, o.fast ? 12 : 6) % 3;
      s.px(px + 1 + f, py + 4, 's');
      s.px(px + 1 + f, py + 5, 'S');
    }
  } else if (o.pose === 'write') {
    const f = step(t, 6) % 5;
    const tipX = 128 + f * 2;
    s.line(tipX, 93, tipX + 3, 89, 'm');
    s.px(tipX, 93, 'k');
    s.px(tipX + 3, 89, 'd');
    s.rect(tipX + 2, 90, 2, 2, 's');
  }
}

function drawCustomer(s, x, y, o = {}) {
  const t = o.t ?? 0;
  const shirt = o.shirt || 't';
  s.sprite(CUSTOMER, x, y, { flip: o.flip, map: { x: shirt } });
  const walk = o.walking ? step(t, 8) % 2 : 0;
  const lx = x + 3;
  const ly = y + 13;
  s.rect(lx, ly, 2, walk ? 3 : 4, 'k');
  s.rect(lx + 3, ly, 2, walk ? 4 : 3, 'k');
  if (o.bag) s.sprite(ICON.bag, o.flip ? x - 3 : x + 8, y + 9);
}

function bubble(s, x, y, w, h, o = {}) {
  const fill = o.fill || 'c';
  s.rbox(x, y, w, h, fill);
  const tail = o.tail ?? 'left';
  if (tail === 'left') {
    s.px(x + 2, y + h, 'k');
    s.px(x + 3, y + h, 'k');
    s.px(x + 2, y + h + 1, 'k');
    s.px(x + 3, y + h - 1, fill);
  } else if (tail === 'right') {
    s.px(x + w - 3, y + h, 'k');
    s.px(x + w - 4, y + h, 'k');
    s.px(x + w - 3, y + h + 1, 'k');
    s.px(x + w - 4, y + h - 1, fill);
  }
  if (o.text) {
    const tw = s.textWidth(o.text);
    s.text(o.text, x + Math.round((w - tw) / 2), y + Math.round((h - 7) / 2), o.ink || 'k');
  } else if (o.lines !== false && h >= 7) {
    const ink = o.ink || 'G';
    s.rect(x + 3, y + 2, w - 7, 1, ink);
    s.rect(x + 3, y + 4, Math.max(2, w - 10), 1, ink);
  }
}

// ---------------------------------------------------------------------
// The warung (scenes 2, 3, 6)
// ---------------------------------------------------------------------
const BRICK_X = 96;
const BRICK_Y = 102;
export const brickSlot = (i) => ({ x: BRICK_X + (i % 8) * 16, y: BRICK_Y + (5 - Math.floor(i / 8)) * 8 });

const PAL = {
  day: { skyA: 'C', skyB: 'c', wall: 'w', seam: 'W', stripeA: 'o', stripeB: 'c', brickA: 'c', brickB: 'C', ground: 'W', groundSpeck: 'w', wood: 'w', woodHi: 'O' },
  dawn: { skyA: 'O', skyB: 'c', wall: 'w', seam: 'W', stripeA: 'o', stripeB: 'c', brickA: 'c', brickB: 'C', ground: 'W', groundSpeck: 'w', wood: 'w', woodHi: 'O' },
  night: { skyA: 'n', skyB: 'N', wall: 'W', seam: 'k', stripeA: 'd', stripeB: 'C', brickA: 'C', brickB: 'G', ground: 'n', groundSpeck: 'N', wood: 'W', woodHi: 'w' },
};

function drawSky(s, mode, t, f) {
  const p = PAL[mode];
  s.vgrad(0, 0, W, 150, p.skyA, p.skyB);
  if (mode === 'night') {
    const r = rng(5);
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(r() * W);
      const y = Math.floor(r() * 90);
      if (hash(i, 0, step(t, 3)) > 0.15) s.px(x, y, 'c');
    }
  } else {
    // two slow pixel clouds
    for (const [cx0, cy, sp] of [[30, 16, 1.2], [230, 10, 0.8]]) {
      const cx = Math.round(((cx0 + t * sp) % 380) - 30);
      s.rect(cx, cy, 22, 4, 'c');
      s.rect(cx + 4, cy - 3, 10, 3, 'c');
      s.rect(cx + 2, cy + 4, 18, 1, 'C');
    }
  }
}

function drawClock(s, cx, cy, r, t, spin) {
  s.ring(cx, cy, r, 'c');
  const a2 = spin * Math.PI * 2 - Math.PI / 2;
  const a1 = (spin / 12) * Math.PI * 2 - Math.PI / 2 + 1.2;
  s.line(cx, cy, cx + Math.cos(a2) * (r - 1), cy + Math.sin(a2) * (r - 1), 'k');
  s.line(cx, cy, cx + Math.cos(a1) * (r - 3), cy + Math.sin(a1) * (r - 3), 'd');
  s.px(cx, cy, 'k');
}

function drawBook(s, x, y, flipFrame = -1) {
  s.box(x, y, 17, 5, 'c');
  s.rect(x + 8, y, 1, 5, 'k');
  s.rect(x + 2, y + 2, 5, 1, 'G');
  s.rect(x + 10, y + 2, 5, 1, 'G');
  if (flipFrame >= 0) {
    const widths = [8, 6, 3, 1, 3, 6];
    const w = widths[flipFrame % widths.length];
    const right = flipFrame % 6 < 3;
    const px = right ? x + 8 : x + 9 - w;
    s.box(px, y - 3, w + 1, 5, 'c');
  }
}

function drawPhoneUpright(s, x, y, o = {}) {
  s.rbox(x, y, 8, 13, o.glow ? 'O' : 'c');
  s.rect(x + 1, y + 1, 6, 1, 'k');
  if (o.dots) for (let i = 0; i < Math.min(3, o.dots); i++) s.rect(x + 2, y + 3 + i * 3, 4, 2, i === 0 ? 'o' : 'G');
}

// cfg: { mode, t, f, build, skyP, clockSpin, clock, lamp, shelfEsteh, sari, kelo, extras }
function drawWarung(s, cfg) {
  const { mode, t, f } = cfg;
  const p = PAL[mode];
  const b = cfg.build ?? 99; // seconds since build began
  drawSky(s, mode, t, f);
  if (cfg.skyP !== undefined && cfg.skyP < 1) s.speck(0, 0, W, 150, 'k', 1 - cfg.skyP);

  // sun (dawn)
  if (cfg.sun) s.ring(cfg.sun.x, cfg.sun.y, 7, 'm', 'M');

  // back wall, revealed top-down
  const wallP = seg(b, 0.8, 1.4);
  if (wallP > 0) {
    const wh = Math.round((98 - 60) * wallP);
    s.rect(92, 60, 137, wh, p.wall);
    for (let x = 100; x < 228; x += 10) s.rect(x, 60, 1, wh, p.seam);
    s.boil(92, 60, 137, wh, p.seam, f, 0.015, 3);
    if (mode !== 'night') s.speck(92, 63, 137, 4, p.seam, 0.5);
  }

  // shelf
  if (b > 2.1) {
    for (const sy of [78, 92]) {
      s.rect(182, sy, 43, 2, 'W');
      s.rect(182, sy + 2, 43, 1, 'k');
    }
    const top = ['kopi', 'gorengan', 'nasi', 'esteh'];
    top.forEach((k, j) => {
      if (b > 2.2 + j * 0.08) s.sprite(ICON[k], 184 + j * 10, 71);
    });
    const n = cfg.shelfEsteh ?? 2;
    for (let j = 0; j < n; j++) if (b > 2.5 + j * 0.08) s.sprite(ICON.esteh, 184 + j * 10, 85);
  }

  if (cfg.clock) drawClock(s, cfg.clock.x, cfg.clock.y, cfg.clock.r, t, cfg.clockSpin || 0);

  // lamp light pool (behind characters)
  if (cfg.lamp)
    for (let y = 70; y < 96; y++) {
      const hw = Math.round(6 + (y - 70) * 1.1);
      s.speck(160 - hw, y, hw * 2 + 1, 1, 'M', 0.2);
    }

  // Bu Sari (body, behind the counter)
  if (cfg.sari) drawSari(s, cfg.sari.x, cfg.sari.y, cfg.sari);

  // posts grow from the ground
  const postP = easeOut(seg(b, 0.3, 1.0));
  if (postP > 0) {
    const ph = Math.round(90 * postP);
    for (const px of [84, 229]) {
      s.box(px, 150 - ph, 8, ph + 1, p.wood);
      s.rect(px + 2, 151 - ph, 1, ph - 1, p.woodHi);
    }
  }

  // awning stripes slide in
  for (let i = 0; i < 13; i++) {
    const st = 1.2 + i * 0.06;
    if (b < st) continue;
    const dy = Math.round(-12 * (1 - easeOut(seg(b, st, st + 0.15))));
    const sx = 82 + i * 12;
    const c = i % 2 ? p.stripeB : p.stripeA;
    s.rect(sx, 41 + dy, 12, 19, c);
    s.rect(sx, 40 + dy, 12, 1, 'k');
    s.rect(sx, 60 + dy, 12, 1, c);
    s.px(sx, 61 + dy, 'k');
    s.rect(sx + 1, 61 + dy, 10, 1, c);
    s.px(sx + 11, 61 + dy, 'k');
    s.rect(sx + 1, 62 + dy, 2, 1, 'k');
    s.rect(sx + 3, 62 + dy, 6, 1, c);
    s.rect(sx + 9, 62 + dy, 2, 1, 'k');
    s.rect(sx + 3, 63 + dy, 6, 1, 'k');
    if (i === 0) s.rect(sx, 41 + dy, 1, 21, 'k');
    if (i === 12) s.rect(sx + 11, 41 + dy, 1, 21, 'k');
  }

  // sign
  if (b > 2.0) {
    const dy = Math.round(-8 * (1 - easeOut(seg(b, 2.0, 2.2))));
    s.rect(130, 37 + dy, 2, 4, 'W');
    s.rect(188, 37 + dy, 2, 4, 'W');
    s.box(114, 25 + dy, 92, 14, p.wood);
    s.box(116, 27 + dy, 88, 10, 'c');
    const label = 'WARUNG SARI';
    s.text(label, 160 - Math.floor(s.textWidth(label) / 2), 29 + dy, 'k');
  }

  // lamp bulb
  if (b > 2.0) {
    s.rect(160, 63, 1, 4, 'k');
    s.box(159, 67, 3, 3, cfg.lamp ? 'm' : 'G');
  }

  // counter top
  if (b > 1.0) {
    s.box(86, 96, 149, 6, p.wood);
    s.rect(87, 97, 147, 1, p.woodHi);
    s.box(92, 101, 5, 50, p.wood);
    s.box(224, 101, 5, 50, p.wood);
  }

  // bricks (the bubbles from scene 1)
  for (let i = 0; i < 48; i++) {
    const { x, y } = brickSlot(i);
    s.box(x, y, 17, 9, (i + Math.floor(i / 8)) % 2 ? p.brickA : p.brickB);
  }

  // ground
  s.rect(0, 150, W, 30, p.ground);
  s.rect(0, 150, W, 1, 'k');
  s.boil(0, 151, W, 29, p.groundSpeck, f, 0.03, 7);

  if (cfg.after) cfg.after(s);
}

// ---------------------------------------------------------------------
// Scene 1 — hook
// ---------------------------------------------------------------------
const S1_POS = (() => {
  const r = rng(77);
  const out = [{ x: 152, y: 84 }];
  for (let n = 1; n < S1_COUNT; n++) out.push({ x: 12 + Math.floor(r() * 280), y: 14 + Math.floor(r() * 112) });
  return out;
})();

function scene1(s, t, f) {
  s.clear('k');
  if (t < 1.0) {
    if (step(t, 4) % 2 === 0) s.rect(159, 88, 2, 2, 'o');
  }
  // ground rises before the bubbles fall onto it
  const gp = easeOut(seg(t, 7.0, 7.6));
  if (gp > 0) {
    const gy = Math.round(lerp(180, 150, gp));
    s.rect(0, gy, W, 180 - gy, 'W');
    s.rect(0, gy, W, 1, 'k');
    s.boil(0, gy + 1, W, 180 - gy, 'w', f, 0.03, 7);
  }
  let shown = 0;
  for (let n = 0; n < S1_COUNT; n++) {
    const bt = s1BubbleTime(n);
    if (t < bt) continue;
    shown++;
    const p0 = S1_POS[n];
    const slot = brickSlot(n);
    const fs = s1FallStart(n);
    const u = seg(t, fs, fs + S1_FALL_DUR);
    if (u >= 1) {
      s.box(slot.x, slot.y, 17, 9, (n + Math.floor(n / 8)) % 2 ? 'c' : 'C');
      continue;
    }
    let x = lerp(p0.x, slot.x, smooth(u));
    let y = lerp(p0.y, slot.y, easeIn(u));
    if (u === 0 && t - bt < 2 / FPS) x += 1;
    const pop = t - bt < 1 / FPS;
    if (pop) bubble(s, x + 3, y + 2, 10, 5, { tail: 'none', lines: false });
    else bubble(s, x, y, 17, 9, { tail: n % 3 === 0 ? 'right' : 'left', lines: u < 0.5 });
  }
  // counter
  if (t >= 1.0 && t < S1_FALL + 0.4) {
    bubble(s, 262, 10, 12, 8, { tail: 'left', lines: false, fill: 'o' });
    s.text(String(shown), 280, 8, 'c', 2);
  }
}

// ---------------------------------------------------------------------
// Scene 2 — familiar world
// ---------------------------------------------------------------------
const KELO_HOME = { x: 40, y: 84 };
const PHONE_DESK = { x: 166, y: 84 };

function clockSpin(t) {
  if (t < S2.pageFly[1]) return 0;
  if (t < 25) return (t - S2.pageFly[1]) * 2.5;
  return (25 - S2.pageFly[1]) * 2.5 + (t - 25) * 0.05;
}

function keloBob(t) {
  return step(t, 4) % 4 < 2 ? 0 : 1;
}

function scene2(s, t, f) {
  const lt = t - 10;
  const sariOn = t >= S2.saris;
  const typing = t >= S2.typeA[0] && t < S2.typeA[1];
  const writing = t >= S2.write[0] && t < S2.flip + 0.4;
  const sariX = writing ? (t - S2.write[0] < 0.12 ? 146 : 142) : 150;
  const glow = t > 12.7 && t < 13.0 && step(t, 16) % 2 === 0;

  let clock = null;
  if (t >= S2.pageFly[1]) clock = { x: 114, y: 74, r: 7 };

  drawWarung(s, {
    mode: 'day',
    t,
    f,
    build: lt,
    skyP: seg(lt, 0, 1.5),
    clock,
    clockSpin: clockSpin(t),
    shelfEsteh: 2,
    sari: sariOn ? { x: sariX, y: 80 + (t - S2.saris < 1 / FPS ? 2 : 0), t } : null,
    after: (s) => {
      if (sariOn) {
        drawBook(s, 126, 92, t >= S2.flip && t < S2.pageFly[0] ? step(t, 16) : -1);
        if (writing && t < S2.flip) drawSariHands(s, sariX, 80, { pose: 'write', t });
        else if (!writing) drawSariHands(s, sariX, 80, { pose: typing ? 'type' : 'phone', t, glow });
        if (writing) drawPhoneUpright(s, PHONE_DESK.x, PHONE_DESK.y);
      }
      // chat ping-pong while typing: incoming cream, reply teal
      for (const it of s2IncomingTimes()) {
        const a = seg(t, it, it + 0.8);
        if (a > 0 && a < 1) bubble(s, 166, Math.round(78 - a * 8), 14, 7, { tail: 'left' });
        const r = seg(t, it + 0.45, it + 1.25);
        if (r > 0 && r < 1) bubble(s, 138, Math.round(80 - r * 8), 14, 7, { tail: 'right', fill: 't', ink: 'T' });
      }
      // page flies up and becomes the clock
      if (t >= S2.pageFly[0] && t < S2.pageFly[1]) {
        const u = smooth(seg(t, S2.pageFly[0], S2.pageFly[1]));
        const x = lerp(134, 114, u);
        const y = lerp(92, 74, u) - Math.sin(u * Math.PI) * 10;
        if (u < 0.5) {
          const w = Math.round(lerp(7, 12, u * 2));
          s.box(x - w / 2, y - 3, w, 6, 'c');
        } else s.ring(x, y, Math.round(lerp(4, 7, (u - 0.5) * 2)), 'c');
      }
      // Kelo
      if (t >= S2.keloOut) {
        const u = smooth(seg(t, S2.keloOut, S2.keloOut + 0.8));
        const kx = lerp(154, KELO_HOME.x, u);
        const ky = lerp(88, KELO_HOME.y, u) - Math.sin(u * Math.PI) * 26 + (u >= 1 ? keloBob(t) : 0);
        let arm = null;
        if (t > 13.9 && t < 15.3) arm = 'wave';
        if (t > 15.8 && t < 18.6) arm = 'point';
        drawKelo(s, kx, ky, { t, arm, thrust: true, look: arm === 'point' ? 1 : 0 });
      }
    },
  });
}

// ---------------------------------------------------------------------
// Scene 3 — disruption
// ---------------------------------------------------------------------
function scene3World(s, t, f, mode) {
  const sad = t >= S3.sad;
  drawWarung(s, {
    mode,
    t,
    f,
    clock: { x: 114, y: 74, r: 7 },
    clockSpin: clockSpin(t),
    lamp: mode === 'night' && t >= S3.lamp,
    shelfEsteh: 2,
    sari: { x: 150, y: 80, t, face: sad ? 'sad' : 'normal', slump: sad },
    after: (s) => {
      drawBook(s, 126, 92);
      if (!sad) drawSariHands(s, 150, 80, { pose: 'type', t, fast: true });
      const dots = sad ? 3 : 0;
      if (sad) drawPhoneUpright(s, PHONE_DESK.x, PHONE_DESK.y, { dots });
      // pile of unanswered chats above her head
      const times = s3PileTimes();
      times.forEach((pt, k) => {
        if (t < pt) return;
        const u = easeOut(seg(t, pt, pt + 0.25));
        const sway = Math.round(Math.sin(step(t, 8) * 0.5 + k) * (k / 8));
        const tx = 138 + (k % 2) * 14 + sway;
        const ty = 70 - Math.floor(k / 2) * 9;
        const x = lerp(sad ? PHONE_DESK.x : 154, tx, u);
        const y = lerp(sad ? PHONE_DESK.y : 92, ty, u);
        bubble(s, x, y, 17, 9, { tail: k % 2 ? 'right' : 'left', fill: mode === 'night' ? 'C' : 'c' });
      });
      // the cancelled order
      if (t >= S3.grayIn) {
        const inP = easeOut(seg(t, S3.grayIn, S3.grayIn + 0.3));
        const gray = t >= S3.grayTurn;
        const shake = gray && t - S3.grayTurn < 0.25 ? (step(t, 24) % 2 ? 1 : -1) : 0;
        let bx = Math.round(lerp(-70, 8, inP)) + shake;
        let by = 40;
        let bw = 68;
        const fall = seg(t, S3.fall[0], S3.fall[1]);
        if (fall > 0) {
          const u = easeIn(fall);
          bw = Math.max(4, Math.round(lerp(68, 4, u)));
          bx = Math.round(lerp(8, PHONE_DESK.x + 2, u));
          by = Math.round(lerp(40, PHONE_DESK.y + 4, u) - Math.sin(u * Math.PI) * 12);
        }
        if (fall < 1) {
          if (bw > 40) bubble(s, bx, by, bw, 11, { tail: 'left', fill: gray ? 'g' : 'c', ink: gray ? 'G' : 'k', text: 'GA JADI DEH' });
          else s.rbox(bx, by, bw, Math.max(3, Math.round(bw / 6)), 'g');
        }
      }
      // the ledger with a wrong total
      if (t >= S3.bookIn && t < 32.2) {
        const inP = easeOut(seg(t, S3.bookIn, S3.bookIn + 0.3));
        const outP = easeIn(seg(t, 31.6, 32.2));
        const x = Math.round(lerp(322, 236, inP) + outP * 90);
        s.box(x, 70, 78, 46, 'c');
        s.rect(x + 1, 71, 76, 1, 'C');
        s.text('ES TEH', x + 4, 75, 'k');
        s.text('2', x + 68, 75, 'k');
        s.text('GORENGAN', x + 4, 84, 'k');
        s.text('5', x + 68, 84, 'k');
        s.rect(x + 4, 93, 70, 1, 'k');
        const blink = t > 30.2 && step(t, 6) % 2 === 0;
        s.text('RP 85.000', x + 4, 98, blink ? 'd' : 'k');
        s.text('?', x + 66, 98, 'd');
        if (t > 30.6) s.rect(x + 2, 101, 60, 1, 'd');
      }
      // Kelo
      let eyes = 'normal';
      let arm = null;
      if (t > 25.6) eyes = 'worried';
      if (t > 29.6 && t < 31.6) arm = 'cover';
      drawKelo(s, KELO_HOME.x, KELO_HOME.y + keloBob(t), { t, eyes, arm, thrust: true });
    },
  });
}

const tmpA = new Surface();
const tmpB = new Surface();
const tmpC = new Surface();

function scene3(s, t, f) {
  const p = seg(t, S3.night[0], S3.night[1]);
  if (p <= 0) scene3World(s, t, f, 'day');
  else if (p >= 1) scene3World(s, t, f, 'night');
  else {
    scene3World(s, t, f, 'day');
    scene3World(tmpA, t, f, 'night');
    s.dissolve(tmpA, p);
  }
  // dive into the phone
  const z = seg(t, S3.zoom[0], S3.zoom[1]);
  if (z > 0) {
    const u = easeIn(z);
    const x = lerp(PHONE_DESK.x, -24, u);
    const y = lerp(PHONE_DESK.y, -36, u);
    const w = lerp(8, 368, u);
    const h = lerp(13, 252, u);
    const bez = Math.max(1, Math.round(lerp(1, 24, u)));
    s.rect(x, y, w, h, 'k');
    scene4(tmpB, 34.0, f, true);
    s.drawScaled(tmpB, x + bez, y + bez * 1.4, w - bez * 2, h - bez * 2.8);
  }
}

// ---------------------------------------------------------------------
// Scenes 4 & 5 — inside the phone
// ---------------------------------------------------------------------
const ST_CX = [44, 121, 198, 275];
const ROW_Y = (i) => 78 + i * 14;
const BLOCK_X = (k) => 28 + k * 13;
const BAR_X = (i) => 116 + i * 44;
const BAR_Y = (k) => 133 - k * 8;

function appFrame(s, t, f, iconMoon) {
  s.clear('c');
  for (let y = 20; y < H; y += 8) for (let x = 4; x < W; x += 8) s.px(x, y, 'C');
  s.boil(0, 14, W, H - 14, 'C', f, 0.006, 11);
  s.rect(0, 0, W, 14, 'o');
  s.rect(0, 14, W, 1, 'd');
  s.text('KELOLA.AI', 8, 4, 'c');
  s.sprite(iconMoon ? ICON.moon : ICON.sun, 302, 5);
}

function block(s, x, y, c = 'o') {
  s.box(x, y, 12, 7, c);
  s.rect(x + 1, y + 1, 10, 1, c === 'm' ? 'c' : 'O');
}

// Which blocks exist in the table at time t: returns counts and in-flight.
function tableState(t) {
  const items = [];
  // first message
  items.push({ p: 0, at: S4.drop });
  for (const [st, p] of S4_FLOW) items.push({ p, at: st + S4_FLOW_TRAVEL });
  const counts = [0, 0, 0, 0];
  const out = [];
  for (const it of items) {
    const k = counts[it.p]++;
    out.push({ ...it, k });
  }
  return out;
}
const TABLE = tableState();

function scene4(s, t, f, still = false) {
  appFrame(s, t, f, t >= S4.moon);
  const fold = seg(t, S4.fold[0], S4.fold[1]);

  // stations
  ST_CX.forEach((cx, i) => {
    const un = easeOut(seg(t, S4.unfold[i], S4.unfold[i] + 0.4)) * (1 - fold);
    if (un <= 0) return;
    const h = Math.max(2, Math.round(36 * un));
    const x = cx - 32;
    const y = 54 - h;
    // flash header when a flow pip passes
    let flash = false;
    for (const [st] of S4_FLOW) {
      const px = lerp(ST_CX[0], ST_CX[3], seg(t, st, st + S4_FLOW_TRAVEL));
      if (t > st && t < st + S4_FLOW_TRAVEL && Math.abs(px - cx) < 4) flash = true;
    }
    s.box(x, y, 64, h, 'c');
    s.rect(x + 1, y + 1, 62, Math.min(4, h - 2), flash ? 'o' : 't');
    if (un < 1) return;
    if (i === 0) {
      const hot = t > S4.msgIn - 0.2 && t < S4.msgIn + 0.3;
      s.rbox(cx - 5, 26, 10, 15, hot || flash ? 'O' : 'c');
      s.rect(cx - 4, 27, 8, 1, 'k');
      if (t > S4.msgIn - 0.4 && t < S4.toS2[0]) s.rbox(cx + 3, 24, 5, 5, 'o');
    } else if (i === 2) {
      PRODUCTS.forEach((k, j) => {
        const ix = cx - 26 + j * 14;
        s.sprite(ICON[k], ix, 26);
        let stock = [0.9, 0.7, 0.8, 0.6][j];
        if (j === 0 && t >= S4.match) stock -= 0.2;
        for (const [st, p] of S4_FLOW) if (p === j && t > st + S4_FLOW_TRAVEL * 0.66) stock -= 0.02;
        s.box(ix, 38, 9, 4, 'C');
        s.rect(ix + 1, 39, Math.max(1, Math.round(7 * stock)), 2, 'T');
        const matched = (j === 0 && t >= S4.match && t < S4.toS4[1]) ||
          S4_FLOW.some(([st, p]) => p === j && Math.abs(t - (st + S4_FLOW_TRAVEL * 0.66)) < 0.08);
        if (matched) s.sprite(ICON.check2, ix - 1, 44);
      });
    } else if (i === 3) {
      const sending = t > S4.reply - 0.1 && t < S4.reply + 0.4;
      const c = sending || flash ? 't' : 'G';
      // paper plane
      s.line(cx - 8, 36, cx + 8, 30, c);
      s.line(cx + 8, 30, cx - 2, 42, c);
      s.line(cx - 8, 36, cx - 2, 38, c);
      s.line(cx - 2, 38, cx - 2, 42, c);
      s.line(cx - 2, 38, cx + 8, 30, c);
    }
  });

  // Kelo lives in station 2
  {
    const un = seg(t, S4.unfold[1] + 0.3, S4.unfold[1] + 0.5);
    if (un > 0 || fold > 0) {
      const reading = t >= S4.read[0] && t < S4.read[1];
      let look = 0;
      if (reading) look = step(t, 4) % 2 ? 1 : -1;
      for (const [st] of S4_FLOW) {
        const px = lerp(ST_CX[0], ST_CX[3], seg(t, st, st + S4_FLOW_TRAVEL));
        if (t > st && t < st + S4_FLOW_TRAVEL && Math.abs(px - ST_CX[1]) < 10) look = 1;
      }
      const u = smooth(fold);
      const kx = lerp(ST_CX[1] - 8, 24, u);
      const ky = lerp(30, 40, u) - Math.sin(u * Math.PI) * 10;
      const eyes = t > S4.reply && t < S4.reply + 1.2 ? 'happy' : 'normal';
      drawKelo(s, kx, ky, { t, look, eyes, thrust: fold > 0 });
    }
  }

  // belt
  const beltP = 1 - fold;
  if (t > S4.unfold[0] && beltP > 0) {
    const bw = Math.round(296 * Math.min(easeOut(seg(t, S4.unfold[0], S4.unfold[3])), beltP));
    s.box(12, 64, bw, 6, 'G');
    const off = still ? 0 : step(t, 24) % 6;
    for (let x = 13 + off; x < 12 + bw - 1; x += 6) s.rect(x, 65, 2, 4, 'g');
  }

  // first message on the belt
  if (t >= S4.msgIn && t < S4.drop) {
    let cx = ST_CX[0];
    if (t >= S4.toS2[0]) cx = lerp(ST_CX[0], ST_CX[1], smooth(seg(t, S4.toS2[0], S4.toS2[1])));
    if (t >= S4.toS3[0]) cx = lerp(ST_CX[1], ST_CX[2], smooth(seg(t, S4.toS3[0], S4.toS3[1])));
    if (t >= S4.toS4[0]) cx = lerp(ST_CX[2], ST_CX[3], smooth(seg(t, S4.toS4[0], S4.toS4[1])));
    const pop = easeOut(seg(t, S4.msgIn, S4.msgIn + 0.25));
    const y = Math.round(lerp(32, 52, pop));
    if (t < S4.reply) {
      const x = Math.round(cx - 26);
      bubble(s, x, y, 52, 11, { tail: 'left', lines: false });
      // highlight words as Kelo reads them
      const lit = t < S4.read[0] ? 0 : Math.floor(seg(t, S4.read[0], S4.read[1] - 0.4) * 6);
      const txt = 'ES TEH 2';
      let tx = x + Math.round((52 - s.textWidth(txt)) / 2);
      for (let i = 0; i < txt.length; i++) {
        const ch = txt[i];
        const hot = i < 6 && i < lit;
        tx = s.text(ch, tx, y + 2, hot ? 'o' : 'k');
      }
    } else {
      const x = Math.round(cx - 22);
      bubble(s, x, y, 46, 11, { tail: 'right', fill: 't', lines: false });
      s.text('SIAP!', x + 4, y + 2, 'c');
      s.sprite(ICON.check2.map((r) => r.replace(/t/g, 'c')), x + 33, y + 3);
    }
  }

  // fast flow pips
  for (const [st] of S4_FLOW) {
    const u = seg(t, st, st + S4_FLOW_TRAVEL);
    if (u <= 0 || u >= 1) continue;
    const x = Math.round(lerp(ST_CX[0], ST_CX[3], u)) - 6;
    const done = u > 0.8;
    s.rbox(x, 57, 12, 6, done ? 't' : 'c');
    s.rect(x + 2, 59, 7, 1, done ? 'c' : 'G');
  }

  // table
  if (!still || t > 34) {
    const tblP = easeOut(seg(t, 36.0, 36.6));
    if (tblP > 0) {
      for (let i = 0; i < 4; i++) {
        const y = ROW_Y(i);
        const ix = Math.round(lerp(-12, 12, tblP));
        s.sprite(ICON[PRODUCTS[i]], ix, y);
        s.rect(26, y + 9, Math.round(270 * tblP), 1, 'C');
      }
    }
    for (const b of TABLE) {
      if (t < b.at) continue;
      const u = seg(t, b.at, b.at + 0.35);
      const tx = BLOCK_X(b.k);
      const ty = ROW_Y(b.p);
      const x = Math.round(lerp(300, tx, easeOut(u)));
      const y = Math.round(lerp(66, ty, u < 1 ? smooth(u) : 1));
      block(s, x, y);
    }
  }
}

// counts after scene 4
const S4_COUNTS = [0, 1, 2, 3].map((p) => TABLE.filter((b) => b.p === p).length);

function barBlocks(t) {
  // positions of every block during scene 5
  const out = [];
  for (const b of TABLE) out.push({ p: b.p, k: b.k, from: { x: BLOCK_X(b.k), y: ROW_Y(b.p) }, at: null });
  const counts = S4_COUNTS.slice();
  for (const [at, p] of S5.drops) out.push({ p, k: counts[p]++, from: null, at });
  return out;
}
const S5_BLOCKS = barBlocks();
const ESTEH_TOP = S5_BLOCKS.filter((b) => b.p === 0).length - 1;

function scene5Chart(s, t, f, o = {}) {
  appFrame(s, t, f, false);
  s.rect(104, 141, 162, 1, 'k');
  for (let i = 0; i < 4; i++) {
    const u = smooth(seg(t, S5.morph[0], S5.morph[0] + 0.8));
    const x = Math.round(lerp(12, BAR_X(i) + 2, u));
    const y = Math.round(lerp(ROW_Y(i), 143, u));
    s.sprite(ICON[PRODUCTS[i]], x, y);
  }
  for (const b of S5_BLOCKS) {
    const tx = BAR_X(b.p);
    const ty = BAR_Y(b.k);
    let x = tx;
    let y = ty;
    if (b.from) {
      const d = b.k * 0.06 + b.p * 0.12;
      const u = smooth(seg(t, S5.morph[0] + d, S5.morph[0] + d + 0.7));
      x = Math.round(lerp(b.from.x, tx, u));
      y = Math.round(lerp(b.from.y, ty, u));
    } else {
      if (t < b.at) continue;
      const u = seg(t, b.at, b.at + 0.35);
      y = Math.round(lerp(-10, ty, easeIn(u)));
    }
    if (b.p === 0 && o.hideEsteh && o.hideEsteh(b.k)) continue;
    const gold = b.p === 0 && t >= S5.highlight + (ESTEH_TOP - b.k) * 0.03;
    block(s, x, y, gold ? 'm' : 'o');
  }
  if (t >= S5.highlight && !o.noLabel) {
    const u = backOut(seg(t, S5.highlight + 0.3, S5.highlight + 0.6));
    const label = 'ES TEH';
    const lw = s.textWidth(label);
    const ly = Math.round(BAR_Y(ESTEH_TOP) - 11 + (1 - u) * 6);
    if (u > 0) s.textOutlined(label, BAR_X(0) + 6 - Math.floor(lw / 2), ly, 'k', 'c');
  }
  // peak hours
  if (t >= S5.peak - 0.2) {
    const u = backOut(seg(t, S5.peak - 0.2, S5.peak + 0.1));
    const py = Math.round(96 + (1 - u) * 8);
    s.box(12, py, 82, 32, 'c');
    for (let j = 0; j < 12; j++) {
      const lit = j >= 3 && j <= 5 && t >= S5.peak + (j - 3) * 0.12;
      s.box(16 + j * 6, py + 5, 6, 10, lit ? 'm' : 'C');
    }
    s.text('08', 16, py + 19, 'g');
    s.text('12', 40, py + 19, 'g');
    s.text('16', 64, py + 19, 'g');
  }
  // Kelo
  let eyes = 'normal';
  let arm = null;
  if (t > 54.0 && t < 55.6) eyes = 'wide';
  if (t > S5.highlight && t < 59.6) arm = 'point';
  drawKelo(s, 24, 40 + keloBob(t), { t, eyes, arm, thrust: true, look: arm ? 1 : 0 });
}

const SUN0 = { x: 166, y: 22 };

function scene5(s, t, f) {
  const outP = seg(t, S5.out[0], S5.out[1]);
  scene5Chart(s, t, f, {
    hideEsteh: (k) => k === ESTEH_TOP ? outP > 0.1 : t > S5.out[0] + (k * 0.04),
    noLabel: outP > 0,
  });
  if (outP > 0) {
    scene6World(tmpC, 62.0, f);
    s.dissolve(tmpC, seg(t, S5.out[0] + 0.3, S5.out[1]));
    // top block becomes the sun
    const u = smooth(seg(t, S5.out[0] + 0.1, S5.out[1] - 0.2));
    const x = lerp(BAR_X(0) + 6, SUN0.x, u);
    const y = lerp(BAR_Y(ESTEH_TOP) + 3, SUN0.y, u);
    if (u < 0.5) block(s, Math.round(x - 6), Math.round(y - 3), 'm');
    else s.ring(x, y, Math.round(lerp(4, 7, (u - 0.5) * 2)), 'm', 'M');
  }
}

// ---------------------------------------------------------------------
// Scene 6 — consequence
// ---------------------------------------------------------------------
function sariX6(t) {
  if (t < S6.walkTo[0]) return 150;
  if (t < S6.walkTo[1]) return Math.round(lerp(150, 196, Math.floor(seg(t, ...S6.walkTo) * 6) / 6));
  if (t < S6.walkBack[0]) return 196;
  if (t < S6.walkBack[1]) return Math.round(lerp(196, 150, Math.floor(seg(t, ...S6.walkBack) * 6) / 6));
  return 150;
}

function scene6World(s, t, f) {
  const sx = sariX6(t);
  const walking = (t > S6.walkTo[0] && t < S6.walkTo[1]) || (t > S6.walkBack[0] && t < S6.walkBack[1]);
  const placed = S6.place.filter((p) => t >= p).length;
  const sunU = smooth(seg(t, 62.4, 72));
  drawWarung(s, {
    mode: 'dawn',
    t,
    f,
    sun: { x: Math.round(lerp(SUN0.x, 252, sunU)), y: Math.round(lerp(SUN0.y, 14, sunU)) },
    clock: { x: 114, y: 74, r: 7 },
    clockSpin: 6.4 + (t - 62) * 0.05,
    shelfEsteh: 1 + placed,
    sari: { x: sx, y: 80 - (walking && step(t, 8) % 2 ? 1 : 0), t, face: 'smile' },
    after: (s) => {
      drawBook(s, 126, 92);
      drawPhoneUpright(s, PHONE_DESK.x, PHONE_DESK.y, { glow: S6.checks.some((c) => t > c && t < c + 0.1) });
      for (const c of S6.checks) {
        const u = seg(t, c, c + 0.6);
        if (u > 0 && u < 1) s.sprite(ICON.check2, PHONE_DESK.x - 1, Math.round(78 - u * 8));
      }
      // carrying a glass to the shelf
      if (t > S6.walkTo[0] - 0.2 && t < S6.place[2]) s.sprite(ICON.esteh, sx + 2, 88);
      // customer
      let cx = null;
      let walkingC = false;
      let flip = false;
      let hasBag = false;
      if (t >= S6.custIn[0] && t < S6.custIn[1]) {
        cx = Math.round(lerp(-12, 104, seg(t, ...S6.custIn)));
        walkingC = true;
      } else if (t >= S6.custIn[1] && t < S6.custOut[0]) cx = 104;
      else if (t >= S6.custOut[0] && t < S6.custOut[1]) {
        cx = Math.round(lerp(104, -14, seg(t, ...S6.custOut)));
        walkingC = true;
        flip = true;
      }
      if (t >= S6.hand[1]) hasBag = true;
      if (cx !== null) drawCustomer(s, cx, 133, { t, walking: walkingC, flip, bag: hasBag, shirt: 'o' });
      if (t >= S6.hand[0] && t < S6.hand[1]) {
        const u = smooth(seg(t, ...S6.hand));
        s.sprite(ICON.bag, Math.round(lerp(152, 112, u)), Math.round(lerp(89, 142, u) - Math.sin(u * Math.PI) * 10));
      }
      if (t >= S6.heart && t < S6.heart + 0.9) {
        const u = seg(t, S6.heart, S6.heart + 0.9);
        if (!(u > 0.7 && step(t, 12) % 2)) s.sprite(ICON.heart, (cx ?? 104) + 1, Math.round(124 - u * 8));
      }
      // Kelo relaxes next to the phone
      const u = smooth(seg(t, ...S6.keloFly));
      const kx = lerp(24, 176, u);
      const ky = lerp(40, 83, u) - Math.sin(u * Math.PI) * 14;
      drawKelo(s, kx, ky + (u < 1 ? keloBob(t) : 0), { t, eyes: u >= 1 ? 'happy' : 'normal', thrust: u < 1 });
    },
  });
}

function scene6(s, t, f) {
  const pull = seg(t, S6.pull[0], S6.pull[1]);
  if (pull <= 0) return scene6World(s, t, f);
  scene7Map(s, 74.0, f, { onlySari: true });
  scene6World(tmpA, t, f);
  const sc = Math.exp(lerp(0, Math.log(1 / 70), easeIn(pull)));
  const dw = W * sc;
  const dh = H * sc;
  if (dw >= 2) s.drawScaled(tmpA, MAP_CENTER.x - 160 * sc, MAP_CENTER.y - 100 * sc, dw, dh);
}

// ---------------------------------------------------------------------
// Scene 7 — recap and logo
// ---------------------------------------------------------------------
const MAP_CENTER = { x: 160, y: 96 };
const WARUNGS = (() => {
  const r = rng(9);
  const pts = [{ x: MAP_CENTER.x - 1, y: MAP_CENTER.y - 1 }];
  while (pts.length < 170) {
    const cx = Math.floor(r() * 16);
    const cy = Math.floor(r() * 13);
    const x = cx * 20 + 3 + Math.floor(r() * 14);
    const y = cy * 14 + 3 + Math.floor(r() * 8);
    if (Math.abs(x - MAP_CENTER.x) < 4 && Math.abs(y - MAP_CENTER.y) < 4) continue;
    pts.push({ x, y, d: Math.hypot(x - MAP_CENTER.x, y - MAP_CENTER.y) });
  }
  pts[0].d = 0;
  return pts;
})();

const LOGO = (() => {
  const str = 'kelola.aı';
  const tmp = new Surface(200, 10);
  tmp.clear(0);
  const scale = 3;
  const w = tmp.text(str, 0, 0, 0xffffff) - 1;
  const cells = [];
  const x0 = Math.round(160 - (w * scale) / 2);
  const y0 = 64;
  // color: "kelola" cream, ".aı" orange
  const splitX = tmp.textWidth('kelola') + 1;
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < w; x++)
      if (tmp.get(x, y) === 0xffffff) cells.push({ x: x0 + x * scale, y: y0 + y * scale, c: x >= splitX ? 'o' : 'c' });
  const iStart = tmp.textWidth('kelola.a') + 1;
  return { cells, x0, y0, scale, dotX: x0 + (iStart + 1) * scale + 1, dotY: y0 };
})();

const MAP_BLOCKS = (() => {
  const r = rng(21);
  const out = [];
  for (let cy = 0; cy < 13; cy++)
    for (let cx = 0; cx < 16; cx++) out.push({ x: cx * 20 + 2, y: cy * 14 + 2, w: 17, h: 11, c: r() < 0.25 ? 'N' : 'n' });
  return out;
})();

function litAt(i) {
  return 74.6 + WARUNGS[i].d / 85;
}

function scene7Map(s, t, f, o = {}) {
  s.clear('k');
  for (const b of MAP_BLOCKS) s.rect(b.x, b.y, b.w, b.h, b.c);
  WARUNGS.forEach((p, i) => {
    if (o.onlySari && i > 0) return;
    const la = i === 0 ? 0 : litAt(i);
    if (t < la) return;
    if (o.leaving && o.leaving(i)) return;
    if (t - la < 2 / FPS) s.rect(p.x - 1, p.y - 1, 4, 4, 'O');
    else s.rect(p.x, p.y, 2, 2, 'o');
  });
}

function recapIcon(s, i, cx, cy) {
  if (i === 0) {
    bubble(s, cx - 9, cy - 6, 18, 11, { tail: 'left', lines: false });
    s.sprite(ICON.check2, cx - 5, cy - 3);
  } else if (i === 1) {
    s.box(cx - 9, cy - 5, 19, 11, 'c');
    s.rect(cx, cy - 5, 1, 11, 'k');
    for (let j = 0; j < 3; j++) {
      s.rect(cx - 7, cy - 3 + j * 3, 5, 1, 'G');
      s.rect(cx + 2, cy - 3 + j * 3, 6, 1, j === 2 ? 'o' : 'G');
    }
  } else {
    s.rect(cx - 9, cy + 6, 19, 1, 'c');
    s.box(cx - 8, cy - 1, 5, 7, 't');
    s.box(cx - 2, cy - 4, 5, 10, 't');
    s.box(cx + 4, cy - 8, 5, 14, 'm');
  }
}

function scene7(s, t, f, timing) {
  const vo = (i) => (timing && timing[i] ? timing[i].at : [75.0, 77.0, 78.8, 81.3][i - 22]);
  const iconTimes = [vo(22), vo(23), vo(24)];
  const logoStart = vo(25) - 0.7;
  const logoDur = 1.4;

  const used = new Map();
  LOGO.cells.forEach((c, k) => used.set(k, (k * 37) % WARUNGS.length));
  const usedSet = new Set(used.values());
  const depart = (i) => logoStart + hash(i, 3) * 0.4;

  scene7Map(s, t, f, { leaving: (i) => t > logoStart && (usedSet.has(i) ? t > depart(i) : t > logoStart + 0.6) });
  // map blocks fade so the logo sits on clean charcoal
  const dim = seg(t, logoStart, logoStart + 1.0);
  if (dim > 0)
    for (const b of MAP_BLOCKS) s.speck(b.x, b.y, b.w, b.h, 'k', dim);

  // recap tiles
  const tileOut = seg(t, logoStart - 0.2, logoStart + 0.2);
  [116, 160, 204].forEach((cx, i) => {
    const at = iconTimes[i];
    if (t < at || tileOut >= 1) return;
    const u = backOut(seg(t, at, at + 0.3));
    const y = Math.round(22 + (1 - u) * 10);
    s.box(cx - 14, y, 28, 26, 'c');
    s.rect(cx - 13, y + 24, 26, 1, 'C');
    recapIcon(s, i, cx, y + 12);
    if (tileOut > 0) s.speck(cx - 14, y, 28, 26, 'k', tileOut);
  });

  // particles fly into the logo
  if (t >= logoStart) {
    LOGO.cells.forEach((c, k) => {
      const src = WARUNGS[used.get(k)];
      const d0 = depart(used.get(k)) + (k % 5) * 0.05;
      const u = smooth(seg(t, d0, d0 + logoDur - 0.4));
      if (u <= 0) return;
      const x = Math.round(lerp(src.x, c.x, u));
      const y = Math.round(lerp(src.y, c.y, u));
      const size = u >= 1 ? LOGO.scale : 2;
      s.rect(x, y, size, size, u >= 1 ? c.c : 'O');
    });
  }

  // Kelo
  const kIn = smooth(seg(t, 74.3, 75.0));
  let kx = lerp(-20, 72, kIn);
  let ky = 26 + keloBob(t);
  const toDot = smooth(seg(t, logoStart + logoDur - 0.3, logoStart + logoDur + 0.4));
  if (toDot > 0) {
    kx = lerp(72, LOGO.dotX - 8, toDot);
    ky = lerp(26, LOGO.dotY - 9, toDot) - Math.sin(toDot * Math.PI) * 12;
  }
  let arm = null;
  let eyes = 'normal';
  const landed = toDot >= 1;
  if (!landed && iconTimes.some((a) => t > a && t < a + 0.6)) arm = 'point';
  if (landed) {
    eyes = 'happy';
    if (t > logoStart + logoDur + 1.0 && t < logoStart + logoDur + 3.4) arm = 'wave';
  }
  if (kIn > 0) drawKelo(s, kx, ky, { t, arm, eyes, thrust: !landed, look: arm === 'point' ? 1 : 0 });

  // fade out
  s.speck(0, 0, W, H, 'k', seg(t, 86.8, 87.9));
}

// ---------------------------------------------------------------------
export function renderFrame(s, t, timing) {
  const f = Math.round(t * FPS);
  if (t < 10) scene1(s, t, f);
  else if (t < 22) scene2(s, t, f);
  else if (t < 34) scene3(s, t, f);
  else if (t < 50) scene4(s, t, f);
  else if (t < 62) scene5(s, t, f);
  else if (t < 74) scene6(s, t, f);
  else scene7(s, t, f, timing);
}

export { bubble };

// Exposed for the audio builder so light-up sparkles land on the frame.
export { WARUNGS, litAt, LOGO };
