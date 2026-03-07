"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Info } from "lucide-react";
import Link from "next/link";

const includedFeatures = [
    "AI Auto-Reply WhatsApp & Telegram",
    "Dashboard Kasir Digital (POS)",
    "Kalkulator HPP Akurat",
    "Laporan Omzet Real-Time",
    "Prediksi Penjualan AI",
    "Manajemen Produk & Kategori",
    "Daily Insight via Chat",
    "Customer Support Prioritas"
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
                            Harga Transparan, Tanpa Komisi
                        </h2>
                        <p className="text-text-muted text-lg max-w-xl mx-auto">
                            Satu harga untuk semua fitur canggih. Tidak ada potongan transaksi atau biaya tersembunyi.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="max-w-lg mx-auto"
                >
                    <div className="bg-white rounded-[2rem] border border-primary/20 shadow-2xl overflow-hidden relative group transform transition-transform duration-300 hover:-translate-y-2">

                        {/* Glowing Accent */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-secondary" />
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[50px] rounded-full group-hover:bg-primary/30 transition-colors" />

                        <div className="p-8 md:p-10 !pb-6 border-b border-gray-100 relative">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-2xl text-text-dark">Kelola Pro</h3>
                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                                    Paling Laris
                                </span>
                            </div>

                            <div className="flex items-end gap-2 mb-4">
                                <span className="text-5xl font-bold text-text-dark tracking-tight">Rp 99Ribu</span>
                                <span className="text-text-muted text-lg pb-1">/ bulan</span>
                            </div>

                            <p className="text-sm text-text-muted flex justify-between">
                                Berlangganan bulanan tanpa kontrak.
                            </p>
                        </div>

                        <div className="p-8 md:p-10 !pt-6 bg-gray-50/50">
                            <ul className="flex flex-col gap-4 mb-8">
                                {includedFeatures.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle2 size={20} className="text-primary shrink-0 mt-0.5" />
                                        <span className="text-text-dark font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-col gap-3">
                                <Link
                                    href="#daftar"
                                    className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-secondary text-center shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300"
                                >
                                    Mulai Sekarang
                                </Link>

                                <div className="flex items-start gap-2 text-xs text-text-muted justify-center mt-2">
                                    <Info size={14} className="shrink-0 mt-0.5" />
                                    <p>+ Rp 150.000 setup fee (dikenakan sekali bayar di awal pendaftaran).</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="text-center mt-8">
                        <p className="text-sm font-medium text-text-dark bg-white inline-block px-4 py-2 rounded-full shadow-sm border border-gray-100">
                            💡 <span className="text-text-muted">Kompetitor lain:</span> <strong className="text-red-500 line-through">Rp 300.000+/bulan</strong> dengan fitur lebih sedikit.
                        </p>
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
