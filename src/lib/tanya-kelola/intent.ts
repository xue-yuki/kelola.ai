// ═════════════════════════════════════════════════════════════════
// Intent detector — LLM classifies user question, returns query spec
// ═════════════════════════════════════════════════════════════════

import { callLLM } from "./llm";
import type { DynamicQuery } from "./data";

const INTENT_SYSTEM = `Kamu adalah router untuk analytic bisnis UMKM. Tugas: baca pertanyaan owner, tentukan APAKAH mereka minta data terstruktur (chart/table) atau cuma tanya biasa.

OUTPUT WAJIB JSON valid (tanpa markdown fence), format:

{
  "intent": "chart" | "text",
  "query": "revenue_by_hour" | "revenue_by_day" | "orders_by_hour" | "orders_by_day" | "revenue_by_product" | "revenue_by_channel" | "orders_by_status" | "top_customers" | null,
  "period": "today" | "yesterday" | "7d" | "30d" | "90d" | "all" | null,
  "chart_type": "bar" | "line" | "donut" | null,
  "title": "Judul chart singkat (kalo intent=chart)"
}

ATURAN:
- Kalau user minta lihat data/tren/grafik/chart → intent="chart", isi query+period+chart_type
- Kalau user tanya opini/kenapa/saran/general → intent="text", query/period/chart_type = null
- Query WAJIB salah satu dari list di atas — kalau ga cocok, pakai intent="text"
- Untuk data per waktu (hour/day), pakai line chart
- Untuk perbandingan kategori (produk/channel/status/customer), pakai bar chart
- Untuk proporsi channel, boleh donut
- Period default kalau ga disebut: revenue/orders per hour → today, per day → 30d, per product → 30d
- OUTPUT HARUS JSON MURNI. Jangan pakai \`\`\`json fence.

CONTOH:
User: "chart penjualan hari ini per jam"
→ {"intent":"chart","query":"revenue_by_hour","period":"today","chart_type":"line","title":"Penjualan Per Jam - Hari Ini"}

User: "produk mana yang paling laku 30 hari terakhir"
→ {"intent":"chart","query":"revenue_by_product","period":"30d","chart_type":"bar","title":"Revenue Per Produk - 30 Hari"}

User: "kenapa omzet gua turun ya?"
→ {"intent":"text","query":null,"period":null,"chart_type":null,"title":""}

User: "kasih saran donk"
→ {"intent":"text","query":null,"period":null,"chart_type":null,"title":""}

User: "distribusi channel 7 hari"
→ {"intent":"chart","query":"revenue_by_channel","period":"7d","chart_type":"donut","title":"Distribusi Channel - 7 Hari"}`;

export type IntentResult = {
    intent: "chart" | "text";
    query: DynamicQuery["query"] | null;
    period: string | null;
    chart_type: "bar" | "line" | "donut" | null;
    title: string;
};

const VALID_QUERIES = new Set([
    "revenue_by_hour", "revenue_by_day", "orders_by_hour", "orders_by_day",
    "revenue_by_product", "revenue_by_channel", "orders_by_status", "top_customers",
]);
const VALID_PERIODS = new Set(["today", "yesterday", "7d", "30d", "90d", "all"]);
const VALID_CHARTS = new Set(["bar", "line", "donut"]);

export async function detectIntent(question: string): Promise<IntentResult> {
    const raw = await callLLM({ system: INTENT_SYSTEM, user: question, maxTokens: 250 });
    try {
        // Strip markdown fence if LLM ignored instruction
        const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.intent === "chart"
            && VALID_QUERIES.has(parsed.query)
            && VALID_PERIODS.has(parsed.period)
            && VALID_CHARTS.has(parsed.chart_type)) {
            return {
                intent: "chart",
                query: parsed.query,
                period: parsed.period,
                chart_type: parsed.chart_type,
                title: String(parsed.title || "").slice(0, 60),
            };
        }
    } catch {
        // fall through to text
    }
    return { intent: "text", query: null, period: null, chart_type: null, title: "" };
}
