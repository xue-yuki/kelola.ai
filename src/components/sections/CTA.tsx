"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { ArrowRight, Sparkles, Rocket } from "lucide-react";
import Link from "next/link";
import { MouseEvent } from "react";

export default function CTA() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <section className="py-24 md:py-32 bg-[#0a0a0a] relative px-4 md:px-8 overflow-hidden">
            {/* Full-screen ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-orange-500/10 rounded-full blur-[200px] pointer-events-none mix-blend-screen" />

            <div
                className="container mx-auto max-w-6xl relative z-10 w-full"
                onMouseMove={handleMouseMove}
            >
                <div className="relative rounded-[3rem] overflow-hidden group">

                    {/* Dark glassmorphism base */}
                    <div className="absolute inset-0 bg-[#111111]/90 backdrop-blur-xl" />

                    {/* Animated gradient border */}
                    <div className="absolute inset-0 rounded-[3rem] p-[1px]">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 via-rose-500/30 to-amber-500/30 rounded-[3rem] opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>

                    {/* Spotlight on hover */}
                    <motion.div
                        className="absolute -inset-px rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                            background: useMotionTemplate`
                                radial-gradient(
                                    800px circle at ${mouseX}px ${mouseY}px,
                                    rgba(255,107,43,0.08),
                                    transparent 60%
                                )
                            `,
                        }}
                    />

                    {/* Inner glow blobs */}
                    <div className="absolute -top-32 -left-32 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] mix-blend-screen pointer-events-none animate-pulse" />
                    <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-rose-500/15 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse" style={{ animationDelay: "1.5s" }} />

                    {/* Grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="relative z-10 p-12 md:p-20 lg:p-24 text-center flex flex-col items-center justify-center min-h-[500px]"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-8 backdrop-blur-md"
                        >
                            <Rocket size={14} />
                            <span>Mulai Transformasi Digital</span>
                        </motion.div>

                        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 tracking-tight max-w-4xl leading-[1.1]">
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50">
                                Siap Bawa Bisnis Kamu ke
                            </span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400">
                                Level Berikutnya?
                            </span>
                        </h2>

                        <p className="text-white/60 text-lg md:text-xl font-light mb-12 max-w-2xl leading-relaxed">
                            Bergabung dengan <strong className="text-white/90 font-medium">ratusan UMKM</strong> yang sudah lebih cerdas memangkas ribetnya operasional harian bersama Kelola.ai
                        </p>

                        {/* CTA Button */}
                        <Link
                            href="/register"
                            className="group relative inline-flex items-center justify-center p-[2px] rounded-2xl overflow-hidden transition-transform active:scale-95 hover:-translate-y-1 duration-300"
                        >
                            {/* Animated spinning border */}
                            <span className="absolute inset-0 bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 opacity-80 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_6s_linear_infinite]" />

                            {/* Inner button */}
                            <span className="relative flex items-center justify-center gap-3 bg-[#111] px-10 md:px-12 py-5 rounded-[14px] transition-all duration-300 group-hover:bg-[#0a0a0a]">
                                <Sparkles size={20} className="text-orange-400 group-hover:rotate-12 transition-transform duration-300" />
                                <span className="text-white font-bold text-lg md:text-xl">Mulai Gratis Sekarang</span>
                                <ArrowRight size={20} className="text-orange-400 group-hover:translate-x-2 transition-transform duration-300" />
                            </span>

                            {/* Button glow shadow */}
                            <span className="absolute -inset-4 bg-orange-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10" />
                        </Link>

                        <p className="mt-8 text-white/40 text-sm font-light flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Tanpa kartu kredit · Setup instan dalam 5 menit
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
