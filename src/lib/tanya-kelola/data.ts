// ─────────────────────────────────────────────────────────────────
// Tanya Kelola — RAG helpers
// Semua fungsi query Supabase yang jadi context buat LLM.
// Angka & fakta di data card = HASIL QUERY (bukan halusinasi LLM).
// ─────────────────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";

export type OrderItem = { name: string; qty?: number; price?: number };

function parseItems(raw: unknown): OrderItem[] {
    if (Array.isArray(raw)) return raw as OrderItem[];
    if (typeof raw === "string") {
        try { return JSON.parse(raw) as OrderItem[]; } catch { return []; }
    }
    return [];
}

// ─── Preset 1: Top produk bulan ini ────────────────────────────
export async function fetchTopProductsThisMonth(supabase: SupabaseClient, businessId: string) {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const prevEnd = startMonth;

    const [{ data: current }, { data: prev }] = await Promise.all([
        supabase.from("orders").select("items").eq("business_id", businessId).eq("status", "lunas").gte("created_at", startMonth),
        supabase.from("orders").select("items").eq("business_id", businessId).eq("status", "lunas").gte("created_at", prevStart).lt("created_at", prevEnd),
    ]);

    const tally = (rows: { items: unknown }[] | null): Record<string, number> => {
        const m: Record<string, number> = {};
        rows?.forEach((r) => parseItems(r.items).forEach((it) => {
            const name = (it.name || "").trim();
            if (!name) return;
            m[name] = (m[name] || 0) + (it.qty || 1);
        }));
        return m;
    };

    const curr = tally(current);
    const prevMap = tally(prev);
    const list = Object.entries(curr)
        .map(([name, qty]) => {
            const prevQty = prevMap[name] || 0;
            const changePct = prevQty === 0 ? (qty > 0 ? 100 : 0) : Math.round(((qty - prevQty) / prevQty) * 100);
            return { name, qty, prevQty, changePct };
        })
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

    return { items: list, period: now.toLocaleDateString("id-ID", { month: "long", year: "numeric" }) };
}

// ─── Preset 2: Ringkas penjualan 7 hari ────────────────────────
export async function fetchWeekSummary(supabase: SupabaseClient, businessId: string) {
    const now = new Date();
    const start = new Date(); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0);
    const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 7);
    const prevEnd = start;

    const [{ data: curr }, { data: prev }] = await Promise.all([
        supabase.from("orders").select("total, created_at, channel").eq("business_id", businessId).eq("status", "lunas").gte("created_at", start.toISOString()),
        supabase.from("orders").select("total").eq("business_id", businessId).eq("status", "lunas").gte("created_at", prevStart.toISOString()).lt("created_at", prevEnd.toISOString()),
    ]);

    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const daily: { name: string; total: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(now.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const rows = curr?.filter((o) => (o.created_at as string).startsWith(key)) || [];
        daily.push({ name: days[d.getDay()], total: rows.reduce((s, o) => s + (o.total as number), 0), orders: rows.length });
    }

    const totalRev = curr?.reduce((s, o) => s + (o.total as number), 0) || 0;
    const totalOrd = curr?.length || 0;
    const prevRev = prev?.reduce((s, o) => s + (o.total as number), 0) || 0;
    const changePct = prevRev === 0 ? (totalRev > 0 ? 100 : 0) : Math.round(((totalRev - prevRev) / prevRev) * 100);

    const channels: Record<string, number> = {};
    curr?.forEach((o) => { const c = (o.channel as string) || "lainnya"; channels[c] = (channels[c] || 0) + 1; });

    return { daily, totalRev, totalOrd, prevRev, changePct, channels };
}

// ─── Preset 3: Pelanggan paling aktif ─────────────────────────
export async function fetchTopCustomers(supabase: SupabaseClient, businessId: string) {
    const { data } = await supabase
        .from("customers")
        .select("name, wa_number, total_orders, last_order_at")
        .eq("business_id", businessId)
        .order("total_orders", { ascending: false })
        .limit(5);
    return { list: data || [] };
}

// ─── Context umum buat free-text (ringkasan 30 hari) ────────────
export async function fetchBusinessContext(supabase: SupabaseClient, businessId: string) {
    const now = new Date();
    const start30 = new Date(); start30.setDate(now.getDate() - 30);

    const [{ data: business }, { data: orders30 }, { data: products }, { data: topCust }] = await Promise.all([
        supabase.from("businesses").select("business_name, business_type").eq("id", businessId).single(),
        supabase.from("orders").select("total, status, created_at, channel").eq("business_id", businessId).eq("status", "lunas").gte("created_at", start30.toISOString()),
        supabase.from("products").select("name, price, stock").eq("business_id", businessId).order("stock"),
        supabase.from("customers").select("name, total_orders").eq("business_id", businessId).order("total_orders", { ascending: false }).limit(3),
    ]);

    const totalRev = orders30?.reduce((s, o) => s + (o.total as number), 0) || 0;
    const channels: Record<string, number> = {};
    orders30?.forEach((o) => { const c = (o.channel as string) || "lainnya"; channels[c] = (channels[c] || 0) + 1; });

    return {
        business,
        stats30d: {
            totalRevenue: totalRev,
            totalOrders: orders30?.length || 0,
            avgOrder: orders30?.length ? Math.round(totalRev / orders30.length) : 0,
            channels,
        },
        products: products?.slice(0, 15) || [],
        lowStock: products?.filter((p) => (p.stock as number) < 10).slice(0, 5) || [],
        topCustomers: topCust || [],
    };
}

// ═════════════════════════════════════════════════════════════════
// DYNAMIC QUERY EXECUTOR (Round 2)
// Whitelist-based — cuma jalanin query yang known-safe.
// ═════════════════════════════════════════════════════════════════

export type DynamicQuery =
    | { query: "revenue_by_hour"; period: "today" | "yesterday" }
    | { query: "revenue_by_day"; period: "7d" | "30d" | "90d" }
    | { query: "orders_by_hour"; period: "today" | "yesterday" }
    | { query: "orders_by_day"; period: "7d" | "30d" | "90d" }
    | { query: "revenue_by_product"; period: "7d" | "30d" | "all" }
    | { query: "revenue_by_channel"; period: "7d" | "30d" }
    | { query: "orders_by_status"; period: "7d" | "30d" }
    | { query: "top_customers"; period: "7d" | "30d" | "all" };

export type ChartPoint = { name: string; value: number; extra?: number };
export type DynamicResult = { points: ChartPoint[]; total: number; periodLabel: string };

function periodBounds(period: string): { start: Date; end: Date; label: string } {
    const now = new Date();
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    if (period === "today") {
        const s = new Date(now); s.setHours(0, 0, 0, 0);
        return { start: s, end, label: "Hari Ini" };
    }
    if (period === "yesterday") {
        const s = new Date(now); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0);
        const e = new Date(s); e.setHours(23, 59, 59, 999);
        return { start: s, end: e, label: "Kemarin" };
    }
    if (period === "7d") { const s = new Date(now); s.setDate(s.getDate() - 6); s.setHours(0, 0, 0, 0); return { start: s, end, label: "7 Hari Terakhir" }; }
    if (period === "30d") { const s = new Date(now); s.setDate(s.getDate() - 29); s.setHours(0, 0, 0, 0); return { start: s, end, label: "30 Hari Terakhir" }; }
    if (period === "90d") { const s = new Date(now); s.setDate(s.getDate() - 89); s.setHours(0, 0, 0, 0); return { start: s, end, label: "90 Hari Terakhir" }; }
    // "all" = 1 tahun ke belakang cap
    const s = new Date(now); s.setFullYear(s.getFullYear() - 1); return { start: s, end, label: "Semua Waktu" };
}

export async function executeDynamicQuery(
    supabase: SupabaseClient,
    businessId: string,
    q: DynamicQuery
): Promise<DynamicResult> {
    const { start, end, label } = periodBounds(q.period);

    if (q.query === "revenue_by_hour" || q.query === "orders_by_hour") {
        const { data } = await supabase.from("orders")
            .select("total, created_at").eq("business_id", businessId).eq("status", "lunas")
            .gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
        const buckets = new Map<number, { rev: number; count: number }>();
        for (let h = 0; h < 24; h++) buckets.set(h, { rev: 0, count: 0 });
        data?.forEach((o) => {
            const h = new Date(o.created_at as string).getHours();
            const b = buckets.get(h)!; b.rev += o.total as number; b.count += 1;
        });
        const points: ChartPoint[] = [];
        for (const [h, v] of buckets) {
            const val = q.query === "revenue_by_hour" ? v.rev : v.count;
            if (val > 0 || h >= 7 && h <= 22) points.push({ name: `${String(h).padStart(2, "0")}:00`, value: val });
        }
        return { points, total: points.reduce((s, p) => s + p.value, 0), periodLabel: label };
    }

    if (q.query === "revenue_by_day" || q.query === "orders_by_day") {
        const { data } = await supabase.from("orders")
            .select("total, created_at").eq("business_id", businessId).eq("status", "lunas")
            .gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
        const days = Math.round((end.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1;
        const points: ChartPoint[] = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(start); d.setDate(d.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            const rows = data?.filter((o) => (o.created_at as string).startsWith(key)) || [];
            const rev = rows.reduce((s, r) => s + (r.total as number), 0);
            const val = q.query === "revenue_by_day" ? rev : rows.length;
            const short = days <= 7 ? ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`;
            points.push({ name: short, value: val });
        }
        return { points, total: points.reduce((s, p) => s + p.value, 0), periodLabel: label };
    }

    if (q.query === "revenue_by_product") {
        const { data } = await supabase.from("orders")
            .select("items").eq("business_id", businessId).eq("status", "lunas")
            .gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
        const m: Record<string, { rev: number; qty: number }> = {};
        data?.forEach((o) => parseItems(o.items).forEach((it) => {
            const key = (it.name || "").trim(); if (!key) return;
            m[key] = m[key] || { rev: 0, qty: 0 };
            m[key].rev += (it.price || 0) * (it.qty || 1);
            m[key].qty += it.qty || 1;
        }));
        const points = Object.entries(m).map(([name, v]) => ({ name, value: v.rev, extra: v.qty }))
            .sort((a, b) => b.value - a.value).slice(0, 8);
        return { points, total: points.reduce((s, p) => s + p.value, 0), periodLabel: label };
    }

    if (q.query === "revenue_by_channel") {
        const { data } = await supabase.from("orders")
            .select("total, channel").eq("business_id", businessId).eq("status", "lunas")
            .gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
        const m: Record<string, number> = {};
        data?.forEach((o) => { const c = (o.channel as string) || "lainnya"; m[c] = (m[c] || 0) + (o.total as number); });
        const points = Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        return { points, total: points.reduce((s, p) => s + p.value, 0), periodLabel: label };
    }

    if (q.query === "orders_by_status") {
        const { data } = await supabase.from("orders")
            .select("status").eq("business_id", businessId)
            .gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
        const m: Record<string, number> = {};
        data?.forEach((o) => { const s = (o.status as string) || "unknown"; m[s] = (m[s] || 0) + 1; });
        const points = Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        return { points, total: points.reduce((s, p) => s + p.value, 0), periodLabel: label };
    }

    if (q.query === "top_customers") {
        const { data } = await supabase.from("customers")
            .select("name, total_orders").eq("business_id", businessId)
            .order("total_orders", { ascending: false }).limit(8);
        const points = (data || []).map((c) => ({ name: (c.name as string) || "-", value: (c.total_orders as number) || 0 }));
        return { points, total: points.reduce((s, p) => s + p.value, 0), periodLabel: label };
    }

    return { points: [], total: 0, periodLabel: label };
}
