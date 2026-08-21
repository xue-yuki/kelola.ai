# 🔍 Audit Keamanan & Bug — kelola.ai (Website)

> Hasil analisa codebase frontend Next.js sebelum deploy ke VPS.
> Diurutkan berdasarkan tingkat bahaya. Fokus: celah keamanan, fungsi yang belum jalan, dan bug.
> Last updated: 2026-06-13

---

## ✅ STATUS PERBAIKAN (2026-06-13)

Sudah **DIFIX** di sesi ini (CRITICAL + HIGH):
- **SEC-01** — Guard admin diaktifkan kembali di `admin/layout.tsx` + `/admin` ditambah ke `middleware.ts`.
- **SEC-02** — `update-status` sekarang cek login + ownership order.
- **BUG-01** — Onboarding WA linking: pakai agent-proxy + businessId asli + panggil `connect` dulu.
- **BUG-02** — Onboarding tidak lagi bikin bisnis dobel (check-then-update). + unique constraint `businesses.user_id` sudah dipasang di DB.

Sudah **DIFIX** juga (MEDIUM):
- **BUG-03** — `className` ganda digabung jadi satu (gradient banner + dark mode kembali jalan).
- **BUG-04** — Realtime channel `orders` & `complaints` kini di-`removeChannel` saat unmount.
- **SEC-04** — `getSession()` → `getUser()` di `middleware.ts` & `getGlobalBannerSettings` (server-side). Call client-side dibiarkan (sudah di-re-verify server-side via agent-proxy).
- **SEC-05** — `NEXT_PUBLIC_AGENT_URL` → `AGENT_URL` (server-only) di `agent-proxy` & `.env`.

Sudah **DIFIX** juga (HIGH/FEAT — UI jujur):
- **FEAT-01** — Tab Notifikasi: tombol "Simpan" palsu + toggle non-fungsional dihapus. Sekarang jujur: notif WA pesanan/komplain ditandai **Aktif** (memang dikirim agent), laporan email & stok menipis ditandai **"Segera hadir"**.
- **FEAT-02** — Badge sidebar & tab Billing kini baca `subscription_tier` asli + kuota token. Tanggal & tombol pembayaran palsu (Kelola Pembayaran, Batalkan Plan, "25 April 2026") dihapus; diganti arahan "hubungi admin untuk ubah paket".

Sudah **DIFIX** juga (Dashboard — selaras klaim proposal):
- **AI Insight (diferensiator utama proposal)** — kartu "Rekomendasi AI" di `dashboard/laporan` yang tadinya hardcoded ("Sabtu selalu jadi puncak…") kini **AI beneran**: route baru `POST /api/ai-insight` (auth wajib, OpenRouter server-side) menerima ringkasan data transaksi nyata → menghasilkan rekomendasi. Di-cache per (bisnis, periode, hari) via localStorage agar hemat kuota AI. Tombol mati "Atur Promo" → jadi Link ke WA Marketing. Bug angka palsu `total_sales || 20` → `|| 0`.
  - ⏳ *Catatan:* ini versi **on-dashboard**. "Dikirim ke owner setiap hari via WA" (sesuai bunyi proposal) = roadmap terpisah di sisi agent.
  - 🐛 *Fix tambahan:* model OpenRouter `gemini-2.0-flash-001` (mati/404) → `gemini-2.5-flash-lite` di `ai-insight` **dan** `generate-products` (onboarding AI produk yang juga diam-diam rusak).

Sudah **DIFIX** juga (Kasir — selaras klaim "tidak ada oversell"):
- **#2 Validasi stok** — `addToCart`/`updateQty` tidak bisa lebih dari stok; kartu produk stok 0 di-disable + badge "Stok Habis"; tombol `+` mati saat mentok; `handleCheckout` validasi ulang sebelum simpan; stok di-floor 0; tampilan stok refresh tanpa reload; toast peringatan stok.
- **#3 Simpan metode bayar** — kolom `orders.payment_method` ditambah via migration (nullable, aman); kasir kini simpan `payment_method` (tunai/transfer/qris) ke order.
- ⏳ *Follow-up:* agent WhatsApp (`kelola-agent` `saveOrder`) juga belum validasi/floor stok → untuk klaim "no oversell" yang utuh di semua channel, perlu fix serupa di sisi agent.

Sudah **DIFIX** juga (WA Marketing):
- **#4 Status bot nyangkut** — `checkBotStatus` dulu jalan saat `businessId` masih "" (race dgn `loadData` async) → `botConnected` stuck `null` → broadcast keblokir walau bot nyambung. Fix: pindahkan ke `useEffect` ber-dependency `[businessId]` (jalan setelah ID terisi).

Sudah **DIFIX** juga (Format nomor WhatsApp):
- **wa_number tidak konsisten** (`08...`/`8...`/`62...`) → agent cocokkan bisnis via `wa_number = botWa` (format `62...`), jadi yang non-62 **tidak dikenali AI**. Onboarding malah simpan `8...` (strip 62 & 0) → tidak match apa pun.
- Fix: util `src/lib/phone.ts` `normalizeWa()` → dipakai di **onboarding, pengaturan, register** (semua simpan kanonik `62...`).
- Data lama 2 baris (`089…`, `087…`) sudah dinormalisasi ke `62…` via SQL. Semua 4 bisnis kini format benar.
- ⚠️ DB `businesses` sebelumnya **tidak punya `owner_name`** (register & onboarding nyoba insert kolom ini → gagal diam-diam) → kolom `owner_name` + `address` sudah ditambah via migration.

⚠️ **Masih perlu tindakanmu:**
- **Disarankan:** tambah unique constraint `businesses.user_id` di DB agar dobel benar-benar mustahil di level database.
- Sisanya (FEAT-01/02, BUG-03/04, SEC-04/05, LOW-*) belum disentuh — lihat detail di bawah.

ℹ️ **SEC-03 (DIKOREKSI):** Setelah diverifikasi via `git log --all`, file `.env` **tidak pernah ter-commit** dan **tidak ter-push** ke GitHub (`.gitignore` sudah benar sejak awal). Jadi key TIDAK bocor lewat Git. Rotate key hanya perlu jika nilai key sempat ter-ekspos di tempat lain (mis. transcript chat yang di-share). Tidak urgent.

---

## 🔴 CRITICAL — Wajib fix sebelum deploy publik

### SEC-01: Panel Admin TIDAK terproteksi sama sekali
**File:** `src/app/admin/layout.tsx` (baris 15–23)
**Problem:** Seluruh pengecekan auth & admin di-comment dengan catatan *"TODO: Re-enable setelah development"*. Akibatnya **siapa pun** — bahkan yang belum login — bisa membuka:
- `/admin` → omzet & profit seluruh platform
- `/admin/clients` → data SEMUA merchant (nama, nomor WA, paket, token)
- `/admin/logs` → **seluruh isi chat pelanggan + nomor WA mereka** (kebocoran privasi paling parah)
- `/admin/preview/[businessId]` → statistik & omzet tiap bisnis

Halaman-halaman ini pakai `SUPABASE_SERVICE_ROLE_KEY` yang **bypass RLS**, jadi tidak ada lapisan pengaman lain. Middleware juga **tidak** melindungi `/admin` (hanya `/dashboard` & `/onboarding`).

**Catatan:** Server action destruktif (hapus klien, ubah paket, banner) SUDAH cek `ADMIN_EMAILS`, jadi yang bocor adalah semua operasi **baca**. Tetap saja ini data breach.

**Solution:** Aktifkan kembali guard di `admin/layout.tsx`:
```ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/auth/login");

const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
if (!adminEmails.includes(user.email!.toLowerCase())) redirect("/dashboard");
```
Tambahkan juga `/admin` ke proteksi `middleware.ts` sebagai lapis kedua.

---

### SEC-02: `/api/orders/update-status` tanpa autentikasi
**File:** `src/app/api/orders/update-status/route.ts`
**Problem:** Endpoint `PATCH` ini pakai service role key tapi **tidak ada cek login maupun ownership**. Siapa pun yang tahu/menebak `orderId` (UUID) bisa mengubah status pesanan **milik bisnis mana pun** ke `lunas`, `dibatalkan`, dll. Tidak ada verifikasi bahwa order itu milik user yang request.

**Solution:** Verifikasi session + ownership sebelum update:
```ts
const supabaseAuth = await createServerClient();
const { data: { user } } = await supabaseAuth.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// pastikan order.business_id milik user (join ke businesses.user_id)
```

---

### SEC-03: Secret & API key ter-commit di `.env`
**File:** `.env` (root kelola.ai) & `kelola-agent/.env`
**Problem:** `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, dan `AGENT_SECRET_KEY` asli tersimpan plaintext. Service role key = akses penuh DB tanpa RLS.
**Solution:** Rotate semua key, pastikan `.env` tidak pernah ke git, set ulang via env VPS / secret manager.

---

## 🟠 HIGH — Fungsi penting yang BELUM jalan / patah

### BUG-01: Linking WhatsApp di Onboarding rusak total
**File:** `src/app/onboarding/page.tsx` (baris 57)
**Problem:** Ada **3 bug sekaligus** di step QR:
```ts
const res = await fetch('http://localhost:3001/api/qr/1');
```
1. **`localhost:3001` hardcoded** → di browser pelanggan (bukan VPS) ini gagal total. Harus lewat `/api/agent-proxy`.
2. **businessId `1` hardcoded** → padahal bisnis baru punya UUID. QR yang dipoll bukan milik bisnis yang baru dibuat.
3. **Tidak pernah panggil `/api/connect` dulu** → tidak ada session WA yang dibuat, jadi QR tidak akan pernah muncul.

Akibat: user baru **tidak bisa** menautkan WhatsApp dari onboarding. (Di `pengaturan` alurnya benar — bisa jadi acuan perbaikan.)

**Solution:** Samakan dengan pola di `pengaturan/page.tsx`: panggil `connect` via agent-proxy pakai `businessData.id`, lalu poll `status` + `qr` dengan token auth.

---

### BUG-02: Bisnis dobel — register & onboarding sama-sama insert
**File:** `src/app/register/page.tsx` (baris 59) **dan** `src/app/onboarding/page.tsx` (baris 87)
**Problem:** Saat daftar via email, `register` sudah `insert` ke tabel `businesses`. Lalu di `onboarding`, ada `insert` lagi. User bisa punya **2 baris bisnis**.
Banyak query lain pakai `.eq('user_id', ...).single()` (mis. `DashboardLayout`, `pengaturan`, `asisten-ai`). `.single()` akan **throw** kalau ada >1 baris → dashboard bisa error/blank untuk user tsb.

**Solution:** Pilih satu sumber kebenaran. Saran: register **tidak** insert bisnis; biarkan onboarding yang membuat. Atau pakai `upsert` dengan `onConflict: 'user_id'`. Tambahkan juga unique constraint `user_id` di DB.

---

### FEAT-01: Simpan Preferensi Notifikasi cuma pura-pura
**File:** `src/app/dashboard/pengaturan/page.tsx` (`handleSaveNotif`, baris 138)
**Problem:** Tombol "Simpan Preferensi" hanya `setTimeout` 800ms lalu tampilkan "Tersimpan" — **tidak ada tulisan ke DB**. Semua toggle notifikasi tidak berefek apa-apa.
**Solution:** Simpan ke kolom JSON `notification_settings` di `businesses`, atau hapus UI-nya kalau belum siap agar tidak menyesatkan user.

---

### FEAT-02: Tab Billing & badge "Pro Plan" hardcoded
**File:** `src/app/dashboard/pengaturan/page.tsx` (tab billing) + `src/components/layout/DashboardLayout.tsx` (baris 317)
**Problem:** Tab Berlangganan menampilkan "Pro Plan", tanggal "25 April 2026", tombol "Kelola Pembayaran" & "Batalkan Plan" yang **semuanya statis/tidak berfungsi**. Badge "Pro Plan" di sidebar muncul untuk **semua** user tanpa melihat `subscription_tier` asli.
**Solution:** Ambil `subscription_tier` real dari DB; sembunyikan tombol yang belum ada backend-nya.

---

## 🟡 MEDIUM — Bug nyata tapi dampak terbatas

### BUG-03: Atribut `className` ganda (styling banner hilang)
**File:** `src/components/layout/DashboardLayout.tsx` (baris 363–364)
**Problem:** `motion.div` banner global punya **dua** atribut `className`. Di JSX yang kedua menimpa yang pertama — jadi gradient `from-orange-600 to-rose-600` + shadow **diam-diam hilang**, hanya `bg-orange-600` yang dipakai.
**Solution:** Gabungkan jadi satu `className`.

### BUG-04: Realtime channel tidak di-cleanup
**File:** `src/components/layout/DashboardLayout.tsx` (baris 139–152)
**Problem:** `supabase.channel(...).subscribe()` dipanggil tapi tidak pernah `removeChannel` saat unmount (cleanup hanya set `isMounted=false`). Bisa menumpuk subscription / memory leak saat navigasi berulang.
**Solution:** Simpan ref channel, `supabase.removeChannel(ch)` di fungsi cleanup `useEffect`.

### SEC-04: `getSession()` di server (middleware & server action)
**File:** `src/middleware.ts` (baris 57), `src/app/actions/global-settings.ts` (baris 55)
**Problem:** Supabase menyarankan `getUser()` di server karena `getSession()` membaca cookie **tanpa revalidasi** ke Auth server → bisa dipalsukan. `getGlobalBannerSettings` juga hanya gate "ada session" lalu baca pakai service role.
**Solution:** Ganti ke `supabase.auth.getUser()` untuk keputusan otorisasi server-side.

### SEC-05: `NEXT_PUBLIC_AGENT_URL` ter-expose ke browser
**File:** `src/app/api/agent-proxy/route.ts` (baris 4)
**Problem:** Proxy ini server-side (bagus — sudah verifikasi ownership + pegang secret), tapi URL agent pakai prefix `NEXT_PUBLIC_` sehingga ikut ter-bundle ke client. Info disclosure ringan.
**Solution:** Rename jadi `AGENT_URL` (tanpa `NEXT_PUBLIC_`) karena hanya dipakai server.

---

## 🟢 LOW — Konsistensi & polish

### LOW-01: Panjang password tidak konsisten
`register` minta **8** karakter (baris 36), ganti password di `pengaturan` minta **6** (baris 116). Samakan (saran: 8) dan idealnya enforce juga di Supabase Auth settings.

### LOW-02: Pencarian global hanya ke Pesanan
`DashboardLayout.tsx` (baris 403) — search ⌘K selalu redirect ke `/dashboard/pesanan`. Label terlihat global tapi cakupannya sempit.

### LOW-03: `auth_bg.png` & avatar eksternal
Pastikan semua aset (mis. `i.pravatar.cc` di `next.config.ts`, favicon Google di login/register) memang diinginkan di production; aset eksternal = dependency pihak ketiga.

---

## ✅ Yang sudah BAGUS
- `agent-proxy` route: verifikasi session **dan** ownership sebelum forward ke agent + simpan secret server-side. Pola ini benar.
- `delete-business` route & server action admin: cek login + ownership / `ADMIN_EMAILS`.
- `.gitignore` sudah meng-exclude `.env*`.
- RLS Supabase dipakai untuk query user biasa (service role hanya di jalur admin/proxy).

---

## 📊 Ringkasan Prioritas

| ID | Temuan | Tingkat | Est. |
|------|--------|---------|------|
| SEC-01 | Panel admin tidak terproteksi | 🔴 Critical | 30 mnt |
| SEC-02 | `update-status` tanpa auth | 🔴 Critical | 30 mnt |
| SEC-03 | Secret ter-commit | 🔴 Critical | 30 mnt + rotate |
| BUG-01 | Onboarding WA linking rusak | 🟠 High | 1–2 jam |
| BUG-02 | Bisnis dobel (register+onboarding) | 🟠 High | 1 jam |
| FEAT-01 | Simpan notifikasi palsu | 🟠 High | 1 jam |
| FEAT-02 | Billing & badge Pro hardcoded | 🟠 High | 1–2 jam |
| BUG-03 | `className` ganda banner | 🟡 Medium | 5 mnt |
| BUG-04 | Realtime channel bocor | 🟡 Medium | 30 mnt |
| SEC-04 | `getSession` di server | 🟡 Medium | 30 mnt |
| SEC-05 | `NEXT_PUBLIC_AGENT_URL` exposed | 🟡 Medium | 10 mnt |
| LOW-01 | Password length beda | 🟢 Low | 10 mnt |
| LOW-02 | Search cuma pesanan | 🟢 Low | 30 mnt |
| LOW-03 | Aset eksternal | 🟢 Low | — |

---

## 💳 ROADMAP — Integrasi Pembayaran QRIS (ditunda, kompleks)

**Keputusan arsitektur (13 Jun 2026):**

- **Fase sekarang (prototype/FIKSI):** QRIS **dinamis** dari QRIS statis UMKM via lib [`verssache/qris-dinamis`](https://github.com/verssache/qris-dinamis) (parse payload EMVCo → suntik nominal → recalc CRC16). Uang **langsung ke UMKM** (NMID tak berubah), nominal otomatis, **tanpa gateway**. Konfirmasi pembayaran **MANUAL** (owner tandai "Lunas" / pelanggan kirim bukti). Pakai trik **nominal unik** (mis. Rp 35.0**17**) untuk pencocokan akurat.
- **Kenapa tidak auto-konfirmasi sekarang:** status "sudah dibayar" ada di akun acquirer UMKM, bukan di string QR. Lib ini 0% validasi pembayaran — dan tidak bisa "dimodif" untuk itu (masalah terpisah).
- **Opsi auto-konfirmasi DIY (TIDAK disarankan untuk demo):** polling mutasi OrderKuota via API tidak resmi → fragile (bisa rusak saat demo), harus simpan kredensial finansial UMKM (bentrok dgn risiko "keamanan data" di proposal), ToS gray-area.
- **Fase scale (2027):** Xendit xenPlatform / split-payment → tiap UMKM jadi sub-merchant (KYC), uang **tetap settle ke UMKM**, Kelola.ai ambil fee, QRIS dinamis + **auto-konfirmasi via webhook resmi**.

**Pitch ke juri:** "QRIS dinamis nominal-otomatis tanpa gateway (uang langsung ke UMKM, nol risiko), konfirmasi by owner. Auto-konfirmasi via Xendit split-payment di fase scale." — JANGAN model 1-akun-gateway (uang masuk ke kita = butuh izin PJP Bank Indonesia).

**Yang perlu dibangun saat eksekusi:** field upload QRIS statis di Pengaturan → generate QRIS dinamis per order → bot WA kirim ke pelanggan → owner konfirmasi via dashboard / command `LUNAS <id>`.

---

## 🔌 ROADMAP — On/Off Bot & Jam Operasional (ditunda)

> Gabungan dari kelola-agent PR-06 (Business Hours) & PR-07 (Human Handover).

**Tujuan:** owner bisa "matikan" bot saat toko tutup; bot tidak proses order di luar jam buka.

**3 status bot:**
1. **Aktif** (default) — balas & proses otomatis 24/7.
2. **Libur/Tutup** (manual) — owner matikan manual.
3. **Jam Operasional** (auto) — aktif hanya dalam jam buka; di luar jam → mode tutup otomatis.

**Saat tutup:** balas away-message **sekali** ("Toko sedang tutup, pesanan dicatat & dibalas saat buka"), **skip AI** (hemat kuota), **skip order**. Pesan pelanggan tetap tercatat di Percakapan untuk ditindaklanjuti owner.

**Anti-spam:** cooldown away-message per pelanggan (mis. 1–2 jam), reuse pola guard anti-duplikat komplain di `agent.js`.

**Yang perlu dibangun:**
- DB `businesses`: `bot_active` (bool, default true), `business_hours` (jsonb), `away_message` (text).
- Agent: cek status di awal `processMessage` → kalau tutup, kirim away-message (cooldown) lalu return tanpa panggil AI.
- Dashboard: kartu "Status Bot" di Pengaturan — toggle on/off + atur jam buka-tutup + edit pesan tutup.
- 🎁 Bonus: command WA dari nomor owner `/tutup` & `/buka` (perlu handle `msg.key.fromMe` khusus di handler agent).

---

## 🧾 ROADMAP — Cetak Struk POS (ditunda)

**Pendekatan bertahap (web app, mobile-first):**
- **Sekarang/MVP:** struk di layar (format 58mm) → tombol **Cetak** (`window.print()`, bisa printer apa aja / Save PDF) + **Struk Digital** (share/kirim ke WA pelanggan). Nol hardware, demo-able.
- **Nanti:** printer thermal Bluetooth via **RawBT** (Android print bridge) atau Web Bluetooth (BLE ESC/POS). Catatan: thermal BT murah biasanya Bluetooth Classic/SPP → Web Bluetooth (BLE) sering tidak kompatibel; RawBT jalur paling realistis.

**Isi struk (spec):**
- Header: nama toko (`business_name`), alamat (`address` ✅ ditambah), no WA (`wa_number`)
- Info: no struk (`order.id`), tgl/jam (`created_at`), kasir/pemilik (`owner_name` ✅ ditambah), metode bayar (`payment_method` ✅)
- Item: nama, qty × harga, subtotal (dari `order.items`)
- Ringkasan: Subtotal, TOTAL; opsional Tunai + Kembalian
- Footer: "Terima kasih…" + "Powered by Kelola.ai" (branding halus)

**Struk itu OPSIONAL (banyak UMKM mikro tidak punya printer):**
- Pasca-checkout, owner pilih: **Cetak** / **Kirim ke WA (digital)** / **Selesai-Lewati** — tidak dipaksa.
- Preferensi default di Pengaturan: toggle `businesses.has_printer` (kalau false → sembunyikan tombol Cetak) atau `receipt_default_mode` (cetak/digital/none) biar tidak pilih tiap transaksi.
- Jalur **digital (WA)** = path utama untuk mayoritas mikro tanpa printer; cetak = sekunder.

**Yang masih perlu saat eksekusi:**
- Input "uang diterima" di kasir → hitung kembalian (buat tunai). Opsional simpan ke order.
- Opsional kolom `businesses.receipt_footer` (catatan custom) & `logo_url`.
- Capture data order **sebelum** keranjang dikosongkan (biar struk bisa dirender pasca-checkout).
- Samakan format dengan `buildReceipt` di `kelola-agent/agent.js` biar struk kasir & struk WA konsisten.

**DB:** `businesses.owner_name` & `businesses.address` sudah ditambah (migration `add_owner_name_and_address_to_businesses`) — sekalian memperbaiki insert `owner_name` di register/onboarding yang sebelumnya gagal diam-diam.
