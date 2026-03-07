"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { MessageSquareWarning, ReceiptText, TrendingDown, AlertCircle } from "lucide-react";
import { MouseEvent } from "react";

const problems = [
    {
        id: 1,
        title: "Kewalahan Balas Pesan",
        desc: "Ratusan chat pelanggan masuk setiap hari. Membalas satu per satu secara manual sangat menguras waktu dan tenaga.",
        icon: <MessageSquareWarning size={32} strokeWidth={1.5} />,
        color: "from-rose-500/20 to-rose-500/0",
        iconColor: "text-rose-400",
        accent: "rgba(244, 63, 94, 0.15)", // rose-500
    },
    {
        id: 2,
        title: "Pencatatan Berantakan",
        desc: "Masih pakai buku tulis atau Excel manual? Rentan hilang, salah hitung, dan sulit melacak arus kas sebenarnya.",
        icon: <ReceiptText size={32} strokeWidth={1.5} />,
        color: "from-orange-500/20 to-orange-500/0",
        iconColor: "text-orange-400",
        accent: "rgba(249, 115, 22, 0.15)", // orange-500
    },
    {
        id: 3,
        title: "Buta Data Penjualan",
        desc: "Tidak tahu pasti produk mana yang paling laris. Keputusan bisnis hanya mengandalkan insting, bukan data riil.",
        icon: <TrendingDown size={32} strokeWidth={1.5} />,
        color: "from-amber-500/20 to-amber-500/0",
        iconColor: "text-amber-400",
        accent: "rgba(245, 158, 11, 0.15)", // amber-500
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
};

function ProblemCard({ problem }: { problem: typeof problems[0] }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            variants={itemVariants}
            onMouseMove={handleMouseMove}
            className="group relative flex flex-col items-start p-8 md:p-10 rounded-[2.5rem] bg-[#111111]/80 backdrop-blur-sm border border-white/5 overflow-hidden transition-colors hover:bg-[#161616]/80"
        >
            {/* Hover Spotlight Effect */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 transition duration-500 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            600px circle at ${mouseX}px ${mouseY}px,
                            ${problem.accent},
                            transparent 80%
                        )
                    `,
                }}
            />

            <div className="relative z-10 flex flex-col h-full">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 bg-gradient-to-br ${problem.color} border border-white/5 shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3`}>
                    <div className={problem.iconColor}>
                        {problem.icon}
                    </div>
                </div>

                <h3 className="text-2xl font-semibold tracking-tight text-white mb-4 group-hover:text-white/90 transition-colors">
                    {problem.title}
                </h3>

                <p className="text-white/50 leading-relaxed text-base font-light group-hover:text-white/70 transition-colors mt-auto">
                    {problem.desc}
                </p>
            </div>

            {/* Subtle glow behind the icon */}
            <div className={`absolute top-0 left-0 w-32 h-32 bg-gradient-to-br ${problem.color} blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full pointer-events-none`} />
        </motion.div>
    );
}

export default function Problems() {
    return (
        <section className="py-24 md:py-32 bg-[#0a0a0a] text-white relative overflow-hidden flex items-center justify-center min-h-screen">
            {/* Dynamic Background Elements */}
            <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[150px] mix-blend-screen opacity-50 pointer-events-none animate-pulse" style={{ animationDelay: "2s" }} />

            {/* Gradient transitions for blending sections */}
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#111111] to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[hsl(var(--background))] to-transparent pointer-events-none" />

            {/* Minimal Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none" />

            <div className="container mx-auto px-6 md:px-12 max-w-7xl relative z-10 w-full">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start lg:items-center mb-20 lg:mb-24">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="lg:w-1/2"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-medium mb-6 backdrop-blur-md">
                            <AlertCircle size={16} className="text-orange-400" />
                            <span>Realita di Lapangan</span>
                        </div>
                        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/30 leading-[1.1] pb-2">
                            Masalah Klasik <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">Pebisnis UMKM</span>
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="lg:w-1/2"
                    >
                        <p className="text-white/60 text-lg md:text-xl leading-relaxed font-light">
                            Kami paham. Menjaga operasional harian tetap lancar seringkali menguras waktu dan energi yang berharga. Hal ini menghambat fokus Anda untuk benar-benar <strong className="text-white/90 font-medium">mengembangkan bisnis</strong> ke level selanjutnya.
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
                    {problems.map((problem) => (
                        <ProblemCard key={problem.id} problem={problem} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
