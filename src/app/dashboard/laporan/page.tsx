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
    Area
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

export default function LaporanPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [timeRange, setTimeRange] = useState("mingguan");

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
                .select('total, created_at, status')
                .eq('business_id', business.id)
                .eq('status', 'lunas')
                .gte('created_at', startDate.toISOString());

            const processedData = [];
            const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

            for (let i = daysToFetch - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dayStr = days[date.getDay()];
                const dateKey = date.toISOString().split('T')[0];

                const dayTotal = orders
                    ?.filter(o => o.created_at.startsWith(dateKey))
                    .reduce((sum, o) => sum + o.total, 0) || 0;

                processedData.push({
                    name: timeRange === "mingguan" ? dayStr : date.getDate().toString(),
                    total: dayTotal
                });
            }
            setRevenueData(processedData);

            const { data: products } = await supabase
                .from('products')
                .select('*')
                .eq('business_id', business.id)
                .limit(5);

            setTopProducts(products?.map(p => ({
                ...p,
                total_sales: Math.floor(Math.random() * 50) + 10
            })).sort((a, b) => b.total_sales - a.total_sales) || []);

        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setIsLoading(false);
        }
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
                                <button className="w-10 h-10 flex items-center justify-center bg-white/5 text-white/40 hover:text-orange-400 border border-white/5 hover:border-orange-500/30 rounded-xl transition-all">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-[#161616]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl flex items-center gap-5 hover:border-orange-500/30 transition-all group">
                                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center p-3 border border-orange-500/20 group-hover:scale-110 transition-transform">
                                    <TrendingUp strokeWidth={2.5} className="w-full h-full" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1.5">Target Bulan Ini</p>
                                    <p className="text-xl font-black text-white/90 tracking-tight">85% <span className="text-xs text-emerald-400 ml-1">Terpenuhi</span></p>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-2.5 overflow-hidden">
                                        <div className="w-[85%] h-full bg-orange-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#161616]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl flex items-center gap-5 hover:border-white/20 transition-all group">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 text-white/90 flex items-center justify-center p-3 border border-white/10 group-hover:scale-110 transition-transform">
                                    <ShoppingBag strokeWidth={2.5} className="w-full h-full" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1.5">Rata. Keranjang</p>
                                    <p className="text-xl font-black text-white/90 tracking-tight">Rp {Math.floor(Math.random() * 50000 + 35000).toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        </div>
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
