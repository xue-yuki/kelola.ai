"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Info, Star } from "lucide-react";
import Link from "next/link";

const pricingTiers = [
    {
        name: "Starter",
        price: "49Ribu",
        description: "Cocok untuk UMKM pemula yang baru ingin mencoba otomatisasi.",
        features: [
            "Limit 1.000 Chat AI/bulan",
            "Dashboard Kasir Digital (POS)",
            "Manajemen Stok Otomatis",
            "Dukungan Multibahasa Daerah",
            "Laporan Harian + Mingguan",
            "Support Prioritas + Onboarding"
        ],
        highlight: false,
        buttonText: "Mulai Starter",
    },
    {
        name: "Basic",
        price: "79Ribu",
        description: "Bagi bisnis menengah yang butuh insight lebih dalam.",
        features: [
            "Limit 3.000 Chat AI/bulan",
            "Dashboard Kasir Digital (POS)",
            "Manajemen Stok Otomatis",
            "Dukungan Multibahasa Daerah",
            "Laporan Lengkap & Grafik visual",
            "AI Insight Mingguan",
            "Support Prioritas + Onboarding"
        ],
        highlight: false,
        buttonText: "Pilih Basic",
    },
    {
        name: "Kelola Pro",
        price: "99Ribu",
        description: "Akses tanpa batas untuk operasional UMKM skala penuh.",
        features: [
            "Unlimited Chat AI/bulan",
            "Dashboard Kasir Digital (POS)",
            "Manajemen Stok Otomatis",
            "Dukungan Multibahasa Daerah",
            "Ekspor Laporan (PDF & Excel)",
            "AI Insight Harian",
            "Support Prioritas + Onboarding"
        ],
        highlight: true,
        buttonText: "Ambil Paket Pro",
    }
];

export default function Pricing() {
    return (
        <section id="harga" className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight text-text-dark">
                            Pilih Paket Sesuai Kebutuhan
                        </h2>
                        <p className="text-text-muted text-lg max-w-xl mx-auto">
                            Tersedia tiga tingkatan harga yang terjangkau tanpa biaya tambahan tersembunyi.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {pricingTiers.map((tier, idx) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: 0.1 * idx }}
                            className={`relative rounded-[2rem] border ${tier.highlight ? 'border-primary/50 shadow-2xl scale-100 md:scale-105 z-10' : 'border-gray-200 shadow-lg'} bg-white overflow-hidden group transform transition-transform duration-300 hover:-translate-y-2 flex flex-col`}
                        >
                            {tier.highlight && (
                                <>
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-rose-500" />
                                    <div className="absolute top-4 right-4 animate-pulse">
                                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Star size={12} className="fill-primary" /> Paling Laris
                                        </span>
                                    </div>
                                </>
                            )}
                            
                            <div className="p-8 md:p-10 !pb-6 border-b border-gray-100 relative">
                                <h3 className={`font-bold text-2xl mb-2 ${tier.highlight ? 'text-primary' : 'text-text-dark'}`}>{tier.name}</h3>
                                
                                <div className="flex items-end gap-2 mb-4">
                                    <span className="text-4xl lg:text-5xl font-bold text-text-dark tracking-tight">Rp {tier.price}</span>
                                    <span className="text-text-muted text-sm lg:text-base pb-1 lg:pb-2">/ bulan</span>
                                </div>
                                <p className="text-sm text-text-muted h-10">{tier.description}</p>
                            </div>

                            <div className="p-8 md:p-10 !pt-6 bg-gray-50/50 flex flex-col flex-1">
                                <ul className="flex flex-col gap-4 mb-8 flex-1">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <CheckCircle2 size={20} className={`${tier.highlight ? 'text-primary' : 'text-gray-400'} shrink-0 mt-0.5`} />
                                            <span className="text-text-dark font-medium text-sm lg:text-base leading-tight">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex flex-col gap-3 mt-auto">
                                    <Link
                                        href="#daftar"
                                        className={`w-full py-4 rounded-xl font-bold text-lg text-center shadow-lg transition-all duration-300 ${tier.highlight ? 'bg-primary text-white hover:bg-rose-500 hover:shadow-primary/25' : 'bg-gray-100 text-text-dark hover:bg-gray-200'}`}
                                    >
                                        {tier.buttonText}
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <p className="text-sm font-medium text-text-dark bg-white inline-block px-4 py-2 rounded-full shadow-sm border border-gray-100">
                        💡 <span className="text-text-muted">Dibanding kompetitor lain:</span> <strong className="text-red-500 line-through">Rp 300.000+/bulan</strong> dengan fitur lebih sedikit.
                    </p>
                </div>
            </div>
        </section>
    );
}
