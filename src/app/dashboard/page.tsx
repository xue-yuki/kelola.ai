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
    { title: "Broadcast WA", icon: MessageCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border border-emerald-500/20", hover: "hover:bg-emerald-500/20", href: "/dashboard/wa-marketing" },
    { title: "Tambah Produk", icon: PackagePlus, color: "text-orange-400", bg: "bg-orange-500/10 border border-orange-500/20", hover: "hover:bg-orange-500/20", href: "/dashboard/produk" },
    { title: "Buat Laporan", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10 border border-blue-500/20", hover: "hover:bg-blue-500/20", href: "/dashboard/laporan" },
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
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                },
                {
                    title: "Pesanan Aktif",
                    value: activeOrdersCount || 0,
                    change: "+4",
                    isPositive: true,
                    icon: ShoppingBag,
                    color: "text-blue-400",
                    bg: "bg-blue-500/10",
                },
                {
                    title: "Total Pelanggan",
                    value: customersCount || 0,
                    change: "+2 Baru",
                    isPositive: true,
                    icon: Users,
                    color: "text-indigo-400",
                    bg: "bg-indigo-500/10",
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
                    <p className="font-bold text-white/50 animate-pulse text-sm">Mengambil data dari Supabase...</p>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-6"
        >
            {/* Header Section */}
            {/* Immersive Header Banner */}
            <motion.div variants={item} className="relative overflow-hidden rounded-[2rem] bg-[#161616]/60 backdrop-blur-3xl border border-white/5 shadow-2xl p-5 sm:px-8 sm:py-6 group flex flex-col justify-center">
                {/* Dynamic Lighting Effects */}
                <div className="absolute -top-[50%] -left-[10%] w-[60%] h-[150%] bg-orange-500/10 rounded-full blur-[100px] group-hover:bg-orange-500/20 transition-all duration-1000" />
                <div className="absolute -bottom-[50%] -right-[10%] w-[60%] h-[150%] bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-1000" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 tracking-tight">
                                {greeting}, <span className="text-orange-400 drop-shadow-[0_0_30px_rgba(255,107,43,0.3)]">{userName}</span>
                            </h1>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Sistem Utama Berjalan Lancar" />
                        </div>
                        <p className="text-sm font-medium text-white/50">
                            {currentDate}
                        </p>
                    </div>

                    {/* Premium Quick Actions Desktop */}
                    <div className="hidden md:flex items-center gap-3">
                        {QUICK_ACTIONS.map((action, i) => {
                            const Icon = action.icon;
                            return (
                                <Link key={i} href={action.href} className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-xl`}>
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent to-white/5`} />
                                    <Icon size={16} className={action.color} />
                                    <span className="text-white/90">{action.title}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions Mobile */}
            <motion.div variants={item} className="grid grid-cols-3 gap-3 md:hidden">
                {QUICK_ACTIONS.map((action, i) => {
                    const Icon = action.icon;
                    return (
                        <Link key={i} href={action.href} className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-3xl transition-all duration-300 bg-white/5 border border-white/10 active:scale-95 overflow-hidden`}>
                            <div className={`absolute inset-0 opacity-10 ${action.bg.split(' ')[0]}`} />
                            <Icon size={24} className={action.color} />
                            <span className="text-[10px] sm:text-xs font-bold text-white/90 text-center leading-tight">{action.title}</span>
                        </Link>
                    );
                })}
            </motion.div>

            {/* Bento Metric Cards */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics && metrics.map((metric: any, i: number) => {
                    const Icon = metric.icon;
                    // First item spans 2 columns on large screens
                    const isFeature = i === 0;

                    return (
                        <div key={i} className={`p-5 sm:p-6 rounded-[1.5rem] bg-[#161616]/90 backdrop-blur-2xl border border-white/5 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all duration-500 hover:-translate-y-1 ${isFeature ? 'lg:col-span-2' : ''}`}>
                            <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${isFeature ? 'bg-orange-500' : 'bg-white/20'}`} />
                            
                            <div className="flex flex-col h-full justify-between relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm group-hover:scale-110 transition-transform duration-500 ${metric.color}`}>
                                        <Icon size={18} />
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border backdrop-blur-md ${metric.isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                        {metric.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {metric.change}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] sm:text-xs font-bold text-white/40 mb-1 uppercase tracking-widest">{metric.title}</p>
                                    <p className={`font-display font-black tracking-tighter ${isFeature ? 'text-3xl lg:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300' : 'text-2xl lg:text-3xl text-white/90'}`}>
                                        {metric.value}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                {/* Revenue Chart */}
                <motion.div variants={item} className="lg:col-span-2 p-6 rounded-[2rem] bg-[#161616]/80 backdrop-blur-3xl border border-white/5 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                        <div>
                            <h2 className="text-lg sm:text-xl font-display font-black text-white/90 tracking-tight">Tren Pendapatan</h2>
                            <p className="text-xs sm:text-sm text-white/40 font-medium mt-0.5">Akumulasi 7 Hari Terakhir</p>
                        </div>
                        <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/5">
                            {['Minggu', 'Bulan', 'Tahun'].map(val => (
                                <button key={val} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${val === 'Minggu' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/80'}`}>
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[240px] sm:h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700 }}
                                    dy={15}
                                />
                                <YAxis
                                    hide
                                />
                                <Tooltip
                                    cursor={{ stroke: 'rgba(255,107,43,0.5)', strokeWidth: 2, strokeDasharray: '4 4' }}
                                    contentStyle={{ 
                                        borderRadius: '20px', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)', 
                                        backgroundColor: 'rgba(15,15,15,0.9)', 
                                        backdropFilter: 'blur(24px)',
                                        padding: '16px 20px'
                                    }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{label}</span>
                                                    <span className="text-xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                                                        Rp {Number(payload[0].value).toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#ea580c"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    activeDot={{ r: 6, fill: '#111', stroke: '#ea580c', strokeWidth: 3 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Recent Orders List */}
                <motion.div variants={item} className="p-6 rounded-[2rem] bg-[#161616]/80 backdrop-blur-3xl border border-white/5 shadow-2xl flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <h2 className="text-lg sm:text-xl font-display font-black text-white/90 tracking-tight">Pesanan Terbaru</h2>
                        <button className="p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>

                    <div className="flex-1 space-y-2 relative z-10">
                        {recentOrders.length > 0 ? recentOrders.map((order, i) => {
                            const cleanedName = order.customer_name?.replace(/@(s\.whatsapp\.net|c\.us|lid)/g, '') || "Customer";
                            return (
                            <div key={order.id || i} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 hover:-translate-y-0.5 transition-all cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-white/60 font-bold text-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                                        {cleanedName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm font-bold text-white/90 tracking-tight mb-0.5">
                                            {cleanedName}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs font-medium text-white/40">
                                            <span>{order.channel || "WhatsApp"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-white/90 tracking-tight mb-1">Rp {order.total?.toLocaleString('id-ID')}</p>
                                    <span className={`inline-block px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border backdrop-blur-sm ${
                                            order.status?.toLowerCase() === 'lunas' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            order.status?.toLowerCase() === 'dikirim' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            order.status?.toLowerCase() === 'diproses' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            order.status?.toLowerCase() === 'dibatalkan' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }`}>
                                        {order.status || "Menunggu"}
                                    </span>
                                </div>
                            </div>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center h-48 text-center bg-white/[0.02] rounded-3xl border border-white/5 border-dashed">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <ShoppingBag className="w-5 h-5 text-white/20" />
                                </div>
                                <p className="text-sm font-black text-white/50 tracking-tight">Belum ada pesanan</p>
                                <p className="text-[11px] font-medium text-white/30 mt-1 uppercase tracking-widest">Pesanan barumu akan muncul di sini</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 sm:mt-6 relative z-10">
                        <Link href="/dashboard/pesanan" className="flex items-center justify-center gap-2 w-full py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 hover:bg-orange-500 hover:text-white rounded-xl transition-all border border-orange-500/20 hover:shadow-[0_0_30px_rgba(255,107,43,0.3)]">
                            Lebih Banyak <ArrowUpRight size={14} />
                        </Link>
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
}
