import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
    title: "Super Admin | Kelola.ai",
    description: "Platform management for Kelola.ai",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Wajib login
    if (!user) {
        redirect("/auth/login");
    }

    // Wajib termasuk dalam daftar Super Admin (ADMIN_EMAILS)
    const adminEmailsConfig = process.env.ADMIN_EMAILS || "";
    const adminEmails = adminEmailsConfig.split(",").map(e => e.trim().toLowerCase());
    const isDevel = process.env.NODE_ENV === 'development';
    const hasAccess = adminEmails.includes(user.email!.toLowerCase()) || (isDevel && adminEmailsConfig === "");

    if (!hasAccess) {
        redirect("/dashboard");
    }

    return (
        <div className="flex min-h-screen bg-[#f8f9fa] font-sans selection:bg-primary/30">
            <AdminSidebar userEmail={user.email ?? ""} />
            <main className="flex-1 w-full lg:w-auto h-[100dvh] overflow-y-auto pt-16 lg:pt-0">
                <div className="p-6 lg:p-10 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
