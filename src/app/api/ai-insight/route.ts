import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Menghasilkan rekomendasi bisnis berbasis AI dari ringkasan data transaksi.
// API key OpenRouter tetap server-side. Wajib login (cegah orang lain pakai kuota AI kita).
export async function POST(request: Request) {
    try {
        // ── Auth ──────────────────────────────────────────────────────────
        const supabaseAuth = await createServerClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "AI service belum dikonfigurasi" }, { status: 500 });
        }

        const { summary } = await request.json();
        if (!summary) {
            return NextResponse.json({ error: "summary wajib diisi" }, { status: 400 });
        }

        const prompt = `Kamu adalah analis bisnis yang ramah untuk UMKM mikro Indonesia. Berdasarkan data penjualan berikut, berikan SATU rekomendasi bisnis yang spesifik dan bisa langsung dilakukan, dalam Bahasa Indonesia santai (maksimal 2-3 kalimat).

ATURAN:
- Fokus pada pola NYATA di data: hari paling ramai, produk terlaris, tren naik/turun, atau channel dominan.
- JANGAN mengarang angka di luar data yang diberikan.
- Jika data masih sedikit/kosong, beri tips memulai yang relevan untuk UMKM.
- Jawab langsung rekomendasinya saja, tanpa kalimat pembuka seperti "Berdasarkan data...".
- Boleh pakai 1 emoji yang relevan.

DATA (periode: ${summary.period || "-"}):
- Total omzet: Rp ${Number(summary.totalRevenue || 0).toLocaleString("id-ID")}
- Total pesanan: ${summary.totalOrders || 0}
- Rata-rata per pesanan: Rp ${Number(summary.avgOrder || 0).toLocaleString("id-ID")}
- Perubahan vs periode lalu: omzet ${summary.comparisonRevenue ?? 0}%, pesanan ${summary.comparisonOrders ?? 0}%
- Omzet per hari: ${JSON.stringify(summary.revenueByDay || [])}
- Pesanan per hari: ${JSON.stringify(summary.orderByDay || [])}
- Produk terlaris: ${JSON.stringify(summary.topProducts || [])}
- Sumber pesanan (channel): ${JSON.stringify(summary.channels || [])}`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://kelola.ai",
                "X-Title": "Kelola.ai Insight",
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite",
                max_tokens: 200,
                messages: [{ role: "user", content: prompt }],
            }),
        });

        const data = await response.json();
        const insight = data.choices?.[0]?.message?.content?.trim();

        if (!response.ok || !insight) {
            console.error("AI insight error:", JSON.stringify(data));
            return NextResponse.json({ error: "AI sedang sibuk, coba lagi nanti" }, { status: 502 });
        }

        return NextResponse.json({ insight });
    } catch (err: any) {
        console.error("AI insight unexpected error:", err);
        return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
    }
}
