# Kelola.ai — Motion Piece "Chat Jadi Data" (Storyboard v1)

Durasi: ±86 detik · 1920×1080 · 24 fps · Narasi Bahasa Indonesia · Gaya pixel art

---

## 1. Konsep

**Kalimat konsep:** Setiap pesan WhatsApp yang dibalas manual mencuri waktu pemilik warung. Kelola.ai membalas pesan itu, mencatatnya, lalu mengubah tumpukan chat menjadi data untuk mengambil keputusan.

**Janji ke penonton:** Dalam 90 detik, pemilik UMKM paham *bagaimana* agen AI menangani pesanan WA, dan *apa* yang mereka dapat: waktu kembali dan tahu produk mana yang laris.

**Hubungan sebab-akibat inti:** chat masuk → AI membalas dan mencatat → catatan menumpuk jadi data → pemilik mengambil keputusan lebih tepat.

- **Pertanyaan pembuka:** "Berapa jam sehari habis cuma buat balas chat?"
- **Kejutan:** chat pesanan itu sebenarnya *data*. Blok pesanan yang sama menyusun diri menjadi grafik.
- **Gambar penutup:** batang grafik tertinggi berubah jadi matahari pixel yang terbit di atas warung Bu Sari. Lalu kamera mundur, ratusan warung menyala, dan semua pixel berkumpul membentuk logo kelola.ai.

**Metafora visual:** **pesan = blok pixel.** Satu bubble chat adalah satu blok. Blok yang sama berubah wujud sepanjang video: dinding yang menumpuk (beban), baris tabel (catatan), batang grafik (insight). Penonton mengikuti satu benda yang terus berubah makna.

---

## 2. Sistem Visual

**Teknik:** semua digambar di kanvas pixel **320×180**, lalu diperbesar **6×** (nearest-neighbor) jadi 1920×1080. Pixelnya benar-benar kotak tajam, tanpa blur.

**Palet (8 warna, diturunkan dari brand):**

| Peran | Hex | Kegunaan |
|---|---|---|
| Oranye Kelola | `#FF6B2B` | Maskot Kelo, aksen utama, logo |
| Oranye muda | `#FF9B5E` | Highlight, cahaya |
| Krem | `#FFF8F4` | Langit siang, kertas, bubble chat |
| Arang | `#1A1A2E` | Garis luar, malam, teks |
| Abu | `#6B7280` | Pesan gagal, bayangan |
| Teal | `#2A9D8F` | Status "terbalas", grafik |
| Mustard | `#E9B44C` | Lampu warung, matahari, produk terlaris |
| Kayu | `#8C5A3C` | Warung, meja, rak |

**Tekstur dan gerak:**
- **Gerak stepped:** sprite beranimasi 8 fps (2–4 frame per siklus), di dalam render 24 fps. Ini versi pixel dari "stop-motion boil" di prompt.
- **Boil halus:** setiap 3 frame, outline objek diam bergeser 1 art-pixel di beberapa titik acak, supaya dunia terasa hidup.
- **Dithering** pola checker 2 warna untuk gradasi langit dan bayangan, menggantikan gradien.
- **Tidak dipakai:** blur, glow, gradien halus, 3D, partikel dekoratif.

**Bingkai panggung:** dunia cerita berada di dalam **layar HP pixel** yang besar. Antarmuka WhatsApp-like di HP bisa "membuka" jadi lingkungan warung (pengganti panel terminal di prompt asli).

**Tipografi:** font pixel bitmap 5×7 buatan sendiri, untuk label pendek di dalam dunia saja. Subtitle memakai font pixel yang lebih besar, di zona aman bawah.

**Zona aman:** margin 16 art-pixel (96 px) di semua sisi. Subtitle di 24 art-pixel dari bawah.

---

## 3. Lembar Karakter

### Kelo — maskot dan narator
- Bot pixel **16×16** art-pixel, badan kotak oranye `#FF6B2B`, sudut terpotong 1 pixel.
- **Dua mata hitam kotak 2×2**, jarak 4 pixel. Antena 1 pixel dengan ujung mustard.
- Tidak punya mulut. Ekspresi hanya dari mata: berkedip, menyipit, membesar 3×3 saat terkejut.
- Pose: *idle* (melayang naik-turun 1 px), *menunjuk*, *membaca* (mata bergerak kiri-kanan), *terkejut*, *melambai*.
- **Aturan konsistensi:** ukuran selalu 16×16 di skala normal dan tidak pernah di-scale tak bulat. Close-up hanya ×2 atau ×3.

### Bu Sari — pemilik warung
- Sprite **12×24**, kerudung teal, celemek mustard.
- Pose: mengetik di HP (jempol 2 frame), menulis di buku, lelah (bahu turun 1 px), tersenyum dan melayani pembeli.

### Pendukung
- Pembeli: siluet sederhana 10×20 dengan 3 variasi warna.
- Benda kunci: HP pixel, buku catatan, jam dinding, rak produk (es teh, kopi, gorengan, nasi bungkus).

---

## 4. Storyboard (7 scene)

### SCENE 1 : 0:00–0:10 — HOOK
- **Tujuan belajar:** chat pesanan datang terus dan memakan waktu.
- **Visual:** layar arang kosong. Satu pixel oranye berkedip di tengah, lalu menjadi bubble chat. Bubble berlipat ganda memenuhi layar, dengan penghitung pixel di pojok naik 1 → 47.
- **Gerak:** masuk dengan pop 1 frame. Aksi utama: bubble bermunculan makin cepat. Reaksi sekunder: setiap bubble bergetar 1 px saat "ting". Keluar: bubble jatuh dan menumpuk ke bawah.
- **Voiceover:** "Ting. Ting. Ting. Pernah hitung, berapa jam sehari habis cuma buat balas chat pesanan?"
- **Suara:** tanpa musik dulu. Tiap bubble memicu blip square-wave pendek yang nadanya naik. Di akhir, bass 1 nada masuk.
- **Transisi:** bubble yang jatuh menumpuk jadi **bata dinding warung**.

### SCENE 2 : 0:10–0:22 — DUNIA YANG AKRAB
- **Tujuan belajar:** begini cara UMKM bekerja sekarang, semua manual.
- **Visual:** warung pixel siang hari dengan dinding dari bata-bubble tadi, langit krem ber-dither. Bu Sari di balik meja, HP di satu tangan, buku catatan di meja. **Kelo** muncul dari layar HP sebagai pemandu.
- **Gerak:** masuk: atap dan rak tersusun pixel demi pixel. Aksi utama: Bu Sari mengetik balasan lalu menulis di buku, bergantian. Reaksi sekunder: Kelo melambai ke kamera lalu menunjuk Bu Sari. Keluar: halaman buku membalik cepat.
- **Voiceover:** "Ini Bu Sari. Warungnya laris. Tapi setiap pesanan ia balas satu per satu, lalu ia catat sendiri di buku."
- **Suara:** musik latar chiptune lembut masuk (bass + arpeggio pelan). Ketukan jempol, gores pensil 8-bit, kicau burung pixel.
- **Transisi:** halaman buku yang membalik berubah jadi **jam dinding** yang jarumnya berputar cepat.

### SCENE 3 : 0:22–0:34 — GANGGUAN
- **Tujuan belajar:** cara manual gagal saat ramai. Pesan telat, pelanggan batal, catatan salah.
- **Visual:** time-lapse dari siang ke malam (palet bergeser ke arang, lampu warung mustard menyala). Bubble menumpuk di atas kepala Bu Sari. Satu bubble berubah abu: "ga jadi deh". Di buku, angka total berkedip merah dan dicoret.
- **Gerak:** masuk: jarum jam berputar dan langit berganti. Aksi utama: tumpukan bubble meninggi dan bergoyang. Reaksi sekunder: bahu Bu Sari turun, Kelo menutup mata. Keluar: bubble abu jatuh **ke dalam layar HP**.
- **Voiceover:** "Saat ramai, pesan menumpuk. Ada yang telat dibalas. Ada pelanggan yang batal. Ada catatan yang salah hitung."
- **Suara:** musik turun ke minor dan melambat. Blip makin rapat lalu satu nada "buzz" rendah untuk pesanan batal.
- **Transisi:** kamera menyelam mengikuti bubble abu **masuk ke layar HP**. Layar membesar sampai memenuhi frame.

### SCENE 4 : 0:34–0:50 — MEKANISME
- **Tujuan belajar:** cara kerja agen AI: baca pesan → cek menu dan stok → balas → catat.
- **Visual:** di dalam HP ada "pabrik" pixel horizontal dengan 4 stasiun yang terhubung jalur conveyor:
  1. **Pesan masuk** ("es teh 2, gorengan 5")
  2. **Kelo membaca**: mata bergerak, kata kunci menyala oranye
  3. **Rak menu dan stok**: Kelo mencocokkan item, centang teal
  4. **Balasan terkirim** dengan centang dua teal, dan **blok pesanan** jatuh ke tabel di bawah
- **Gerak:** masuk: stasiun terbuka satu per satu, seperti panel UI yang dilipat jadi mesin. Aksi utama: satu pesan berjalan pelan melewati 4 stasiun, lalu pesan berikutnya mengalir makin cepat. Reaksi sekunder: indikator jam pojok berganti ke bulan (bekerja malam juga). Keluar: blok pesanan menumpuk rapi di tabel.
- **Voiceover:** "Di sinilah Kelola.ai bekerja. Agen AI membaca setiap pesan WhatsApp, mengecek menu dan stok, lalu membalas dalam hitungan detik. Pesanannya langsung tercatat rapi, siang maupun malam."
- **Suara:** musik kembali mayor dan berpulsa ritmis. Setiap stasiun punya bunyi: "plip" (masuk), "scan" (membaca), "klik" (cocok), "ting" lembut (terkirim).
- **Transisi:** tabel berputar 90°. **Baris-baris blok pesanan berdiri menjadi batang grafik.**

### SCENE 5 : 0:50–1:02 — PENEMUAN
- **Tujuan belajar:** chat yang tercatat itu data. Data menunjukkan produk terlaris dan jam ramai.
- **Visual:** grafik batang pixel, satu batang per produk dengan ikon di bawahnya. Batang **es teh** tumbuh paling tinggi dan berubah mustard. Strip kecil di bawahnya menunjukkan jam ramai (blok pukul 11–13 menyala). Kelo melihat dengan mata membesar.
- **Gerak:** masuk: blok jatuh dan batang tumbuh dengan efek "pantul" 1 px. Aksi utama: batang es teh terus naik melewati yang lain. Reaksi sekunder: Kelo terkejut lalu menunjuk. Keluar: batang es teh terus memanjang ke atas keluar frame.
- **Voiceover:** "Lalu ada kejutan kecil. Setiap chat ternyata adalah data. Dari situ kelihatan produk mana yang paling laku, dan jam berapa pembeli paling ramai."
- **Suara:** musik berhenti sejenak (1 ketukan hening) saat kata "data", lalu kembali dengan arpeggio naik. Tiap blok yang mendarat berbunyi seperti koin.
- **Transisi:** puncak batang es teh **membulat dan menjadi matahari pixel** di langit warung.

### SCENE 6 : 1:02–1:14 — KONSEKUENSI
- **Tujuan belajar:** hasilnya, waktu kembali dan keputusan stok lebih tepat.
- **Visual:** warung pagi hari, matahari mustard terbit. Bu Sari menambah stok es teh di rak, melayani pembeli langsung sambil tersenyum. HP di meja menyala sendiri dengan centang teal bermunculan. Kelo duduk santai di atas HP.
- **Gerak:** masuk: matahari naik dan palet berpindah dari dither fajar ke siang. Aksi utama: Bu Sari menyusun rak lalu menyerahkan pesanan ke pembeli. Reaksi sekunder: centang di HP muncul berirama tanpa disentuh. Keluar: kamera mundur dan warung mengecil.
- **Voiceover:** "Bu Sari kini punya waktu lagi. Ia menyiapkan stok yang tepat, melayani pembeli dengan senyum, dan membiarkan HP-nya bekerja sendiri."
- **Suara:** musik penuh dan hangat. Lonceng pintu 8-bit, tawa pembeli (blip kecil), denting gelas.
- **Transisi:** kamera mundur terus sampai **warung Bu Sari jadi satu pixel** di peta kota pixel.

### SCENE 7 : 1:14–1:26 — RANGKUMAN
- **Tujuan belajar:** ingat tiga hal: dibalas otomatis, tercatat, keputusan dari data.
- **Visual:** peta kota arang. Satu per satu warung lain menyala oranye, seperti jaringan UMKM. Tiga ikon kecil muncul berurutan di dekat Kelo: bubble dengan centang, buku, grafik. Lalu **semua pixel menyala terbang dan berkumpul** membentuk logo **kelola.ai**. Kelo mendarat di titik "i" dan berkedip.
- **Gerak:** masuk: lampu warung menyala bergelombang dari tengah. Aksi utama: tiga ikon muncul satu per satu sesuai narasi, lalu pixel berkumpul jadi logo. Reaksi sekunder: Kelo melambai. Keluar: tahan logo 2 detik lalu fade ke arang dengan dither.
- **Voiceover:** "Pesan dibalas otomatis. Pesanan tercatat. Keputusan berdasarkan data. Kelola.ai — satu platform, bisnis lokal makin pintar."
- **Suara:** musik naik ke resolusi akhir. Tiga ikon dengan tiga nada naik (do-mi-sol). Logo terbentuk dengan "chime" pendek, lalu hening.
- **Transisi:** akhir video.

---

## 5. Naskah Voiceover Final

| Scene | Waktu | Naskah | Kata |
|---|---|---|---|
| 1 | 0:00–0:10 | Ting. Ting. Ting. Pernah hitung, berapa jam sehari habis cuma buat balas chat pesanan? | 14 |
| 2 | 0:10–0:22 | Ini Bu Sari. Warungnya laris. Tapi setiap pesanan ia balas satu per satu, lalu ia catat sendiri di buku. | 19 |
| 3 | 0:22–0:34 | Saat ramai, pesan menumpuk. Ada yang telat dibalas. Ada pelanggan yang batal. Ada catatan yang salah hitung. | 18 |
| 4 | 0:34–0:50 | Di sinilah Kelola.ai bekerja. Agen AI membaca setiap pesan WhatsApp, mengecek menu dan stok, lalu membalas dalam hitungan detik. Pesanannya langsung tercatat rapi, siang maupun malam. | 27 |
| 5 | 0:50–1:02 | Lalu ada kejutan kecil. Setiap chat ternyata adalah data. Dari situ kelihatan produk mana yang paling laku, dan jam berapa pembeli paling ramai. | 24 |
| 6 | 1:02–1:14 | Bu Sari kini punya waktu lagi. Ia menyiapkan stok yang tepat, melayani pembeli dengan senyum, dan membiarkan HP-nya bekerja sendiri. | 21 |
| 7 | 1:14–1:26 | Pesan dibalas otomatis. Pesanan tercatat. Keputusan berdasarkan data. Kelola.ai — satu platform, bisnis lokal makin pintar. | 16 |

Total ±139 kata dalam ±86 detik. Itu sekitar 97 kata/menit, sengaja di bawah target 125–145 karena kata Bahasa Indonesia rata-rata lebih panjang (lebih banyak suku kata) dan setiap perubahan visual penting butuh jeda. Kecepatan bicara efektifnya tetap ±130 kata/menit dalam bagian yang benar-benar diucapkan.

**Aturan label:** teks di layar hanya untuk isi chat ("es teh 2"), nama produk, dan logo. Tidak ada label yang mengulang narasi.

---

## 6. Peta Transisi

| Dari → Ke | Benda yang berubah | Hubungan yang dijelaskan |
|---|---|---|
| 1 → 2 | Bubble chat → bata dinding | Chat adalah beban yang membangun hari-hari warung |
| 2 → 3 | Halaman buku → jam | Mencatat manual memakan waktu |
| 3 → 4 | Bubble gagal → masuk layar HP | Masalahnya ada di chat, solusinya juga di sana |
| 4 → 5 | Baris tabel → batang grafik | Catatan pesanan yang dikumpulkan = data |
| 5 → 6 | Batang tertinggi → matahari | Insight menerangi keputusan |
| 6 → 7 | Warung → satu pixel di peta | Satu warung adalah bagian dari banyak UMKM |
| 7 → logo | Pixel warung → logo kelola.ai | Semua terhubung lewat satu platform |

Tidak ada potongan keras (hard cut) sama sekali.

---

## 7. Rencana Suara

- **Musik:** chiptune tenang dari 3 kanal (square lead, triangle bass, noise untuk perkusi halus), 96 BPM, kunci C mayor. Scene 3 pindah ke A minor.
- **Ducking:** musik turun ±10 dB setiap kali narasi berbunyi.
- **SFX:** blip chat, ketukan jempol, gores pensil, "buzz" batal, plip/scan/klik/ting di pabrik, koin untuk blok grafik, lonceng pintu, chime logo.
- **Semua musik dan SFX disintesis dari kode** (tanpa aset berlisensi).
- **Voiceover:** aku tidak bisa merekam suara manusia. Yang aku sediakan:
  - naskah per scene + timing persis
  - file subtitle `.srt` dan subtitle yang di-burn ke video
  - celah suara (gap) di audio yang pas untuk narasi. Kamu tinggal rekam atau pakai TTS per scene, lalu tempel di timeline. Setiap baris memang dibuat sebagai klip terpisah.

---

## 8. Implementasi Teknis

- **Mesin:** satu halaman HTML + Canvas 2D di kanvas 320×180. Setiap frame adalah fungsi murni dari nomor frame (`render(frame)`), jadi render bisa diulang dan selalu identik.
- **Render:** Chromium tanpa layar (Playwright) mengambil setiap frame (2.064 frame untuk 86 detik × 24 fps). Frame diperbesar 6× nearest-neighbor ke 1920×1080.
- **Audio:** musik dan SFX dibuat dengan skrip Node menjadi WAV mengikuti timeline yang sama.
- **Encode:** ffmpeg → `kelola-motion.mp4` (H.264, yuv420p, 24 fps) + versi tanpa subtitle + `voiceover.srt`.
- **Review:** sebelum final, cek sekali tanpa suara (apakah cerita terbaca dari visual saja) dan sekali audio saja (apakah tempo dan ducking pas).
- **Lokasi:** semua sumber disimpan di `motion/` dalam repo kelola.ai supaya bisa diedit dan di-render ulang.

---

## Yang perlu kamu putuskan sebelum aku render

1. Nama dan desain **Kelo** (maskot) dan **Bu Sari**: oke, atau mau nama/tampilan lain?
2. Produk terlaris di grafik: **es teh**, atau produk lain?
3. Subtitle di-burn ke video: **ya**, atau cukup file `.srt` terpisah?
