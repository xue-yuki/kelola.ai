"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTA() {
    return (
        <section className="py-24 bg-background relative px-4 md:px-8">
            <div className="container mx-auto max-w-6xl relative z-10 w-full overflow-hidden rounded-[3rem]">
                {/* Vibrant Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-amber-400 opacity-90" />

                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

                {/* Floating circles decor */}
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/20 rounded-full blur-3xl mix-blend-overlay pointer-events-none" />
                <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-yellow-400/30 rounded-full blur-3xl mix-blend-overlay pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 p-12 md:p-20 text-center flex flex-col items-center justify-center min-h-[400px]"
                >
                    <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white tracking-tight max-w-4xl leading-[1.1]">
                        Siap Bawa Bisnis Kamu ke Level Berikutnya?
                    </h2>

                    <p className="text-white/90 text-xl font-medium mb-10 max-w-2xl">
                        Bergabung dengan ratusan UMKM yang sudah lebih cerdas memangkas ribetnya operasional bersama Kelola.ai
                    </p>

                    <Link
                        href="#daftar"
                        className="group flex items-center justify-center gap-2 px-10 py-5 rounded-2xl bg-white text-primary font-bold text-xl hover:shadow-[0_20px_40px_rgba(255,255,255,0.3)] transition-all duration-300 transform hover:-translate-y-2"
                    >
                        Mulai Gratis Sekarang
                        <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                    </Link>

                    <p className="mt-6 text-white/70 text-sm">
                        Tanpa kartu kredit. Setup instan dalam 5 menit.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
