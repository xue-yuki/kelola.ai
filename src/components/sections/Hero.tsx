"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bot, TrendingUp, Sparkles, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

const INCOMING_ORDERS = [
    { item: "Nasi Goreng Spesial x2", price: "Rp 50.000" },
    { item: "Bakso Jumbo x3", price: "Rp 54.000" },
    { item: "Es Kopi Gula Aren x1", price: "Rp 18.000" },
    { item: "Ayam Bakar x2", price: "Rp 72.000" }
];

const AI_INSIGHTS = [
    "Es Kopi Gula Aren sangat diminati hari ini. Siapkan stok lebih!",
    "Penjualan tertinggi pukul 11.00–13.00. Tambah promo siang!",
    "Produk terlaris minggu ini: Nasi Goreng Spesial 🏆"
];

function Counter({ from, to }: { from: number; to: number }) {
    const [count, setCount] = useState(from);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;
        const duration = 2000;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;

            if (progress < duration) {
                const easeOutQuart = 1 - Math.pow(1 - progress / duration, 4);
                setCount(Math.floor(from + (to - from) * easeOutQuart));
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(to);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [from, to]);

    const formatted = new Intl.NumberFormat('id-ID').format(count);
    return <>{`Rp ${formatted}`}</>;
}

export default function Hero() {
    const [orderIndex, setOrderIndex] = useState(0);
    const [insightIndex, setInsightIndex] = useState(0);
    const [showInsight, setShowInsight] = useState(false);

    useEffect(() => {
        // Cycle orders every 3 seconds
        const orderInterval = setInterval(() => {
            setOrderIndex((prev) => (prev + 1) % INCOMING_ORDERS.length);
        }, 3000);

        // Initial delay for AI Insight, then cycle every 5 seconds
        const insightTimeout = setTimeout(() => {
            setShowInsight(true);
            const insightInterval = setInterval(() => {
                setInsightIndex((prev) => (prev + 1) % AI_INSIGHTS.length);
            }, 5000);
            return () => clearInterval(insightInterval);
        }, 1500);

        return () => {
            clearInterval(orderInterval);
            clearTimeout(insightTimeout);
        };
    }, []);

    return (
        <section className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-background">
            {/* Background Animated Blobs */}
            <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-blob" />
            <div className="absolute top-1/3 -right-64 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px] mix-blend-multiply opacity-50 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-32 left-1/3 w-[400px] h-[400px] bg-amber-200/20 rounded-full blur-[100px] mix-blend-multiply opacity-60 animate-blob animation-delay-4000" />

            <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex flex-col gap-6"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 w-max font-medium text-sm">
                            <Sparkles size={16} />
                            <span>AI Terpintar untuk UMKM Indonesia</span>
                        </div>

                        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] text-text-dark tracking-tight">
                            Bisnis Lokal Kamu, <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                                Dikelola Lebih Cerdas
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-text-muted leading-relaxed max-w-xl">
                            Dari pesanan WhatsApp otomatis, kasir digital, hingga laporan AI — semua dalam satu platform terjangkau.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <Link
                                href="#daftar"
                                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-white font-medium text-lg hover:bg-secondary hover:shadow-[0_0_25px_rgba(255,107,43,0.4)] transition-all duration-300 transform hover:-translate-y-1"
                            >
                                Mulai Gratis
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="#demo"
                                className="flex items-center justify-center px-8 py-4 rounded-xl bg-white text-text-dark font-medium text-lg border-2 border-gray-200 hover:border-primary hover:text-primary transition-all duration-300"
                            >
                                Lihat Demo
                            </Link>
                        </div>

                        <div className="flex items-center gap-4 mt-6">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-gray-200 shadow-sm flex items-center justify-center text-xs overflow-hidden`}>
                                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt={`User ${i}`} />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm text-text-muted">
                                <span className="font-bold text-text-dark">500+</span> UMKM telah bergabung
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Visual Mockup (Clean & Aesthetic) */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{
                            opacity: 1,
                            x: 0
                        }}
                        transition={{
                            opacity: { duration: 0.8, ease: "easeOut", delay: 0.2 },
                            x: { duration: 0.8, ease: "easeOut", delay: 0.2 }
                        }}
                        className="relative"
                    >
                        {/* Main Mockup Card: Glassmorphic and subtle shadows */}
                        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white relative z-20 overflow-hidden group">

                            <div className="flex justify-between items-center border-b border-gray-100/60 pb-5 mb-5">
                                <div>
                                    <h3 className="font-bold text-lg text-text-dark">Dashboard Omzet</h3>
                                    <p className="text-xs text-text-muted mt-0.5">Hari ini, 24 Okt</p>
                                </div>
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="bg-green-50 text-green-600 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-green-100/50"
                                >
                                    <TrendingUp size={14} /> +12.5%
                                </motion.div>
                            </div>

                            {/* Animated Revenue Counter */}
                            <div className="mb-8">
                                <p className="text-sm text-text-muted font-medium mb-1.5">Total Pendapatan</p>
                                <div className="font-display font-bold text-4xl text-text-dark tracking-tight">
                                    <Counter from={0} to={2450000} />
                                </div>
                            </div>

                            {/* Chart Mockup: Softer bars and gradients */}
                            <div className="h-28 w-full flex items-end justify-between gap-3 mb-8 border-b border-gray-100/50 pb-4 relative">
                                {/* Subtle horizontal grid lines */}
                                <div className="absolute w-full top-0 h-px bg-gray-100/50" />
                                <div className="absolute w-full top-1/2 h-px bg-gray-100/50" />

                                {[40, 60, 30, 80, 50, 90, 70].map((height, i) => (
                                    <div key={i} className="w-full h-full flex items-end relative group-hover:opacity-90 transition-opacity">
                                        {/* Background track for bars */}
                                        <div className="absolute inset-0 bg-gray-50/50 rounded-full w-full" />

                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${height}%` }}
                                            transition={{ duration: 1.2, delay: 0.5 + (i * 0.1), ease: "circOut" }}
                                            className={`relative w-full rounded-full z-10 ${i === 6
                                                    ? 'bg-gradient-to-t from-primary/80 to-primary shadow-[0_4px_15px_rgba(255,107,43,0.3)]'
                                                    : 'bg-gradient-to-t from-gray-200 to-gray-200/50'
                                                }`}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Order Notification Row */}
                            <div className="h-[84px] mb-5 relative overflow-hidden">
                                <AnimatePresence mode="popLayout">
                                    <motion.div
                                        key={orderIndex}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-[0_5px_20px_-5px_rgba(0,0,0,0.05)] border border-gray-50 w-full"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-green-50 text-green-500 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                                <MessageCircle size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-text-dark">Pesanan via WA</h4>
                                                <p className="text-xs text-text-muted mt-0.5">{INCOMING_ORDERS[orderIndex].item}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-bold text-sm text-text-dark">{INCOMING_ORDERS[orderIndex].price}</div>
                                            <div className="text-[10px] text-green-500 font-bold tracking-wider mt-0.5">✅ LUNAS</div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* AI Insight Card */}
                            <div className="h-[100px]">
                                <AnimatePresence mode="wait">
                                    {showInsight && (
                                        <motion.div
                                            key={insightIndex}
                                            initial={{ opacity: 0, filter: "blur(4px)" }}
                                            animate={{ opacity: 1, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, filter: "blur(4px)" }}
                                            transition={{ duration: 0.6 }}
                                            className="bg-gradient-to-br from-primary/5 to-transparent rounded-2xl p-5 border border-primary/10 flex gap-4 h-full items-start"
                                        >
                                            <div className="bg-white p-2 text-primary rounded-xl shadow-sm border border-primary/5 shrink-0">
                                                <Bot size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-primary mb-1">Insight AI Hari Ini</h4>
                                                <p className="text-xs text-text-dark/80 leading-relaxed font-medium">
                                                    {AI_INSIGHTS[insightIndex]}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                        </div>

                        {/* Glowing Backdrop behind Mockup (Smoother glow) */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary/30 rounded-[3rem] blur-3xl opacity-20 transform scale-95 translate-y-6 -z-10" />
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
