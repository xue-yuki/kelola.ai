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

// Mock Data for Chart
const revenueData = [
    { name: "Sen", total: 1200000 },
    { name: "Sel", total: 1800000 },
    { name: "Rab", total: 1400000 },
    { name: "Kam", total: 2200000 },
    { name: "Jum", total: 1900000 },
    { name: "Sab", total: 2800000 },
    { name: "Min", total: 2450000 },
];

// Mock Data for Recent Orders
const RECENT_ORDERS = [
    { id: "ORD-001", customer: "Budi Santoso", items: "Kopi Arabika 250g x2", total: "Rp 150.000", status: "Lunas", date: "Hari ini, 10:42" },
    { id: "ORD-002", customer: "Siti Aminah", items: "Set Alat Seduh V60", total: "Rp 350.000", status: "Kirim", date: "Hari ini, 09:15" },
    { id: "ORD-003", customer: "Hendra Wijaya", items: "Filter Kertas x5", total: "Rp 75.000", status: "Menunggu", date: "Kemarin, 16:30" },
    { id: "ORD-004", customer: "Toko Harapan", items: "Kopi Robusta 1kg x5", total: "Rp 600.000", status: "Lunas", date: "Kemarin, 14:20" },
];

const METRICS = [
    {
        title: "Omzet Hari Ini",
        value: "Rp 2.450.000",
        change: "+12.5%",
        isPositive: true,
        icon: TrendingUp,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
    },
    {
        title: "Pesanan Aktif",
        value: "24",
        change: "+4",
        isPositive: true,
        icon: ShoppingBag,
        color: "text-blue-500",
        bg: "bg-blue-50",
    },
    {
        title: "Pelanggan Baru",
        value: "15",
        change: "-2%",
        isPositive: false,
        icon: Users,
        color: "text-indigo-500",
        bg: "bg-indigo-50",
    },
];

const QUICK_ACTIONS = [
    { title: "Broadcast WA", icon: MessageCircle, color: "text-green-600", bg: "bg-green-50", hover: "hover:bg-green-100" },
    { title: "Tambah Produk", icon: PackagePlus, color: "text-orange-600", bg: "bg-orange-50", hover: "hover:bg-orange-100" },
    { title: "Buat Laporan", icon: FileText, color: "text-blue-600", bg: "bg-blue-50", hover: "hover:bg-blue-100" },
];

export default function DashboardPage() {
    const [greeting, setGreeting] = useState("Selamat datang");
    const [currentDate, setCurrentDate] = useState("");

    useEffect(() => {
        // Dynamic Greeting based on current hour
        const hour = new Date().getHours();
        if (hour < 11) setGreeting("Selamat Pagi");
        else if (hour < 15) setGreeting("Selamat Siang");
        else if (hour < 18) setGreeting("Selamat Sore");
        else setGreeting("Selamat Malam");

        // Format current date
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        setCurrentDate(new Date().toLocaleDateString('id-ID', options));
    }, []);

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
                        {greeting}, Andi! ☕
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
                {METRICS.map((metric, i) => {
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
                        {RECENT_ORDERS.map((order, i) => (
                            <div key={i} className="flex items-center justify-between p-3 -mx-3 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-white group-hover:shadow-sm transition-all text-xs">
                                        {order.customer.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 tracking-tight mb-0.5 group-hover:text-orange-600 transition-colors">
                                            {order.customer}
                                        </p>
                                        <p className="text-xs text-slate-500 font-medium truncate max-w-[120px] sm:max-w-xs md:max-w-[120px]">
                                            {order.items}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-800 tracking-tight">{order.total}</p>
                                    <p className={`text-[10px] font-black uppercase mt-1 ${order.status === 'Lunas' ? 'text-emerald-500' :
                                        order.status === 'Kirim' ? 'text-blue-500' : 'text-amber-500'
                                        }`}>
                                        {order.status}
                                    </p>
                                </div>
                            </div>
                        ))}
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
