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
    Bell
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

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
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Pengaturan</h1>
                <p className="text-slate-500 font-medium">Kelola informasi bisnis dan preferensi akun kamu.</p>
            </div>

            {isLoading ? (
                <div className="py-20 flex justify-center">
                    <Loader2 className="animate-spin w-10 h-10 text-orange-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Navigation/Tabs Placeholder */}
                    <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm text-sm font-black text-orange-600">
                            <Building2 size={18} /> Profil Bisnis
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:bg-white transition-all">
                            <Bell size={18} /> Notifikasi
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:bg-white transition-all">
                            <Shield size={18} /> Keamanan
                        </button>
                    </div>

                    {/* Main Settings Form */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-50">
                                <h2 className="font-black text-lg text-slate-900 tracking-tight">Informasi Dasar</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Nama Bisnis</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                                            <input
                                                required
                                                type="text"
                                                value={formData.businessName}
                                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Jenis Bisnis</label>
                                        <div className="relative group">
                                            <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                                            <select
                                                required
                                                value={formData.businessType}
                                                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all outline-none appearance-none"
                                            >
                                                {BUSINESS_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Nomor WhatsApp</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                                            <input
                                                required
                                                type="tel"
                                                value={formData.waNumber}
                                                onChange={(e) => setFormData({ ...formData, waNumber: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-between gap-4">
                                    <p className="text-[10px] font-bold text-slate-400 max-w-[200px] leading-relaxed">
                                        Perubahan pada nama bisnis akan langsung terlihat di struk dan dashboard.
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg ${saveSuccess
                                                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20 disabled:opacity-50'
                                            }`}
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : saveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                                        {isSaving ? 'Menyimpan...' : saveSuccess ? 'Berhasil Simpan' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Danger Zone Placeholder */}
                        <div className="bg-rose-50/50 rounded-[32px] border border-rose-100/50 p-8 flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-rose-600 tracking-tight">Zona Bahaya</h3>
                                <p className="text-xs font-bold text-rose-400 mt-1 uppercase tracking-widest">Hapus akun dan semua data bisnis.</p>
                            </div>
                            <button className="px-5 py-2.5 rounded-xl border border-rose-200 text-rose-500 text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">
                                Tutup Bisnis
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
