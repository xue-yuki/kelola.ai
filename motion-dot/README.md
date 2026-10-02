# Kelola.ai — "Satu Titik"

Motion piece 45 detik (1920×1080, **60 fps, motion blur**) dalam satu tarikan kamera tanpa potongan. Titik oranye dari logo memantul, lalu berubah jadi bubble chat, koin di kasir, donat margin, dan pena grafik. Kamera kemudian zoom out sampai semua cerita itu hanya satu titik di antara ratusan warung, yang lalu berkerumun membentuk logo kelola.ai.

```bash
npm install
npm run build                                  # out/audio.wav -> out/kelola-satu-titik.mp4
node scripts/render.mjs --stills 6.6,23.9,36.6 # cek frame tertentu
```

- `index.html`: seluruh animasi di satu canvas. `drawScene(t)` adalah fungsi murni dari waktu; `frame(t)` merata-ratakan 6 sub-frame (shutter 180°) untuk motion blur. Kamera diatur lewat keyframe `CAM` (zoom diinterpolasi di skala log, jadi zoom out ekstremnya tetap mulus).
- `scripts/render.mjs`: capture lewat Chromium (Playwright) lalu ffmpeg.
- `scripts/audio.mjs`: musik 120 BPM + SFX yang mengikuti setiap pantulan, perubahan bentuk, dan zoom.
