"use client";

import { motion } from "framer-motion";
import { MessageSquareWarning, ReceiptText, TrendingDown } from "lucide-react";

const problems = [
    {
        id: 1,
        title: "Kewalahan balas pesanan WA satu per satu",
        icon: <MessageSquareWarning size={32} />,
        color: "text-red-400 text-rose-400 bg-rose-400/10",
    },
    {
        id: 2,
        title: "Catat keuangan manual di buku, sering salah",
        icon: <ReceiptText size={32} />,
        color: "text-orange-400 bg-orange-400/10",
    },
    {
        id: 3,
        title: "Tidak tahu produk mana yang paling laku",
        icon: <TrendingDown size={32} />,
        color: "text-amber-400 bg-amber-400/10",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
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

export default function Problems() {
    return (
        <section className="py-24 bg-text-dark text-white relative overflow-hidden">
            {/* Background accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />

            <div className="container mx-auto px-4 md:px-8 max-w-5xl relative z-10">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight">
                            Masalah yang Sering UMKM Hadapi
                        </h2>
                        <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
                            Menjaga operasional harian tetap lancar seringkali menguras waktu dan energi yang berharga.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {problems.map((problem) => (
                        <motion.div
                            key={problem.id}
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                            className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors duration-300"
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-white/5 ${problem.color}`}>
                                {problem.icon}
                            </div>
                            <h3 className="text-xl font-bold leading-snug">
                                {problem.title}
                            </h3>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
