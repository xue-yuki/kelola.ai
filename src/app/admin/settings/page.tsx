"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Megaphone, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { saveGlobalBannerSettings, getGlobalBannerSettings } from "@/app/actions/global-settings";

export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    const [bannerMessage, setBannerMessage] = useState("");
    const [isBannerActive, setIsBannerActive] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const data = await getGlobalBannerSettings();
            if (data) {
                setBannerMessage(data.value || "");
                setIsBannerActive(data.is_active || false);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveGlobalBannerSettings(bannerMessage, isBannerActive);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error: any) {
            console.error("Error saving settings:", error);
            alert(`Gagal menyimpan pengaturan: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin w-12 h-12 text-primary" />
                <p className="font-bold text-text-muted text-sm uppercase tracking-widest">Memuat Pengaturan...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-black text-text-dark tracking-tight flex items-center gap-3 mb-2">
                    <Settings className="text-primary" size={32} />
                    Sistem Ops & Pengaturan
                </h1>
                <p className="text-text-muted font-medium">
                    Atur konfigurasi global platform Kelola.ai yang akan berdampak langsung ke seluruh klien.
                </p>
            </div>

            {/* Broadcast Banner Settings Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-100 rounded-[2rem] shadow-xl overflow-hidden p-8 sm:p-10 relative"
            >
                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="flex items-center gap-3 mb-8 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-primary flex items-center justify-center border border-primary/20">
                        <Megaphone size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl text-text-dark tracking-tight">Global Broadcast Banner</h2>
                        <p className="text-sm font-medium text-text-muted mt-0.5">
                            Kirim pengumuman massal yang akan muncul di *Dashboard Utama* semua klien merchant.
                        </p>
                    </div>
                </div>

                <div className="space-y-8 relative z-10">
                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 border border-gray-100">
                        <div>
                            <h3 className="font-bold text-text-dark text-sm mb-1">Status Banner</h3>
                            <p className="text-xs text-text-muted font-medium">Nyalakan untuk menampilkan pengumuman ini ke semua klien.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer group">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={isBannerActive}
                                onChange={(e) => setIsBannerActive(e.target.checked)}
                            />
                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                        </label>
                    </div>

                    {/* Message Input */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Pesan Pengumuman</label>
                            {isBannerActive && (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Banner Aktif
                                </span>
                            )}
                        </div>
                        <textarea
                            value={bannerMessage}
                            onChange={(e) => setBannerMessage(e.target.value)}
                            className="w-full min-h-[8rem] bg-white border border-gray-200 text-text-dark rounded-2xl p-5 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-y shadow-sm"
                            placeholder="Ketik pengumuman di sini... (Contoh: Server akan maintenance pada pukul 00:00 WIB malam ini)"
                        />
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end pt-6 border-t border-gray-100">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !bannerMessage.trim()}
                            className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg ${
                                saveSuccess
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 translate-y-[-2px]'
                                    : 'bg-primary text-white hover:bg-orange-600 hover:shadow-orange-500/25 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none'
                            }`}
                        >
                            {isSaving ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : saveSuccess ? (
                                <CheckCircle2 size={18} />
                            ) : (
                                <Save size={18} />
                            )}
                            
                            {isSaving ? 'Menyimpan...' : saveSuccess ? 'Berhasil Disimpan!' : 'Simpan Pengaturan'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
