import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
    fetchTopProductsThisMonth,
    fetchWeekSummary,
    fetchTopCustomers,
    fetchBusinessContext,
    executeDynamicQuery,
    type DynamicQuery,
} from "@/lib/tanya-kelola/data";
import { callLLM, SYSTEM_PROMPT_ANALYST } from "@/lib/tanya-kelola/llm";
import { detectIntent } from "@/lib/tanya-kelola/intent";

export const runtime = "nodejs";

// POST body: { preset?: "top-products" | "week-summary" | "top-customers", question?: string }
// Response: { text, insight, data? }
export async function POST(request: Request) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: business } = await supabase
            .from("businesses")
            .select("id, business_name")
            .eq("user_id", user.id)
            .single();
        if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

        const body = await request.json();
        const preset = body.preset as string | undefined;
        const question = body.question as string | undefined;

        // ─── PRESET FLOWS (real data + LLM narasi) ──────────────────
        if (preset === "top-products") return await handleTopProducts(supabase, business.id, business.business_name);
        if (preset === "week-summary") return await handleWeekSummary(supabase, business.id, business.business_name);
        if (preset === "top-customers") return await handleTopCustomers(supabase, business.id, business.business_name);

        // ─── FREE-TEXT (context ringkas + LLM full) ─────────────────
        if (question) return await handleFreeText(supabase, business.id, business.business_name, question);

        return NextResponse.json({ error: "preset atau question wajib diisi" }, { status: 400 });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("Tanya Kelola error:", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// ═══════════════════════════════════════════════════════════════════
// PRESET HANDLERS
// ═══════════════════════════════════════════════════════════════════

async function handleTopProducts(supabase: any, businessId: string, businessName: string) {
    const result = await fetchTopProductsThisMonth(supabase, businessId);
    if (result.items.length === 0) {
        return NextResponse.json({
            text: `Belum ada produk terjual di ${result.period} nih. Yuk mulai catat penjualan biar bisa kelihatan tren produknya! 🚀`,
            insight: null,
            data: null,
        });
    }
    const table = result.items.map((p, i) => `${i + 1}. ${p.name}: ${p.qty} terjual (${p.changePct >= 0 ? "+" : ""}${p.changePct}% vs bulan lalu)`).join("\n");
    const prompt = `Merchant: ${businessName}\nPeriode: ${result.period}\n\nTop 5 produk bulan ini:\n${table}\n\nBerikan analisis singkat tentang produk mana yang jadi bintang, tren yang terlihat, dan 1 rekomendasi actionable. Sebut nama produk yang relevan.`;
    const text = await callLLM({ system: SYSTEM_PROMPT_ANALYST, user: prompt, maxTokens: 500 });

    return NextResponse.json({
        text,
        insight: null,
        data: {
            type: "top-products",
            title: `Top 5 Produk — ${result.period}`,
            items: result.items,
        },
    });
}

async function handleWeekSummary(supabase: any, businessId: string, businessName: string) {
    const s = await fetchWeekSummary(supabase, businessId);
    if (s.totalOrd === 0) {
        return NextResponse.json({
            text: `Belum ada pesanan lunas 7 hari terakhir. Kalau baru mulai, coba fokus promo di kanal WhatsApp & catat semua transaksi biar tren-nya kelihatan! 💪`,
            insight: null,
            data: null,
        });
    }
    const daily = s.daily.map(d => `${d.name}: Rp ${d.total.toLocaleString("id-ID")} (${d.orders} order)`).join("\n");
    const chanStr = Object.entries(s.channels).map(([k, v]) => `${k}: ${v}`).join(", ");
    const prompt = `Merchant: ${businessName}\n\nRingkasan 7 hari terakhir:\n- Total omzet: Rp ${s.totalRev.toLocaleString("id-ID")} (${s.changePct >= 0 ? "+" : ""}${s.changePct}% vs minggu lalu)\n- Total pesanan: ${s.totalOrd}\n- Rata-rata order: Rp ${Math.round(s.totalRev / s.totalOrd).toLocaleString("id-ID")}\n- Channel: ${chanStr}\n\nPer hari:\n${daily}\n\nRingkas performa minggu ini + sorot hari terbaik + 1 saran actionable.`;
    const text = await callLLM({ system: SYSTEM_PROMPT_ANALYST, user: prompt, maxTokens: 500 });

    return NextResponse.json({
        text,
        insight: null,
        data: {
            type: "week-summary",
            title: "Penjualan 7 Hari Terakhir",
            daily: s.daily,
            totals: { revenue: s.totalRev, orders: s.totalOrd, avg: Math.round(s.totalRev / s.totalOrd), changePct: s.changePct },
        },
    });
}

async function handleTopCustomers(supabase: any, businessId: string, businessName: string) {
    const { list } = await fetchTopCustomers(supabase, businessId);
    if (list.length === 0) {
        return NextResponse.json({
            text: `Belum ada pelanggan tercatat. Setiap pelanggan yang chat lewat bot WA akan tersimpan otomatis di sini. Mulai konek WhatsApp dulu ya! 📱`,
            insight: null,
            data: null,
        });
    }
    const rows = list.map((c: any, i: number) => `${i + 1}. ${c.name}: ${c.total_orders || 0} order`).join("\n");
    const prompt = `Merchant: ${businessName}\n\nTop 5 pelanggan (by jumlah order):\n${rows}\n\nBerikan insight singkat + saran cara treat pelanggan setia (misal: WA broadcast promo khusus, kasih diskon loyalty, dll).`;
    const text = await callLLM({ system: SYSTEM_PROMPT_ANALYST, user: prompt, maxTokens: 500 });

    return NextResponse.json({
        text,
        insight: null,
        data: {
            type: "top-customers",
            title: "Pelanggan Paling Aktif",
            items: list,
        },
    });
}

async function handleFreeText(supabase: any, businessId: string, businessName: string, question: string) {
    // 1. Detect intent — chart or text?
    const intent = await detectIntent(question);

    // ─── CHART INTENT ─────────────────────────────────────────
    if (intent.intent === "chart" && intent.query && intent.period) {
        try {
            const result = await executeDynamicQuery(supabase, businessId, {
                query: intent.query,
                period: intent.period,
            } as DynamicQuery);

            if (result.points.length === 0) {
                return NextResponse.json({
                    text: `Belum ada data untuk pertanyaan itu di periode "${result.periodLabel}". Data akan muncul begitu ada transaksi lunas 📊`,
                    data: null,
                });
            }

            // Ask LLM for narasi based on actual query result
            const dataStr = result.points.slice(0, 10).map((p) => `${p.name}: ${p.value.toLocaleString("id-ID")}`).join("\n");
            const narrationPrompt = `Pertanyaan owner: "${question}"\n\nData ${intent.title} (${result.periodLabel}):\n${dataStr}\n\nTotal: ${result.total.toLocaleString("id-ID")}\n\nBerikan analisis singkat (1-2 kalimat) tentang pola yang terlihat. Sebut angka spesifik yang relevan.`;
            const text = await callLLM({
                system: SYSTEM_PROMPT_ANALYST,
                user: narrationPrompt,
                maxTokens: 400,
            });

            return NextResponse.json({
                text,
                data: {
                    type: "dynamic",
                    chart_type: intent.chart_type,
                    title: intent.title || `${result.periodLabel}`,
                    points: result.points,
                    total: result.total,
                    period_label: result.periodLabel,
                },
            });
        } catch (err) {
            console.error("Dynamic query error, fallback to text:", err);
            // fall through to text
        }
    }

    // ─── TEXT INTENT (default & fallback) ──────────────────────
    const ctx = await fetchBusinessContext(supabase, businessId);
    const productsList = ctx.products.map((p: any) => `- ${p.name} (Rp ${p.price.toLocaleString("id-ID")}, stok ${p.stock})`).join("\n");
    const topCustStr = ctx.topCustomers.map((c: any) => `${c.name} (${c.total_orders} order)`).join(", ");
    const chanStr = Object.entries(ctx.stats30d.channels).map(([k, v]) => `${k}: ${v}`).join(", ");

    const prompt = `PERTANYAAN OWNER: "${question}"

DATA BISNIS (${businessName}):

Statistik 30 hari terakhir:
- Total omzet: Rp ${ctx.stats30d.totalRevenue.toLocaleString("id-ID")}
- Total pesanan: ${ctx.stats30d.totalOrders}
- Rata-rata order: Rp ${ctx.stats30d.avgOrder.toLocaleString("id-ID")}
- Distribusi channel: ${chanStr || "(belum ada)"}

Produk (top 15):
${productsList || "(belum ada produk)"}

Stok rendah (< 10):
${ctx.lowStock.map((p: any) => `- ${p.name}: sisa ${p.stock}`).join("\n") || "(semua aman)"}

Top pelanggan: ${topCustStr || "(belum ada)"}

Jawab pertanyaan owner di atas berdasarkan data ini. Fokus, natural, dan actionable.`;

    const text = await callLLM({ system: SYSTEM_PROMPT_ANALYST, user: prompt, maxTokens: 700 });
    return NextResponse.json({ text, insight: null, data: null });
}
