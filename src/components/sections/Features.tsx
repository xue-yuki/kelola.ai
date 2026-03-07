"use client";

import { motion } from "framer-motion";
import { Bot, Zap, MonitorSmartphone, Calculator, LineChart, Lightbulb } from "lucide-react";

const features = [
    {
        icon: <Bot size={28} />,
        title: "AI Agent WA & Telegram",
        description: "Auto-reply pesanan 24/7 tanpa perlu balas manual. Biarkan AI yang melayani pelangganmu layaknya admin cerdas.",
        color: "bg-blue-100 text-blue-600",
    },
    {
        icon: <Zap size={28} />,
        title: "Smart Onboarding",
        description: "Setup bisnis dalam 5 menit, AI langsung siapkan template katalog dan harga yang sesuai dengan bidang usahamu.",
        color: "bg-amber-100 text-amber-600",
    },
    {
        icon: <MonitorSmartphone size={28} />,
        title: "Kasir Digital (POS)",
        description: "Catat transaksi offline & online di satu tempat. Interface yang mudah digunakan bahkan oleh karyawan baru.",
        color: "bg-emerald-100 text-emerald-600",
    },
    {
        icon: <Calculator size={28} />,
        title: "Kalkulasi HPP Otomatis",
        description: "Hitung harga pokok produksi dengan akurat. Tidak ada lagi margin bocor karena salah hitung bahan baku.",
        color: "bg-purple-100 text-purple-600",
    },
    {
        icon: <LineChart size={28} />,
        title: "Prediksi Pendapatan",
        description: "AI forecast pendapatan bulan depan berbasis data historis agar kamu bisa bersiap untuk restock lebih awal.",
        color: "bg-rose-100 text-rose-600",
    },
    {
        icon: <Lightbulb size={28} />,
        title: "AI Insight Harian",
        description: "Rekomendasi bisnis otomatis setiap hari via WA. Dapatkan insight produk terlaris dan waktu paling pas buat promosi.",
        color: "bg-primary/20 text-primary",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.5, ease: "easeOut" as const },
    },
};

export default function Features() {
    return (
        <section id="fitur" className="py-24 bg-background relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-40 -left-64 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-20 -right-64 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />

            <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium text-sm mb-4">
                            ✨ Fitur Unggulan
                        </div>
                        <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight text-text-dark">
                            Semua Solusinya Ada di Kelola.ai
                        </h2>
                        <p className="text-text-muted text-lg">
                            Fitur super lengkap yang dirancang khusus untuk mempermudah operasional UMKM tanpa ribet.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                >
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            whileHover={{
                                y: -8,
                                boxShadow: "0 20px 40px -15px rgba(255,107,43,0.15)",
                                borderColor: "rgba(255,107,43,0.3)"
                            }}
                            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm transition-all duration-300 relative group overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-primary/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300 ${feature.color}`}>
                                {feature.icon}
                            </div>

                            <h3 className="text-xl font-bold text-text-dark mb-3">
                                {feature.title}
                            </h3>

                            <p className="text-text-muted leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
