import { createClient } from "@supabase/supabase-js";
import { Users, CheckCircle, Clock, Database, Wallet, TrendingUp, AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
    // We use the Service Role key here because RLS prevents the Admin user from querying other users' businesses
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch Stats
    // Total Clients
    const { count: totalClients } = await supabaseAdmin
        .from('businesses')
        .select('*', { count: 'exact', head: true });

    // Connected WA
    const { count: connectedWA } = await supabaseAdmin
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('wa_status', 'connected');

    // Total Orders across all platform (if exists, assumption made to calculate platform traction)
    const { count: totalOrders } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true });

    // Billing & Cost Calculation
    const { data: allClients } = await supabaseAdmin.from('businesses').select('subscription_tier, token_usage');
    
    let totalRevenue = 0;
    let totalTokenUsage = 0;

    allClients?.forEach(biz => {
        const tier = biz.subscription_tier?.toLowerCase() || 'starter';
        if (tier === 'pro') totalRevenue += 99000;
        else if (tier === 'basic') totalRevenue += 79000;
        else totalRevenue += 49000; // Starter default

        totalTokenUsage += (biz.token_usage || 0);
    });

    const COST_PER_TOKEN = 1.65; // Fixed cost assumed from FIKSI PDF (OpenRouter/Gemini-Flash approx)
    const totalCost = totalTokenUsage * COST_PER_TOKEN;
    const grossProfit = totalRevenue - totalCost;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-text-dark tracking-tight mb-2">Platform Overview</h1>
                <p className="text-text-muted text-lg">Statistik utama dari seluruh merchant di Kelola.ai.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Merchant" 
                    value={totalClients ?? 0} 
                    icon={Users} 
                    color="text-primary" 
                    bg="bg-primary/10" 
                    border="border-primary/20"
                />
                <div className="border border-gray-100 p-6 rounded-2xl bg-white relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-[#25D366]/10 text-[#25D366]`}>
                            <CheckCircle size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-bold tracking-widest text-[#25D366] uppercase mb-1">WhatsApp Aktif</p>
                    <h2 className="text-4xl font-black text-text-dark">{connectedWA ?? 0}</h2>
                    <p className="text-xs text-text-muted mt-3 font-medium">Merchant dgn koneksi Agent WA aktif</p>
                </div>
                <StatCard 
                    title="Total Pesanan" 
                    value={totalOrders ?? 0} 
                    icon={Database} 
                    color="text-emerald-500" 
                    bg="bg-emerald-500/10" 
                    border="border-emerald-500/20"
                />
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6 pt-6">
                {/* Financial Overview */}
                <div className="border border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-white to-primary/5 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full" />
                    
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-text-dark">Platform Keuangan</h3>
                            <p className="text-xs text-text-muted">Estimasi Gross Profit Bulan Ini</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flexjustify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100 flex gap-4">
                            <div className="flex-1">
                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Gross Revenue</p>
                                <p className="text-xl font-bold text-text-dark">Rp {totalRevenue.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="w-px h-10 bg-gray-200" />
                            <div className="flex-1">
                                <p className="text-[10px] text-red-500/70 font-bold uppercase tracking-wider mb-1">API Cost (OpenRouter)</p>
                                <p className="text-xl font-bold text-red-500">-Rp {Math.round(totalCost).toLocaleString('id-ID')}</p>
                            </div>
                        </div>

                        <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">Net Profit Margin</p>
                                <p className="text-3xl font-black text-primary">Rp {Math.round(grossProfit).toLocaleString('id-ID')}</p>
                            </div>
                            <TrendingUp size={32} className="text-primary/50" />
                        </div>
                        <p className="text-[10px] text-text-muted text-center flex items-center justify-center gap-1">
                            <AlertTriangle size={10} /> Dihitung otomatis (Rp 1.65/token API)
                        </p>
                    </div>
                </div>

                <div className="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-text-dark">Sistem & Konektivitas</h3>
                    <div className="space-y-4">
                         <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                             <div className="flex items-center gap-3">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                 <span className="font-semibold text-text-dark">Agent Server Status</span>
                             </div>
                             <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg">ONLINE</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg, border }: any) {
    return (
        <div className={`border ${border} p-6 rounded-2xl bg-white relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow`}>
            <div className="absolute top-0 right-0 p-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color}`}>
                    <Icon size={24} />
                </div>
            </div>
            <p className="text-sm font-bold tracking-widest text-text-muted uppercase mb-1">{title}</p>
            <h2 className="text-4xl font-black text-text-dark tracking-tight">{value}</h2>
        </div>
    );
}
