"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, LayoutDashboard, CheckCheck, Send } from "lucide-react";

const CHAT_MESSAGES = [
    { id: 1, text: "Halo min, pesen Nasi Goreng Spesial 2 porsi bisa?", isBot: false },
    { id: 2, text: "Halo kak! 🙏 Pesanan 2x Nasi Goreng Spesial tercatat. Totalnya Rp 50.000. Tekan tombol di bawah untuk konfirmasi pesanan.", isBot: true },
    { id: 3, text: "Ya, Konfirmasi", isBot: false },
    { id: 4, text: "✅ Pesanan terkonfirmasi dan sudah masuk antrean dapur. Estimasi siap: 15 Menit. Terima kasih! 🎉", isBot: true },
];

export default function Simulation() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // 0 = chat 1, 1 = chat 2, 2 = chat 3, 3 = chat 4, 4 = wait & update dashboard, 5 = wait end & reset
        const interval = setInterval(() => {
            setStep((prev) => (prev >= 6 ? 0 : prev + 1));
        }, 1500); // changes every 1.5s -> 9s loop
        return () => clearInterval(interval);
    }, []);

    // Dashboard calculations based on step
    const startingOmzet = 1250000;
    const increasedOmzet = startingOmzet + 50000;
    const currentOmzet = step >= 4 ? increasedOmzet : startingOmzet;

    const formattedOmzet = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(currentOmzet);

    return (
        <section id="demo" className="py-24 bg-text-dark text-white relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 left-1/2 -ml-[400px] w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white border border-white/20 font-medium text-sm mb-4">
                        <Smartphone size={16} /> <span>Simulasi Langsung</span>
                    </div>
                    <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        Sinkronisasi Real-Time
                    </h2>
                    <p className="text-white/70 text-lg">
                        Saksikan bagaimana Kelola AI membalas pesan pelanggan secara otomatis di WhatsApp dan langsung mencatat transaksi di Dashboard.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">

                    {/* Left: WhatsApp Mockup */}
                    <div className="relative mx-auto w-full max-w-sm">
                        <div className="bg-[#EFEAE2] rounded-[2.5rem] border-8 border-gray-900 overflow-hidden shadow-2xl h-[550px] relative flex flex-col">

                            {/* WA Header */}
                            <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3 z-10 shadow-md">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center p-1">
                                    <div className="w-full h-full rounded-full overflow-hidden">
                                        <img src="https://i.pravatar.cc/100?img=33" alt="Bot" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm leading-tight">Kelola.ai Bot</h3>
                                    <p className="text-[10px] text-white/70">Online</p>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 relative"
                                style={{
                                    backgroundImage: `url("pattern-whatsapp.png")`, // Optional if available
                                    backgroundSize: 'cover'
                                }}>
                                <AnimatePresence>
                                    {CHAT_MESSAGES.map((msg, idx) => (
                                        idx <= step && (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.3 }}
                                                className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                                            >
                                                <div className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm text-sm relative ${msg.isBot
                                                        ? 'bg-white text-gray-800 rounded-tl-none'
                                                        : 'bg-[#DCF8C6] text-gray-800 rounded-tr-none'
                                                    }`}>
                                                    {msg.text}
                                                    <div className="text-[10px] text-gray-400 text-right mt-1 flex items-center justify-end gap-1">
                                                        10:42 <CheckCheck size={12} className="text-blue-500" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    ))}

                                    {step === 0 && (
                                        <motion.div
                                            key="typing1"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex justify-start text-xs text-gray-500 bg-white/80 w-max px-3 py-1 rounded-full italic"
                                        >
                                            Bot sedang mengetik...
                                        </motion.div>
                                    )}
                                    {step === 2 && (
                                        <motion.div
                                            key="typing2"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex justify-start text-xs text-gray-500 bg-white/80 w-max px-3 py-1 rounded-full italic"
                                        >
                                            Bot sedang mengetik...
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* WA Input Footer */}
                            <div className="bg-[#F0F0F0] p-2 flex gap-2 items-center">
                                <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-gray-400 flex items-center">
                                    Ketik pesan...
                                </div>
                                <div className="w-10 h-10 rounded-full bg-[#00897B] text-white flex items-center justify-center">
                                    <Send size={16} className="-ml-1" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Dashboard Mockup */}
                    <div className="relative mx-auto w-full">
                        {/* Connecting visual element on desktop */}
                        <div className="hidden lg:block absolute top-[40%] -left-12 font-bold text-white/20 whitespace-nowrap rotate-90 tracking-widest text-sm">
                            SINKRONISASI
                        </div>

                        <motion.div
                            layout
                            className="bg-white rounded-[2rem] p-6 md:p-8 text-gray-800 shadow-2xl relative"
                        >
                            <div className="absolute top-0 right-10 p-4 bg-primary text-white rounded-b-xl shadow-lg transform -translate-y-2 flex flex-col items-center">
                                <LayoutDashboard size={20} />
                            </div>

                            <h3 className="font-bold text-xl mb-6">Dashboard Kasir</h3>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="border border-gray-100 bg-gray-50 p-4 rounded-2xl transition-all duration-300">
                                    <p className="text-gray-500 text-sm mb-1">Total Omzet Hari Ini</p>
                                    <motion.div
                                        key={formattedOmzet} // Force re-animation on value change
                                        initial={{ opacity: 0, scale: 0.8, color: '#FF6B2B' }}
                                        animate={{ opacity: 1, scale: 1, color: '#1F2937' }}
                                        transition={{ duration: 0.5 }}
                                        className="font-bold text-2xl text-gray-800"
                                    >
                                        {formattedOmzet}
                                    </motion.div>
                                </div>
                                <div className="border border-gray-100 bg-gray-50 p-4 rounded-2xl transition-all duration-300">
                                    <p className="text-gray-500 text-sm mb-1">Pesanan Sukses</p>
                                    <motion.div
                                        key={step >= 4 ? 'up' : 'base'}
                                        initial={{ opacity: 0, scale: 0.8, color: '#FF6B2B' }}
                                        animate={{ opacity: 1, scale: 1, color: '#1F2937' }}
                                        className="font-bold text-2xl text-gray-800"
                                    >
                                        {step >= 4 ? 43 : 42} <span className="text-sm font-normal text-gray-500">porsi</span>
                                    </motion.div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold mb-3">Pesanan Terbaru</h4>
                                <div className="flex flex-col gap-3">
                                    <AnimatePresence>
                                        {step >= 4 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -20, height: 0 }}
                                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-green-50 border border-green-100 p-3 rounded-xl flex items-center justify-between"
                                            >
                                                <div className="flex gap-3 items-center">
                                                    <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">2x</div>
                                                    <div>
                                                        <p className="font-bold text-sm">Nasi Goreng Spesial</p>
                                                        <p className="text-xs text-gray-500">WA: 0812-xxxx-1234</p>
                                                    </div>
                                                </div>
                                                <div className="font-bold text-green-700">Rp 50.000</div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center justify-between">
                                        <div className="flex gap-3 items-center">
                                            <div className="bg-gray-200 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">1x</div>
                                            <div>
                                                <p className="font-bold text-sm">Mie Goreng Telur</p>
                                                <p className="text-xs text-gray-500">WA: 0856-xxxx-9876</p>
                                            </div>
                                        </div>
                                        <div className="font-bold text-gray-700">Rp 18.000</div>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center justify-between opacity-50">
                                        <div className="flex gap-3 items-center">
                                            <div className="bg-gray-200 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">3x</div>
                                            <div>
                                                <p className="font-bold text-sm">Es Teh Manis</p>
                                                <p className="text-xs text-gray-500">Dine-in (Meja 4)</p>
                                            </div>
                                        </div>
                                        <div className="font-bold text-gray-700">Rp 15.000</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
