"use client";

import { useState } from "react";
import { Store, Phone, CalendarDays, Key, Cpu, Eye, Search, Filter } from "lucide-react";
import Link from "next/link";
import DeleteClientBtn from "./DeleteClientBtn";
import EditPackageBtn from "./EditPackageBtn";
import { motion, AnimatePresence } from "framer-motion";

export default function ClientTable({ initialBusinesses }: { initialBusinesses: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTier, setFilterTier] = useState<string>("All");

    const filteredBusinesses = initialBusinesses?.filter(biz => {
        const matchesSearch = biz.business_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              biz.wa_number.includes(searchTerm);
        
        const tier = biz.subscription_tier?.toLowerCase() || 'starter';
        const matchesTier = filterTier === "All" || tier === filterTier.toLowerCase();

        return matchesSearch && matchesTier;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        type="text" 
                        placeholder="Cari nama merchant atau nomor WA..."
                        className="w-full bg-gray-50 border border-gray-200 focus:border-primary/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-dark placeholder:text-text-muted/60 transition-all outline-none focus:ring-4 focus:ring-primary/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="text-text-muted" size={18} />
                    <select 
                        className="bg-gray-50 border border-gray-200 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm text-text-dark transition-all outline-none cursor-pointer appearance-none"
                        value={filterTier}
                        onChange={(e) => setFilterTier(e.target.value)}
                    >
                        <option value="All">Semua Paket</option>
                        <option value="Starter">Starter (Free)</option>
                        <option value="Basic">Basic</option>
                        <option value="Pro">Kelola Pro</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm relative">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="p-5 font-bold text-text-muted text-xs tracking-widest uppercase">Info Merchant</th>
                                <th className="p-5 font-bold text-text-muted text-xs tracking-widest uppercase">Sistem & Kontak</th>
                                <th className="p-5 font-bold text-text-muted text-xs tracking-widest uppercase">Pemakaian API</th>
                                <th className="p-5 font-bold text-text-muted text-xs tracking-widest uppercase">Status Akses</th>
                                <th className="p-5 font-bold text-text-muted text-xs tracking-widest uppercase text-right">Manajemen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <AnimatePresence>
                                {filteredBusinesses?.map((biz) => {
                                    const tier = biz.subscription_tier?.toLowerCase() || 'starter';
                                    const usage = biz.token_usage || 0;
                                    let badgeClass = 'text-gray-600 bg-gray-100 border-gray-200';
                                    let limit = 1000;
                                    let label = 'Starter';
                                    
                                    if (tier === 'pro') {
                                        badgeClass = 'text-primary bg-primary/10 border-primary/20';
                                        limit = -1;
                                        label = 'Kelola Pro';
                                    } else if (tier === 'basic') {
                                        badgeClass = 'text-orange-500 bg-orange-500/10 border-orange-500/20';
                                        limit = 3000;
                                        label = 'Basic';
                                    }

                                    const percent = limit > 0 ? Math.min(100, Math.round((usage / limit) * 100)) : 0;

                                    return (
                                        <motion.tr 
                                            key={biz.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="hover:bg-gray-50 transition-colors group"
                                        >
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 shadow-sm group-hover:border-primary/30 transition-all">
                                                        <Store size={20} className="text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text-dark text-base mb-1">{biz.business_name}</p>
                                                        <p className="text-[10px] text-text-muted flex items-center gap-1.5 font-mono uppercase tracking-wider">
                                                            <Key size={10} /> {biz.id.split('-')[0]}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="space-y-1.5">
                                                    <span className="inline-block px-2 text-[10px] font-bold tracking-wider text-blue-600 bg-blue-50 border border-blue-200 rounded uppercase">
                                                        {biz.business_type}
                                                    </span>
                                                    <p className="text-xs text-text-muted flex items-center gap-1.5 font-mono bg-gray-50 w-fit px-2 py-0.5 rounded-lg border border-gray-200">
                                                        <Phone size={10} className="text-text-muted" /> +62 {biz.wa_number}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col gap-2.5 max-w-[150px]">
                                                    <div>
                                                        <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border shadow-sm ${badgeClass}`}>
                                                            {label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[11px] text-text-muted font-mono">
                                                        <div className="flex items-center gap-1.5">
                                                            <Cpu size={12} className={limit === -1 ? "text-primary" : "text-text-muted"} />
                                                            {limit === -1 ? (
                                                                <span className="text-primary font-bold">{usage.toLocaleString('id-ID')} reqs</span>
                                                            ) : (
                                                                <span className="font-semibold text-text-dark">{usage.toLocaleString('id-ID')}</span>
                                                            )}
                                                        </div>
                                                        {limit > 0 && <span>/ {limit.toLocaleString('id-ID')}</span>}
                                                    </div>
                                                    {limit > 0 && (
                                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden border border-gray-100">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-1000 ${percent > 90 ? 'bg-red-500' : percent > 50 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="space-y-2">
                                                    {biz.wa_status === 'connected' ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-xs font-bold text-emerald-600">WA AKTIF</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                                                            <span className="text-xs font-bold text-text-muted">OFFLINE</span>
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] text-text-muted flex items-center gap-1 uppercase tracking-wider">
                                                        <CalendarDays size={10} /> {new Date(biz.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                 <div className="flex items-center justify-end gap-2 opacity-50 xl:opacity-0 group-hover:opacity-100 transition-opacity">
                                                     <Link 
                                                        href={`/admin/preview/${biz.id}`}
                                                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-200 shadow-sm"
                                                        title="Intip Dashboard Klien"
                                                     >
                                                         <Eye size={16} />
                                                     </Link>
                                                     <div className="px-1" />
                                                     <EditPackageBtn businessId={biz.id} currentTier={biz.subscription_tier} />
                                                     <DeleteClientBtn businessId={biz.id} businessName={biz.business_name} />
                                                 </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>

                            {(!filteredBusinesses || filteredBusinesses.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 border border-gray-100 mb-4 text-text-muted">
                                            <Search size={24} />
                                        </div>
                                        <p className="text-text-muted font-medium tracking-wide">Pencarian tidak menemukan hasil apapun.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
