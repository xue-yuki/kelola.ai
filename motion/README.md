# Kelola.ai — Motion "Chat Jadi Data"

Video penjelasan pixel art ±88 detik (1920×1080, 24 fps) dengan narasi Bahasa Indonesia. Storyboard: [`storyboard.md`](storyboard.md).

Semua gambar, musik, dan efek suara dibuat dari kode, tanpa aset luar.

## Build

Butuh Node 18+, `ffmpeg`, dan `espeak-ng` + `mbrola-id1` (untuk narasi sementara).

```bash
npm run build      # voice -> audio -> render
```

Hasil ada di `out/`:

| File | Isi |
|---|---|
| `kelola-motion.mp4` | Video final: narasi sementara (TTS) + subtitle pixel |
| `kelola-motion-tanpa-narasi.mp4` | Tanpa narasi dan subtitle; musik sudah dikecilkan di slot narasi |
| `voiceover.srt` | Subtitle dengan timing narasi |
| `vo/line-XX.wav` | Satu klip per kalimat |
| `vo/scene-N.wav` | Narasi per scene (waktu relatif ke awal scene) |

## Mengganti narasi dengan rekaman asli

1. Rekam tiap kalimat di `src/timeline.js` (`VO`) dan simpan dengan nama yang sama di `out/vo/line-XX.wav` (16-bit WAV).
2. `KEEP_VO=1 npm run voice && npm run audio && npm run render`

Timing subtitle dan ducking musik ikut menyesuaikan durasi rekaman. Kalau ada kalimat yang menabrak kalimat berikutnya, `npm run voice` akan memberi peringatan. Geser nilai `at`-nya di `src/timeline.js`.

## Narasi dari ElevenLabs (suara cewek)

Simpan key sebagai environment variable `ELEVENLABS_API_KEY`, lalu izinkan domain `api.elevenlabs.io` di network access environment.

```bash
npm run build:eleven        # narasi ElevenLabs (Sarah) -> audio -> render
```

Kalau mau ganti suara: `node scripts/tts-api.mjs gen eleven <voice_id> && KEEP_VO=1 npm run build`.

Suara bawaan (premade) yang perempuan dan bisa dipakai di paket gratis. Semuanya bicara Bahasa Indonesia lewat `eleven_multilingual_v2`:

| Suara | voice_id |
|---|---|
| Sarah (default) | `EXAVITQu4vr4xnSDxMaL` |
| Matilda | `XrExE9yKIg1WjnnlVkGX` |
| Jessica | `cgSgspJ2msm6clMCkdW9` |
| Bella | `hpp4J3VqNfWAUOO0d1Us` |

Suara asli Indonesia dari Voice Library (`node scripts/tts-api.mjs list eleven`) butuh paket berbayar. Pakai dengan `ELEVEN_OWNER=<owner> node scripts/tts-api.mjs gen eleven <voice_id>`.

Teks yang dibaca ElevenLabs adalah `text` di `src/timeline.js`, atau `say` kalau ada (untuk "Kelola A.I.", "hape"). `tts` khusus untuk espeak.

Fish Audio juga didukung: `FISH_API_KEY`, `node scripts/tts-api.mjs list fish`, `node scripts/tts-api.mjs gen fish <model_id>`.

## Struktur

- `src/gfx.js`: raster pixel 320×180 (dither, sprite, font)
- `src/font.js`, `src/sprites.js`: font bitmap 5×7, Kelo, Bu Sari, ikon
- `src/timeline.js`: satu sumber waktu untuk gambar, narasi, dan suara
- `src/scenes.js`: 7 scene sebagai fungsi murni dari waktu
- `scripts/voice.mjs`, `scripts/audio.mjs`, `scripts/render.mjs`: narasi, soundtrack, render + mux
- `node scripts/render.mjs --stills 12,40,85`: PNG cepat untuk cek frame tertentu
