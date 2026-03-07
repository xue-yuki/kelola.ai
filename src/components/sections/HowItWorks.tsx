"use client";

import { motion } from "framer-motion";
import { UserPlus, Wand2, Smartphone, Rocket } from "lucide-react";

const steps = [
    {
        id: 1,
        title: "Daftar & Jawab",
        desc: "Isi form singkat tentang jenis usaha dan skala bisnismu saat ini.",
        icon: <UserPlus size={24} />,
    },
    {
        id: 2,
        title: "AI Setup Otomatis",
        desc: "AI menyusun katalog, kategori produk, dan dashboard omzet untukmu.",
        icon: <Wand2 size={24} />,
    },
    {
        id: 3,
        title: "Hubungkan Kontak",
        desc: "Sinkronisasi nomor WhatsApp atau Telegram untuk bot balasan otomatis.",
        icon: <Smartphone size={24} />,
    },
    {
        id: 4,
        title: "Siap Dikelola!",
        desc: "Mulai terima pesanan otomatis dan pantau cuan dari satu layar.",
        icon: <Rocket size={24} />,
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.3,
        },
    },
};

const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.6, ease: "easeOut" as const },
    },
};

export default function HowItWorks() {
    return (
        <section className="py-24 bg-background relative">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <div className="text-center mb-16 md:mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight text-text-dark">
                            Cara Kerja Kelola.ai
                        </h2>
                        <p className="text-text-muted text-lg max-w-xl mx-auto">
                            Hanya butuh 4 langkah mudah, AI kami siap menjadi asisten setiamu 24 jam sehari.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="relative max-w-5xl mx-auto"
                >
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[44px] left-[10%] right-[10%] h-1 bg-gray-100 rounded-full z-0 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: "100%" }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                            className="h-full bg-gradient-to-r from-primary to-secondary"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                variants={itemVariants}
                                className="relative z-10 flex flex-col items-center text-center group"
                            >
                                {/* Connecting Line (Mobile) */}
                                {index !== steps.length - 1 && (
                                    <div className="md:hidden absolute top-[88px] bottom-[-48px] left-1/2 -ml-px w-0.5 bg-gray-100 z-0">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            whileInView={{ height: "100%" }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.8, delay: 0.2 }}
                                            className="w-full bg-gradient-to-b from-primary to-secondary"
                                        />
                                    </div>
                                )}

                                <div className="w-24 h-24 rounded-full bg-white border-4 border-gray-50 flex items-center justify-center text-primary shadow-xl mb-6 relative group-hover:scale-110 transition-transform duration-300 group-hover:border-primary/20 bg-clip-padding">
                                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 scale-0 group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                                    {step.icon}
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-sm shadow-md border-2 border-white">
                                        {step.id}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-text-dark mb-3 bg-white relative z-10 px-2">
                                    {step.title}
                                </h3>
                                <p className="text-text-muted text-sm leading-relaxed max-w-xs mx-auto bg-white relative z-10">
                                    {step.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
