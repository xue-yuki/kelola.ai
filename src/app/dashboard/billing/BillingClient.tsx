"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CreditCard, Clock, TrendingUp, Receipt, Tag, AlertTriangle, ArrowRight, Check, Infinity as InfinityIcon } from "lucide-react";
import type { Subscription, SubscriptionPlan, FeatureUsage, Invoice } from "@/lib/billing/types";
import { daysUntil, formatIDR } from "@/lib/billing/subscription";
import ChangePackagePanel from "./ChangePackagePanel";

export default function BillingClient({
    businessName,
    subscription,
    plans,
    currentPlan,
    usage,
    invoices,
}: {
    businessName: string;
    subscription: Subscription | null;
    plans: SubscriptionPlan[];
    currentPlan: SubscriptionPlan | null;
    usage: FeatureUsage | null;
    invoices: Invoice[];
}) {
    const [panelOpen, setPanelOpen] = useState(false);
    const [promoCode, setPromoCode] = useState("");
    const searchParams = useSearchParams();
    const router = useRouter();

    // Auto-open panel kalo ada ?upgrade=1 di URL (dari banner/modal trial)
    useEffect(() => {
        if (searchParams.get("upgrade") === "1") {
            // Delay 250ms biar halaman render dulu
            const timer = setTimeout(() => setPanelOpen(true), 250);
            // Clean up URL param biar ga trigger lagi pas back/forward
            router.replace("/dashboard/billing", { scroll: false });
            return () => clearTimeout(timer);
        }
    }, [searchParams, router]);

    const isTrialing = subscription?.status === "trialing";
    const trialDaysLeft = daysUntil(subscription?.trial_end ?? null);
    const periodEndDate = subscription?.current_period_end
        ? new Date(subscription.current_period_end).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : "-";

    return (
        <>
            <div className="max-w-6xl mx-auto space-y-5">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        Billing & Langganan
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Kelola paket, pembayaran & invoice untuk {businessName}
                    </p>
                </div>

                {/* Active Plan Card */}
                {subscription && currentPlan && (
                    <section className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 overflow-hidden">
                        <div className="p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                                <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs uppercase tracking-wide font-semibold text-zinc-500 dark:text-zinc-400">
                                        Paket Aktif
                                    </span>
                                    {isTrialing && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400">
                                            <Clock className="w-2.5 h-2.5" />
                                            TRIAL
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                                    {currentPlan.name}
                                </h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    {isTrialing
                                        ? `Trial berakhir ${periodEndDate} · ${trialDaysLeft} hari lagi`
                                        : `Aktif hingga ${periodEndDate}`}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                    {formatIDR(currentPlan.price_monthly)}
                                </div>
                                <div className="text-xs text-zinc-500">/bulan</div>
                            </div>
                        </div>
                        <div className="border-t border-zinc-200 dark:border-zinc-800 px-5 py-3 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {isTrialing
                                    ? "Setelah trial berakhir, akun akan otomatis pindah ke Starter"
                                    : "Auto-renewal aktif — invoice akan dikirim menjelang tanggal berakhir"}
                            </p>
                            <button
                                onClick={() => setPanelOpen(true)}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                            >
                                Ganti Paket
                                <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </section>
                )}

                {/* 2-column grid — Usage + Invoice di kiri (span 2), Payment/Promo/Danger di kanan */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 space-y-5">
                        {/* Usage Section */}
                        {currentPlan && (
                    <section className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 overflow-hidden">
                        <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-zinc-500" />
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                Pemakaian Bulan Ini
                            </h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <UsageBar
                                label="WA Chat AI"
                                used={usage?.wa_chat_count ?? 0}
                                limit={currentPlan.limits.wa_chat_monthly}
                                suffix="chat"
                            />
                            <UsageBar
                                label="Tanya Kelola"
                                used={usage?.tanya_kelola_daily_count ?? 0}
                                limit={currentPlan.limits.tanya_kelola_daily}
                                suffix="query hari ini"
                            />
                            <UsageBar
                                label="Broadcast WA"
                                used={usage?.broadcast_contacts_count ?? 0}
                                limit={currentPlan.limits.broadcast_monthly}
                                suffix="kontak"
                            />
                            <UsageBar
                                label="OCR Bukti Bayar"
                                used={usage?.ocr_verify_count ?? 0}
                                limit={currentPlan.limits.ocr_monthly}
                                suffix="verifikasi"
                            />
                        </div>
                    </section>
                )}

                        {/* Invoice History */}
                        <section className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 overflow-hidden">
                            <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-zinc-500" />
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    Riwayat Invoice
                                </h3>
                            </div>
                            <div className="p-5">
                                {invoices.length === 0 ? (
                                    <div className="text-center py-6 text-sm text-zinc-500">
                                        Belum ada invoice. Riwayat akan muncul di sini setelah Anda melakukan pembayaran pertama.
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {invoices.map((inv) => (
                                            <li key={inv.id} className="py-3 flex items-center justify-between text-sm">
                                                <div>
                                                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                                        {inv.invoice_number || inv.id.slice(0, 8)}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 mt-0.5">
                                                        {new Date(inv.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                                        {formatIDR(inv.net_amount)}
                                                    </div>
                                                    <div className={`text-[10px] uppercase font-semibold ${inv.status === "paid" ? "text-emerald-600" : inv.status === "pending" ? "text-amber-600" : "text-rose-600"}`}>
                                                        {inv.status}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>

                    </div>
                    {/* Kolom kanan (col-span-1): Payment Method, Promo Code, Danger Zone */}
                    <div className="lg:col-span-1 space-y-5">
                {/* Payment Method */}
                <section className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-zinc-500" />
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Metode Pembayaran
                        </h3>
                    </div>
                    <div className="p-5">
                        <div className="flex items-start gap-3 p-4 rounded-md bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-300 dark:border-zinc-700">
                            <div className="w-8 h-8 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                <CreditCard className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    Xendit sedang dipersiapkan
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Setelah aktif, Anda dapat bayar via QRIS, transfer bank, atau e-wallet
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Promo Code */}
                <section className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-zinc-500" />
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Kode Promo
                        </h3>
                    </div>
                    <div className="p-5">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                placeholder="Masukkan kode promo..."
                                className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            <button
                                onClick={() => alert("Kode promo akan diverifikasi saat sistem pembayaran aktif")}
                                disabled={!promoCode.trim()}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Terapkan
                            </button>
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="border border-rose-200 dark:border-rose-900/50 rounded-lg bg-rose-50/30 dark:bg-rose-950/10 overflow-hidden">
                    <div className="px-5 py-3 border-b border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                            Zona Bahaya
                        </h3>
                    </div>
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    Batalkan Langganan
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Akan didowngrade ke Starter di akhir periode. Data tetap utuh.
                                </p>
                            </div>
                            <button
                                onClick={() => alert("Fitur pembatalan akan aktif setelah sistem pembayaran siap")}
                                className="text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors shrink-0"
                            >
                                Batalkan →
                            </button>
                        </div>
                    </div>
                </section>
                    </div>
                </div>
                {/* End of 2-column grid */}
            </div>

            {/* Side Panel Change Package */}
            <ChangePackagePanel
                open={panelOpen}
                onClose={() => setPanelOpen(false)}
                plans={plans}
                currentPlanId={currentPlan?.id ?? null}
            />
        </>
    );
}

// ─────────────────────────────────────────────────────────
// Sub-component: UsageBar
// ─────────────────────────────────────────────────────────
function UsageBar({
    label,
    used,
    limit,
    suffix,
}: {
    label: string;
    used: number;
    limit: number;
    suffix: string;
}) {
    const isUnlimited = limit === -1;
    const percent = isUnlimited ? 0 : limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    const isHigh = percent >= 80;
    const isCritical = percent >= 95;

    const barColor = isCritical
        ? "bg-rose-500"
        : isHigh
        ? "bg-amber-500"
        : "bg-emerald-500";

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{label}</span>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums flex items-center gap-1">
                    {isUnlimited ? (
                        <>
                            <InfinityIcon className="w-3 h-3" />
                            <span>Unlimited</span>
                        </>
                    ) : limit === 0 ? (
                        <span className="text-zinc-400">Tidak tersedia</span>
                    ) : (
                        <span>
                            <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                                {used.toLocaleString("id-ID")}
                            </span>{" "}
                            / {limit.toLocaleString("id-ID")} {suffix}
                        </span>
                    )}
                </div>
            </div>
            {!isUnlimited && limit > 0 && (
                <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                        className={`h-full ${barColor} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            )}
        </div>
    );
}
