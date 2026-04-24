import { createClient } from "@supabase/supabase-js";
import ClientTable from "./ClientTable";

export const dynamic = 'force-dynamic';

export default async function AdminClientsListPage() {
    // Service role bypass
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all businesses
    const { data: businesses, error } = await supabaseAdmin
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return <div className="text-rose-500">Error fetching clients: {error.message}</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-text-dark tracking-tight mb-2">Manajemen Klien</h1>
                <p className="text-text-muted text-lg">Kelola seluruh merchant yang terdaftar di platform Anda.</p>
            </div>

            <ClientTable initialBusinesses={businesses || []} />
        </div>
    );
}
