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
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-bold text-[#1A1A2E] tracking-tight mb-2">Manajemen Pesanan</h1>
                    <p className="text-sm font-medium text-[#6B7280]">Pantau dan kelola semua transaksi bisnismu di sini.</p>
                </div>
                <button className="flex items-center justify-center gap-2 bg-white border border-[#F0EEE9] px-6 py-2.5 rounded-full text-[#1A1A2E] font-bold hover:bg-[#FAFAF8] transition-all shadow-sm">
                    <Download size={18} />
                    Export Laporan
                </button>
            </div>

            {/* Pill Filters Bar */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Search bar */}
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF6B2B] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Cari nama pelanggan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-[#F0EEE9] rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium focus:ring-4 focus:ring-[#FF6B2B]/5 focus:border-[#FF6B2B]/20 transition-all outline-none"
                        />
                    </div>

                    {/* Channel Pill Filter */}
                    <div className="flex flex-wrap items-center gap-2 p-1 bg-white border border-[#F0EEE9] rounded-2xl w-fit">
                        {CHANNEL_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setChannelFilter(opt.value)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${channelFilter === opt.value
                                        ? "bg-[#1A1A2E] text-white shadow-md"
                                        : "text-[#94A3B8] hover:text-[#1A1A2E] hover:bg-[#FAFAF8]"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status Pill Filter */}
                <div className="flex flex-wrap items-center gap-2 p-1 bg-[#FAFAF8] rounded-2xl border border-[#F0EEE9] w-fit">
                    {STATUS_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setStatusFilter(opt.value)}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${statusFilter === opt.value
                                    ? "bg-[#FF6B2B] text-white shadow-lg shadow-[#FF6B2B]/20"
                                    : "text-[#6B7280] hover:text-[#1A1A2E] hover:bg-white"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-[#F0EEE9] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#FAFAF8] border-b border-[#F0EEE9]">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Pelanggan</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Saluran</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Waktu Transaksi</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8] text-right">Total Tagihan</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8] text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8] text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="animate-spin w-10 h-10 text-[#FF6B2B]" />
                                                <p className="text-sm font-bold text-[#6B7280]">Sinkronisasi data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredOrders.length > 0 ? filteredOrders.map((order, idx) => (
                                    <motion.tr
                                        key={order.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="border-b border-[#F0EEE9] hover:bg-[#FFF8F5] transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-full bg-[#FAFAF8] border border-[#F0EEE9] flex items-center justify-center text-xs font-black text-[#1A1A2E] group-hover:bg-white group-hover:text-[#FF6B2B] group-hover:border-[#FF6B2B]/20 transition-all">
                                                    {order.customer_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#1A1A2E] text-sm tracking-tight mb-1">{order.customer_name}</p>
                                                    <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-tighter">ID: #{order.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                {order.channel === "whatsapp" ? (
                                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                                                        <MessageCircle size={12} /> WhatsApp
                                                    </span>
                                                ) : order.channel === "telegram" ? (
                                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                                                        <Zap size={12} /> Telegram
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                                                        <Globe size={12} /> Offline
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-[#6B7280] font-bold text-[11px] uppercase tracking-tight">
                                                <Calendar size={14} className="text-[#94A3B8]" />
                                                {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                <span className="text-slate-300">•</span>
                                                {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-[#1A1A2E] text-sm">
                                            Rp {order.total?.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${order.status === 'lunas' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                                    order.status === 'menunggu' ? 'bg-[#FF6B2B] text-white shadow-[#FF6B2B]/20' : 'bg-rose-500 text-white shadow-rose-500/20'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-[#FF6B2B] hover:bg-white rounded-full border border-transparent hover:border-[#F0EEE9] transition-all">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-40 text-center">
                                            <div className="flex flex-col items-center gap-5">
                                                <div className="w-20 h-20 rounded-full bg-[#FAFAF8] border border-[#F0EEE9] flex items-center justify-center text-slate-200">
                                                    <ShoppingBag size={40} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-lg font-bold text-[#1A1A2E] tracking-tight text-center">Tidak ada pesanan ditemukan</p>
                                                    <p className="text-sm font-medium text-[#6B7280] text-center">Coba ubah filter atau kata kunci pencarian Anda.</p>
                                                </div>
                                                <button
                                                    onClick={() => { setStatusFilter("all"); setChannelFilter("all"); setSearchTerm(""); }}
                                                    className="mt-2 px-6 py-2.5 rounded-full bg-[#1A1A2E] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#FF6B2B] transition-all"
                                                >
                                                    Reset Filter
                                                </button>
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
