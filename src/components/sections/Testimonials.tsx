"use client";

import { motion } from "framer-motion";
import { Star, Quote, ChevronRight } from "lucide-react";
import Image from "next/image";

const testimonials = [
    {
        id: 1,
        name: "Bu Siti",
        business: "Kedai Kopi & Toast",
        quote: "Awalnya pusing tiap weekend pesanan WA numpuk, sering kelewatan. Semenjak pakai AI, pelanggan bisa pesan dan bayar sendiri walau saya lagi sibuk banget di dapur. Omzet naik 30% karena gak ada orderan bocor lagi!",
        rating: 5,
        image: "https://i.pravatar.cc/150?img=47",
        gradient: "from-rose-500/20 to-orange-500/5",
        accent: "text-rose-400"
    },
    {
        id: 2,
        name: "Pak Budi",
        business: "Distributor Sembako",
        quote: "Fitur kalkulasi HPP dan laporan kasir sangat menolong. Dulu hitung manual sering nombok karena lupa lapor. Sekarang data harian akurat, gampang dicek lewat HP sambil ngopi pagi.",
        rating: 5,
        image: "https://i.pravatar.cc/150?img=11",
        gradient: "from-emerald-500/20 to-teal-500/5",
        accent: "text-emerald-400"
    },
    {
        id: 3,
        name: "Anisa Fitri",
        business: "Thrift Shop Online",
        quote: "Sangat recommended! Rekomendasi harian AI-nya tau persis baju model apa yang lagi laku dan kapan jam promosi terbaik di Instagram. Followers organikku naik banyak gara-gara insight-nya.",
        rating: 5,
        image: "https://i.pravatar.cc/150?img=9",
        gradient: "from-blue-500/20 to-indigo-500/5",
        accent: "text-blue-400"
    },
    {
        id: 4,
        name: "Mas Doni",
        business: "Grosir Sparepart",
        quote: "Kelola.ai bikin manajemen stok barang jadi super gampang. Dulu sering ditanya pelanggan barang ada apa nggak, bingung nyarinya. Rekap omzet bulanan juga tinggal klik aja kelar.",
        rating: 5,
        image: "https://i.pravatar.cc/150?img=15",
        gradient: "from-amber-500/20 to-orange-500/5",
        accent: "text-amber-400"
    }
];

export default function Testimonials() {
    return (
        <section id="testimoni" className="py-24 md:py-32 bg-[#0a0a0a] text-white relative overflow-hidden flex flex-col items-center justify-center min-h-screen">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none opacity-60" />
            <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none opacity-50" />

            {/* Minimal Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_10%,transparent_100%)] pointer-events-none" />

            {/* Gradient transition masking top & bottom */}
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#0a0a0a] to-transparent pointer-events-none z-10" />
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none z-10" />

            <div className="container mx-auto px-6 md:px-12 max-w-7xl relative z-20 w-full mb-16 md:mb-24">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 gap-y-12">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="max-w-2xl"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-medium mb-6 backdrop-blur-md">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                            <span>Kisah Sukses UMKM</span>
                        </div>
                        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/40">
                            Dipercaya oleh Ribuan <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">Pahlawan Ekonomi</span>
                        </h2>
                        <p className="text-white/60 text-lg md:text-xl leading-relaxed font-light">
                            Jangan hanya dengar dari kami. Lihat bagaimana Kelola.ai membantu mengubah jam kerja yang melelahkan menjadi waktu luang yang berharga bagi pebisnis seperti Anda.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="hidden lg:flex"
                    >
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`w-14 h-14 rounded-full border-2 border-[#0a0a0a] overflow-hidden z-[${10 - i}] relative`}>
                                    <Image src={`https://i.pravatar.cc/100?img=${i * 10}`} alt="User" width={56} height={56} className="w-full h-full object-cover" />
                                </div>
                            ))}
                            <div className="w-14 h-14 rounded-full border-2 border-[#0a0a0a] bg-white/10 backdrop-blur-md flex items-center justify-center text-xs font-bold text-white z-0">
                                2k+
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scrolling Marquee Container */}
            <div className="relative w-full max-w-[100vw] overflow-hidden flex z-20 pb-10">

                {/* Fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[#0a0a0a] to-transparent z-30 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[#0a0a0a] to-transparent z-30 pointer-events-none" />

                <motion.div
                    className="flex gap-6 md:gap-8 px-4 w-max"
                    animate={{
                        x: [0, -1035], // Approximate width of one set of cards (adjust as needed based on card width + gap)
                    }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 35, // Speed of scroll
                            ease: "linear",
                        },
                    }}
                >
                    {/* Double the array for seamless infinite scroll effect */}
                    {[...testimonials, ...testimonials].map((testi, idx) => (
                        <div
                            key={`${testi.id}-${idx}`}
                            className="w-[320px] md:w-[400px] flex-shrink-0 group relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-[2.5rem] p-[1px] opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>

                            <div className={`h-full bg-[#111111]/90 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden transition-all duration-500 hover:bg-[#161616]`}>

                                {/* Inner Gradient Glow */}
                                <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${testi.gradient} blur-3xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none`} />

                                <Quote className={`absolute top-8 right-8 ${testi.accent} opacity-10 w-16 h-16 transform -rotate-12 group-hover:scale-110 group-hover:-rotate-6 group-hover:opacity-20 transition-all duration-500`} />

                                <div className="relative z-10 flex-col flex h-full">
                                    <div className="flex items-center gap-1 mb-8">
                                        {[...Array(testi.rating)].map((_, i) => (
                                            <Star key={i} size={16} className={`text-orange-400 fill-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]`} />
                                        ))}
                                    </div>

                                    <p className="text-white/80 leading-relaxed text-base md:text-[17px] mb-10 relative z-10 font-light group-hover:text-white/90 transition-colors">
                                        "{testi.quote}"
                                    </p>

                                    <div className="flex items-center gap-4 mt-auto">
                                        <div className="w-14 h-14 rounded-full overflow-hidden border border-white/20 bg-[#1a1a1a] shrink-0 p-1 relative">
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <Image
                                                src={testi.image}
                                                alt={testi.name}
                                                width={56}
                                                height={56}
                                                className="w-full h-full object-cover rounded-full relative z-10"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white/90 text-lg leading-tight group-hover:text-white transition-colors">{testi.name}</h4>
                                            <p className={`text-sm ${testi.accent} mt-1 font-medium`}>{testi.business}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            <div className="mt-12 md:mt-16 flex justify-center z-20">
                <button className="group flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300">
                    <span className="text-sm font-medium">Baca 500+ Testimoni Lainnya</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </section>
    );
}
