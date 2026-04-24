"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/layout/AuthLayout";
import { User, Store, Mail, Phone, Lock, Eye, EyeOff, Loader2, Sparkles, ChevronRight, AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        businessName: "",
        email: "",
        phone: "",
        password: ""
    });
    const supabase = createClient();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (formData.password.length < 8) {
            setError("Password minimal 8 karakter");
            setIsLoading(false);
            return;
        }

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        business_name: formData.businessName,
                        phone: formData.phone,
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                const { error: bizError } = await supabase.from('businesses').insert({
                    user_id: authData.user.id,
                    business_name: formData.businessName,
                    owner_name: formData.name,
                    wa_number: formData.phone.startsWith('0')
                        ? '62' + formData.phone.slice(1)
                        : formData.phone,
                });

                if (bizError) {
                    console.error('Error creating business:', bizError);
                }
            }

            setSuccess(true);
        } catch (error: any) {
            console.error('Error registering:', error);
            if (error.message.includes("already registered")) {
                setError("Email sudah terdaftar. Silakan login.");
            } else {
                setError(error.message || "Gagal mendaftar");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <AuthLayout
                title="Cek Email Kamu!"
                subtitle="Kami sudah mengirim link verifikasi ke email kamu."
            >
                <div className="space-y-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center"
                    >
                        <CheckCircle size={40} className="text-emerald-400" />
                    </motion.div>
                    <p className="text-center text-white/60 text-sm">
                        Klik link di email untuk mengaktifkan akun. Setelah itu kamu bisa langsung login.
                    </p>
                    <Link href="/auth/login">
                        <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all"
                        >
                            Ke Halaman Login
                        </motion.button>
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Ayo Bergabung!"
            subtitle="Buat akun gratis dalam 60 detik dan mulai transformasi bisnis Anda."
        >
            <div className="space-y-8 pb-12">
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

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/50 ml-1">Nama Pemilik</label>
                            <div className="relative group/input">
                                <motion.div
                                    className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent pointer-events-none z-20"
                                    initial={{ scaleX: 0, opacity: 0 }}
                                    animate={{
                                        scaleX: focusedField === 'name' ? 1 : 0,
                                        opacity: focusedField === 'name' ? 1 : 0
                                    }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                />
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within/input:text-orange-400 transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Andi Pratama"
                                    className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all font-light"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/50 ml-1">Nama Bisnis</label>
                            <div className="relative group/input">
                                <motion.div
                                    className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent pointer-events-none z-20"
                                    initial={{ scaleX: 0, opacity: 0 }}
                                    animate={{
                                        scaleX: focusedField === 'biz' ? 1 : 0,
                                        opacity: focusedField === 'biz' ? 1 : 0
                                    }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                />
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within/input:text-orange-400 transition-colors">
                                    <Store size={18} />
                                </div>
                                <input
                                    required
                                    type="text"
                                    name="businessName"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('biz')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Kopi Kita"
                                    className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all font-light"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/50 ml-1">Email Bisnis</label>
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
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="bisnis@email.com"
                                className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all font-light"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/50 ml-1">No. WhatsApp</label>
                        <div className="relative group/input">
                            <motion.div
                                className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent pointer-events-none z-20"
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{
                                    scaleX: focusedField === 'phone' ? 1 : 0,
                                    opacity: focusedField === 'phone' ? 1 : 0
                                }}
                                transition={{ duration: 0.4, ease: "circOut" }}
                            />
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within/input:text-orange-400 transition-colors">
                                <Phone size={18} />
                            </div>
                            <input
                                required
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('phone')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="0812..."
                                className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all font-light"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/50 ml-1">Kata Sandi</label>
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
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Minimal 8 karakter"
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

                    <div className="flex items-start">
                        <input
                            id="terms"
                            name="terms"
                            type="checkbox"
                            required
                            className="mt-1 h-4 w-4 rounded border-white/10 bg-white/5 text-orange-500 focus:ring-orange-500/20 focus:ring-offset-0 transition-all cursor-pointer"
                        />
                        <label htmlFor="terms" className="ml-3 block text-sm text-white/30 leading-relaxed cursor-pointer hover:text-white/50 transition-colors font-medium">
                            Saya setuju dengan <Link href="#" className="underline decoration-white/10 underline-offset-2">Syarat & Ketentuan</Link> serta <Link href="#" className="underline decoration-white/10 underline-offset-2 font-bold">Kebijakan Privasi</Link>.
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
                                <span className="flex items-center gap-2">
                                    <Sparkles size={18} />
                                    Daftar Sekarang
                                    <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                </span>
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
                        <span className="px-4 bg-[#0a0a0a] text-white/30 font-medium">atau daftar dengan</span>
                    </div>
                </div>

                {/* Google Signup */}
                <motion.button
                    onClick={async () => {
                        const { error } = await supabase.auth.signInWithOAuth({
                            provider: 'google',
                            options: {
                                redirectTo: `${window.location.origin}/auth/callback`,
                            },
                        });
                        if (error) console.error('Google signup error:', error);
                    }}
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-base"
                >
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                    Daftar dengan Google
                </motion.button>

                <div className="text-center">
                    <p className="text-white/40 text-sm font-medium tracking-tight">
                        Sudah punya akun?{" "}
                        <Link href="/auth/login" className="text-orange-400 font-bold hover:text-orange-300 transition-colors decoration-orange-400/20 underline underline-offset-4 ml-1">
                            Masuk di sini
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}
