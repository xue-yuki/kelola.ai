# Kelola.ai — "Satu Kata, Satu Fitur"

Motion typography 28 detik (1920×1080, 30 fps): BALAS → CATAT → HITUNG → PREDIKSI, masing-masing terbuka jadi komponen UI Kelola.ai, lalu ditutup dengan tagline dan logo. Musik dan efek suara 120 BPM dibuat dari kode.

Semua elemennya asli dari project: font Plus Jakarta Sans + Inter, warna brand `#FF6B2B`, dan copy dari `plan.md`.

```bash
npm install
npm run build        # out/audio.wav -> out/kelola-typo.mp4
node scripts/render.mjs --stills 5,10,25   # cek frame tertentu
```

- `index.html`: seluruh animasi; `render(t)` adalah fungsi murni dari waktu, jadi bisa dibuka di browser dan di-scrub
- `scripts/render.mjs`: capture frame lewat Chromium (Playwright), lalu ffmpeg
- `scripts/audio.mjs`: musik + SFX yang sinkron dengan timeline
