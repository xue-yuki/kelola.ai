"use client";

import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend
} from "recharts";
import {
    Download,
    TrendingUp,
    TrendingDown,
    Calendar,
    ArrowRight,
    Loader2,
    Trophy,
    ShoppingBag,
    Star,
    Zap,
    ChevronRight,
    ArrowUpRight,
    Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

    useEffect(() => {
        fetchReportData();
    }, [timeRange]);

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

            const daysToFetch = timeRange === "mingguan" ? 7 : 30;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - (daysToFetch - 1));
            startDate.setHours(0, 0, 0, 0);

            const { data: orders } = await supabase
                .from('orders')
                .select('total, created_at, status, channel')
                .eq('business_id', business.id)
                .eq('status', 'lunas')
                .gte('created_at', startDate.toISOString());

            // Fetch previous period for comparison
            const prevStartDate = new Date(startDate);
            prevStartDate.setDate(prevStartDate.getDate() - daysToFetch);
            const prevEndDate = new Date(startDate);
            prevEndDate.setMilliseconds(prevEndDate.getMilliseconds() - 1);

            const { data: prevOrders } = await supabase
                .from('orders')
                .select('total')
                .eq('business_id', business.id)
                .eq('status', 'lunas')
                .gte('created_at', prevStartDate.toISOString())
                .lt('created_at', startDate.toISOString());

            const processedData = [];
            const orderCountProcessed = [];
            const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

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
            setChannelData(Object.entries(channelCounts).map(([key, value]) => ({
                name: channelLabels[key] || key,
                value,
                color: channelColors[key] || '#9CA3AF'
            })));

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
            setComparison({
                revenue: calcChange(totalRevenue, prevRevenue),
                orders: calcChange(totalOrders, prevOrderCount),
                avgOrder: calcChange(avgOrder, prevAvgOrder)
            });

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

        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const periodLabel = timeRange === 'mingguan' ? '7 Hari Terakhir' : '30 Hari Terakhir';

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

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white/90 tracking-tight leading-none mb-2">Insight & Laporan</h1>
                    <p className="text-white/40 text-sm font-medium">Pantau peforma bisnismu lewat analitik real-time.</p>
                </div>
                <div className="flex gap-1.5 p-1.5 bg-[#161616]/90 backdrop-blur-xl rounded-2xl border border-white/5">
                    <button
                        onClick={() => setTimeRange("mingguan")}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${timeRange === "mingguan" ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white/90'}`}
                    >
                        Mingguan
                    </button>
                    <button
                        onClick={() => setTimeRange("bulanan")}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${timeRange === "bulanan" ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white/90'}`}
                    >
                        Bulanan
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin w-12 h-12 text-orange-400" />
                    <p className="font-black text-white/30 text-[10px] uppercase tracking-[0.2em]">Menyusun Laporan...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Charts Column */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Main Revenue Chart */}
                        <div className="bg-[#161616]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl flex flex-col group hover:border-orange-500/20 transition-all duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="font-bold text-lg text-white/90 tracking-tight mb-0.5">Tren Pendapatan</h3>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Omzet Bersih</p>
                                </div>
                                <button
                                    onClick={exportPDF}
                                    title="Export PDF"
                                    className="w-10 h-10 flex items-center justify-center bg-white/5 text-white/40 hover:text-orange-400 border border-white/5 hover:border-orange-500/30 rounded-xl transition-all"
                                >
                                    <Download size={18} />
                                </button>
                            </div>

                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#FF6B2B" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#FF6B2B" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F0EEE9" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fontWeight: 700, fill: '#94A3B8' }}
                                            dy={15}
                                        />
                                        <YAxis
                                            hide
                                        />
                                        <Tooltip
                                            cursor={{ stroke: '#FF6B2B', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: '1px solid #F0EEE9',
                                                boxShadow: '0 10px 20px -5px rgba(0,0,0,0.05)',
                                                padding: '12px'
                                            }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-[#111] p-3 rounded-2xl border border-white/10 shadow-2xl">
                                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{label}</p>
                                                            <p className="text-sm font-black text-white/90">Rp {Number(payload[0].value).toLocaleString('id-ID')}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#FF6B2B"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                            activeDot={{ r: 6, fill: '#1A1A2E', strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-[#161616]/90 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 shadow-2xl flex items-center gap-4 hover:border-emerald-500/30 transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                    <TrendingUp strokeWidth={2.5} size={22} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">Total Omzet <span className="text-white/20">vs {timeRange === 'mingguan' ? 'minggu' : 'bulan'} lalu</span></p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-black text-white/90 tracking-tight">Rp {summaryStats.totalRevenue.toLocaleString('id-ID')}</p>
                                        {comparison.revenue !== 0 && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${comparison.revenue > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {comparison.revenue > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                {comparison.revenue > 0 ? '+' : ''}{comparison.revenue}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#161616]/90 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 shadow-2xl flex items-center gap-4 hover:border-blue-500/30 transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                                    <ShoppingBag strokeWidth={2.5} size={22} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">Total Pesanan <span className="text-white/20">vs {timeRange === 'mingguan' ? 'minggu' : 'bulan'} lalu</span></p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-black text-white/90 tracking-tight">{summaryStats.totalOrders} Order</p>
                                        {comparison.orders !== 0 && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${comparison.orders > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {comparison.orders > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                {comparison.orders > 0 ? '+' : ''}{comparison.orders}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#161616]/90 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 shadow-2xl flex items-center gap-4 hover:border-orange-500/30 transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
                                    <Zap strokeWidth={2.5} size={22} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">Rata. Keranjang <span className="text-white/20">vs {timeRange === 'mingguan' ? 'minggu' : 'bulan'} lalu</span></p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-black text-white/90 tracking-tight">Rp {summaryStats.avgOrder.toLocaleString('id-ID')}</p>
                                        {comparison.avgOrder !== 0 && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${comparison.avgOrder > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {comparison.avgOrder > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                {comparison.avgOrder > 0 ? '+' : ''}{comparison.avgOrder}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Count Trend (Line Chart) */}
                        <div className="bg-[#161616]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl hover:border-blue-500/20 transition-all">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-bold text-lg text-white/90 tracking-tight mb-0.5">Jumlah Pesanan</h3>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Order per Hari</p>
                                </div>
                            </div>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={orderCountData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#333" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fontWeight: 700, fill: '#94A3B8' }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-[#111] p-3 rounded-2xl border border-white/10 shadow-2xl">
                                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{label}</p>
                                                            <p className="text-sm font-black text-blue-400">{payload[0].value} Pesanan</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="orders" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Channel Distribution (Pie Chart) */}
                        {channelData.length > 0 && (
                            <div className="bg-[#161616]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl hover:border-purple-500/20 transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-bold text-lg text-white/90 tracking-tight mb-0.5">Sumber Pesanan</h3>
                                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Channel Distribution</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="h-[180px] w-[180px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={channelData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {channelData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-[#111] p-3 rounded-2xl border border-white/10 shadow-2xl">
                                                                    <p className="text-sm font-black text-white/90">{payload[0].name}: {payload[0].value}</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        {channelData.map((ch, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ch.color }} />
                                                <span className="text-sm font-medium text-white/70 flex-1">{ch.name}</span>
                                                <span className="text-sm font-bold text-white/90">{ch.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Insights Column */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Top Products Elegant Board */}
                        <div className="bg-[#161616]/90 backdrop-blur-2xl border border-white/5 p-6 sm:p-8 rounded-3xl shadow-2xl h-auto flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                                    <Trophy size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white/90 tracking-tight">Peringkat Produk</h3>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Bulan Ini</p>
                                </div>
                            </div>

                            <div className="space-y-6 flex-1">
                                {topProducts.map((p, idx) => (
                                    <div key={p.id} className="flex items-center gap-4 group cursor-pointer">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(255,107,43,0.3)]' :
                                            idx === 1 ? 'bg-white/10 text-white/90 border border-white/10' : 'bg-white/5 text-white/40 border border-white/5'
                                            }`}>
                                            #{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white/90 tracking-tight truncate mb-0.5 group-hover:text-orange-400 transition-colors">{p.name}</p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${idx === 0 ? 'bg-orange-500' : 'bg-white/30'}`}
                                                        style={{ width: `${100 - (idx * 15)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold text-white/40">{p.total_sales || 20} Terjual</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Minimal AI Insight Card */}
                        <div className="bg-orange-500/5 border border-orange-500/20 p-6 sm:p-8 rounded-3xl group backdrop-blur-xl relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles size={16} className="text-orange-400" />
                                    <h4 className="font-bold text-orange-400 text-sm">💡 Rekomendasi AI</h4>
                                </div>
                                <p className="text-sm text-white/70 leading-relaxed mb-6">
                                    <span className="font-bold text-white/90">Sabtu</span> selalu menjadi puncak penjualanmu minggu ini. Buat promo <span className="font-bold text-white/90">Bundling Hemat</span> di hari Sabtu siang untuk memaksimalkan angka konversi secara drastis!
                                </p>
                                <button className="flex items-center gap-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 w-full justify-center py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-orange-500 hover:text-white shadow-lg hover:shadow-orange-500/20">
                                    Atur Promo Sekarang <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
