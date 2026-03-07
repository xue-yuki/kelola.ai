"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
    {
        id: 1,
        name: "Bu Siti",
        business: "Pemilik Kedai Kopi & Toast",
        quote: "Awalnya pusing tiap weekend pesanan WA numpuk, sering kelewatan. Semenjak pakai AI, pelanggan bisa pesan dan bayar sendiri walau saya lagi sibuk di dapur.",
        rating: 5,
        image: "https://i.pravatar.cc/150?img=47"
    },
    {
        id: 2,
        name: "Pak Budi",
        business: "Distributor Sembako",
        quote: "Fitur kalkulasi HPP dan laporan kasir sangat menolong. Dulu hitung manual sering nombok. Sekarang data harian akurat dan gampang dicek lewat HP.",
        rating: 5,
        image: "https://i.pravatar.cc/150?img=11"
    },
    {
        id: 3,
        name: "Anisa",
        business: "Owner Thrift Shop Online",
        quote: "Sangat recommended! Rekomendasi harian AI-nya tau persis baju model apa yang lagi laku dan kapan jam promosi terbaik di Instagram. Insightful banget!",
        rating: 5,
        image: "https://i.pravatar.cc/150?img=9"
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" as const },
    },
};

export default function Testimonials() {
    return (
        <section className="py-24 bg-text-dark text-white relative overflow-hidden">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-200px] left-[-100px] w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

            <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight">
                            Apa Kata Mereka?
                        </h2>
                        <p className="text-white/70 text-lg">
                            Ribuan pelaku bisnis telah membuktikan efisiensi Kelola.ai dalam membantu operasional mereka.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"
                >
                    {testimonials.map((testi) => (
                        <motion.div
                            key={testi.id}
                            variants={cardVariants}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            className="bg-[#1F1F3D]/80 backdrop-blur-lg border border-white/10 rounded-[2rem] p-8 md:p-10 flex flex-col justify-between relative group"
                        >
                            <Quote className="absolute top-6 right-8 text-white/5 w-20 h-20 transform -rotate-12 group-hover:scale-110 transition-transform duration-500" />

                            <div>
                                <div className="flex items-center gap-1 mb-6">
                                    {[...Array(testi.rating)].map((_, i) => (
                                        <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>

                                <p className="text-white/80 leading-relaxed text-[17px] mb-8 relative z-10 font-medium italic">
                                    "{testi.quote}"
                                </p>
                            </div>

                            <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 bg-gray-500 shrink-0">
                                    <img src={testi.image} alt={testi.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white leading-tight">{testi.name}</h4>
                                    <p className="text-sm text-primary/80 mt-1">{testi.business}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
