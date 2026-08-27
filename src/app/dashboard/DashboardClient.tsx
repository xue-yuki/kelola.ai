"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search,
    Bell,
    ArrowUpRight,
    ArrowDownRight,
    MessageCircle,
    PackagePlus,
    FileText,
    MoreHorizontal,
    ShoppingBag,
    Users,
    AlertCircle,
    Package,
    ArrowRight
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from "recharts";

import { createClient } from "@/lib/supabase/client";
import type { DashboardData } from "./_data";

const QUICK_ACTIONS = [
    { title: "Broadcast WA", icon: MessageCircle, href: "/dashboard/wa-marketing" },
    { title: "Tambah Produk", icon: PackagePlus, href: "/dashboard/produk" },
    { title: "Buat Laporan", icon: FileText, href: "/dashboard/laporan" },
];

export default function DashboardClient({ initialData }: { initialData: DashboardData }) {
    const supabase = createClient();
    // ── Data diambil server-side & di-hydrate lewat props → NO client waterfall di initial load
    const [metrics, setMetrics] = useState<DashboardData["metrics"]>(initialData.metrics);
    const [revenueData, setRevenueData] = useState<DashboardData["revenueData"]>(initialData.revenueData);
    const [breakdownData, setBreakdownData] = useState<DashboardData["breakdownData"]>(initialData.breakdownData);
    const [recentOrders, setRecentOrders] = useState<DashboardData["recentOrders"]>(initialData.recentOrders);
    const [topProducts, setTopProducts] = useState<DashboardData["topProducts"]>(initialData.topProducts);

    useEffect(() => {
        // Realtime updates — subscribe channel, refetch via API kalau ada perubahan
        const ordersSubscription = supabase
            .channel("orders_channel")
            .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
                // Re-fetch dari server route (kita bisa expose /api/dashboard/refresh nanti)
                // Untuk sekarang, panggil fetch original — ini terjadi di background, ga blocking LCP.
                refetchClient();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ordersSubscription);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refetchClient = async () => {
        // Client refetch fallback buat realtime (server ga bisa push RSC ke client on demand)
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { data: business } = await supabase.from("businesses").select("id").eq("user_id", session.user.id).single();
            if (!business) return;
            const businessId = business.id;

            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
            fourteenDaysAgo.setHours(0, 0, 0, 0);

            const { data: allRecentSales } = await supabase.from("orders")
                .select("total, created_at, status, items, channel")
                .eq("business_id", businessId).eq("status", "lunas")
                .gte("created_at", fourteenDaysAgo.toISOString());

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            sevenDaysAgo.setHours(0, 0, 0, 0);
            const recentSales = allRecentSales?.filter(s => new Date(s.created_at) >= sevenDaysAgo) || [];

            const today = new Date(); today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
            const todayRevenue = recentSales.filter(s => new Date(s.created_at) >= today).reduce((sum, o) => sum + o.total, 0);
            const yesterdayRevenue = recentSales.filter(s => { const d = new Date(s.created_at); return d >= yesterday && d < today; }).reduce((sum, o) => sum + o.total, 0);
            let revenueChange = "";
            let revenuePositive = true;
            if (yesterdayRevenue === 0 && todayRevenue > 0) revenueChange = "+100.0%";
            else if (yesterdayRevenue > 0) {
                const diff = (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1);
                revenueChange = parseFloat(diff) > 0 ? `+${diff}%` : `${diff}%`;
                revenuePositive = parseFloat(diff) >= 0;
            }

            const [{ count: customersCount }, { count: activeOrdersCount }, { count: openComplaintsCount }] = await Promise.all([
                supabase.from("customers").select("*", { count: "exact", head: true }).eq("business_id", businessId),
                supabase.from("orders").select("*", { count: "exact", head: true }).eq("business_id", businessId).eq("status", "menunggu"),
                supabase.from("complaints").select("*", { count: "exact", head: true }).eq("business_id", businessId).eq("status", "baru"),
            ]);

            setMetrics([
                { title: "Omzet Hari Ini", value: `Rp ${todayRevenue.toLocaleString("id-ID")}`, change: revenueChange ? `${revenueChange} vs kemarin` : "", isPositive: revenuePositive },
                { title: "Pesanan Aktif", value: activeOrdersCount || 0, change: "", isPositive: true },
                { title: "Total Pelanggan", value: customersCount || 0, change: "", isPositive: true },
                { title: "Tiket Terbuka", value: openComplaintsCount || 0, change: "", isPositive: true },
            ]);

            const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
            const last7DaysData: DashboardData["revenueData"] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(); date.setDate(date.getDate() - i);
                const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);
                const dayTotal = recentSales.filter(s => { const d = new Date(s.created_at); return d >= startOfDay && d <= endOfDay; }).reduce((sum, s) => sum + s.total, 0);
                last7DaysData.push({ name: days[date.getDay()], total: dayTotal, isToday: i === 0 });
            }
            setRevenueData(last7DaysData);

            const channelCount: Record<string, number> = {};
            let totalSales = 0;
            recentSales.forEach(sale => {
                const c = sale.channel || "Lainnya";
                channelCount[c] = (channelCount[c] || 0) + sale.total;
                totalSales += sale.total;
            });
            let bData = Object.entries(channelCount).map(([name, value]) => ({ name, value, total: totalSales }));
            if (bData.length === 0) bData = [{ name: "Belum ada data", value: 1, total: 1 }];
            setBreakdownData(bData);

            const { data: orders } = await supabase.from("orders").select("*").eq("business_id", businessId).order("created_at", { ascending: false }).limit(5);
            setRecentOrders(orders || []);
        } catch (e) { console.error(e); }
    };


    const COLORS = ['#ea580c', '#3f3f46', '#52525b', '#71717a', '#a1a1aa'];

    return (
        <div className="-m-8 bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 min-h-[calc(100vh-73px)] font-sans border-l-0">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-zinc-200 dark:border-zinc-800">
                {metrics && metrics.map((metric: any, i: number) => (
                    <div key={i} className="p-6 border-b border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-32 hover:bg-zinc-50 dark:hover:bg-[#111] transition-colors">
                        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">{metric.title}</p>
                        <p className="text-3xl font-mono tracking-tight font-light">{metric.value}</p>
                        <div className="mt-2 h-4">
                            {metric.change && (
                                <p className={`text-xs font-medium font-mono ${metric.isPositive ? 'text-zinc-500 dark:text-zinc-400' : 'text-rose-500'}`}>
                                    {metric.change}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 border-zinc-200 dark:border-zinc-800 mt-6 lg:mt-0">
                
                {/* Bar Chart */}
                <div className="lg:col-span-2 border-r border-b border-zinc-200 dark:border-zinc-800 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-base font-semibold">Pendapatan</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1">
                                7 Hari Terakhir
                            </span>
                        </div>
                    </div>
                    
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid vertical={false} stroke="var(--color-border, #27272a)" strokeOpacity={0.3} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'monospace' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'monospace' }} tickFormatter={(val) => `Rp${val/1000}k`} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 p-3 shadow-xl rounded-md">
                                                    <p className="text-xs text-zinc-500 mb-1">{label}</p>
                                                    <p className="text-base font-mono">Rp {Number(payload[0].value).toLocaleString('id-ID')}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="total" radius={[2, 2, 0, 0]} maxBarSize={40} background={{ fill: 'rgba(255,255,255,0.03)' }}>
                                    {revenueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.isToday ? '#ea580c' : 'transparent'} stroke={entry.isToday ? '#ea580c' : '#27272a'} strokeWidth={1} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4">
                        <Link href="/dashboard/laporan" className="text-sm text-orange-500 hover:text-orange-400 font-medium flex items-center gap-1 group w-max">
                            Lihat analitik <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="border-r border-b border-zinc-200 dark:border-zinc-800 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-base font-semibold">Rincian Pendapatan</h2>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="h-[180px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={breakdownData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {breakdownData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.name === 'Belum ada data' ? '#27272a' : COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length && payload[0].name !== 'Belum ada data') {
                                                return (
                                                    <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 p-3 shadow-xl rounded-md">
                                                        <p className="text-xs text-zinc-500 mb-1">{payload[0].name}</p>
                                                        <p className="text-sm font-mono">Rp {Number(payload[0].value).toLocaleString('id-ID')}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <p className="text-sm font-mono tracking-tighter">
                                    {breakdownData[0]?.name === 'Belum ada data' ? 'Rp 0' : `Rp ${(breakdownData[0]?.total || 0).toLocaleString('id-ID')}`}
                                </p>
                                <p className="text-xs text-zinc-500">Total</p>
                            </div>
                        </div>
                        
                        <div className="w-full mt-6 space-y-2">
                            {breakdownData.map((entry, index) => {
                                if (entry.name === 'Belum ada data') return null;
                                const pct = ((entry.value / entry.total) * 100).toFixed(1);
                                return (
                                    <div key={index} className="flex items-center justify-between text-sm py-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-zinc-400">{entry.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 font-mono">
                                            <span>Rp {entry.value.toLocaleString('id-ID')}</span>
                                            <span className="text-zinc-500 w-9 text-right">{pct}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 border-zinc-200 dark:border-zinc-800">
                
                {/* Recent Transactions */}
                <div className="lg:col-span-2 border-r border-b border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-semibold">Transaksi Terbaru</h2>
                        <Link href="/dashboard/pesanan" className="text-sm text-orange-500 hover:text-orange-400 font-medium flex items-center gap-1 group">
                            Lihat semua <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
                                    <th className="pb-3 font-normal">ID</th>
                                    <th className="pb-3 font-normal">Pelanggan</th>
                                    <th className="pb-3 font-normal">Kanal</th>
                                    <th className="pb-3 font-normal text-right">Jumlah</th>
                                    <th className="pb-3 font-normal text-center">Status</th>
                                    <th className="pb-3 font-normal text-right">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-mono">
                                {recentOrders.length > 0 ? recentOrders.map((order, i) => {
                                    const cleanedName = order.customer_name?.replace(/@(s\.whatsapp\.net|c\.us|lid)/g, '') || "Customer";
                                    const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    const isPending = ['menunggu', 'diproses'].includes(order.status?.toLowerCase());
                                    return (
                                        <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-[#111] transition-colors">
                                            <td className="py-3 text-zinc-500">{order.id?.substring(0, 8) || `txn_00${i}`}</td>
                                            <td className="py-3 font-sans font-medium text-zinc-900 dark:text-zinc-100">{cleanedName}</td>
                                            <td className="py-3 text-right">Rp {order.total?.toLocaleString('id-ID')}</td>
                                            <td className="py-3 text-center">
                                                <span className={`px-2.5 py-1 border text-xs rounded-md font-medium ${
                                                    isPending ? 'border-orange-500/30 text-orange-500 bg-orange-50 dark:bg-orange-500/10' : 
                                                    order.status?.toLowerCase() === 'dibatalkan' ? 'border-rose-500/30 text-rose-500 bg-rose-50 dark:bg-rose-500/10' :
                                                    'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50'
                                                }`}>
                                                    {isPending ? 'Menunggu' : order.status === 'lunas' ? 'Lunas' : order.status || 'Selesai'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right text-zinc-500">{date}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-zinc-500 font-sans">Belum ada transaksi</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Top Products & Quick Actions */}
                <div className="border-r border-b border-zinc-200 dark:border-zinc-800 flex flex-col">
                    
                    {/* Top Products */}
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-semibold">Produk Terlaris</h2>
                        </div>
                        <div className="space-y-4">
                            {topProducts.length > 0 ? topProducts.map((p, i) => (
                                <div key={i} className="flex items-center justify-between text-sm py-1">
                                    <span className="font-medium truncate max-w-[150px]">{p.name}</span>
                                    <div className="flex items-center gap-4 font-mono">
                                        <span className="text-zinc-500">{p.qty} terjual</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-zinc-500">Belum ada data produk.</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="p-6">
                        <h2 className="text-base font-semibold mb-4">Aksi Cepat</h2>
                        <div className="space-y-2">
                            {QUICK_ACTIONS.map((action, i) => {
                                const Icon = action.icon;
                                return (
                                    <Link key={i} href={action.href} className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-[#111] transition-colors text-zinc-700 dark:text-zinc-300">
                                        <Icon size={16} className="text-zinc-400" />
                                        {action.title}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
            
        </div>
    );
}
