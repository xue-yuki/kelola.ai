"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import AuthLayout from "@/components/layout/AuthLayout";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error logging in with Google:', error);
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Selamat Datang"
            subtitle="Masuk ke dashboard Kelola.ai Anda dan kelola bisnis dengan satu klik."
        >
            <div className="space-y-8">
                {/* Social Login */}
                <div className="flex flex-col gap-4">
                    <motion.button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-lg disabled:opacity-70"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                                Masuk dengan Google
                            </>
                        )}
                    </motion.button>
                </div>

                <div className="text-center pt-4">
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
