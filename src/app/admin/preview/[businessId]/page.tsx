import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, Package, User, ShoppingCart, MessageSquare, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminPreviewCCTVPage({ params }: { params: Promise<{ businessId: string }> }) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { businessId } = await params;

    const { data: business } = await supabaseAdmin
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

    if (!business) return notFound();

    // Fetch Stats
    const { count: countProducts } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('business_id', businessId);
    const { count: countCustomers } = await supabaseAdmin.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', businessId);
    const { count: countOrders } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('business_id', businessId);

    // Sum Total Revenue for this business
    const { data: ordersData } = await supabaseAdmin.from('orders').select('total').eq('business_id', businessId);
    const totalEarnings = ordersData?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;

    return (
        <div className="space-y-6">
            <div>
                <Link href="/admin/clients" className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-sm mb-4">
                    <ArrowLeft size={16} /> Kembali ke Kumpulan Klien
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-text-dark tracking-tight">CCTV Klien</h1>
                        <p className="text-text-muted text-base mt-1">Mengintip statisik <strong className="text-text-dark">"{business.business_name}"</strong> mode Read-Only.</p>
                    </div>
                    <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> Live Mirroring
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl hover:shadow-md transition-shadow">
                    <Package size={20} className="text-primary mb-3" />
                    <p className="text-xs text-text-muted uppercase tracking-widest font-bold mb-1">Total Produk</p>
                    <p className="text-2xl font-black text-text-dark">{countProducts}</p>
                </div>
                <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl hover:shadow-md transition-shadow">
                    <User size={20} className="text-blue-500 mb-3" />
                    <p className="text-xs text-text-muted uppercase tracking-widest font-bold mb-1">Pelanggan Unik</p>
                    <p className="text-2xl font-black text-text-dark">{countCustomers}</p>
                </div>
                <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl hover:shadow-md transition-shadow">
                    <ShoppingCart size={20} className="text-emerald-500 mb-3" />
                    <p className="text-xs text-text-muted uppercase tracking-widest font-bold mb-1">Pesanan Terjadi</p>
                    <p className="text-2xl font-black text-text-dark">{countOrders}</p>
                </div>
                <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl hover:shadow-md transition-shadow">
                    <MessageSquare size={20} className="text-orange-400 mb-3" />
                    <p className="text-xs text-text-muted uppercase tracking-widest font-bold mb-1">Token AI Terpakai</p>
                    <p className="text-2xl font-black text-text-dark">{business.token_usage || 0}</p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
                <p className="text-xs text-emerald-600 uppercase tracking-widest font-bold mb-1">Total Nilai Transaksi Bisnis Ini</p>
                <p className="text-4xl font-black text-emerald-600">Rp {totalEarnings.toLocaleString('id-ID')}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <p className="text-sm text-text-muted">
                    Mode CCTV hanya menampilkan angka agregasi untuk melindungi kerahasiaan data transaksi individu milik merchant.
                </p>
            </div>
        </div>
    );
}
