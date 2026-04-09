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
    LogOut,
    Smartphone,
    QrCode
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

    const [waStatus, setWaStatus] = useState("disconnected");
    const [waConnectedAt, setWaConnectedAt] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);

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
                if (business.wa_status) setWaStatus(business.wa_status);
                if (business.wa_connected_at) setWaConnectedAt(business.wa_connected_at);
            }
        } catch (error) {
            console.error("Error fetching business:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (waStatus === 'connecting') {
            interval = setInterval(() => {
                checkWaStatus();
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [waStatus, businessId]);

    const checkWaStatus = async () => {
        if (!businessId) return;
        try {
            const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3001";
            const response = await fetch(`${agentUrl}/api/status/${businessId}`, { cache: 'no-store' });
            const data = await response.json();
            
            setWaStatus(prevStatus => {
                if (data.status !== prevStatus) {
                    if (data.status === 'connected') {
                        const now = new Date().toISOString();
                        setWaConnectedAt(now);
                        supabase.from('businesses').update({ wa_status: 'connected', wa_connected_at: now }).eq('id', businessId).then();
                    } else if (data.status === 'disconnected') {
                        setWaConnectedAt(null);
                        supabase.from('businesses').update({ wa_status: 'disconnected', wa_connected_at: null }).eq('id', businessId).then();
                    }
                    return data.status;
                }
                return prevStatus;
            });

            if (data.status === 'connecting') {
                const qrRes = await fetch(`${agentUrl}/api/qr/${businessId}`, { cache: 'no-store' });
                const qrData = await qrRes.json();
                if (qrData.qr) setQrCode(qrData.qr);
            } else {
                setQrCode(null);
            }
        } catch (error) {
            console.error("Error polling WA status:", error);
        }
    };

    const handleConnectClick = async () => {
        setWaStatus('connecting');
        checkWaStatus();
    };

    const handleDisconnectClick = async () => {
        try {
            const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3001";
            const response = await fetch(`${agentUrl}/api/disconnect/${businessId}`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Immediate UI update
            setWaStatus('disconnected');
            setQrCode(null);
            setWaConnectedAt(null);
            
            // Update Supabase
            await supabase.from('businesses').update({ 
                wa_status: 'disconnected', 
                wa_connected_at: null 
            }).eq('id', businessId);
            
        } catch (error) {
            console.error("Error disconnecting WA:", error);
            alert("Gagal memutuskan koneksi WhatsApp. Pastikan Agent aktif. Error: " + (error as any).message);
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
                <h1 className="text-[32px] font-bold text-white/90 tracking-tight">Pengaturan Akun</h1>
                <p className="text-white/40 font-medium mt-1">Konfigurasi profile bisnis dan preferensi sistem kamu.</p>
            </div>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin w-12 h-12 text-orange-400" />
                    <p className="font-black text-white/30 text-[10px] uppercase tracking-widest">Memuat Data...</p>
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
                                    ? 'bg-[#111] text-white shadow-xl shadow-black/50 border border-white/10 translate-x-1'
                                    : 'bg-white/5 border border-transparent text-white/40 hover:border-orange-500/30 hover:text-white/90 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <tab.icon size={20} className={activeTab === tab.id ? 'text-orange-500' : 'group-hover:text-orange-400'} />
                                    <span className="text-sm font-bold tracking-tight">{tab.label}</span>
                                </div>
                                <ChevronRight size={16} className={`opacity-20 ${activeTab === tab.id ? 'opacity-100 text-orange-500' : ''}`} />
                            </button>
                        ))}

                        <div className="pt-6 border-t border-white/5 mt-4">
                            <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-500/80 hover:text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-sm">
                                <LogOut size={20} />
                                Keluar Akun
                            </button>
                        </div>
                    </div>

                    {/* Main Settings Panel */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-[#161616]/90 backdrop-blur-2xl rounded-[32px] border border-white/5 shadow-2xl overflow-hidden">
                            <div className="px-10 py-8 border-b border-white/5 bg-[#111]">
                                <h2 className="font-bold text-xl text-white/90 tracking-tight">Informasi Dasar Bisnis</h2>
                                <p className="text-xs font-medium text-white/40 mt-1">Gunakan informasi resmi untuk keperluan invoice dan laporan.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pl-1">Nama Brand / Bisnis</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-orange-500 transition-colors" size={20} />
                                            <input
                                                required
                                                type="text"
                                                value={formData.businessName}
                                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                                className="w-full bg-[#111] border border-white/5 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-white/90 focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pl-1">Kategori Industri</label>
                                        <div className="relative group">
                                            <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-orange-500 transition-colors" size={20} />
                                            <select
                                                required
                                                value={formData.businessType}
                                                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                                className="w-full bg-[#111] border border-white/5 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-white/90 focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all outline-none appearance-none"
                                            >
                                                {BUSINESS_TYPES.map(type => <option key={type} value={type} className="bg-[#111] text-white/90">{type}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pl-1">Link WhatsApp (Broadcast)</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-orange-500 transition-colors" size={20} />
                                            <input
                                                required
                                                type="tel"
                                                value={formData.waNumber}
                                                onChange={(e) => setFormData({ ...formData, waNumber: e.target.value })}
                                                className="w-full bg-[#111] border border-white/5 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-white/90 focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all outline-none"
                                                placeholder="Contoh: 08123456789"
                                            />
                                        </div>
                                        <p className="text-[10px] font-medium text-white/30 mt-2 italic px-1">* Digunakan sebagai pengirim otomatis di modul WA Marketing.</p>
                                    </div>
                                </div>

                                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/5 mt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                                            <Shield size={20} />
                                        </div>
                                        <p className="text-[11px] font-bold text-white/40 leading-tight max-w-[240px]">
                                            Data profil bisnis kamu aman dan terenkripsi di server kami.
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className={`w-full sm:w-auto px-10 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${saveSuccess
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 translate-y-[-2px]'
                                            : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20 disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none'
                                            }`}
                                    >
                                        {isSaving ? <Loader2 className="animate-spin text-white" size={18} /> : saveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                                        {isSaving ? 'Menyimpan...' : saveSuccess ? 'Data Disimpan!' : 'Update Profil'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* WhatsApp Connection */}
                        <div className="bg-[#161616]/90 backdrop-blur-2xl rounded-[32px] border border-white/5 shadow-2xl overflow-hidden p-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Smartphone className="text-orange-400" size={24} />
                                        <h2 className="font-bold text-xl text-white/90 tracking-tight">Koneksi WhatsApp</h2>
                                        
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5 ${
                                            waStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 
                                            waStatus === 'connecting' ? 'bg-amber-500/10 text-amber-400' :
                                            'bg-rose-500/10 text-rose-400'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                waStatus === 'connected' ? 'bg-emerald-500' : 
                                                waStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                                                'bg-rose-500'
                                            }`} />
                                            {waStatus === 'connected' ? 'Terhubung' : 
                                             waStatus === 'connecting' ? 'Menghubungkan...' : 
                                             'Belum Terhubung'}
                                        </div>
                                    </div>
                                    <p className="text-xs font-medium text-white/40">Hubungkan nomor WhatsApp untuk fitur balasan otomatis dan broadcast.</p>
                                </div>
                            </div>

                            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-8 items-center sm:items-start justify-between">
                                {waStatus === 'disconnected' && (
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between w-full gap-6">
                                        <div className="space-y-4">
                                            <p className="text-sm font-medium text-white/50 text-center sm:text-left max-w-md">
                                                Kamu belum menghubungkan sesi perangkat WhatsApp. Klik tombol di samping untuk mulai memindai kode QR.
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handleConnectClick}
                                            className="px-6 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm tracking-tight hover:bg-orange-600 transition-all flex-[0_0_auto]"
                                        >
                                            Hubungkan WhatsApp
                                        </button>
                                    </div>
                                )}

                                {waStatus === 'connecting' && (
                                    <div className="flex flex-col items-center justify-center w-full space-y-6 py-4">
                                        {qrCode ? (
                                            <div className="p-2 bg-white rounded-xl">
                                                <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
                                            </div>
                                        ) : (
                                            <div className="w-48 h-48 border border-white/10 rounded-xl flex items-center justify-center bg-white/5">
                                                <Loader2 className="animate-spin text-orange-400 w-8 h-8" />
                                            </div>
                                        )}
                                        <div className="text-center space-y-2">
                                            <div className="flex items-center justify-center gap-2 text-amber-400">
                                                <Loader2 className="animate-spin w-4 h-4" />
                                                <span className="font-bold text-sm">Menunggu scan...</span>
                                            </div>
                                            <p className="text-xs font-medium text-white/50 max-w-xs mx-auto">
                                                Buka WhatsApp &rarr; Linked Devices &rarr; Link a Device &rarr; Scan
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {waStatus === 'connected' && (
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between w-full gap-6">
                                        <div className="space-y-2 text-center sm:text-left">
                                            <p className="text-lg font-black tracking-tight text-white/90">
                                                {formData.waNumber || "Nomor Terhubung"}
                                            </p>
                                            <p className="text-xs font-bold text-white/30 uppercase tracking-widest">
                                                Terakhir terhubung: {waConnectedAt ? new Date(waConnectedAt).toLocaleString('id-ID') : '-'}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handleDisconnectClick}
                                            className="px-6 py-3 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 font-bold text-sm tracking-tight transition-all flex-[0_0_auto]"
                                        >
                                            Putuskan Koneksi
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-rose-500/5 rounded-[32px] border border-rose-500/20 p-10 flex flex-col sm:flex-row items-center justify-between gap-6 group hover:bg-rose-500/10 transition-colors backdrop-blur-xl">
                            <div className="text-center sm:text-left">
                                <h3 className="font-bold text-lg text-rose-400 tracking-tight">Ganti Rencana atau Hapus Bisnis</h3>
                                <p className="text-sm font-medium text-rose-400/60 mt-1">Semua data pesanan dan produk akan dihapus permanen.</p>
                            </div>
                            <button className="px-8 py-4 rounded-2xl border border-rose-500/30 text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all">
                                Tutup Bisnis
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
