"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, X, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSubscription, daysUntil, isTrialing } from "@/lib/billing/subscription";
import type { SubscriptionWithPlan } from "@/lib/billing/types";

/**
 * TrialBanner — minimal, Linear/Vercel-style.
 * Border-left indicator only (no gradient/emoji), compact height,
 * dark-mode aware. Auto-hidden after user dismiss (per session).
 */
export default function TrialBanner({ businessId }: { businessId: string | null }) {
    const [sub, setSub] = useState<SubscriptionWithPlan | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!businessId) return;
        const supabase = createClient();
        getSubscription(supabase, businessId).then(setSub);

        const today = new Date().toISOString().slice(0, 10);
        const key = `kelola_trial_dismissed_${businessId}_${today}`;
        if (typeof window !== "undefined" && sessionStorage.getItem(key) === "1") {
            setDismissed(true);
        }
    }, [businessId]);

    if (!sub || !isTrialing(sub) || dismissed) return null;

    const days = daysUntil(sub.trial_end);
    const isCritical = days <= 1;
    const isUrgent = days <= 3;

    // Left border indicator color (only meaningful accent)
    const borderColor = isCritical
        ? "border-l-rose-500"
        : isUrgent
        ? "border-l-amber-500"
        : "border-l-orange-500";

    // Icon color matches border
    const iconColor = isCritical
        ? "text-rose-500"
        : isUrgent
        ? "text-amber-500"
        : "text-orange-500";

    // Label text — tier-based dengan loss-aversion di urgent
    const label = isCritical
        ? "Trial berakhir hari ini · Broadcast, AI Insight & Tanya Kelola akan hilang"
        : isUrgent
        ? `${days} hari lagi trial berakhir · Fitur Pro akan hilang kalau ga upgrade`
        : `Trial Pro · ${days} hari tersisa`;

    function handleDismiss() {
        if (!businessId) return;
        const today = new Date().toISOString().slice(0, 10);
        const key = `kelola_trial_dismissed_${businessId}_${today}`;
        sessionStorage.setItem(key, "1");
        setDismissed(true);
    }

    return (
        <div
            className={`
                border-b border-zinc-200 dark:border-zinc-800
                bg-white dark:bg-zinc-950
                border-l-2 ${borderColor}
            `}
        >
            <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-4">
                <Clock className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} strokeWidth={2.5} />

                <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {label}
                    </span>
                </div>

                <Link
                    href="/dashboard/billing?upgrade=1"
                    className="
                        inline-flex items-center gap-1
                        text-[12px] font-medium
                        text-zinc-700 dark:text-zinc-300
                        hover:text-zinc-900 dark:hover:text-zinc-100
                        transition-colors
                        shrink-0
                    "
                >
                    Upgrade
                    <ArrowRight className="w-3 h-3" />
                </Link>

                <button
                    onClick={handleDismiss}
                    aria-label="Tutup"
                    className="
                        text-zinc-400 hover:text-zinc-600
                        dark:text-zinc-500 dark:hover:text-zinc-300
                        transition-colors shrink-0
                    "
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
