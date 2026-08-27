"use client";

import { useState, useEffect, useRef } from "react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from "recharts";
import {
    Download,
    ArrowUp,
    ArrowDown,
    Loader2,
    Sparkles,
    RefreshCw,
    Calendar,
    Filter,
    ArrowRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
// jsPDF & jspdf-autotable di-lazy load pas tombol Export diklik (lihat handleExportPDF).
// Rationale: jsPDF ~450KB uncompressed, cuma dipake di 1 halaman & 1 aksi.
// Kalau di-import static, dia masuk initial bundle & kena semua route yang share layout.

export default function LaporanPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [timeRange, setTimeRange] = useState("mingguan");
    const [channelData, setChannelData] = useState<any[]>([]);
    const [orderCountData, setOrderCountData] = useState<any[]>([]);
    const [summaryStats, setSummaryStats] = useState({ totalRevenue: 0, totalOrders: 0, avgOrder: 0 });
    const [comparison, setComparison] = useState({ revenue: 0, orders: 0, avgOrder: 0 });
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);
    const [insightError, setInsightError] = useState<string | null>(null);
    const lastInsightArgs = useRef<{ summary: any; businessId: string } | null>(null);

    useEffect(() => {
        fetchReportData();
    }, [timeRange]);

    // Rekomendasi AI dari data nyata. Cache per (bisnis, periode, hari) di localStorage
    // agar tidak memanggil AI berulang kali dalam satu hari.
    const generateInsight = async (summary: any, businessId: string, force = false) => {
        lastInsightArgs.current = { summary, businessId };
        const today = new Date().toISOString().split("T")[0];
        const cacheKey = `kelola_insight_${businessId}_${timeRange}_${today}`;
        if (!force) {
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) { setAiInsight(cached); setInsightError(null); return; }
            } catch { }
        }

        setIsLoadingInsight(true);
        setAiInsight(null);
        setInsightError(null);
        try {
            const res = await fetch("/api/ai-insight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ summary }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.insight) {
                setAiInsight(data.insight);
                try { localStorage.setItem(cacheKey, data.insight); } catch { }
            } else {
                setInsightError(data.error || `Gagal memuat (HTTP ${res.status})`);
            }
        } catch (e: any) {
            setInsightError(e?.message || "Gagal terhubung ke server");
        } finally {
            setIsLoadingInsight(false);
        }
    };

    const fetchReportData = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: business } = await supabase
                .from('businesses')
                .select('id')
                .eq('user_id', session.user.id)
                .single();

            if (!business) return;

            const now = new Date();
            let startDate: Date;
            let daysToFetch: number;

            if (timeRange === "tahun_ini") {
                startDate = new Date(now.getFullYear(), 0, 1);
                startDate.setHours(0, 0, 0, 0);
                daysToFetch = 0; // not used for yearly
            } else {
                daysToFetch = timeRange === "mingguan" ? 7 : 30;
                startDate = new Date();
                startDate.setDate(startDate.getDate() - (daysToFetch - 1));
                startDate.setHours(0, 0, 0, 0);
            }

            const { data: orders } = await supabase
                .from('orders')
                .select('total, created_at, status, channel')
                .eq('business_id', business.id)
                .eq('status', 'lunas')
                .gte('created_at', startDate.toISOString());


            // Comparison period
            let prevStartDate: Date;
            let prevEndDate: Date;
            if (timeRange === "tahun_ini") {
                // Same Jan–today period last year
                prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
                prevStartDate.setHours(0, 0, 0, 0);
                prevEndDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                prevEndDate.setHours(23, 59, 59, 999);
            } else {
                prevStartDate = new Date(startDate);
                prevStartDate.setDate(prevStartDate.getDate() - daysToFetch);
                prevEndDate = new Date(startDate);
                prevEndDate.setMilliseconds(prevEndDate.getMilliseconds() - 1);
            }

            const { data: prevOrders } = await supabase
                .from('orders')
                .select('total')
                .eq('business_id', business.id)
                .eq('status', 'lunas')
                .gte('created_at', prevStartDate.toISOString())
                .lte('created_at', prevEndDate.toISOString());

            const processedData = [];
            const orderCountProcessed = [];
            const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

            if (timeRange === "tahun_ini") {
                for (let m = 0; m <= now.getMonth(); m++) {
                    const monthOrders = orders?.filter(o => {
                        const d = new Date(o.created_at);
                        return d.getFullYear() === now.getFullYear() && d.getMonth() === m;
                    }) || [];
                    processedData.push({ name: monthNames[m], total: monthOrders.reduce((s, o) => s + o.total, 0) });
                    orderCountProcessed.push({ name: monthNames[m], orders: monthOrders.length });
                }
            } else {
                for (let i = daysToFetch - 1; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dayStr = days[date.getDay()];
                    const dateKey = date.toISOString().split('T')[0];

                    const dayOrders = orders?.filter(o => o.created_at.startsWith(dateKey)) || [];
                    const dayTotal = dayOrders.reduce((sum, o) => sum + o.total, 0);
                    const dayCount = dayOrders.length;

                    processedData.push({
                        name: timeRange === "mingguan" ? dayStr : date.getDate().toString(),
                        total: dayTotal
                    });
                    orderCountProcessed.push({
                        name: timeRange === "mingguan" ? dayStr : date.getDate().toString(),
                        orders: dayCount
                    });
                }
            }
            setRevenueData(processedData);
            setOrderCountData(orderCountProcessed);

            // Channel distribution (Pie Chart)
            const channelCounts: Record<string, number> = {};
            orders?.forEach(o => {
                const ch = o.channel || 'unknown';
                channelCounts[ch] = (channelCounts[ch] || 0) + 1;
            });
            const channelColors: Record<string, string> = {
                whatsapp: '#25D366',
                offline: '#6B7280',
                telegram: '#0088cc',
                unknown: '#9CA3AF'
            };
            const channelLabels: Record<string, string> = {
                whatsapp: 'WhatsApp',
                offline: 'Offline/Kasir',
                telegram: 'Telegram',
                unknown: 'Lainnya'
            };
            const channelArr = Object.entries(channelCounts).map(([key, value]) => ({
                name: channelLabels[key] || key,
                value,
                color: channelColors[key] || '#9CA3AF'
            }));
            setChannelData(channelArr);

            // Summary stats
            const totalRevenue = orders?.reduce((sum, o) => sum + o.total, 0) || 0;
            const totalOrders = orders?.length || 0;
            const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
            setSummaryStats({ totalRevenue, totalOrders, avgOrder });

            // Previous period stats for comparison
            const prevRevenue = prevOrders?.reduce((sum, o) => sum + o.total, 0) || 0;
            const prevOrderCount = prevOrders?.length || 0;
            const prevAvgOrder = prevOrderCount > 0 ? Math.round(prevRevenue / prevOrderCount) : 0;

            // Calculate percentage changes
            const calcChange = (current: number, prev: number) => {
                if (prev === 0) return current > 0 ? 100 : 0;
                return Math.round(((current - prev) / prev) * 100);
            };
            const comparisonObj = {
                revenue: calcChange(totalRevenue, prevRevenue),
                orders: calcChange(totalOrders, prevOrderCount),
                avgOrder: calcChange(avgOrder, prevAvgOrder)
            };
            setComparison(comparisonObj);

            // Get all completed orders to calculate real sales
            const { data: allOrders } = await supabase
                .from('orders')
                .select('items')
                .eq('business_id', business.id)
                .eq('status', 'lunas');

            // Count sales per product from order items
            const salesCount: Record<string, number> = {};
            allOrders?.forEach(order => {
                let items = order.items;
                if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch { items = []; }
                }
                if (Array.isArray(items)) {
                    items.forEach((item: any) => {
                        const name = item.name?.toLowerCase() || '';
                        salesCount[name] = (salesCount[name] || 0) + (item.qty || 1);
                    });
                }
            });

            const { data: products } = await supabase
                .from('products')
                .select('*')
                .eq('business_id', business.id);

            // Map products with real sales data
            const productsWithSales = products?.map(p => ({
                ...p,
                total_sales: salesCount[p.name?.toLowerCase()] || 0
            })).sort((a, b) => b.total_sales - a.total_sales).slice(0, 5) || [];

            setTopProducts(productsWithSales);

            // Generate rekomendasi AI dari data nyata di atas
            const periodLabel = timeRange === 'mingguan' ? '7 hari terakhir' : timeRange === 'tahun_ini' ? 'tahun ini' : '30 hari terakhir';
            generateInsight({
                period: periodLabel,
                totalRevenue,
                totalOrders,
                avgOrder,
                comparisonRevenue: comparisonObj.revenue,
                comparisonOrders: comparisonObj.orders,
                revenueByDay: processedData,
                orderByDay: orderCountProcessed,
                topProducts: productsWithSales.map((p: any) => ({ name: p.name, sales: p.total_sales })),
                channels: channelArr.map(c => ({ name: c.name, value: c.value })),
            }, business.id);

        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const exportPDF = async () => {
        // Lazy load jsPDF + autotable — dimuat cuma pas tombol export diklik
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
            import("jspdf"),
            import("jspdf-autotable"),
        ]);
        const doc = new jsPDF();
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const periodLabel = timeRange === 'mingguan' ? '7 Hari Terakhir' : timeRange === 'tahun_ini' ? `Tahun ${now.getFullYear()}` : '30 Hari Terakhir';

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Laporan Bisnis', 14, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`Periode: ${periodLabel} | Dibuat: ${dateStr}`, 14, 28);

        // Summary Stats
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text('Ringkasan', 14, 42);

        autoTable(doc, {
            startY: 46,
            head: [['Metrik', 'Nilai', 'vs Periode Lalu']],
            body: [
                ['Total Omzet', `Rp ${summaryStats.totalRevenue.toLocaleString('id-ID')}`, `${comparison.revenue >= 0 ? '+' : ''}${comparison.revenue}%`],
                ['Total Pesanan', `${summaryStats.totalOrders} Order`, `${comparison.orders >= 0 ? '+' : ''}${comparison.orders}%`],
                ['Rata-rata Keranjang', `Rp ${summaryStats.avgOrder.toLocaleString('id-ID')}`, `${comparison.avgOrder >= 0 ? '+' : ''}${comparison.avgOrder}%`],
            ],
            theme: 'striped',
            headStyles: { fillColor: [255, 107, 43] },
        });

        // Revenue per Day
        const lastY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Pendapatan Harian', 14, lastY);

        autoTable(doc, {
            startY: lastY + 4,
            head: [['Hari', 'Pendapatan', 'Jumlah Order']],
            body: revenueData.map((r, i) => [
                r.name,
                `Rp ${r.total.toLocaleString('id-ID')}`,
                orderCountData[i]?.orders || 0
            ]),
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
        });

        // Top Products
        const lastY2 = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Produk Terlaris', 14, lastY2);

        autoTable(doc, {
            startY: lastY2 + 4,
            head: [['#', 'Nama Produk', 'Terjual']],
            body: topProducts.map((p, i) => [
                i + 1,
                p.name,
                `${p.total_sales} unit`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [245, 158, 11] },
        });

        // Channel Distribution
        if (channelData.length > 0) {
            const lastY3 = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Sumber Pesanan', 14, lastY3);

            autoTable(doc, {
                startY: lastY3 + 4,
                head: [['Channel', 'Jumlah Order']],
                body: channelData.map(c => [c.name, c.value]),
                theme: 'striped',
                headStyles: { fillColor: [139, 92, 246] },
            });
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Dibuat dengan Kelola.ai', 14, doc.internal.pageSize.height - 10);
            doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width - 35, doc.internal.pageSize.height - 10);
        }

        doc.save(`laporan-${timeRange}-${now.toISOString().split('T')[0]}.pdf`);
    };

    // ─── Helper untuk formatting angka ala Stripe/Vercel ────────────────
    const formatRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
    const periodLabel = timeRange === 'mingguan' ? '7 hari terakhir' : timeRange === 'tahun_ini' ? `Tahun ${new Date().getFullYear()}` : '30 hari terakhir';
    const prevLabel = timeRange === 'mingguan' ? 'vs minggu lalu' : timeRange === 'tahun_ini' ? 'vs tahun lalu' : 'vs periode lalu';

    return (
        <div className="min-h-screen bg-white dark:bg-[#090909] text-zinc-900 dark:text-[#F5F5F5]">
            <div className="max-w-[1400px] mx-auto px-6 md:px-8 pt-4 md:pt-5 pb-10 space-y-5">
                {/* ── Page Header ────────────────────────────────────────── */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-[#F5F5F5] tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                            Laporan
                        </h1>
                        <p className="text-[13px] text-zinc-500 dark:text-[#A1A1A1] mt-0.5">
                            Ringkasan performa bisnis Anda
                        </p>
                    </div>
                    <button
                        onClick={exportPDF}
                        className="hidden md:inline-flex items-center gap-2 h-8 px-3 rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] hover:bg-zinc-50 dark:hover:bg-[#151515] text-zinc-700 dark:text-[#F5F5F5] text-[13px] font-medium transition-colors"
                    >
                        <Download size={14} strokeWidth={2} />
                        Export PDF
                    </button>
                </div>

                {/* ── Analytics Toolbar: Date Range + Filter ─────────────── */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-[#1A1A1A]">
                    <div className="inline-flex rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] p-0.5">
                        {[
                            { key: 'mingguan', label: '7 hari' },
                            { key: 'bulanan', label: '30 hari' },
                            { key: 'tahun_ini', label: 'Tahun ini' },
                        ].map((r) => (
                            <button
                                key={r.key}
                                onClick={() => setTimeRange(r.key)}
                                className={`h-7 px-3 rounded text-[12px] font-medium transition-colors ${timeRange === r.key
                                    ? 'bg-zinc-100 dark:bg-[#151515] text-zinc-900 dark:text-[#F5F5F5]'
                                    : 'text-zinc-500 dark:text-[#A1A1A1] hover:text-zinc-900 dark:hover:text-[#F5F5F5]'
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] text-[12px] text-zinc-500 dark:text-[#A1A1A1]">
                            <Calendar size={12} />
                            {periodLabel}
                        </span>
                        <button className="hidden sm:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] hover:bg-zinc-50 dark:hover:bg-[#151515] text-[12px] text-zinc-700 dark:text-[#F5F5F5] font-medium">
                            <Filter size={12} />
                            Filter
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <LaporanSkeleton />
                ) : (
                    <>
                        {/* ── KPI Grid ─────────────────────────────────── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <KpiCard
                                label="Total Omzet"
                                value={formatRp(summaryStats.totalRevenue)}
                                delta={comparison.revenue}
                                deltaLabel={prevLabel}
                                data={revenueData.map((r) => ({ v: r.total }))}
                            />
                            <KpiCard
                                label="Total Pesanan"
                                value={`${summaryStats.totalOrders}`}
                                delta={comparison.orders}
                                deltaLabel={prevLabel}
                                data={orderCountData.map((r) => ({ v: r.orders }))}
                            />
                            <KpiCard
                                label="Rata-rata Keranjang"
                                value={formatRp(summaryStats.avgOrder)}
                                delta={comparison.avgOrder}
                                deltaLabel={prevLabel}
                            />
                            <KpiCard
                                label="Total Pelanggan Aktif"
                                value={`${channelData.reduce((s, c) => s + c.value, 0)}`}
                                delta={0}
                                deltaLabel="berdasarkan order"
                                hideBadge
                            />
                        </div>

                        {/* ── Main Grid: Revenue Chart + Current Performance ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                            <RevenueChartCard data={revenueData} />
                            <CurrentPerformanceCard
                                stats={summaryStats}
                                comparison={comparison}
                                revenueData={revenueData}
                                orderCountData={orderCountData}
                                channelData={channelData}
                            />
                        </div>

                        {/* ── Secondary Grid: Top Produk (table) + Channel (donut) ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                            <TopProductsCard products={topProducts} totalRevenue={summaryStats.totalRevenue} />
                            <ChannelDistributionCard data={channelData} />
                        </div>

                        {/* ── AI Insight (full width bottom card) ─────── */}
                        <AiInsightCard
                            insight={aiInsight}
                            loading={isLoadingInsight}
                            error={insightError}
                            onRetry={() => lastInsightArgs.current && generateInsight(lastInsightArgs.current.summary, lastInsightArgs.current.businessId, true)}
                            hasData={summaryStats.totalOrders > 0}
                        />
                    </>
                )}
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS — semua styled ala Stripe/Vercel dark
// ═══════════════════════════════════════════════════════════════════════

function KpiCard({
    label,
    value,
    delta,
    deltaLabel,
    data,
    hideBadge = false
}: {
    label: string;
    value: string;
    delta: number;
    deltaLabel: string;
    data?: { v: number }[];
    hideBadge?: boolean;
}) {
    const isUp = delta > 0;
    const isDown = delta < 0;
    return (
        <div className="group relative rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] hover:border-zinc-300 dark:hover:border-[#333] hover:bg-zinc-50/50 dark:hover:bg-[#111] transition-colors p-4">
            <div className="text-[12px] text-zinc-500 dark:text-[#A1A1A1] font-normal mb-2">{label}</div>
            <div className="flex items-end justify-between gap-3">
                <div
                    className="text-[26px] font-medium text-zinc-900 dark:text-[#F5F5F5] leading-none"
                    style={{ letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
                >
                    {value}
                </div>
                {data && data.length > 1 && (
                    <div className="w-16 h-6 opacity-60 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <Line
                                    type="monotone"
                                    dataKey="v"
                                    stroke="#FF8A00"
                                    strokeWidth={1.25}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
            {!hideBadge && (
                <div className="flex items-center gap-1.5 mt-3">
                    <span
                        className={`inline-flex items-center gap-0.5 text-[12px] font-medium ${isUp
                            ? 'text-emerald-600 dark:text-[#4ADE80]'
                            : isDown
                                ? 'text-rose-600 dark:text-[#F87171]'
                                : 'text-zinc-500 dark:text-[#666]'
                            }`}
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                        {isUp && <ArrowUp size={11} strokeWidth={2.5} />}
                        {isDown && <ArrowDown size={11} strokeWidth={2.5} />}
                        {delta > 0 ? '+' : ''}{delta}%
                    </span>
                    <span className="text-[12px] text-zinc-400 dark:text-[#666]">{deltaLabel}</span>
                </div>
            )}
            {hideBadge && (
                <div className="text-[12px] text-zinc-400 dark:text-[#666] mt-3">{deltaLabel}</div>
            )}
        </div>
    );
}

function LaporanSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-[104px] rounded-md border border-zinc-200 dark:border-[#242424] bg-zinc-50 dark:bg-[#151515]" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-8 h-[340px] rounded-md border border-zinc-200 dark:border-[#242424] bg-zinc-50 dark:bg-[#151515]" />
                <div className="lg:col-span-4 h-[340px] rounded-md border border-zinc-200 dark:border-[#242424] bg-zinc-50 dark:bg-[#151515]" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-7 h-[300px] rounded-md border border-zinc-200 dark:border-[#242424] bg-zinc-50 dark:bg-[#151515]" />
                <div className="lg:col-span-5 h-[300px] rounded-md border border-zinc-200 dark:border-[#242424] bg-zinc-50 dark:bg-[#151515]" />
            </div>
        </div>
    );
}

function RevenueChartCard({ data }: { data: any[] }) {
    const hasData = data.some((d) => d.total > 0);
    return (
        <div className="lg:col-span-8 rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[14px] font-medium text-zinc-900 dark:text-[#F5F5F5]">Revenue Over Time</h3>
                    <p className="text-[12px] text-zinc-500 dark:text-[#A1A1A1] mt-0.5">Pendapatan per periode</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-[#A1A1A1]">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-0.5 bg-[#FF8A00]" /> Periode ini
                    </span>
                </div>
            </div>
            <div className="h-[280px] w-full">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid, #1D1D1D)" strokeOpacity={0.5} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#A1A1A1' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#666' }}
                                tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}Jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v}
                                width={50}
                            />
                            <Tooltip
                                cursor={{ stroke: '#FF8A00', strokeWidth: 1, strokeDasharray: '3 3' }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] px-3 py-2 shadow-sm">
                                                <p className="text-[11px] text-zinc-500 dark:text-[#A1A1A1] mb-0.5">{label}</p>
                                                <p className="text-[13px] font-medium text-zinc-900 dark:text-[#F5F5F5]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                    Rp {Number(payload[0].value).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke="#FF8A00"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: '#FF8A00', strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyChart />
                )}
            </div>
        </div>
    );
}

function EmptyChart() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-[13px] text-zinc-500 dark:text-[#A1A1A1] font-medium">Belum ada data</p>
            <p className="text-[12px] text-zinc-400 dark:text-[#666] mt-1">Data akan muncul setelah ada transaksi</p>
        </div>
    );
}

function CurrentPerformanceCard({
    stats,
    comparison,
    revenueData,
    orderCountData,
    channelData
}: {
    stats: { totalRevenue: number; totalOrders: number; avgOrder: number };
    comparison: { revenue: number; orders: number; avgOrder: number };
    revenueData: any[];
    orderCountData: any[];
    channelData: any[];
}) {
    const totalChannels = channelData.length;
    const rows = [
        { label: 'Omzet Periode', value: `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`, delta: comparison.revenue, spark: revenueData.map(r => ({ v: r.total })) },
        { label: 'Jumlah Pesanan', value: `${stats.totalOrders}`, delta: comparison.orders, spark: orderCountData.map(r => ({ v: r.orders })) },
        { label: 'Rata-rata Order', value: `Rp ${stats.avgOrder.toLocaleString('id-ID')}`, delta: comparison.avgOrder, spark: [] },
        { label: 'Kanal Aktif', value: `${totalChannels}`, delta: 0, spark: [] },
    ];
    return (
        <div className="lg:col-span-4 rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] p-5">
            <div className="mb-4">
                <h3 className="text-[14px] font-medium text-zinc-900 dark:text-[#F5F5F5]">Current Performance</h3>
                <p className="text-[12px] text-zinc-500 dark:text-[#A1A1A1] mt-0.5">Ringkasan periode ini</p>
            </div>
            <div className="space-y-0 divide-y divide-zinc-100 dark:divide-[#1A1A1A]">
                {rows.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5">
                        <span className="text-[13px] text-zinc-500 dark:text-[#A1A1A1]">{r.label}</span>
                        <div className="flex items-center gap-2.5">
                            {r.spark.length > 1 && (
                                <div className="w-14 h-4 opacity-60">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={r.spark}>
                                            <Line type="monotone" dataKey="v" stroke="#FF8A00" strokeWidth={1} dot={false} isAnimationActive={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            <span
                                className="text-[13px] font-medium text-zinc-900 dark:text-[#F5F5F5]"
                                style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                                {r.value}
                            </span>
                            {r.delta !== 0 && (
                                <span
                                    className={`inline-flex items-center gap-0.5 text-[11px] font-medium min-w-[46px] justify-end ${r.delta > 0 ? 'text-emerald-600 dark:text-[#4ADE80]' : 'text-rose-600 dark:text-[#F87171]'}`}
                                    style={{ fontVariantNumeric: 'tabular-nums' }}
                                >
                                    {r.delta > 0 ? <ArrowUp size={10} strokeWidth={2.5} /> : <ArrowDown size={10} strokeWidth={2.5} />}
                                    {r.delta > 0 ? '+' : ''}{r.delta}%
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TopProductsCard({ products, totalRevenue }: { products: any[]; totalRevenue: number }) {
    const maxSales = Math.max(...products.map((p) => p.total_sales || 0), 1);
    return (
        <div className="lg:col-span-7 rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-[#1A1A1A]">
                <div>
                    <h3 className="text-[14px] font-medium text-zinc-900 dark:text-[#F5F5F5]">Top Produk</h3>
                    <p className="text-[12px] text-zinc-500 dark:text-[#A1A1A1] mt-0.5">Ranking berdasarkan unit terjual</p>
                </div>
            </div>
            {products.length === 0 ? (
                <div className="py-16 text-center">
                    <p className="text-[13px] text-zinc-500 dark:text-[#A1A1A1] font-medium">Belum ada produk terjual</p>
                    <p className="text-[12px] text-zinc-400 dark:text-[#666] mt-1">Data muncul setelah ada order lunas</p>
                </div>
            ) : (
                <div className="overflow-hidden">
                    <table className="w-full" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        <thead>
                            <tr className="border-b border-zinc-100 dark:border-[#1A1A1A]">
                                <th className="text-[11px] font-medium text-zinc-400 dark:text-[#666] uppercase tracking-wider text-left px-5 py-2.5 w-8">#</th>
                                <th className="text-[11px] font-medium text-zinc-400 dark:text-[#666] uppercase tracking-wider text-left px-2 py-2.5">Produk</th>
                                <th className="text-[11px] font-medium text-zinc-400 dark:text-[#666] uppercase tracking-wider text-right px-2 py-2.5">Terjual</th>
                                <th className="text-[11px] font-medium text-zinc-400 dark:text-[#666] uppercase tracking-wider text-right px-5 py-2.5 w-24">Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p, idx) => {
                                const share = maxSales > 0 ? Math.round(((p.total_sales || 0) / maxSales) * 100) : 0;
                                return (
                                    <tr key={p.id} className="border-b border-zinc-100 dark:border-[#1A1A1A] last:border-0 hover:bg-zinc-50 dark:hover:bg-[#111] transition-colors">
                                        <td className="px-5 py-3 text-[13px] text-zinc-400 dark:text-[#666]">{idx + 1}</td>
                                        <td className="px-2 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1 h-4 rounded-sm ${idx === 0 ? 'bg-[#FF8A00]' : 'bg-zinc-200 dark:bg-[#333]'}`} />
                                                <span className="text-[13px] font-medium text-zinc-900 dark:text-[#F5F5F5]">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-3 text-[13px] text-zinc-700 dark:text-[#F5F5F5] text-right">
                                            {p.total_sales || 0}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2 justify-end">
                                                <div className="w-16 h-1 bg-zinc-100 dark:bg-[#1A1A1A] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${idx === 0 ? 'bg-[#FF8A00]' : 'bg-zinc-400 dark:bg-[#555]'}`}
                                                        style={{ width: `${share}%` }}
                                                    />
                                                </div>
                                                <span className="text-[11px] text-zinc-500 dark:text-[#A1A1A1] w-8 text-right">{share}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function ChannelDistributionCard({ data }: { data: any[] }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    // Force palette: orange for primary, grey shades for others (per spec: no rainbow)
    const palette = ['#FF8A00', '#666666', '#A1A1A1', '#444444'];
    const withColor = data.map((d, i) => ({ ...d, color: palette[i % palette.length] }));
    return (
        <div className="lg:col-span-5 rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] p-5">
            <div className="mb-4">
                <h3 className="text-[14px] font-medium text-zinc-900 dark:text-[#F5F5F5]">Kanal Penjualan</h3>
                <p className="text-[12px] text-zinc-500 dark:text-[#A1A1A1] mt-0.5">Distribusi order per channel</p>
            </div>
            {total === 0 ? (
                <div className="py-16 text-center">
                    <p className="text-[13px] text-zinc-500 dark:text-[#A1A1A1] font-medium">Belum ada order</p>
                    <p className="text-[12px] text-zinc-400 dark:text-[#666] mt-1">Data channel akan muncul di sini</p>
                </div>
            ) : (
                <div className="flex items-center gap-5">
                    <div className="relative w-[140px] h-[140px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={withColor} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">
                                    {withColor.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const p: any = payload[0];
                                            return (
                                                <div className="rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] px-2.5 py-1.5 shadow-sm">
                                                    <p className="text-[12px] font-medium text-zinc-900 dark:text-[#F5F5F5]">{p.name}: {p.value}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div
                                className="text-[18px] font-medium text-zinc-900 dark:text-[#F5F5F5] leading-none"
                                style={{ letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
                            >
                                {total}
                            </div>
                            <div className="text-[10px] text-zinc-500 dark:text-[#A1A1A1] uppercase tracking-wider mt-1">Order</div>
                        </div>
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                        {withColor.map((ch, idx) => {
                            const pct = Math.round((ch.value / total) * 100);
                            return (
                                <div key={idx} className="flex items-center gap-2.5 py-1">
                                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: ch.color }} />
                                    <span className="text-[13px] text-zinc-700 dark:text-[#F5F5F5] flex-1 truncate">{ch.name}</span>
                                    <span className="text-[12px] text-zinc-500 dark:text-[#A1A1A1] tabular-nums">{ch.value}</span>
                                    <span className="text-[11px] text-zinc-400 dark:text-[#666] tabular-nums w-9 text-right">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function AiInsightCard({
    insight,
    loading,
    error,
    onRetry,
    hasData
}: {
    insight: string | null;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    hasData: boolean;
}) {
    return (
        <div className="rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] p-5">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#FF8A00]" strokeWidth={2} />
                    <h3 className="text-[14px] font-medium text-zinc-900 dark:text-[#F5F5F5]">Rekomendasi AI</h3>
                </div>
                {(insight || error) && !loading && (
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-zinc-200 dark:border-[#242424] hover:bg-zinc-50 dark:hover:bg-[#151515] text-[12px] text-zinc-600 dark:text-[#A1A1A1] font-medium transition-colors"
                    >
                        <RefreshCw size={11} />
                        Refresh
                    </button>
                )}
            </div>
            {loading ? (
                <div className="flex items-center gap-2 text-zinc-500 dark:text-[#A1A1A1] py-2">
                    <Loader2 size={13} className="animate-spin" />
                    <span className="text-[13px]">Menganalisa data bisnis…</span>
                </div>
            ) : insight ? (
                <>
                    <p className="text-[13px] leading-relaxed text-zinc-700 dark:text-[#F5F5F5]/90 whitespace-pre-wrap">{insight}</p>
                    <Link
                        href="/dashboard/wa-marketing"
                        className="inline-flex items-center gap-1.5 mt-4 text-[12px] font-medium text-[#FF8A00] hover:text-[#FF9D2E] transition-colors"
                    >
                        Buat promo broadcast <ArrowRight size={12} />
                    </Link>
                </>
            ) : error ? (
                <div>
                    <p className="text-[13px] text-rose-600 dark:text-[#F87171] mb-2">Gagal memuat: {error}</p>
                    <button onClick={onRetry} className="text-[12px] font-medium text-[#FF8A00] hover:text-[#FF9D2E]">Coba lagi</button>
                </div>
            ) : hasData ? (
                <p className="text-[13px] text-zinc-500 dark:text-[#A1A1A1]">Rekomendasi belum tersedia. Coba muat ulang halaman.</p>
            ) : (
                <p className="text-[13px] text-zinc-500 dark:text-[#A1A1A1]">Rekomendasi AI akan muncul begitu ada data transaksi.</p>
            )}
        </div>
    );
}
