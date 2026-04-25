"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Admin only action
export async function saveGlobalBannerSettings(message: string, isActive: boolean) {
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized: Harap login terlebih dahulu.");
    }

    // Security Check
    const adminEmailsConfig = process.env.ADMIN_EMAILS || "";
    const adminEmails = adminEmailsConfig.split(",").map(e => e.trim().toLowerCase());
    const isDevel = process.env.NODE_ENV === 'development';
    const hasAccess = adminEmails.includes(user.email!.toLowerCase()) || (isDevel && adminEmailsConfig === "");

    if (!hasAccess) {
        throw new Error("Forbidden: Anda bukan Super Admin.");
    }

    // Bypass RLS using Service Role
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
        .from('system_settings')
        .upsert({
            key: 'global_banner',
            value: message,
            is_active: isActive,
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

    if (error) {
        throw new Error(error.message);
    }

    // Force Next.js to re-fetch the layout
    revalidatePath("/", "layout");
    
    return { success: true };
}

// Public authenticated action
export async function getGlobalBannerSettings() {
    // Optional check: Ensure user is at least logged in
    const supabaseAuth = await createServerClient();
    const { data: { session } } = await supabaseAuth.auth.getSession();
    if (!session) return null;

    // Bypass RLS using Service Role to just read the public banner
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
        .from('system_settings')
        .select('*')
        .eq('key', 'global_banner')
        .single();
    
    if (error || !data) return null;
    return data;
}
