"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Filter,
    Calendar,
    ChevronDown,
    MoreHorizontal,
    MessageCircle,
    Globe,
    Zap,
    Download,
    Loader2,
    ShoppingBag
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STATUS_OPTIONS = [
    { label: "Semua Status", value: "all" },
    { label: "Lunas", value: "lunas" },
    { label: "Menunggu", value: "menunggu" },
    { label: "Dibatalkan", value: "dibatalkan" },
];

const CHANNEL_OPTIONS = [
    { label: "Semua Saluran", value: "all" },
    { label: "WhatsApp", value: "whatsapp" },
    { label: "Telegram", value: "telegram" },
    { label: "Offline", value: "offline" },
];

export default function PesananPage() {
    const supabase = createClient();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [channelFilter, setChannelFilter] = useState("all");

    useEffect(() => {
        fetchOrders();

        const subscription = supabase
            .channel('orders_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [statusFilter, channelFilter]);

    const fetchOrders = async () => {
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

            let query = supabase
                .from('orders')
                .select('*')
                .eq('business_id', business.id)
                .order('created_at', { ascending: false });

            if (statusFilter !== "all") {
                query = query.eq('status', statusFilter);
            }
            if (channelFilter !== "all") {
                query = query.eq('channel', channelFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredOrders = orders.filter(order =>
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Manajemen Pesanan</h1>
                    <p className="text-slate-500 font-medium">Pantau dan kelola semua transaksi bisnismu di sini.</p>
                </div>
                <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm">
                    <Download size={18} />
                    Export Laporan
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Cari nama pelanggan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all outline-none"
                    />
                </div>

                <div className="flex gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none cursor-pointer"
                    >
                        {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>

                    <select
                        value={channelFilter}
                        onChange={(e) => setChannelFilter(e.target.value)}
                        className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none cursor-pointer"
                    >
                        {CHANNEL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Orders Table/List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Pelanggan</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Saluran</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Waktu</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-orange-500">
                                                <Loader2 className="animate-spin w-8 h-8" />
                                                <p className="text-sm font-bold text-slate-500">Memuat pesanan...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredOrders.length > 0 ? filteredOrders.map((order, idx) => (
                                    <motion.tr
                                        key={order.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    {order.customer_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm tracking-tight">{order.customer_name}</p>
                                                    <p className="text-[10px] font-medium text-slate-400">#{order.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                {order.channel === "whatsapp" ? (
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider">
                                                        <MessageCircle size={12} /> WhatsApp
                                                    </span>
                                                ) : order.channel === "telegram" ? (
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider">
                                                        <Zap size={12} /> Telegram
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                                                        <Globe size={12} /> Offline
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                                                <Calendar size={14} className="text-slate-300" />
                                                {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-slate-900 text-sm">
                                            Rp {order.total?.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${order.status === 'lunas' ? 'bg-emerald-500 text-white' :
                                                    order.status === 'menunggu' ? 'bg-amber-400 text-white' : 'bg-rose-500 text-white'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-300">
                                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                                                    <ShoppingBag size={32} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-lg font-black text-slate-400 tracking-tight">Belum ada pesanan</p>
                                                    <p className="text-sm font-medium text-slate-400">Pesanan akan muncul di sini setelah transaksi dilakukan.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
