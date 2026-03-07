"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Sparkles, TrendingUp, MessageSquare, Users } from "lucide-react";
import { useState, useEffect } from "react";

export default function AuthLayout({
    children,
    title,
    subtitle,
    showVisual = true,
}: {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    showVisual?: boolean;
}) {


    return (
        <div className="min-h-screen bg-white lg:bg-[#0a0a0a] text-white flex flex-col lg:flex-row overflow-hidden font-sans selection:bg-orange-500/30">
            {/* Left Panel: Minimalist White (60% on Desktop) */}
            {showVisual && (
                <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-[#fafafa]">
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 z-0">
                        {/* Soft Mesh Gradients */}
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                x: [0, 50, 0],
                                y: [0, 30, 0],
                            }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-orange-100 rounded-full blur-[120px] opacity-40"
                        />
                        <motion.div
                            animate={{
                                scale: [1.2, 1, 1.2],
                                x: [0, -40, 0],
                                y: [0, -50, 0],
                            }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-rose-100 rounded-full blur-[100px] opacity-30"
                        />

                        {/* Minimalist Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                    </div>

                    {/* Dynamic Data Content (Floating Glass Cells) */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        {/* Floating Mini Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="absolute top-[20%] right-[15%] w-56 p-5 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_20px_40px_rgba(0,0,0,0.04)]"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 rounded-xl bg-green-50 text-green-600">
                                    <TrendingUp size={16} />
                                </div>
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+24%</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Omzet Harian</p>
                                <p className="text-xl font-bold text-gray-800">Rp 2.450.000</p>
                            </div>
                            <div className="mt-4 flex items-end gap-1 h-8">
                                {[30, 50, 40, 70, 50, 90, 60].map((h, i) => (
                                    <div key={i} className="flex-1 bg-gray-100 rounded-full relative overflow-hidden h-full">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ delay: 1 + (i * 0.1), duration: 0.8 }}
                                            className="absolute bottom-0 w-full bg-gradient-to-t from-orange-400 to-orange-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>



                        {/* Social Proof Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.2 }}
                            className="absolute bottom-[10%] right-[10%] px-5 py-3 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm flex items-center gap-3"
                        >
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                        <img src={`https://i.pravatar.cc/50?img=${i + 15}`} alt="User" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                                <Users size={12} className="text-orange-500" />
                                2,000+ UMKM Bergabung
                            </span>
                        </motion.div>
                    </div>

                    {/* Content Overlay */}
                    <div className="relative z-20 w-full h-full flex flex-col justify-between p-16 xl:p-24">
                        <Link href="/" className="flex items-center gap-1 group">
                            <span className="font-display font-bold text-3xl tracking-tight text-[#1a1a1a] group-hover:text-orange-500 transition-colors">
                                kelola
                            </span>
                            <span className="text-orange-600 font-bold text-3xl">.ai</span>
                        </Link>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="max-w-xl"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/5 border border-orange-500/10 text-orange-600 text-sm font-semibold mb-8">
                                <Sparkles size={14} />
                                <span>Solusi Cerdas UMKM Indonesia</span>
                            </div>

                            <h1 className="text-4xl xl:text-6xl font-black leading-[1.1] mb-8 text-[#111111] tracking-tight">
                                Transformasi <br />
                                Bisnis Lebih <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600">Cepat.</span>
                            </h1>

                            <div className="space-y-6">
                                {[
                                    "Otomasi WhatsApp Marketing & Sales.",
                                    "Analisis Keuangan berbasis AI real-time.",
                                    "Manajemen stok dalam satu platform.",
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + (i * 0.1) }}
                                        className="flex items-center gap-4 group"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-orange-600 border border-orange-100 group-hover:scale-110 transition-transform">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <p className="text-[#444] font-medium group-hover:text-[#111] transition-colors">{item}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <div className="text-[#999] text-xs font-medium tracking-widest uppercase">
                            Premium Business Operating System
                        </div>
                    </div>

                    <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/5 to-transparent pointer-events-none" />
                </div>
            )}

            {/* Right Panel: Form (Always dark for premium contrast) */}
            <div className={`w-full ${showVisual ? "lg:w-[40%]" : "lg:w-full"} flex flex-col relative z-30 bg-[#0a0a0a] shadow-[-20px_0_60px_rgba(0,0,0,0.5)]`}>

                {/* Mobile Specific Header (Minimalist White) */}
                <div className="lg:hidden p-8 bg-white border-b border-gray-100">
                    <Link href="/" className="flex items-center gap-1">
                        <span className="font-display font-bold text-2xl tracking-tight text-[#111]">
                            kelola
                        </span>
                        <span className="text-orange-600 font-bold text-2xl">.ai</span>
                    </Link>
                </div>

                <div className="absolute top-8 left-8 lg:left-12 z-40">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-[#999] lg:text-white/40 hover:text-black lg:hover:text-white transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Beranda</span>
                    </Link>
                </div>

                <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-20 relative z-10 w-full max-w-2xl mx-auto lg:max-w-none">


                    <div className="mb-10">
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl xl:text-4xl font-bold tracking-tight text-[#111] lg:text-white mb-3"
                        >
                            {title}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-[#666] lg:text-white/50 text-base xl:text-lg font-light leading-relaxed"
                        >
                            {subtitle}
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative z-10"
                    >
                        {children}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
