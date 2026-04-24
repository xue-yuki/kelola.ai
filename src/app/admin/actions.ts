"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function forceDeleteBusinessAction(businessId: string) {
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

    // Delete cascading references manually just like the standard API
    const tables = ['conversations', 'orders', 'customers', 'products'];
    for (const table of tables) {
        const { error } = await supabaseAdmin.from(table).delete().eq('business_id', businessId);
        if (error) console.error(`Error cascading ${table}:`, error);
    }

    // Delete the business record itself
    const { error: bizError } = await supabaseAdmin.from('businesses').delete().eq('id', businessId);
    
    if (bizError) {
        throw new Error("Gagal menghapus bisnis: " + bizError.message);
    }

    // Force Next.js to re-fetch the table
    revalidatePath("/admin/clients");
    revalidatePath("/admin");
    
    return { success: true };
}

export async function updateBusinessPackageAction(businessId: string, newTier: string, resetToken: boolean) {
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const adminEmailsConfig = process.env.ADMIN_EMAILS || "";
    const adminEmails = adminEmailsConfig.split(",").map(e => e.trim().toLowerCase());
    const isDevel = process.env.NODE_ENV === 'development';
    const hasAccess = adminEmails.includes(user.email!.toLowerCase()) || (isDevel && adminEmailsConfig === "");

    if (!hasAccess) throw new Error("Forbidden");

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updateData: any = { subscription_tier: newTier };
    if (resetToken) {
        updateData.token_usage = 0;
    }

    const { error } = await supabaseAdmin.from('businesses').update(updateData).eq('id', businessId);
    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/clients");
    revalidatePath("/admin");
    return { success: true };
}
