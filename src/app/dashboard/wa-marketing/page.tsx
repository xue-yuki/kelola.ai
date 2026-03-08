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
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">WhatsApp Marketing</h1>
                    <p className="text-slate-500 font-medium">Kirim promosi dan sapa pelangganmu secara massal.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Composer (Left) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.032)] flex flex-col gap-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Target Audiens</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {SEGMENTS.map((seg) => {
                                    const Icon = seg.icon;
                                    return (
                                        <button
                                            key={seg.id}
                                            onClick={() => setSelectedSegment(seg)}
                                            className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${selectedSegment.id === seg.id
                                                    ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20'
                                                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            <div>
                                                <p className="text-xs font-black tracking-tight">{seg.name}</p>
                                                <p className={`text-[10px] font-bold ${selectedSegment.id === seg.id ? 'text-white/60' : 'text-slate-400'}`}>{seg.count} Pelanggan</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Isi Pesan Broadcast</label>
                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Gunakan [Nama] untuk personalisasi</span>
                            </div>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tulis pesan promosi kamu di sini..."
                                className="w-full h-48 bg-slate-50 border border-slate-100 rounded-[24px] p-6 text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all outline-none resize-none"
                            />
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex-1 text-[10px] font-bold text-slate-400 flex items-center gap-2">
                                <AlertCircle size={14} className="text-amber-500" />
                                Pastikan nomor WhatsApp kamu sudah aktif untuk menghindari banned.
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={isSending || !message.trim()}
                                className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${isSending ? 'bg-slate-900 text-white' : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95 disabled:opacity-50'
                                    }`}
                            >
                                {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                {isSending ? `Mengirim ${sendProgress}%` : 'Kirim Broadcast'}
                            </button>
                        </div>
                    </div>

                    {/* Quick Templates */}
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                                <Copy size={18} />
                            </div>
                            <h3 className="font-black text-slate-800 tracking-tight">Template Cepat</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {TEMPLATES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => applyTemplate(t.text)}
                                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left hover:border-orange-500/30 hover:bg-white hover:shadow-lg transition-all group"
                                >
                                    <p className="font-black text-xs text-slate-900 mb-2 truncate uppercase tracking-widest">{t.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium line-clamp-3 leading-relaxed mb-4 group-hover:text-slate-600 transition-colors">{t.text}</p>
                                    <p className="text-[9px] font-black text-orange-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Gunakan <ArrowRight size={10} /></p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview (Right) */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center">
                        <div className="w-full flex items-center justify-between mb-8">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Preview Pesan</h3>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                            </div>
                        </div>

                        {/* Phone Mockup */}
                        <div className="relative w-64 h-[440px] bg-slate-900 rounded-[40px] border-[6px] border-slate-800 shadow-2xl p-2">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-800 rounded-b-[20px]" />
                            <div className="h-full bg-[#E5DDD5] rounded-[30px] overflow-hidden flex flex-col">
                                <div className="bg-[#075E54] p-3 pt-6 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white/20" />
                                    <div className="w-20 h-2 bg-white/30 rounded" />
                                </div>
                                <div className="flex-1 p-3 space-y-3 relative overflow-y-auto">
                                    {message && (
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="bg-[#DCF8C6] p-3 rounded-2xl rounded-tr-none shadow-sm ml-4"
                                        >
                                            <p className="text-[10px] text-slate-700 font-medium leading-[1.4] whitespace-pre-wrap">
                                                {message.replace("[Nama]", "Budi")}
                                            </p>
                                            <p className="text-[8px] text-slate-400 text-right mt-1">11:08</p>
                                        </motion.div>
                                    )}
                                </div>
                                <div className="bg-white p-3 flex items-center gap-2">
                                    <div className="w-full h-6 bg-slate-100 rounded-full" />
                                    <div className="w-6 h-6 rounded-full bg-[#128C7E] flex items-center justify-center">
                                        <Send size={10} className="text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analytics Summary */}
                    <div className="bg-slate-900 p-8 rounded-[32px] text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="text-orange-500" size={20} />
                                <h4 className="font-black tracking-tight">Estimasi Jangkauan</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/50 font-bold uppercase tracking-widest">Terkirim</span>
                                    <span className="font-black text-xl">{selectedSegment.count}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/50 font-bold uppercase tracking-widest">Rate Dibaca</span>
                                    <span className="font-black text-xl">~85%</span>
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
                        className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-rose-500" />
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Pesan Terkirim!</h2>
                            <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                                Broadcast kamu sedang diproses dan dikirim ke <strong>{selectedSegment.count}</strong> pelanggan.
                            </p>
                            <button
                                onClick={() => setIsSent(false)}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all"
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
