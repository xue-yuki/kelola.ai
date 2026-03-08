"use client";

import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import {
    TrendingUp,
    ShoppingBag,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    MessageCircle,
    PackagePlus,
    FileText,
    MoreHorizontal
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
const QUICK_ACTIONS = [
    { title: "Broadcast WA", icon: MessageCircle, color: "text-green-600", bg: "bg-green-50", hover: "hover:bg-green-100" },
    { title: "Tambah Produk", icon: PackagePlus, color: "text-orange-600", bg: "bg-orange-50", hover: "hover:bg-orange-100" },
    { title: "Buat Laporan", icon: FileText, color: "text-blue-600", bg: "bg-blue-50", hover: "hover:bg-blue-100" },
];

export default function DashboardPage() {
    const supabase = createClient();
    const [greeting, setGreeting] = useState("Selamat datang");
    const [userName, setUserName] = useState("User");
    const [currentDate, setCurrentDate] = useState("");

    // Data States
    const [isLoading, setIsLoading] = useState(true);
    const [metrics, setMetrics] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    useEffect(() => {
        // Dynamic Greeting based on current hour
        const hour = new Date().getHours();
        if (hour < 11) setGreeting("Selamat Pagi");
        else if (hour < 15) setGreeting("Selamat Siang");
        else if (hour < 18) setGreeting("Selamat Sore");
        else setGreeting("Selamat Malam");

        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        setCurrentDate(new Date().toLocaleDateString('id-ID', options));

        fetchDashboardData();

        // 5. Enable Realtime Subscription
        const ordersSubscription = supabase
            .channel('orders_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
                fetchDashboardData();
            })
            .subscribe();

        const customersSubscription = supabase
            .channel('customers_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, payload => {
                fetchDashboardData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ordersSubscription);
            supabase.removeChannel(customersSubscription);
        };
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // 1. Get user and business ID
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            setUserName(session.user.user_metadata.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || "User");

            const { data: business } = await supabase
                .from('businesses')
                .select('id')
                .eq('user_id', session.user.id)
                .single();

            if (!business) { setIsLoading(false); return; }
            const businessId = business.id;

            // 2. Fetch Recent Orders
            const { data: orders } = await supabase
                .from('orders')
                .select('*')
                .eq('business_id', businessId)
                .order('created_at', { ascending: false })
                .limit(4);

            setRecentOrders(orders || []);

            // 3. True Metrics Calculation & Chart Grouping
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            const { data: recentSales } = await supabase
                .from('orders')
                .select('total, created_at, status')
                .eq('business_id', businessId)
                .eq('status', 'lunas')
                .gte('created_at', sevenDaysAgo.toISOString());

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayRevenue = recentSales?.filter(s => new Date(s.created_at) >= today).reduce((sum, order) => sum + order.total, 0) || 0;

            const { count: customersCount } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', businessId);
            const { count: activeOrdersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'menunggu');

            setMetrics([
                {
                    title: "Omzet Hari Ini",
                    value: `Rp ${todayRevenue.toLocaleString('id-ID')}`,
                    change: "+12.5%",
                    isPositive: true,
                    icon: TrendingUp,
                    color: "text-emerald-500",
                    bg: "bg-emerald-50",
                },
                {
                    title: "Pesanan Aktif",
                    value: activeOrdersCount || 0,
                    change: "+4",
                    isPositive: true,
                    icon: ShoppingBag,
                    color: "text-blue-500",
                    bg: "bg-blue-50",
                },
                {
                    title: "Total Pelanggan",
                    value: customersCount || 0,
                    change: "+2 Baru",
                    isPositive: true,
                    icon: Users,
                    color: "text-indigo-500",
                    bg: "bg-indigo-50",
                },
            ]);

            // 4. Revenue Chart Data grouped by date for last 7 days
            const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
            const last7DaysData = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dayStr = days[date.getDay()];

                // Set bounds for this specific day
                const startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);

                const dayTotal = recentSales
                    ?.filter(sale => {
                        const saleDate = new Date(sale.created_at);
                        return saleDate >= startOfDay && saleDate <= endOfDay;
                    })
                    .reduce((sum, sale) => sum + sale.total, 0) || 0;

                last7DaysData.push({
                    name: dayStr,
                    total: dayTotal
                });
            }

            setRevenueData(last7DaysData);

        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    // Animation Variants
    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-orange-500">
                    <Loader2 className="animate-spin w-10 h-10" />
                    <p className="font-bold text-slate-500 animate-pulse text-sm">Mengambil data dari Supabase...</p>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-8 pb-10"
        >
            {/* Header Section */}
            <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">
                        {greeting}, {userName}! ☕
                    </h1>
                    <p className="text-sm font-medium text-slate-500">
                        {currentDate} • <span className="text-orange-600 font-bold">Penjualanmu naik 12% minggu ini!</span>
                    </p>
                </div>

                {/* Quick Actions Desktop */}
                <div className="hidden md:flex items-center gap-3">
                    {QUICK_ACTIONS.map((action, i) => {
                        const Icon = action.icon;
                        return (
                            <button key={i} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${action.bg} ${action.color} ${action.hover}`}>
                                <Icon size={16} />
                                {action.title}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Quick Actions Mobile */}
            <motion.div variants={item} className="grid grid-cols-3 gap-3 md:hidden">
                {QUICK_ACTIONS.map((action, i) => {
                    const Icon = action.icon;
                    return (
                        <button key={i} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all ${action.bg} ${action.color}`}>
                            <Icon size={20} />
                            <span className="text-[10px] sm:text-xs font-black text-center leading-tight">{action.title}</span>
                        </button>
                    );
                })}
            </motion.div>

            {/* Metric Cards */}
            <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {metrics && metrics.map((metric: any, i: number) => {
                    const Icon = metric.icon;
                    return (
                        <div key={i} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-orange-200 transition-colors">
                            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-slate-50 blur-2xl group-hover:bg-orange-50 transition-colors duration-500" />
                            <div className="flex items-start justify-between relative z-10">
                                <div className="space-y-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${metric.bg} ${metric.color}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-400 mb-1">{metric.title}</p>
                                        <p className="text-3xl font-black text-slate-800 tracking-tighter">{metric.value}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${metric.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {metric.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {metric.change}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Revenue Chart */}
                <motion.div variants={item} className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Tren Pendapatan</h2>
                            <p className="text-sm text-slate-500 font-medium">7 Hari Terakhir</p>
                        </div>
                        <select className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                            <option>Minggu Ini</option>
                            <option>Bulan Ini</option>
                            <option>Tahun Ini</option>
                        </select>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                    tickFormatter={(value) => `Rp${value / 1000000}M`}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Omzet']}
                                    labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#ea580c"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Recent Orders List */}
                <motion.div variants={item} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Pesanan Terbaru</h2>
                        <button className="p-2 text-slate-400 hover:text-orange-600 transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    <div className="flex-1 space-y-4">
                        {recentOrders.length > 0 ? recentOrders.map((order, i) => (
                            <div key={order.id || i} className="flex items-center justify-between p-3 -mx-3 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-white group-hover:shadow-sm transition-all text-xs">
                                        {order.customer_name?.charAt(0) || "C"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 tracking-tight mb-0.5 group-hover:text-orange-600 transition-colors">
                                            {order.customer_name}
                                        </p>
                                        <p className="text-xs text-slate-500 font-medium truncate max-w-[120px] sm:max-w-xs md:max-w-[120px]">
                                            {order.channel || "WhatsApp"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-800 tracking-tight">Rp {order.total?.toLocaleString('id-ID')}</p>
                                    <p className={`text-[10px] font-black uppercase mt-1 ${order.status?.toLowerCase() === 'lunas' ? 'text-emerald-500' :
                                        order.status?.toLowerCase() === 'dikirim' ? 'text-blue-500' : 'text-amber-500'
                                        }`}>
                                        {order.status || "Menunggu"}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-40 text-center">
                                <ShoppingBag className="w-10 h-10 text-slate-200 mb-3" />
                                <p className="text-sm font-bold text-slate-400">Belum ada pesanan</p>
                                <p className="text-xs font-medium text-slate-400 mt-1">Pesanan barumu akan muncul di sini</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <Link href="/dashboard/pesanan" className="block text-center text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors">
                            Lihat Semua Pesanan
                        </Link>
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
}
