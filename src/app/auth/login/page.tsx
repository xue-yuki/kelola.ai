"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/layout/AuthLayout";
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        setError("");
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            console.error('Error logging in with Google:', error);
            setError(error.message || "Gagal login dengan Google");
            setIsGoogleLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            router.push("/dashboard");
        } catch (error: any) {
            console.error('Error logging in:', error);
            if (error.message.includes("Invalid login")) {
                setError("Email atau password salah");
            } else if (error.message.includes("Email not confirmed")) {
                setError("Email belum diverifikasi. Cek inbox kamu.");
            } else {
                setError(error.message || "Gagal login");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Selamat Datang"
            subtitle="Masuk ke dashboard Kelola.ai Anda dan kelola bisnis dengan satu klik."
        >
            <div className="space-y-6">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400"
                    >
                        <AlertCircle size={18} />
                        <span className="text-sm font-medium">{error}</span>
                    </motion.div>
                )}

                {/* Email Login Form */}
                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/50 ml-1">Email</label>
                        <div className="relative group/input">
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
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="email@contoh.com"
                                className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all font-light"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/50 ml-1">Password</label>
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Password kamu"
                                className="block w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all font-light"
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

                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full relative group/btn flex items-center justify-center p-[2px] rounded-2xl overflow-hidden transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500 group-hover/btn:opacity-100 transition-opacity opacity-80" />
                        <span className="relative w-full flex items-center justify-center gap-2 bg-[#111] py-3.5 rounded-[14px] text-white font-bold text-base group-hover/btn:bg-transparent transition-all">
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                "Masuk"
                            )}
                        </span>
                    </motion.button>
                </form>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-[#0a0a0a] text-white/30 font-medium">atau</span>
                    </div>
                </div>

                {/* Google Login */}
                <motion.button
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-base disabled:opacity-70"
                >
                    {isGoogleLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                            Masuk dengan Google
                        </>
                    )}
                </motion.button>

                <div className="text-center pt-2">
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
