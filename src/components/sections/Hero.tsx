"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bot, TrendingUp, Sparkles, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function Hero() {
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

                    {/* Right Visual Mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="relative"
                    >
                        {/* Main Mockup Card */}
                        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 relative z-20 overflow-hidden group">

                            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                                <div>
                                    <h3 className="font-bold text-lg text-text-dark">Dashboard Omzet</h3>
                                    <p className="text-xs text-text-muted">Hari ini, 24 Okt</p>
                                </div>
                                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                    <TrendingUp size={14} /> +12.5%
                                </div>
                            </div>

                            {/* Chart Mockup */}
                            <div className="h-40 w-full flex items-end justify-between gap-2 mb-6">
                                {[40, 60, 30, 80, 50, 90, 70].map((height, i) => (
                                    <div key={i} className="w-full bg-gray-100 rounded-t-sm relative group-hover:bg-primary/5 transition-colors">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${height}%` }}
                                            transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                            className={`absolute bottom-0 w-full rounded-t-sm ${i === 5 ? 'bg-primary' : 'bg-secondary/40'}`}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Order Notification Row */}
                            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between mb-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 text-green-600 p-2 rounded-full">
                                        <MessageCircle size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-text-dark">Pesanan Masuk via WA</h4>
                                        <p className="text-xs text-text-muted">Nasi Goreng Spesial x2</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-sm text-text-dark">Rp 50.000</div>
                                    <div className="text-[10px] text-green-600 font-medium">Lunas</div>
                                </div>
                            </div>

                            {/* AI Insight Card */}
                            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 flex gap-3">
                                <div className="text-primary mt-0.5">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-primary">Insight AI Hari Ini</h4>
                                    <p className="text-xs text-text-dark leading-relaxed mt-1">
                                        Menu "Es Kopi Gula Aren" hari ini sangat diminati. Pertimbangkan untuk menyiapkan lebih banyak stok es batu dan susu.
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* Glowing Backdrop behind Mockup */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-3xl blur-2xl opacity-20 transform scale-[0.85] translate-y-4" />
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
