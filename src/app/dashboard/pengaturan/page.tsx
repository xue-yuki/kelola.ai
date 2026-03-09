"use client";

import { useState, useEffect } from "react";
import {
    Building2,
    Store,
    Phone,
    Save,
    CheckCircle2,
    Loader2,
    ArrowLeft,
    Shield,
    Bell,
    User,
    CreditCard,
    ChevronRight,
    LogOut
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const BUSINESS_TYPES = [
    "Makanan & Minuman",
    "Fashion & Apparel",
    "Elektronik & Gadget",
    "Kesehatan & Kecantikan",
    "Jasa & Konsultasi",
    "Lainnya"
];

export default function PengaturanPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState("profil");

    const [formData, setFormData] = useState({
        businessName: "",
        businessType: "",
        waNumber: ""
    });

    const [businessId, setBusinessId] = useState<string | null>(null);

    useEffect(() => {
        fetchBusinessData();
    }, []);

    const fetchBusinessData = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: business } = await supabase
                .from('businesses')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (business) {
                setBusinessId(business.id);
                setFormData({
                    businessName: business.business_name,
                    businessType: business.business_type,
                    waNumber: business.wa_number
                });
            }
        } catch (error) {
            console.error("Error fetching business:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessId) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('businesses')
                .update({
                    business_name: formData.businessName,
                    business_type: formData.businessType,
                    wa_number: formData.waNumber
                })
                .eq('id', businessId);

            if (error) throw error;

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Error updating settings:", error);
            alert("Gagal menyimpan pengaturan.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            {/* Page Header */}
            <div>
                <h1 className="text-[32px] font-bold text-[#1A1A2E] tracking-tight">Pengaturan Akun</h1>
                <p className="text-[#6B7280] font-medium mt-1">Konfigurasi profile bisnis dan preferensi sistem kamu.</p>
            </div>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin w-12 h-12 text-[#FF6B2B]" />
                    <p className="font-black text-[#94A3B8] text-[10px] uppercase tracking-widest">Memuat Data...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-4 space-y-2">
                        {[
                            { id: 'profil', label: 'Profil Bisnis', icon: Building2 },
                            { id: 'notif', label: 'Notifikasi', icon: Bell },
                            { id: 'keamanan', label: 'Keamanan', icon: Shield },
                            { id: 'billing', label: 'Berlangganan', icon: CreditCard },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all group ${activeTab === tab.id
                                    ? 'bg-[#1A1A2E] text-white shadow-xl shadow-[#1A1A2E]/10 translate-x-1'
                                    : 'bg-white border border-[#F0EEE9] text-[#94A3B8] hover:border-[#FF6B2B]/30 hover:text-[#1A1A2E]'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <tab.icon size={20} className={activeTab === tab.id ? 'text-[#FF6B2B]' : 'group-hover:text-[#FF6B2B]'} />
                                    <span className="text-sm font-bold tracking-tight">{tab.label}</span>
                                </div>
                                <ChevronRight size={16} className={`opacity-20 ${activeTab === tab.id ? 'opacity-100 text-[#FF6B2B]' : ''}`} />
                            </button>
                        ))}

                        <div className="pt-6">
                            <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-sm">
                                <LogOut size={20} />
                                Keluar Akun
                            </button>
                        </div>
                    </div>

                    {/* Main Settings Panel */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white rounded-[32px] border border-[#F0EEE9] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)] overflow-hidden">
                            <div className="px-10 py-8 border-b border-[#F0EEE9] bg-[#FAFAF8]">
                                <h2 className="font-bold text-xl text-[#1A1A2E] tracking-tight">Informasi Dasar Bisnis</h2>
                                <p className="text-xs font-medium text-[#94A3B8] mt-1">Gunakan informasi resmi untuk keperluan invoice dan laporan.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Nama Brand / Bisnis</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F0EEE9] group-focus-within:text-[#FF6B2B] transition-colors" size={20} />
                                            <input
                                                required
                                                type="text"
                                                value={formData.businessName}
                                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                                className="w-full bg-[#FAFAF8] border border-[#F0EEE9] rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-[#1A1A2E] focus:ring-4 focus:ring-[#FF6B2B]/5 focus:border-[#FF6B2B]/20 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Kategori Industri</label>
                                        <div className="relative group">
                                            <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F0EEE9] group-focus-within:text-[#FF6B2B] transition-colors" size={20} />
                                            <select
                                                required
                                                value={formData.businessType}
                                                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                                className="w-full bg-[#FAFAF8] border border-[#F0EEE9] rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-[#1A1A2E] focus:ring-4 focus:ring-[#FF6B2B]/5 focus:border-[#FF6B2B]/20 transition-all outline-none appearance-none"
                                            >
                                                {BUSINESS_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Link WhatsApp (Broadcast)</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F0EEE9] group-focus-within:text-[#FF6B2B] transition-colors" size={20} />
                                            <input
                                                required
                                                type="tel"
                                                value={formData.waNumber}
                                                onChange={(e) => setFormData({ ...formData, waNumber: e.target.value })}
                                                className="w-full bg-[#FAFAF8] border border-[#F0EEE9] rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-[#1A1A2E] focus:ring-4 focus:ring-[#FF6B2B]/5 focus:border-[#FF6B2B]/20 transition-all outline-none"
                                                placeholder="Contoh: 08123456789"
                                            />
                                        </div>
                                        <p className="text-[10px] font-medium text-[#94A3B8] mt-2 italic px-1">* Digunakan sebagai pengirim otomatis di modul WA Marketing.</p>
                                    </div>
                                </div>

                                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                            <Shield size={20} />
                                        </div>
                                        <p className="text-[11px] font-bold text-[#94A3B8] leading-tight max-w-[240px]">
                                            Data profil bisni kamu aman dan terenkripsi di server kami.
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className={`w-full sm:w-auto px-10 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${saveSuccess
                                            ? 'bg-emerald-500 text-white shadow-emerald-500/20 translate-y-[-2px]'
                                            : 'bg-[#FF6B2B] text-white hover:bg-[#E85A1D] shadow-[#FF6B2B]/20 disabled:opacity-50'
                                            }`}
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : saveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                                        {isSaving ? 'Menyimpan...' : saveSuccess ? 'Data Disimpan!' : 'Update Profil'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-rose-50/30 rounded-[32px] border border-rose-100/50 p-10 flex flex-col sm:flex-row items-center justify-between gap-6 group hover:bg-rose-50 transition-colors">
                            <div className="text-center sm:text-left">
                                <h3 className="font-bold text-lg text-rose-600 tracking-tight">Ganti Rencana atau Hapus Bisnis</h3>
                                <p className="text-sm font-medium text-rose-400 mt-1">Semua data pesanan dan produk akan dihapus permanen.</p>
                            </div>
                            <button className="px-8 py-4 rounded-2xl border-2 border-rose-200 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all">
                                Tutup Bisnis
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
