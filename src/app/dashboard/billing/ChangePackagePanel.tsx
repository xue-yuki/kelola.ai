"use client";

import { X, Check, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SubscriptionPlan } from "@/lib/billing/types";
import { formatIDR } from "@/lib/billing/subscription";

export default function ChangePackagePanel({
    open,
    onClose,
    plans,
    currentPlanId,
}: {
    open: boolean;
    onClose: () => void;
    plans: SubscriptionPlan[];
    currentPlanId: string | null;
}) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Panel */}
                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
                        className="fixed top-0 right-0 h-full w-full max-w-[440px] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                            <div>
                                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                    Ganti Paket
                                </h2>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Pilih paket yang paling sesuai dengan bisnis Anda
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                                aria-label="Tutup"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Plans List — staggered */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                            {plans.map((plan, idx) => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    currentPlanId={currentPlanId}
                                    index={idx}
                                />
                            ))}
                        </div>

                        {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.25, duration: 0.3 }}
                            className="border-t border-zinc-200 dark:border-zinc-800 px-5 py-3 shrink-0 bg-zinc-50 dark:bg-zinc-900/50"
                        >
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
                                Harga launch — hemat sampai 67% dari harga normal
                            </p>
                        </motion.div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

function PlanCard({
    plan,
    currentPlanId,
    index,
}: {
    plan: SubscriptionPlan;
    currentPlanId: string | null;
    index: number;
}) {
    const isCurrent = plan.id === currentPlanId;
    const isPro = plan.id === "pro";
    const savings = plan.anchor_price ? plan.anchor_price - plan.price_monthly : 0;
    const discountPct = plan.anchor_price
        ? Math.round((savings / plan.anchor_price) * 100)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: 0.12 + index * 0.06,
                duration: 0.28,
                ease: [0.22, 1, 0.36, 1], // easeOutExpo-ish
            }}
            whileHover={!isCurrent ? { y: -2 } : undefined}
            className={`
                relative border rounded-lg p-4 transition-colors
                ${isCurrent
                    ? "border-orange-500 bg-orange-50/50 dark:bg-orange-500/5"
                    : isPro
                    ? "border-zinc-300 dark:border-zinc-700 hover:border-orange-500 hover:bg-orange-50/30 dark:hover:bg-orange-500/5"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                }
            `}
        >
            {isPro && !isCurrent && (
                <div className="absolute -top-2 left-4 inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500 text-white uppercase tracking-wide">
                    Rekomendasi
                </div>
            )}
            {isCurrent && (
                <div className="absolute -top-2 left-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white uppercase tracking-wide">
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    Aktif
                </div>
            )}

            <div className="mb-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {plan.name}
                </h3>
                <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatIDR(plan.price_monthly)}
                    </span>
                    <span className="text-xs text-zinc-500">/bulan</span>
                    {plan.anchor_price && (
                        <span className="text-xs text-zinc-400 line-through ml-1">
                            {formatIDR(plan.anchor_price)}
                        </span>
                    )}
                </div>
                {plan.anchor_price && (
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Hemat {discountPct}% • {formatIDR(savings)}
                    </div>
                )}
            </div>

            <ul className="space-y-1 mb-3 text-[11px] text-zinc-600 dark:text-zinc-400">
                <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" strokeWidth={3} />
                    {plan.limits.wa_chat_monthly.toLocaleString("id-ID")} chat WA/bulan
                </li>
                <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" strokeWidth={3} />
                    {plan.limits.tanya_kelola_daily} Tanya Kelola/hari
                </li>
                {plan.limits.broadcast_monthly > 0 && (
                    <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" strokeWidth={3} />
                        Broadcast {plan.limits.broadcast_monthly.toLocaleString("id-ID")} kontak
                    </li>
                )}
                {plan.features.ai_insight && (
                    <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" strokeWidth={3} />
                        AI Insight {plan.features.ai_insight === "daily" ? "harian" : "mingguan"}
                    </li>
                )}
                {plan.features.export_pdf && (
                    <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" strokeWidth={3} />
                        Export {plan.features.export_excel ? "PDF + Excel" : "PDF"}
                    </li>
                )}
            </ul>

            <motion.button
                disabled={isCurrent}
                whileHover={!isCurrent ? { scale: 1.02 } : undefined}
                whileTap={!isCurrent ? { scale: 0.98 } : undefined}
                onClick={() =>
                    alert(`Pindah ke ${plan.name} akan aktif setelah sistem pembayaran Xendit siap.`)
                }
                className={`
                    w-full inline-flex items-center justify-center gap-1.5
                    px-3 py-2 rounded-md text-xs font-medium
                    transition-colors
                    ${isCurrent
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : isPro
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900"
                    }
                `}
            >
                {isCurrent ? "Paket Aktif" : "Pilih Paket"}
                {!isCurrent && <ArrowRight className="w-3 h-3" />}
            </motion.button>
        </motion.div>
    );
}
