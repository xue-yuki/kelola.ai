

**TASK:**
Generate the complete code for the "Kelola.ai" landing page — an AI-powered business automation platform for Indonesian local SMEs (UMKM). Use Next.js (App Router), TypeScript, Tailwind CSS, and Framer Motion. Break down the code into neat, modular components.

---

## BRAND IDENTITY

* **Product Name:** Kelola.ai
* **Tagline:** "Satu Platform, Bisnis Lokal Makin Pintar"
* **Target Users:** Indonesian local SMEs (warungs, home-based shops, online sellers)
* **Tone:** Modern, friendly, trustworthy, tech-forward yet approachable
* **Color Palette (Add to Tailwind config):**
* Primary: `#FF6B2B` (vibrant orange)
* Secondary: `#FF9B5E` (light orange)
* Accent: `#FFFFFF` (white)
* Background: `#FFFFFF` and `#FFF8F4` (warm white)
* Dark text: `#1A1A2E`
* Muted text: `#6B7280`



---

## PAGE SECTIONS (Modular Components)

### 1. NAVBAR (`components/layout/Navbar.tsx`)

* **Logo:** "kelola.ai" text with an orange dot or gradient.
* **Nav links:** Fitur, Harga, Demo, Tentang.
* **CTA button:** "Coba Gratis" (orange, rounded, with a hover glow effect).
* **Behavior:** Sticky navbar with a blur backdrop effect (Tailwind `backdrop-blur`) on scroll.

### 2. HERO SECTION (`components/sections/Hero.tsx`)

* **Large Bold Headline:** "Bisnis Lokal Kamu, Dikelola Lebih Cerdas"
* **Subheadline:** "Dari pesanan WhatsApp otomatis, kasir digital, hingga laporan AI — semua dalam satu platform terjangkau."
* **Two CTA buttons:** "Mulai Gratis" (solid orange) & "Lihat Demo" (outline).
* **Right Visual:** A static or lightly animated dashboard mockup showing incoming order notifications, an upward chart, and an AI insight card.
* **Background:** Subtle animated orange blob/mesh gradient.
* **Framer Motion Animation:** Text fades in from the left, mockup slides in from the right.

### 3. PROBLEM SECTION (`components/sections/Problems.tsx`)

* **Section title:** "Masalah yang Sering UMKM Hadapi"
* **3 Problem Cards (using icons from `lucide-react`):**
1. "Kewalahan balas pesanan WA satu per satu"
2. "Catat keuangan manual di buku, sering salah"
3. "Tidak tahu produk mana yang paling laku"


* **Styling:** Use a dark background (`#1A1A2E`) for high contrast.
* **Framer Motion Animation:** Cards appear with a stagger effect on scroll (`whileInView`).

### 4. SOLUTION / FEATURES SECTION (`components/sections/Features.tsx`)

* **Section title:** "Semua Solusinya Ada di Kelola.ai"
* **6 Feature Cards (3x2 grid on desktop, 1 column on mobile):**
1. AI Agent WA & Telegram — "Auto-reply pesanan 24/7 tanpa perlu balas manual"
2. Smart Onboarding — "Setup bisnis dalam 5 menit, AI langsung siapkan template"
3. Kasir Digital (POS) — "Catat transaksi offline & online di satu tempat"
4. Kalkulasi HPP Otomatis — "Hitung harga pokok produksi dengan akurat"
5. Prediksi Pendapatan — "AI forecast pendapatan bulan depan berbasis data"
6. AI Insight Harian — "Rekomendasi bisnis otomatis setiap hari via WA"


* **Hover effects:** Cards lift slightly with an orange glow shadow.

### 5. HOW IT WORKS (`components/sections/HowItWorks.tsx`)

* **Section title:** "Cara Kerja Kelola.ai"
* **4-Step Flow:**
1. Daftar & Jawab Pertanyaan Bisnis
2. AI Setup Dashboard Otomatis
3. Hubungkan WhatsApp / Telegram
4. Bisnis Siap Dikelola!


* **Layout:** Horizontal on desktop, vertical on mobile, with connecting lines between steps.

### 6. LIVE SIMULATION (`components/sections/Simulation.tsx` - Interactive)

* **Section title:** "Simulasi Langsung"
* **Layout:** Side-by-side UI (WhatsApp chat on the left, Dashboard updates on the right).
* **Behavior:** Use Framer Motion to create a looping animation of a mock chat (Customer orders -> Bot replies -> Confirmation). The dashboard side should sync with the chat, displaying new order notifications as they happen.

### 7. PRICING (`components/sections/Pricing.tsx`)

* **Section title:** "Harga Transparan, Tanpa Komisi"
* **Single Centered Card:** "Kelola Pro" - "Rp 99.000 / bulan".
* **Features list:** Include checkmarks for all features.
* **CTA:** "Mulai Sekarang". Small note below: "+ Rp 150.000 setup fee (sekali bayar)".
* **Comparison text:** "Kompetitor lain: Rp 300.000+/bulan dengan fitur lebih sedikit".

### 8. TESTIMONIALS (`components/sections/Testimonials.tsx`)

* **Section title:** "Apa Kata Mereka?"
* **3 Testimonial Cards:** Include names (Bu Siti, Pak Budi, Anisa), business types, star ratings, and quotes.
* **Layout:** Grid or horizontal flex layout.

### 9. CTA BANNER (`components/sections/CTA.tsx`)

* **Design:** Full-width orange gradient background.
* **Large text:** "Siap Bawa Bisnis Kamu ke Level Berikutnya?"
* **Subtext:** "Bergabung dengan ratusan UMKM yang sudah lebih cerdas bersama Kelola.ai"
* **Large white button:** "Mulai Gratis Sekarang".

### 10. FOOTER (`components/layout/Footer.tsx`)

* **Content:** Logo, Tagline, Links (Fitur, Harga, Kontak, Privasi), Copyright 2026.

---

## TECHNICAL & ANIMATION REQUIREMENTS

* **Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS.
* **Animation:** Use **Framer Motion** for component transitions, scroll-triggers (`whileInView`), stagger effects, and the looping chat simulation. Do not use manual CSS keyframes if Framer Motion can handle it.
* **Icons & Fonts:** Use `lucide-react` for all icons. Use fonts from `next/font/google` (Plus Jakarta Sans for headings, Inter for body text).
* **TypeScript Strictness:** Define clear `interfaces` or `types` for mapped data (e.g., feature lists, testimonials, pricing details).
* **Responsiveness:** Must use a mobile-first approach utilizing Tailwind utility classes (`sm:`, `md:`, `lg:`).

## DESIGN STYLE

* Clean, modern SaaS aesthetic.
* Generous whitespace and padding (use `py-20` or `py-24` between sections).
* A mix of Notion's clean structural style combined with Gojek's warm, approachable color scheme.
* Cards should have rounded corners (minimum `rounded-2xl`) and subtle shadows (`shadow-sm` to `shadow-md`).
