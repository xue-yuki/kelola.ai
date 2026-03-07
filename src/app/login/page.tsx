"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import AuthLayout from "@/components/layout/AuthLayout";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsLoading(false);
    };

    return (
        <AuthLayout
            title="Selamat Datang"
            subtitle="Masuk ke dashboard Kelola.ai Anda dan kelola bisnis dengan satu klik."
        >
            <div className="space-y-8">
                {/* Social Login */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
                    >
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                        Google
                    </motion.button>
                    <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
                    >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-4 h-4" alt="WhatsApp" />
                        WhatsApp
                    </motion.button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/5"></span>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]">
                        <span className="bg-[#0a0a0a] px-4 text-white/20">Atau gunakan email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/50 ml-1">Email Anda</label>
                        <div className="relative group/input">
                            {/* Glow Spread Effect */}
                            <motion.div
                                className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent pointer-events-none z-20"
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{
                                    scaleX: focusedField === 'email' ? 1 : 0,
                                    opacity: focusedField === 'email' ? 1 : 0
                                }}
                                transition={{ duration: 0.4, ease: "circOut" }}
                            />

                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within/input:text-orange-400 transition-colors">
                                <Mail size={18} />
                            </div>
                            <input
                                required
                                type="email"
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="nama@bisnis.com"
                                className="block w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all font-light"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-sm font-medium text-white/50">Kata Sandi</label>
                            <Link href="#" className="text-xs text-orange-400/80 hover:text-orange-400 transition-colors">
                                Lupa sandi?
                            </Link>
                        </div>
                        <div className="relative group/input">
                            <motion.div
                                className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent pointer-events-none z-20"
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{
                                    scaleX: focusedField === 'password' ? 1 : 0,
                                    opacity: focusedField === 'password' ? 1 : 0
                                }}
                                transition={{ duration: 0.4, ease: "circOut" }}
                            />

                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within/input:text-orange-400 transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="••••••••"
                                className="block w-full pl-11 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all font-light"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 rounded border-white/10 bg-white/5 text-orange-500 focus:ring-orange-500/20 focus:ring-offset-0 transition-all cursor-pointer"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-white/40 cursor-pointer hover:text-white/60 transition-colors font-medium">
                            Ingat saya di perangkat ini
                        </label>
                    </div>

                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full relative group/btn flex items-center justify-center p-[2px] rounded-2xl overflow-hidden transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500 group-hover/btn:opacity-100 transition-opacity opacity-80" />
                        <span className="relative w-full flex items-center justify-center gap-2 bg-[#111] py-4 rounded-[14px] text-white font-bold text-lg group-hover/btn:bg-transparent transition-all">
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                "Masuk ke Dashboard"
                            )}
                        </span>
                    </motion.button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-white/40 text-sm font-medium tracking-tight">
                        Belum punya akun?{" "}
                        <Link href="/register" className="text-orange-400 font-bold hover:text-orange-300 transition-colors decoration-orange-400/20 underline underline-offset-4 ml-1">
                            Daftar gratis sekarang
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}
