// ─────────────────────────────────────────────────────────────────
// Subscription & Billing — Types
// Reflect skema Supabase (subscription_plans, subscriptions, invoices,
// feature_usage, promo_codes, promo_redemptions)
// ─────────────────────────────────────────────────────────────────

export type PlanId = "starter" | "basic" | "pro";
export type SubStatus = "trialing" | "active" | "grace" | "suspended" | "cancelled";
export type InvoiceStatus = "pending" | "paid" | "failed" | "expired" | "refunded";
export type PaymentMethod = "xendit_qris" | "xendit_va" | "xendit_ewallet" | "manual_transfer";
export type PromoDiscountType = "percentage" | "fixed" | "trial_extend";

export type PlanFeatures = {
    pos?: boolean;
    produk?: boolean;
    pelanggan?: boolean;
    pesanan?: boolean;
    laporan_basic?: boolean;
    laporan_lengkap?: boolean;
    asisten_ai?: boolean;
    tanya_kelola?: boolean;
    tanya_kelola_haiku_direct?: boolean;
    broadcast?: boolean;
    broadcast_schedule?: boolean;
    broadcast_segment?: boolean;
    export_pdf?: boolean;
    export_excel?: boolean;
    ai_insight?: false | "weekly" | "daily";
    ocr_verify?: boolean;
    xendit_pos?: boolean;
    payment_link?: boolean;
    priority_support_wa?: boolean;
    onboarding_call?: boolean;
};

export type PlanLimits = {
    wa_chat_monthly: number;         // -1 = unlimited
    tanya_kelola_daily: number;      // per hari, reset 00:00
    broadcast_monthly: number;
    ocr_monthly: number;             // -1 = unlimited
    wa_numbers: number;
    business_count: number;
    support_response_hours: number;
};

export type SubscriptionPlan = {
    id: PlanId;
    name: string;
    price_monthly: number;
    anchor_price: number | null;
    features: PlanFeatures;
    limits: PlanLimits;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
};

export type Subscription = {
    id: string;
    business_id: string;
    plan_id: PlanId;
    status: SubStatus;
    trial_end: string | null;
    current_period_start: string;
    current_period_end: string;
    xendit_customer_id: string | null;
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;
};

export type Invoice = {
    id: string;
    business_id: string;
    subscription_id: string | null;
    invoice_number: string | null;
    plan_id: PlanId;
    amount: number;
    discount_amount: number;
    net_amount: number;
    currency: string;
    status: InvoiceStatus;
    payment_method: PaymentMethod | null;
    xendit_invoice_id: string | null;
    xendit_external_id: string | null;
    payment_url: string | null;
    paid_at: string | null;
    expired_at: string | null;
    manual_transfer_proof_url: string | null;
    promo_code: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
};

export type FeatureUsage = {
    id: string;
    business_id: string;
    period_start: string;
    period_end: string;
    wa_chat_count: number;
    tanya_kelola_daily_count: number;
    tanya_kelola_daily_reset_at: string;
    broadcast_contacts_count: number;
    ocr_verify_count: number;
    ai_insight_sent_count: number;
    created_at: string;
    updated_at: string;
};

export type PromoCode = {
    id: string;
    code: string;
    description: string | null;
    discount_type: PromoDiscountType;
    discount_value: number;
    tier_restriction: PlanId | "all" | null;
    usage_limit: number | null;
    usage_count: number;
    expires_at: string | null;
    is_active: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
};

export type PromoRedemption = {
    id: string;
    promo_code_id: string;
    business_id: string;
    invoice_id: string | null;
    discount_applied: number;
    redeemed_at: string;
};

// Combined type helper: subscription + plan (join hasil)
export type SubscriptionWithPlan = Subscription & {
    plan: SubscriptionPlan;
};
