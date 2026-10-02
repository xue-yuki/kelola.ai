// Single source of truth for timing. The renderer and the audio builder
// both read from here so picture, narration and SFX stay in sync.
export const FPS = 24;
export const DURATION = 88;

export const SCENES = [
  { id: 1, name: 'hook', start: 0, end: 10 },
  { id: 2, name: 'dunia', start: 10, end: 22 },
  { id: 3, name: 'gangguan', start: 22, end: 34 },
  { id: 4, name: 'mekanisme', start: 34, end: 50 },
  { id: 5, name: 'penemuan', start: 50, end: 62 },
  { id: 6, name: 'konsekuensi', start: 62, end: 74 },
  { id: 7, name: 'rangkuman', start: 74, end: 88 },
];

// Narration. `at` is the absolute start; `tts` is the spelling fed to the
// synthesizer so it pronounces brand words the Indonesian way.
export const VO = [
  { scene: 1, at: 1.0, text: 'Ting. Ting. Ting.' },
  { scene: 1, at: 4.0, text: 'Pernah hitung, berapa jam sehari habis cuma buat balas chat pesanan?', tts: 'Pernah hitung, berapa jam sehari habis cuma buat balas cet pesanan?' },
  { scene: 2, at: 12.6, text: 'Ini Bu Sari.' },
  { scene: 2, at: 14.0, text: 'Warungnya laris.' },
  { scene: 2, at: 15.8, text: 'Tapi setiap pesanan ia balas satu per satu, lalu ia catat sendiri di buku.' },
  { scene: 3, at: 23.0, text: 'Saat ramai, pesan menumpuk.' },
  { scene: 3, at: 25.6, text: 'Ada yang telat dibalas.' },
  { scene: 3, at: 27.6, text: 'Ada pelanggan yang batal.' },
  { scene: 3, at: 29.7, text: 'Ada catatan yang salah hitung.' },
  { scene: 4, at: 35.0, text: 'Di sinilah Kelola.ai bekerja.', tts: 'Di sinilah Kelola A I bekerja.' },
  { scene: 4, at: 37.6, text: 'Agen AI membaca setiap pesan WhatsApp,', tts: 'Agen A I membaca setiap pesan wotsep,' },
  { scene: 4, at: 40.6, text: 'mengecek menu dan stok,' },
  { scene: 4, at: 42.4, text: 'lalu membalas dalam hitungan detik.' },
  { scene: 4, at: 45.2, text: 'Pesanannya langsung tercatat rapi, siang maupun malam.' },
  { scene: 5, at: 50.4, text: 'Lalu ada kejutan kecil.' },
  { scene: 5, at: 52.6, text: 'Setiap chat ternyata adalah data.', tts: 'Setiap cet ternyata adalah data.' },
  { scene: 5, at: 55.6, text: 'Dari situ kelihatan produk mana yang paling laku,' },
  { scene: 5, at: 58.8, text: 'dan jam berapa pembeli paling ramai.' },
  { scene: 6, at: 62.8, text: 'Bu Sari kini punya waktu lagi.' },
  { scene: 6, at: 65.2, text: 'Ia menyiapkan stok yang tepat,' },
  { scene: 6, at: 67.5, text: 'melayani pembeli dengan senyum,' },
  { scene: 6, at: 69.8, text: 'dan membiarkan HP-nya bekerja sendiri.', tts: 'dan membiarkan hape-nya bekerja sendiri.' },
  { scene: 7, at: 75.0, text: 'Pesan dibalas otomatis.' },
  { scene: 7, at: 77.0, text: 'Pesanan tercatat.' },
  { scene: 7, at: 78.8, text: 'Keputusan berdasarkan data.' },
  { scene: 7, at: 81.3, text: 'Kelola.ai -', tts: 'Kelola A I.' },
  { scene: 7, at: 82.6, text: 'satu platform, bisnis lokal makin pintar.' },
];

// ---- Scene 1: bubbles ------------------------------------------------
export const S1_COUNT = 48;
export const s1BubbleTime = (n) => 1.0 + 6.0 * Math.pow(n / (S1_COUNT - 1), 0.5);
export const S1_FALL = 7.4;
export const s1FallStart = (i) => S1_FALL + i * 0.035;
export const S1_FALL_DUR = 0.5;

// ---- Scene 2 ---------------------------------------------------------
export const S2 = {
  saris: 12.0,
  keloOut: 13.0,
  typeA: [13.2, 17.6],
  write: [17.6, 20.2],
  flip: 20.2,
  pageFly: [20.6, 21.4],
};
export const s2IncomingTimes = () => [13.6, 14.6, 15.6, 16.6];

// ---- Scene 3 ---------------------------------------------------------
export const S3 = {
  night: [22.4, 23.6],
  lamp: 24.5,
  pile: [23.0, 30.0],
  grayIn: 27.0,
  grayTurn: 27.6,
  bookIn: 29.5,
  sad: 28.0,
  fall: [31.8, 32.6],
  zoom: [32.6, 34.0],
};
export const s3PileTimes = () => Array.from({ length: 16 }, (_, i) => 23.0 + i * 0.42);

// ---- Scene 4 ---------------------------------------------------------
export const S4 = {
  unfold: [34.5, 35.0, 35.5, 36.0],
  msgIn: 37.0,
  toS2: [37.6, 38.2],
  read: [38.2, 40.4],
  toS3: [40.5, 41.0],
  match: 41.0,
  toS4: [42.4, 42.9],
  reply: 42.9,
  drop: 44.6,
  moon: 47.0,
  fold: [49.6, 50.0],
};
// Fast-flow messages after the first: [spawnTime, productIndex]
export const S4_FLOW = (() => {
  const seq = [];
  const counts = [8, 4, 6, 3];
  const order = [0, 2, 1, 0, 3, 0, 2, 0, 1, 2, 0, 3, 0, 2, 1, 0, 2, 3, 0, 1, 2];
  for (let k = 0; k < order.length; k++) seq.push([44.4 + k * 0.2, order[k]]);
  // sanity: matches counts
  const c = [0, 0, 0, 0];
  for (const [, p] of seq) c[p]++;
  if (c.join() !== counts.join()) throw new Error('S4_FLOW counts ' + c.join());
  return seq;
})();
export const S4_FLOW_TRAVEL = 1.2;

// ---- Scene 5 ---------------------------------------------------------
export const S5 = {
  morph: [50.0, 51.8],
  drops: [
    [52.0, 0],
    [52.4, 1],
    [52.8, 0],
    [53.2, 2],
    [53.6, 0],
    [55.0, 0],
  ],
  highlight: 57.4,
  peak: 59.0,
  out: [60.4, 61.8],
};

// ---- Scene 6 ---------------------------------------------------------
export const S6 = {
  keloFly: [62.4, 63.4],
  walkTo: [64.4, 65.2],
  place: [65.6, 66.2, 66.8],
  walkBack: [67.2, 67.8],
  custIn: [67.4, 69.0],
  hand: [69.4, 70.0],
  heart: 70.1,
  custOut: [70.6, 72.0],
  checks: Array.from({ length: 12 }, (_, i) => 62.6 + i * 0.8),
  pull: [72.0, 74.0],
};
