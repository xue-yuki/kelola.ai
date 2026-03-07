"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, LayoutDashboard, CheckCheck, Send, ArrowRight } from "lucide-react";

const CHAT_MESSAGES = [
    { id: 1, text: "Halo min, pesen Nasi Goreng Spesial 2 porsi bisa?", isBot: false },
    { id: 2, text: "Halo kak! 🙏 Pesanan 2x Nasi Goreng Spesial tercatat. Totalnya Rp 50.000. Tekan tombol di bawah untuk konfirmasi pesanan.", isBot: true },
    { id: 3, text: "Ya, Konfirmasi", isBot: false },
    { id: 4, text: "✅ Pesanan terkonfirmasi dan sudah masuk antrean dapur. Estimasi siap: 15 Menit. Terima kasih! 🎉", isBot: true },
];

export default function Simulation() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // 0 = chat 1, 1 = chat 2, 2 = chat 3, 3 = chat 4, 4 = wait & update dashboard, 5 = wait end & reset
        const interval = setInterval(() => {
            setStep((prev) => (prev >= 6 ? 0 : prev + 1));
        }, 1800);
        return () => clearInterval(interval);
    }, []);

    // Dashboard calculations based on step
    const startingOmzet = 1250000;
    const increasedOmzet = startingOmzet + 50000;
    const currentOmzet = step >= 4 ? increasedOmzet : startingOmzet;

    const formattedOmzet = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(currentOmzet);

    // Determines if data is syncing to dashboard
    const isSyncing = step === 4;

    return (
        <section id="demo" className="py-24 md:py-32 bg-[#0a0a0a] text-white relative overflow-hidden flex items-center justify-center min-h-screen">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

            {/* Minimal Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />

            <div className="container mx-auto px-6 md:px-12 max-w-7xl relative z-10">
                <div className="text-center mb-16 md:mb-24 max-w-3xl mx-auto flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 font-medium text-sm mb-6 backdrop-blur-md"
                    >
                        <Smartphone size={16} className="text-orange-400" />
                        <span>Simulasi Langsung</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/30"
                    >
                        Tonton <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">Keajaiban</span> Sinkronisasi Real-Time
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-white/60 text-lg lg:text-xl font-light leading-relaxed max-w-2xl"
                    >
                        Saksikan bagaimana pesanan yang otomatis dibalas oleh AI Langsung tercatat dengan rapi di dashboard kasir Anda dalam hitungan detik.
                    </motion.p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 items-center justify-center relative">

                    {/* Background Connection Line (Desktop) */}
                    <div className="hidden lg:block absolute top-[45%] left-[30%] right-[30%] h-px bg-white/10 overflow-hidden z-0">
                        {isSyncing && (
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                                className="w-1/2 h-full bg-gradient-to-r from-transparent via-orange-500 to-transparent blur-[2px]"
                            />
                        )}
                    </div>

                    {/* Left: WhatsApp Mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative w-full max-w-[340px] z-10"
                    >
                        <div className="bg-[#111111]/80 backdrop-blur-2xl rounded-[3rem] border-8 border-white/10 overflow-hidden shadow-2xl h-[600px] flex flex-col relative group">

                            {/* Device Notch */}
                            <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50 pointer-events-none">
                                <div className="w-32 h-6 bg-white/10 rounded-b-xl backdrop-blur-md" />
                            </div>

                            {/* WA Header */}
                            <div className="bg-[#0a0a0a] pt-10 pb-4 px-5 flex items-center gap-4 z-10 border-b border-white/5 shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 p-[2px] shadow-lg shadow-green-500/20">
                                    <div className="w-full h-full bg-[#111] rounded-full flex items-center justify-center font-bold text-sm text-green-400">
                                        AI
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white/90 text-sm">Kelola.ai Bot</h3>
                                    <div className="text-[11px] text-green-400 flex items-center gap-1 mt-0.5">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
                                    </div>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 relative bg-[#0f0f0f] scrollbar-hide">
                                {/* Subtle chat background details */}
                                <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-screen bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

                                <AnimatePresence>
                                    {CHAT_MESSAGES.map((msg, idx) => (
                                        idx <= step && (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
                                                className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                                            >
                                                <div className={`max-w-[85%] px-4 py-2.5 shadow-sm text-[13px] relative leading-relaxed ${msg.isBot
                                                    ? 'bg-[#1a1a1a] text-white/90 rounded-2xl rounded-tl-sm border border-white/5'
                                                    : 'bg-emerald-600/20 text-emerald-50 rounded-2xl rounded-tr-sm border border-emerald-500/20'
                                                    }`}>
                                                    {msg.text}
                                                    <div className="text-[10px] text-white/40 text-right mt-1.5 flex items-center justify-end gap-1 font-mono">
                                                        10:42 <CheckCheck size={12} className={idx < step ? "text-emerald-400" : "text-white/40"} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    ))}

                                    {/* Typing Indicators */}
                                    {(step === 0 || step === 2) && (
                                        <motion.div
                                            key="typing"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="flex justify-start pt-2"
                                        >
                                            <div className="bg-[#1a1a1a] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 w-max items-center shadow-lg">
                                                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* WA Input Footer */}
                            <div className="bg-[#0a0a0a] p-4 flex gap-3 items-center border-t border-white/5">
                                <div className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-full px-5 py-3 text-[13px] text-white/40 font-light flex items-center shadow-inner">
                                    Ketik pesan...
                                </div>
                                <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 transition-transform active:scale-95">
                                    <Send size={16} className="ml-1" />
                                </div>
                            </div>
                        </div>

                        {/* Glow under phone */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-white/5 blur-xl rounded-[100%] pointer-events-none" />
                    </motion.div>

                    {/* Sync Indicator (Mobile & Tablet) */}
                    <div className="lg:hidden flex flex-col items-center gap-2 text-orange-400 py-4">
                        <motion.div
                            animate={{ y: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            <ArrowRight className="rotate-90" />
                        </motion.div>
                        <span className="text-xs tracking-widest uppercase font-semibold text-orange-400/80">Real-time Sync</span>
                    </div>

                    {/* Right: Dashboard Mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative w-full max-w-[420px] z-10"
                    >
                        <div className="bg-[#161616]/90 backdrop-blur-2xl rounded-[2rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden group">

                            {/* Dashboard Glow Accent */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 blur-[60px] rounded-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" />

                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-display font-semibold text-xl text-white/90">Dashboard Kasir</h3>
                                <div className="p-2.5 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                                    <LayoutDashboard size={18} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="relative border border-white/5 bg-[#111]/50 p-5 rounded-2xl overflow-hidden group-hover:bg-[#1a1a1a]/50 transition-colors">
                                    <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Total Omzet</p>
                                    <motion.div
                                        key={formattedOmzet} // Force re-animation on value change
                                        initial={step >= 4 ? { opacity: 0, scale: 0.8, color: '#f97316' } : {}}
                                        animate={{ opacity: 1, scale: 1, color: '#fff' }}
                                        transition={{ duration: 0.5, type: 'spring' }}
                                        className="font-display font-bold text-2xl"
                                    >
                                        {formattedOmzet}
                                    </motion.div>

                                    {/* Mini chart visual */}
                                    <div className="absolute bottom-0 inset-x-0 h-8 opacity-20">
                                        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full stroke-orange-500 fill-orange-500/20">
                                            <path d="M0 20 L0 15 L20 12 L40 16 L60 8 L80 10 L100 2 L100 20 Z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="border border-white/5 bg-[#111]/50 p-5 rounded-2xl group-hover:bg-[#1a1a1a]/50 transition-colors">
                                    <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Pesanan</p>
                                    <motion.div
                                        key={step >= 4 ? 'up' : 'base'}
                                        initial={step >= 4 ? { opacity: 0, scale: 0.8, color: '#f97316' } : {}}
                                        animate={{ opacity: 1, scale: 1, color: '#fff' }}
                                        transition={{ duration: 0.5, type: 'spring' }}
                                        className="font-display font-bold text-2xl flex items-baseline gap-1"
                                    >
                                        {step >= 4 ? 43 : 42} <span className="text-xs font-normal text-white/30">porsi</span>
                                    </motion.div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-white/60 text-sm mb-4">Aktivitas Terbaru</h4>
                                <div className="flex flex-col gap-3">
                                    <AnimatePresence>
                                        {step >= 4 && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                                                animate={{ opacity: 1, x: 0, height: 'auto', marginBottom: '0.75rem' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex items-center justify-between shadow-[0_4px_20px_rgba(249,115,22,0.1)]"
                                            >
                                                <div className="flex gap-3 items-center">
                                                    <div className="bg-orange-500 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-lg shadow-orange-500/30">2x</div>
                                                    <div>
                                                        <p className="font-semibold text-[13px] text-white/90">Nasi Goreng Spesial</p>
                                                        <p className="text-[11px] text-white/50 mt-0.5 font-mono">WA: 0812-****</p>
                                                    </div>
                                                </div>
                                                <div className="font-semibold text-orange-400 text-sm tracking-wide">Rp 50rb</div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                        <div className="flex gap-3 items-center">
                                            <div className="bg-white/5 text-white/60 border border-white/10 w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs">1x</div>
                                            <div>
                                                <p className="font-medium text-[13px] text-white/80">Mie Goreng Telur</p>
                                                <p className="text-[11px] text-white/40 mt-0.5 font-mono">WA: 0856-****</p>
                                            </div>
                                        </div>
                                        <div className="font-medium text-white/60 text-sm">Rp 18rb</div>
                                    </div>

                                    <div className="bg-[#1a1a1a]/50 border border-white/5 p-4 rounded-xl flex items-center justify-between opacity-50">
                                        <div className="flex gap-3 items-center">
                                            <div className="bg-white/5 text-white/40 border border-white/10 w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs">3x</div>
                                            <div>
                                                <p className="font-medium text-[13px] text-white/60">Es Teh Manis</p>
                                                <p className="text-[11px] text-white/30 mt-0.5">Dine-in (Meja 4)</p>
                                            </div>
                                        </div>
                                        <div className="font-medium text-white/40 text-sm">Rp 15rb</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
