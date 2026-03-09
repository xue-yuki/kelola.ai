"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Users,
    Calendar,
    ShoppingBag,
    MoreHorizontal,
    Mail,
    Phone,
    Loader2,
    ArrowUpRight,
    LayoutGrid,
    List,
    MessageSquare
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PelangganPage() {
    const supabase = createClient();
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1 }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
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

            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('business_id', business.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCustomers(data || []);
        } catch (error: any) {
            console.error("Error:", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-bold text-[#1A1A2E] tracking-tight mb-2">Database Pelanggan</h1>
                    <p className="text-sm font-medium text-[#6B7280]">Kenali pelangganmu lebih dekat untuk meningkatkan loyalitas.</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 w-full relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF6B2B] transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Cari nama atau nomor telepon..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-[#F0EEE9] rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium focus:ring-4 focus:ring-[#FF6B2B]/5 focus:border-[#FF6B2B]/20 transition-all outline-none"
                    />
                </div>

                <div className="flex items-center p-1 bg-white border border-[#F0EEE9] rounded-2xl">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#1A1A2E] text-white shadow-md' : 'text-[#94A3B8] hover:text-[#1A1A2E]'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[#1A1A2E] text-white shadow-md' : 'text-[#94A3B8] hover:text-[#1A1A2E]'}`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-32"
                    >
                        <Loader2 className="animate-spin w-12 h-12 text-[#FF6B2B] mb-4" />
                        <p className="text-[#6B7280] font-bold uppercase tracking-widest text-xs">Menganalisa data...</p>
                    </motion.div>
                ) : filteredCustomers.length > 0 ? (
                    viewMode === 'grid' ? (
                        <motion.div
                            key="grid"
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {filteredCustomers.map((c, i) => {
                                const initial = c.name?.charAt(0).toUpperCase();
                                const colors = [
                                    'from-orange-500 to-orange-400',
                                    'from-blue-500 to-blue-400',
                                    'from-indigo-500 to-indigo-400',
                                    'from-emerald-500 to-emerald-400'
                                ];
                                const colorClass = colors[i % colors.length];

                                return (
                                    <motion.div
                                        key={c.id}
                                        variants={item}
                                        className="bg-white rounded-2xl border border-[#F0EEE9] p-6 hover:shadow-xl hover:shadow-[#1A1A2E]/5 transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-6">
                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${colorClass} flex items-center justify-center text-xl font-bold text-white shadow-lg`}>
                                                {initial}
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FAFAF8] text-[#6B7280] hover:bg-[#FFF3EE] hover:text-[#FF6B2B] transition-all">
                                                    <MessageSquare size={18} />
                                                </button>
                                                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FAFAF8] text-[#6B7280] hover:bg-[#FFF3EE] hover:text-[#FF6B2B] transition-all">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-[#1A1A2E] group-hover:text-[#FF6B2B] transition-colors line-clamp-1">{c.name}</h3>
                                                <div className="flex items-center gap-2 mt-1 py-1 px-2.5 bg-emerald-50 w-fit rounded-lg">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Aktif Belanja</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#F0EEE9]">
                                                <div>
                                                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Telepon</p>
                                                    <p className="text-xs font-bold text-[#1A1A2E]">{c.phone || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Terdaftar</p>
                                                    <p className="text-xs font-bold text-[#1A1A2E]">{new Date(c.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <div className="text-[#6B7280] text-xs font-medium">Transaksi Terakhir</div>
                                                <div className="px-3 py-1 rounded-full bg-[#1A1A2E] text-white text-[10px] font-black">2 Hari Lalu</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white rounded-2xl border border-[#F0EEE9] overflow-hidden shadow-sm"
                        >
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#FAFAF8] border-b border-[#F0EEE9]">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Nama Pelanggan</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Kontak & Email</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Alamat Pengiriman</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Tanggal Bergabung</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8] text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.map((c) => (
                                        <tr key={c.id} className="border-b border-[#F0EEE9] hover:bg-[#FFF8F5] transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#1A1A2E] to-[#2D2D4D] text-white flex items-center justify-center font-bold text-xs shadow-md">
                                                        {c.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[#1A1A2E] text-sm tracking-tight">{c.name}</p>
                                                        <p className="text-[10px] font-bold text-[#94A3B8] uppercase">Pelanggan Setia</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280]">
                                                        <Phone size={12} className="text-[#FF6B2B]" />
                                                        {c.phone}
                                                    </div>
                                                    {c.email && (
                                                        <div className="flex items-center gap-2 text-[11px] font-medium text-[#94A3B8]">
                                                            <Mail size={12} className="text-[#94A3B8]" />
                                                            {c.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-bold text-[#6B7280] text-[11px] max-w-[200px] truncate uppercase tracking-tight">
                                                {c.address || 'Alamat Belum Diatur'}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-[#6B7280] font-bold text-[11px] uppercase tracking-wider">
                                                    <Calendar size={14} className="text-[#94A3B8]" />
                                                    {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button className="w-10 h-10 flex items-center justify-center rounded-xl text-blue-500 hover:bg-white border border-transparent hover:border-[#F0EEE9] transition-all">
                                                        <ArrowUpRight size={18} />
                                                    </button>
                                                    <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-[#1A1A2E] hover:bg-white border border-transparent hover:border-[#F0EEE9] transition-all">
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    )
                ) : (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl border-2 border-dashed border-[#F0EEE9] py-32 text-center"
                    >
                        <div className="w-24 h-24 rounded-full bg-[#FAFAF8] border border-[#F0EEE9] flex items-center justify-center mx-auto mb-6 text-slate-200">
                            <Users size={48} />
                        </div>
                        <h2 className="text-xl font-bold text-[#1A1A2E] tracking-tight">Belum Ada Pelanggan</h2>
                        <p className="text-[#6B7280] mt-2 mb-8 max-w-sm mx-auto font-medium">Data pelanggan Anda akan terkumpul secara otomatis saat ada transaksi baru.</p>
                        <button
                            onClick={() => window.location.href = '/dashboard/kasir'}
                            className="bg-[#1A1A2E] text-white px-8 py-3 rounded-full font-bold hover:bg-[#FF6B2B] transition-all"
                        >
                            Ke Kasir Sekarang
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
