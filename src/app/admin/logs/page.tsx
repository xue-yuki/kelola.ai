import { createClient } from "@supabase/supabase-js";
import { MessageSquareCode, User, Bot, Clock } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminLogsPage() {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the 50 most recent conversations across all businesses
    // We join with businesses to get the business name
    const { data: logs, error } = await supabaseAdmin
        .from('conversations')
        .select(`
            *,
            businesses (
                business_name
            )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-text-dark tracking-tight mb-2">Monitoring Log AI</h1>
                <p className="text-text-muted text-lg">Pantau interaksi bot dengan pelanggan untuk keperluan riset & penyempurnaan prompt.</p>
            </div>

            <div className="space-y-4">
                {logs?.map((log) => (
                    <div key={log.id} className="bg-white border border-gray-100 shadow-sm p-6 rounded-2xl flex flex-col gap-3 transition-shadow hover:shadow-md">
                        <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                            <p className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <span className="bg-gray-100 px-2 py-1 rounded text-text-dark border border-gray-200">{log.businesses?.business_name || 'Unknown'}</span>
                                {' → '} Customer: +{log.customer_wa}
                            </p>
                            <span className="text-xs text-text-muted flex items-center gap-1 font-mono">
                                <Clock size={12} /> {new Date(log.created_at).toLocaleString('id-ID')}
                            </span>
                        </div>
                        
                        <div className={`flex gap-4 ${log.role === 'assistant' ? 'bg-primary/5 border-primary/10' : 'bg-gray-50 border-gray-100'} p-4 rounded-xl border`}>
                            <div className="shrink-0 mt-1">
                                {log.role === 'assistant' ? <Bot size={20} className="text-primary" /> : <User size={20} className="text-gray-400" />}
                            </div>
                            <div className="flex-1 whitespace-pre-wrap text-sm text-text-dark font-mono leading-relaxed">
                                {log.message}
                            </div>
                        </div>
                    </div>
                ))}

                {(!logs || logs.length === 0) && (
                    <div className="text-center p-12 text-text-muted border border-gray-200 rounded-2xl border-dashed bg-gray-50">
                        Belum ada riwayat percakapan tercatat.
                    </div>
                )}
            </div>
        </div>
    );
}
