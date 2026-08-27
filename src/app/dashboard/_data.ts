// ─────────────────────────────────────────────────────────────────
// Dashboard data fetcher — SERVER-SIDE
// Called dari Server Component, hasilnya di-embed ke HTML awal.
// Rationale: hilangkan client-side waterfall (auth → business → 3-4 queries).
// LCP: dari ~8s (CSR waterfall) → target <2s (data udah ada di HTML).
// ─────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server";

export type DashboardData = {
    ok: boolean;
    metrics: Array<{ title: string; value: string | number; change: string; isPositive: boolean }>;
    revenueData: Array<{ name: string; total: number; isToday: boolean }>;
    breakdownData: Array<{ name: string; value: number; total: number }>;
    recentOrders: Array<{ id: string; customer_name: string; total: number; status: string; created_at: string }>;
    topProducts: Array<{ name: string; qty: number }>;
};

export async function fetchDashboardData(): Promise<DashboardData | null> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!business) return { ok: false, metrics: [], revenueData: [], breakdownData: [], recentOrders: [], topProducts: [] };

    const businessId = business.id;

    // Parallel fetches — same waterfall we had di client, tapi di server (1 network trip dari user)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const [
        { data: allRecentSales },
        { count: customersCount },
        { count: activeOrdersCount },
        { count: openComplaintsCount },
        { data: recentOrdersRaw },
    ] = await Promise.all([
        supabase.from("orders").select("total, created_at, status, items, channel")
            .eq("business_id", businessId).eq("status", "lunas")
            .gte("created_at", fourteenDaysAgo.toISOString()),
        supabase.from("customers").select("*", { count: "exact", head: true }).eq("business_id", businessId),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("business_id", businessId).eq("status", "menunggu"),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("business_id", businessId).eq("status", "baru"),
        supabase.from("orders").select("id, customer_name, total, status, created_at")
            .eq("business_id", businessId).order("created_at", { ascending: false }).limit(5),
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const recentSales = allRecentSales?.filter(s => new Date(s.created_at as string) >= sevenDaysAgo) || [];

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

    const todayRevenue = recentSales.filter(s => new Date(s.created_at as string) >= today)
        .reduce((sum, o) => sum + (o.total as number), 0);
    const yesterdayRevenue = recentSales.filter(s => {
        const d = new Date(s.created_at as string);
        return d >= yesterday && d < today;
    }).reduce((sum, o) => sum + (o.total as number), 0);

    let revenueChange = "";
    let revenuePositive = true;
    if (yesterdayRevenue === 0 && todayRevenue > 0) {
        revenueChange = "+100.0%";
    } else if (yesterdayRevenue > 0) {
        const diff = (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1);
        revenueChange = parseFloat(diff) > 0 ? `+${diff}%` : `${diff}%`;
        revenuePositive = parseFloat(diff) >= 0;
    }

    const metrics = [
        { title: "Omzet Hari Ini", value: `Rp ${todayRevenue.toLocaleString("id-ID")}`, change: revenueChange ? `${revenueChange} vs kemarin` : "", isPositive: revenuePositive },
        { title: "Pesanan Aktif", value: activeOrdersCount || 0, change: "", isPositive: true },
        { title: "Total Pelanggan", value: customersCount || 0, change: "", isPositive: true },
        { title: "Tiket Terbuka", value: openComplaintsCount || 0, change: "", isPositive: true },
    ];

    // 7-day revenue chart
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const revenueData: DashboardData["revenueData"] = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);
        const dayTotal = recentSales
            .filter(sale => {
                const saleDate = new Date(sale.created_at as string);
                return saleDate >= startOfDay && saleDate <= endOfDay;
            })
            .reduce((sum, sale) => sum + (sale.total as number), 0);
        revenueData.push({ name: days[date.getDay()], total: dayTotal, isToday: i === 0 });
    }

    // Channel breakdown
    const channelCount: Record<string, number> = {};
    let totalSales = 0;
    recentSales.forEach(sale => {
        const c = (sale.channel as string) || "Lainnya";
        channelCount[c] = (channelCount[c] || 0) + (sale.total as number);
        totalSales += sale.total as number;
    });
    const breakdownData = Object.entries(channelCount).map(([name, value]) => ({ name, value, total: totalSales }));

    // Top products (from items JSON)
    const productCount: Record<string, number> = {};
    recentSales.forEach(sale => {
        const items = sale.items as Array<{ name?: string; qty?: number }> | null;
        if (!Array.isArray(items)) return;
        items.forEach(it => {
            const name = (it.name || "").trim();
            if (!name) return;
            productCount[name] = (productCount[name] || 0) + (it.qty || 1);
        });
    });
    const topProducts = Object.entries(productCount)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

    return {
        ok: true,
        metrics,
        revenueData,
        breakdownData,
        recentOrders: (recentOrdersRaw as DashboardData["recentOrders"]) || [],
        topProducts,
    };
}
