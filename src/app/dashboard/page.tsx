// ─────────────────────────────────────────────────────────────────
// Dashboard SERVER COMPONENT (RSC)
// Data di-fetch di server (Supabase RLS-authenticated via cookies),
// hasilnya di-embed ke HTML awal. NO client-side waterfall.
// LCP: 8s (CSR) → target <2s (SSR).
// ─────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { fetchDashboardData } from "./_data";
import DashboardClient from "./DashboardClient";

// Force dynamic — dashboard bergantung ke session cookie, ga bisa di-cache statis
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const data = await fetchDashboardData();

    // Kalau user belum login (data null), redirect ke login
    // (biasanya middleware/proxy udah handle, tapi safety net)
    if (!data) {
        redirect("/auth/login");
    }

    return <DashboardClient initialData={data} />;
}
