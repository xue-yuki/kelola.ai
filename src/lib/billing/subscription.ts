// ─────────────────────────────────────────────────────────────────
// Subscription helpers — client-safe (pake createClient dari
// @/lib/supabase/client atau bisa juga di-server pake createServerClient
// via parameter dependency injection).
// ─────────────────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
    Subscription,
    SubscriptionPlan,
    SubscriptionWithPlan,
    PlanFeatures,
    PlanLimits,
    FeatureUsage,
    PlanId,
} from "./types";

/**
 * Ambil subscription aktif suatu business + plan-nya (JOIN).
 * Return null kalau ga ada subscription (edge case).
 */
export async function getSubscription(
    supabase: SupabaseClient,
    businessId: string
): Promise<SubscriptionWithPlan | null> {
    const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("business_id", businessId)
        .in("status", ["trialing", "active", "grace"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!sub) return null;

    const { data: plan } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", sub.plan_id)
        .single();

    if (!plan) return null;

    return { ...(sub as Subscription), plan: plan as SubscriptionPlan };
}

/**
 * Cek apakah fitur tertentu ke-unlock untuk business ini.
 * Example: hasFeature(sub, "broadcast") → true/false
 */
export function hasFeature(
    sub: SubscriptionWithPlan | null,
    feature: keyof PlanFeatures
): boolean {
    if (!sub) return false;
    if (sub.status === "suspended" || sub.status === "cancelled") return false;
    const val = sub.plan.features[feature];
    return val === true || (typeof val === "string" && val.length > 0);
}

/**
 * Ambil limit fitur (untuk quota check).
 * Return -1 = unlimited.
 */
export function getLimit(
    sub: SubscriptionWithPlan | null,
    key: keyof PlanLimits
): number {
    if (!sub) return 0;
    return sub.plan.limits[key] ?? 0;
}

/**
 * Cek quota masih tersisa buat fitur tertentu.
 * Return: { limit, used, remaining, exceeded }
 */
export async function checkQuota(
    supabase: SupabaseClient,
    businessId: string,
    sub: SubscriptionWithPlan,
    quotaKey: "wa_chat" | "tanya_kelola" | "broadcast" | "ocr"
): Promise<{ limit: number; used: number; remaining: number; exceeded: boolean }> {
    const usage = await getCurrentUsage(supabase, businessId, sub);

    const limitKey: keyof PlanLimits = (
        quotaKey === "wa_chat"      ? "wa_chat_monthly" :
        quotaKey === "tanya_kelola" ? "tanya_kelola_daily" :
        quotaKey === "broadcast"    ? "broadcast_monthly" :
                                      "ocr_monthly"
    );
    const limit = getLimit(sub, limitKey);

    const used = (
        quotaKey === "wa_chat"      ? usage.wa_chat_count :
        quotaKey === "tanya_kelola" ? usage.tanya_kelola_daily_count :
        quotaKey === "broadcast"    ? usage.broadcast_contacts_count :
                                      usage.ocr_verify_count
    );

    if (limit === -1) {
        return { limit: -1, used, remaining: Infinity, exceeded: false };
    }

    return {
        limit,
        used,
        remaining: Math.max(0, limit - used),
        exceeded: used >= limit,
    };
}

/**
 * Ambil / auto-create feature_usage row untuk periode saat ini.
 * Reset tanya_kelola_daily counter kalau tanggal reset udah lewat.
 */
export async function getCurrentUsage(
    supabase: SupabaseClient,
    businessId: string,
    sub: SubscriptionWithPlan
): Promise<FeatureUsage> {
    // Periode = subscription's current billing cycle
    const periodStart = sub.current_period_start;

    const { data: existing } = await supabase
        .from("feature_usage")
        .select("*")
        .eq("business_id", businessId)
        .eq("period_start", periodStart)
        .maybeSingle();

    if (existing) {
        const existingRow = existing as FeatureUsage;
        // Reset harian tanya_kelola kalau tgl reset < hari ini
        const today = new Date().toISOString().slice(0, 10);
        if (existingRow.tanya_kelola_daily_reset_at < today) {
            const { data: updated } = await supabase
                .from("feature_usage")
                .update({
                    tanya_kelola_daily_count: 0,
                    tanya_kelola_daily_reset_at: today,
                })
                .eq("id", existingRow.id)
                .select()
                .single();
            return (updated as FeatureUsage) ?? existingRow;
        }
        return existingRow;
    }

    // Buat baru untuk periode ini
    const { data: created } = await supabase
        .from("feature_usage")
        .insert({
            business_id: businessId,
            period_start: sub.current_period_start,
            period_end: sub.current_period_end,
        })
        .select()
        .single();

    return created as FeatureUsage;
}

/**
 * Increment counter usage. Amount default 1.
 * Return: bool sukses / false kalau exceed limit (opsi enforce=true).
 */
export async function incrementUsage(
    supabase: SupabaseClient,
    businessId: string,
    sub: SubscriptionWithPlan,
    quotaKey: "wa_chat" | "tanya_kelola" | "broadcast" | "ocr" | "ai_insight",
    amount: number = 1
): Promise<void> {
    const usage = await getCurrentUsage(supabase, businessId, sub);

    const columnMap = {
        wa_chat: "wa_chat_count",
        tanya_kelola: "tanya_kelola_daily_count",
        broadcast: "broadcast_contacts_count",
        ocr: "ocr_verify_count",
        ai_insight: "ai_insight_sent_count",
    };
    const column = columnMap[quotaKey];
    const currentVal = (usage as unknown as Record<string, number>)[column] ?? 0;

    await supabase
        .from("feature_usage")
        .update({ [column]: currentVal + amount })
        .eq("id", usage.id);
}

/**
 * Utility: format Rupiah
 */
export function formatIDR(amount: number): string {
    return `Rp ${amount.toLocaleString("id-ID")}`;
}

/**
 * Utility: days remaining until date
 */
export function daysUntil(dateIso: string | null): number {
    if (!dateIso) return 0;
    const diff = new Date(dateIso).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Utility: apakah subscription lagi trial?
 */
export function isTrialing(sub: SubscriptionWithPlan | null): boolean {
    return sub?.status === "trialing";
}

/**
 * Utility: get plan display name by id
 */
export const PLAN_DISPLAY_NAME: Record<PlanId, string> = {
    starter: "Starter",
    basic: "Basic",
    pro: "Kelola Pro",
};
