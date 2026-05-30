# 🎨 kelola.ai Design System & UI/UX Guidelines

> **Visi Desain:** Menjadikan kelola.ai sebagai aplikasi B2B UMKM yang memiliki standar estetika *"SaaS Kelas Dunia"* (setara Vercel, Linear, Stripe). Tidak kaku, tetapi sangat tajam, bersih, dan memprioritaskan fungsionalitas data.

---

## 🎯 1. Filosofi Utama (Core Philosophy)
Gaya desain yang kita anut adalah **"Minimalist Utility-First SaaS"**.
- **Data > Dekorasi:** Angka penjualan dan isi pesan pelanggan adalah raja. Latar belakang dan komponen lain hanya bertugas sebagai kanvas, tidak boleh mencuri perhatian.
- **UMKM Friendly:** Walaupun bergaya *high-end*, aplikasi harus tetap ramah untuk kasir atau pemilik toko. Ikon harus jelas, huruf (angka omzet) harus besar, dan tata letak tidak boleh membingungkan.
- **Zero Fluff:** Tidak ada *glassmorphism* (blur), tidak ada shadow besar-besaran, tidak ada teks bergradasi. Murni bentuk geometris datar (flat) yang dipisahkan oleh garis presisi.

---

## 🏛️ 1.5 Referensi Kiblat Desain (The Inspirations)
Untuk memudahkan membayangkan hasil akhirnya, desain kelola.ai sangat berkiblat pada platform-platform B2B modern berikut:
1. **[Linear.app](https://linear.app):** Inspirasi utama untuk kesunyian UI (cleanliness), penggunaan garis tepi (*border*) yang sangat tipis, dan *Dark Mode* yang pekat.
2. **[Vercel Dashboard](https://vercel.com/dashboard):** Inspirasi untuk *Light Mode* yang sangat putih bersih, fungsional, menggunakan kotak (*cards*) rata (flat), dan font yang tajam.
3. **[Supabase](https://supabase.com):** Inspirasi untuk keseimbangan penggunaan warna aksen. (Supabase menggunakan warna hijau neon secara hemat, kelola.ai menggunakan warna Oranye).
4. **[Stripe Dashboard](https://stripe.com):** Referensi abadi untuk desain tabel pesanan, laporan, dan cara menyajikan deretan angka uang agar mudah dibaca kasir/admin.

*(Pesan untuk developer/AI agent di masa depan: Cek UI web-web di atas sebelum membuat komponen baru. Jangan pernah pakai efek blur/glow murahan!)*

---

## 🎨 2. Aturan Palet Warna (The Palette)
Kita membagi sistem menjadi dua dunia (Light Mode sebagai Default/Utama untuk operasional siang hari, dan Dark Mode sebagai opsi).

### ☀️ Light Mode (Mode Siang - Default)
- **Background Utama (Canvas):** `bg-zinc-50` (Putih salju yang sangat lembut, anti silau).
- **Background Panel (Card/Sidebar):** `bg-white` (Putih murni).
- **Garis Batas (Border):** `border-zinc-200` (Abu-abu pudar). *Kunci kemewahan desain ini ada di garis tepi yang tipis.*
- **Teks:** 
  - Judul/Angka Utama: `text-zinc-900`
  - Sub-judul/Label: `text-zinc-500`
- **Warna Aksen (Brand):** `text-orange-600` atau `bg-orange-600`. Hanya untuk tombol "Call to Action" utama (misal: Simpan, Tambah, Broadcast).

### 🌙 Dark Mode (Mode Malam - Opsional)
- **Background Utama (Canvas):** `bg-zinc-950` (Nyaris hitam pekat).
- **Background Panel (Card/Sidebar):** `bg-zinc-900` (Hitam sedikit abu-abu).
- **Garis Batas (Border):** `border-zinc-800`.
- **Teks:** 
  - Judul/Angka Utama: `text-zinc-100` (Putih)
  - Sub-judul/Label: `text-zinc-400`
- **Warna Aksen (Brand):** `text-orange-500` atau `bg-orange-500`.

---

## 📐 3. Komponen & Geometri (The Rules)

1. **Borders, not Shadows:** 
   Jangan gunakan class `shadow-lg` atau `shadow-2xl` untuk memisahkan kotak. Selalu gunakan `border border-zinc-200 dark:border-zinc-800`. (Kecuali untuk *dropdown menu* kecil yang melayang, boleh pakai *shadow-sm* atau *shadow-md*).
2. **Sudut (Corners):** 
   Hindari sudut yang terlalu bulat seperti `rounded-[2rem]`. Gunakan **`rounded-lg`** atau maksimal **`rounded-xl`** agar terasa seperti alat ukur/mesin yang presisi.
3. **Tombol (Buttons):** 
   - Tombol utama: Solid warna Oranye.
   - Tombol sekunder: Transparan dengan *hover* abu-abu tipis (`hover:bg-zinc-100 dark:hover:bg-zinc-800`).
4. **Tabel (Tables/Lists):**
   Ubah susunan kotak/kartu (*cards*) yang menumpuk menjadi bentuk *List* atau *Table* bergaris bawah (`border-b`). Lebih hemat ruang dan lebih mudah dibaca oleh mata manusia (scannability).

---

## 🗺️ 4. Roadmap Rombak UI (Implementation Plan)

- [x] **Tahap 1: Persiapan Sistem Tema (Selesai)**
  - Install `next-themes`.
  - Fix Tailwind v4 dark mode variant di `globals.css`.
  - Rombak Sidebar dan Header `DashboardLayout.tsx` menjadi gaya *Linear Style*.

- [ ] **Tahap 2: Rombak Dashboard Utama (`/dashboard/page.tsx`)**
  - Bersihkan *glassmorphism* di semua panel metrik.
  - Ubah susunan kotak Quick Actions menjadi menu tombol yang rapi di pojok kanan atas.
  - Rapikan grafik Chart (buang efek *glow*, sisakan garis solid yang presisi).
  - Ubah daftar "Pesanan Terbaru" dari bentuk *Bento Card* menjadi Tabel bergaris yang elegan.
  - Ganti *loading state* (spinner) menjadi *Skeleton/Shimmer Loading* agar tidak ada *Layout Shift*.

- [ ] **Tahap 3: Rapikan Halaman Fitur (Kasir, WA Marketing, Pengaturan)**
  - Terapkan warna putih dan *border* abu-abu tipis secara konsisten.
  - Terapkan Toast Notification system (seperti library `sonner`) untuk menggantikan *alert* bawaan atau *error state* merah yang mengganggu *layout*.

---

*Dokumen ini adalah "Kitab Suci" desain kelola.ai. Jika agent AI lupa konteks, baca kembali file ini.*
