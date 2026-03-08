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
    ArrowUpRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PelangganPage() {
    const supabase = createClient();
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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

            if (!business) {
                console.warn("No business found for user:", session.user.id);
                return;
            }

            console.log("Fetching customers for business:", business.id);

            // Fetch customers and join with something or just fetch customers?
            // The customer table doesn't have total orders, we might need to count them.
            // For now let's just fetch customers.
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('business_id', business.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCustomers(data || []);
        } catch (error: any) {
            console.error("Error fetching customers detailed:", error.message || error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Database Pelanggan</h1>
                    <p className="text-slate-500 font-medium">Kenali pelangganmu lebih dekat untuk meningkatkan loyalitas.</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Cari nama atau nomor telepon..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all outline-none"
                    />
                </div>
            </div>

            {/* Customers Grid/Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Pelanggan</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Kontak</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Alamat</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Bergabung</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <Loader2 className="animate-spin w-8 h-8 text-orange-500 mx-auto" />
                                        </td>
                                    </tr>
                                ) : filteredCustomers.length > 0 ? filteredCustomers.map((c, idx) => (
                                    <motion.tr
                                        key={c.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                                                    {c.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <p className="font-bold text-slate-800 text-sm tracking-tight">{c.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                                    <Phone size={12} className="text-slate-400" />
                                                    {c.phone}
                                                </div>
                                                {c.email && (
                                                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                                                        <Mail size={12} className="text-slate-400" />
                                                        {c.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-medium text-slate-500 text-xs max-w-[200px] truncate">
                                            {c.address || '-'}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                                                <Calendar size={14} className="text-slate-300" />
                                                {new Date(c.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all">
                                                    <ArrowUpRight size={18} />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-32 text-center text-slate-300">
                                            <Users size={48} className="mx-auto mb-4" />
                                            <p className="font-black text-lg text-slate-400">Belum ada pelanggan</p>
                                            <p className="text-sm font-medium">Pelanggan akan terdata saat pesanan dibuat.</p>
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
