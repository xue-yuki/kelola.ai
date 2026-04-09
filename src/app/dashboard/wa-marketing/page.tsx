"use client";

import { useState, useEffect } from "react";
import {
    Send,
    Users,
    Sparkles,
    MessageSquare,
    Smartphone,
    History,
    Search,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Copy,
    ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const SEGMENTS = [
    { id: 'all', name: 'Semua Pelanggan', count: 120, icon: Users },
    { id: 'loyal', name: 'Pelanggan Setia (Top 20%)', count: 24, icon: Sparkles },
    { id: 'inactive', name: 'Tidak Aktif > 30 Hari', count: 45, icon: History },
];

const TEMPLATES = [
    { id: 1, name: "Promo Flash Sale", text: "Halo [Nama]! Spesial untuk kamu, dapatkan Flash Sale 50% untuk produk [Produk] hari ini saja. Yuk pesan sekarang di Kelola.ai!" },
    { id: 2, name: "Sapaan Pelanggan", text: "Hai [Nama], sudah lama ya tidak berkunjung ke toko kami. Ada menu baru lho! Sampai jumpa ya." },
    { id: 3, name: "Update Stok", text: "Kabar gembira [Nama]! Stok [Produk] yang kamu tunggu sudah tersedia kembali. Segera amankan sebelum kehabisan!" },
];

export default function WAMarketingPage() {
    const supabase = createClient();
    const [message, setMessage] = useState("");
    const [selectedSegment, setSelectedSegment] = useState(SEGMENTS[0]);
    const [isSending, setIsSending] = useState(false);
    const [sendProgress, setSendProgress] = useState(0);
    const [isSent, setIsSent] = useState(false);

    const handleSend = () => {
        if (!message.trim()) return;
        setIsSending(true);
        setSendProgress(0);

        // Simulating the broadcast sending process
        const interval = setInterval(() => {
            setSendProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsSending(false);
                    setIsSent(true);
                    setTimeout(() => setIsSent(false), 5000);
                    return 100;
                }
                return prev + 5;
            });
        }, 100);
    };

    const applyTemplate = (text: string) => {
        setMessage(text);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white/90 tracking-tight mb-2">WhatsApp Marketing</h1>
                    <p className="text-white/40 font-medium">Kirim promosi dan sapa pelangganmu secara massal.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Composer (Left) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#161616]/90 backdrop-blur-2xl p-8 rounded-[32px] border border-white/5 shadow-2xl flex flex-col gap-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 pl-1">Target Audiens</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {SEGMENTS.map((seg) => {
                                    const Icon = seg.icon;
                                    return (
                                        <button
                                            key={seg.id}
                                            onClick={() => setSelectedSegment(seg)}
                                            className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${selectedSegment.id === seg.id
                                                    ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                                                    : 'bg-white/5 border-white/5 text-white/50 hover:border-white/10 hover:text-white/80'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            <div>
                                                <p className="text-xs font-black tracking-tight">{seg.name}</p>
                                                <p className={`text-[10px] font-bold ${selectedSegment.id === seg.id ? 'text-white/60' : 'text-white/30'}`}>{seg.count} Pelanggan</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 pl-1">Isi Pesan Broadcast</label>
                                <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">Gunakan [Nama] untuk personalisasi</span>
                            </div>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tulis pesan promosi kamu di sini..."
                                className="w-full h-48 bg-[#111] border border-white/5 rounded-[24px] p-6 text-sm font-medium text-white/90 placeholder:text-white/30 focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all outline-none resize-none"
                            />
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex-1 text-[10px] font-bold text-white/40 flex items-center gap-2">
                                <AlertCircle size={14} className="text-amber-500" />
                                Pastikan nomor WhatsApp kamu sudah aktif untuk menghindari banned.
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={isSending || !message.trim()}
                                className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${isSending ? 'bg-white/5 text-white/50' : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:bg-white/5 disabled:text-white/30 shadow-orange-500/20'
                                    }`}
                            >
                                {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                {isSending ? `Mengirim ${sendProgress}%` : 'Kirim Broadcast'}
                            </button>
                        </div>
                    </div>

                    {/* Quick Templates */}
                    <div className="bg-[#161616]/90 backdrop-blur-2xl p-8 rounded-[32px] border border-white/5 shadow-2xl space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                <Copy size={18} />
                            </div>
                            <h3 className="font-black text-white/90 tracking-tight">Template Cepat</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {TEMPLATES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => applyTemplate(t.text)}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left hover:border-orange-500/30 hover:bg-white/10 hover:shadow-2xl transition-all group"
                                >
                                    <p className="font-black text-xs text-white/90 mb-2 truncate uppercase tracking-widest">{t.name}</p>
                                    <p className="text-[10px] text-white/40 font-medium line-clamp-3 leading-relaxed mb-4 group-hover:text-white/60 transition-colors">{t.text}</p>
                                    <p className="text-[9px] font-black text-orange-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Gunakan <ArrowRight size={10} /></p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview (Right) */}
                <div className="space-y-6">
                    <div className="bg-[#161616]/90 backdrop-blur-2xl p-8 rounded-[32px] border border-white/5 shadow-2xl flex flex-col items-center">
                        <div className="w-full flex items-center justify-between mb-8">
                            <h3 className="font-black text-xs uppercase tracking-widest text-white/40">Preview Pesan</h3>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                            </div>
                        </div>

                        {/* Phone Mockup */}
                        <div className="relative w-64 h-[440px] bg-black rounded-[40px] border-[6px] border-[#111] shadow-2xl p-2">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#111] rounded-b-[20px]" />
                            <div className="h-full bg-[#111b21] rounded-[30px] overflow-hidden flex flex-col border border-white/5">
                                <div className="bg-[#202c33] p-3 pt-6 flex items-center gap-2 border-b border-white/5">
                                    <div className="w-6 h-6 rounded-full bg-white/10" />
                                    <div className="w-20 h-2 bg-white/20 rounded" />
                                </div>
                                <div className="flex-1 p-3 space-y-3 relative overflow-y-auto bg-[#0b141a]">
                                    {message && (
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="bg-[#005c4b] p-3 rounded-2xl rounded-tr-none shadow-sm ml-4"
                                        >
                                            <p className="text-[10px] text-white/90 font-medium leading-[1.4] whitespace-pre-wrap">
                                                {message.replace("[Nama]", "Budi")}
                                            </p>
                                            <p className="text-[8px] text-white/50 text-right mt-1">11:08</p>
                                        </motion.div>
                                    )}
                                </div>
                                <div className="bg-[#202c33] p-3 flex items-center gap-2 border-t border-white/5">
                                    <div className="w-full h-8 bg-[#2a3942] rounded-full" />
                                    <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
                                        <Send size={12} className="text-[#111b21]" fill="currentColor" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analytics Summary */}
                    <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 p-8 rounded-[32px] text-white/90 overflow-hidden relative group backdrop-blur-xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="text-orange-400" size={20} />
                                <h4 className="font-black tracking-tight">Estimasi Jangkauan</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/50 font-bold uppercase tracking-widest">Terkirim</span>
                                    <span className="font-black text-xl text-white">{selectedSegment.count}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/50 font-bold uppercase tracking-widest">Rate Dibaca</span>
                                    <span className="font-black text-xl text-white">~85%</span>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-[10px] font-bold text-white/40 leading-relaxed">
                                        WhatsApp memiliki open rate 4x lebih tinggi dibanding Email Marketing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Backdrop */}
            <AnimatePresence>
                {isSent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#161616] border border-white/10 rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-rose-500" />
                            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-white/90 tracking-tight mb-2">Pesan Terkirim!</h2>
                            <p className="text-sm font-medium text-white/40 mb-8 leading-relaxed">
                                Broadcast kamu sedang diproses dan dikirim ke <strong className="text-white/90">{selectedSegment.count}</strong> pelanggan.
                            </p>
                            <button
                                onClick={() => setIsSent(false)}
                                className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                Kembali ke Menu
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
