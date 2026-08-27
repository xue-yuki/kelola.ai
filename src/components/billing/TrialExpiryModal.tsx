"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, ArrowRight, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSubscription, daysUntil, isTrialing } from "@/lib/billing/subscription";
import type { SubscriptionWithPlan } from "@/lib/billing/types";

/**
 * TrialExpiryModal — muncul otomatis sekali per session pas trial critical.
 * Cuma trigger di H-3 / H-1 / H+0 (bukan setiap login).
 * Loss-aversion messaging.
 */
export default function TrialExpiryModal({ businessId }: { businessId: string | null }) {
    const [sub, setSub] = useState<SubscriptionWithPlan | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!businessId) return;

        const supabase = createClient();
        getSubscription(supabase, businessId).then((s) => {
            if (!s || !isTrialing(s)) return;

            const days = daysUntil(s.trial_end);
            // Trigger hanya kalau H-3, H-1, atau H-0
            if (![0, 1, 3].includes(days)) return;

            // Cek dismiss session-scoped per hari
            const today = new Date().toISOString().slice(0, 10);
            const key = `kelola_expiry_modal_${businessId}_${today}`;
            if (typeof window !== "undefined" && sessionStorage.getItem(key) === "1") return;

            setSub(s);
            // Delay 800ms biar dashboard sempat render, ga bump
            setTimeout(() => setOpen(true), 800);
        });
    }, [businessId]);

    function handleDismiss() {
        if (!businessId) return;
        const today = new Date().toISOString().slice(0, 10);
        const key = `kelola_expiry_modal_${businessId}_${today}`;
        sessionStorage.setItem(key, "1");
        setOpen(false);
    }

    if (!sub) return null;

    const days = daysUntil(sub.trial_end);
    const endDateStr = new Date(sub.trial_end!).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const heading = days === 0
        ? "Trial Pro berakhir hari ini"
        : days === 1
        ? "Trial Pro berakhir besok"
        : `Trial Pro berakhir dalam ${days} hari`;

    const subheading = days === 0
        ? "Sisa waktu terakhir sebelum akun otomatis pindah ke Starter"
        : `Setelah ${endDateStr}, akun akan otomatis pindah ke Starter (Rp 49.000/bln)`;

    const lostFeatures = [
        "Broadcast WA (2.000 kontak/bulan)",
        "AI Insight harian",
        "Tanya Kelola 15 → 3 query/hari",
        "Export laporan PDF & Excel",
        "OCR bukti bayar unlimited",
    ];

    const isCritical = days <= 1;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
                        onClick={handleDismiss}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-full max-w-md mx-auto"
                    >
                        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="px-6 pt-6 pb-4 flex items-start gap-4">
                                <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                        isCritical
                                            ? "bg-rose-100 dark:bg-rose-500/10"
                                            : "bg-amber-100 dark:bg-amber-500/10"
                                    }`}
                                >
                                    {isCritical ? (
                                        <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                    ) : (
                                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                        {heading}
                                    </h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                        {subheading}
                                    </p>
                                </div>
                                <button
                                    onClick={handleDismiss}
                                    className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors shrink-0"
                                    aria-label="Tutup"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Loss features list */}
                            <div className="px-6 pb-4">
                                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                                        Yang akan hilang
                                    </p>
                                    <ul className="space-y-1.5">
                                        {lostFeatures.map((feature, idx) => (
                                            <motion.li
                                                key={feature}
                                                initial={{ opacity: 0, x: -4 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.15 + idx * 0.05 }}
                                                className="text-sm text-zinc-700 dark:text-zinc-300 flex items-start gap-2"
                                            >
                                                <span className="text-rose-500 shrink-0 leading-none translate-y-0.5">✗</span>
                                                <span>{feature}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/30">
                                <button
                                    onClick={handleDismiss}
                                    className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Ingatkan Nanti
                                </button>
                                <Link
                                    href="/dashboard/billing?upgrade=1"
                                    onClick={handleDismiss}
                                    className={`
                                        flex-1 inline-flex items-center justify-center gap-1.5
                                        px-4 py-2 rounded-md text-sm font-medium
                                        text-white transition-colors
                                        ${isCritical
                                            ? "bg-rose-500 hover:bg-rose-600"
                                            : "bg-orange-500 hover:bg-orange-600"
                                        }
                                    `}
                                >
                                    Upgrade Pro
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
