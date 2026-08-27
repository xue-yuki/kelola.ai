import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BillingClient from "./BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: business } = await supabase
        .from("businesses")
        .select("id, business_name")
        .eq("user_id", user.id)
        .single();

    if (!business) redirect("/onboarding");

    const [
        { data: sub },
        { data: plans },
        { data: usage },
        { data: invoices },
    ] = await Promise.all([
        supabase
            .from("subscriptions")
            .select("*")
            .eq("business_id", business.id)
            .in("status", ["trialing", "active", "grace"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase
            .from("subscription_plans")
            .select("*")
            .eq("is_active", true)
            .order("sort_order"),
        supabase
            .from("feature_usage")
            .select("*")
            .eq("business_id", business.id)
            .order("period_start", { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase
            .from("invoices")
            .select("*")
            .eq("business_id", business.id)
            .order("created_at", { ascending: false })
            .limit(10),
    ]);

    const currentPlan = sub ? (plans || []).find((p) => p.id === sub.plan_id) : null;

    return (
        <BillingClient
            businessName={business.business_name}
            subscription={sub}
            plans={plans || []}
            currentPlan={currentPlan || null}
            usage={usage}
            invoices={invoices || []}
        />
    );
}
