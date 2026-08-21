"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Plus, Package, Edit2, Trash2, Loader2, X, Check,
    Download, Filter, Columns, MoreHorizontal, ArrowRight, TrendingUp, TrendingDown,
    Activity, ArrowUpRight, DollarSign, Box, AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type Product = {
    id: string;
    business_id: string;
    name: string;
    price: number;
    cost_price: number;
    stock: number;
    created_at: string;
    // Computed fields
    unitsSold?: number;
    revenue?: number;
};

const CHART_COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#f43f5e", "#71717a"];
const TABS = ["Semua Produk"];

export default function ProdukPage() {
    const supabase = createClient();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("All Products");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({ name: "", price: "", cost_price: "", stock: "" });

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: business } = await supabase.from('businesses').select('id').eq('user_id', session.user.id).single();
            if (!business) return;

            // Fetch products AND orders to calculate real sales data
            const [productsResponse, ordersResponse] = await Promise.all([
                supabase.from('products').select('*').eq('business_id', business.id).order('created_at', { ascending: false }),
                supabase.from('orders').select('items, status').eq('business_id', business.id)
            ]);

            if (productsResponse.error) throw productsResponse.error;
            
            const rawProducts = productsResponse.data || [];
            const rawOrders = ordersResponse.data || [];

            // Parse JSON items from orders to aggregate sales per product
            const salesMap: Record<string, { qty: number, revenue: number }> = {};
            
            rawOrders.forEach(order => {
                // Only count non-cancelled orders for revenue
                if (order.status !== 'dibatalkan') {
                    let items: any[] = [];
                    try {
                        items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                    } catch (e) { }

                    items.forEach(item => {
                        const nameKey = item.name?.toLowerCase().trim();
                        if (nameKey) {
                            if (!salesMap[nameKey]) salesMap[nameKey] = { qty: 0, revenue: 0 };
                            salesMap[nameKey].qty += (parseInt(item.qty) || 0);
                            salesMap[nameKey].revenue += ((parseInt(item.qty) || 0) * (parseInt(item.price) || 0));
                        }
                    });
                }
            });

            // Merge sales data into products
            const enrichedProducts = rawProducts.map(p => {
                const nameKey = p.name?.toLowerCase().trim();
                const sales = salesMap[nameKey] || { qty: 0, revenue: 0 };
                return {
                    ...p,
                    unitsSold: sales.qty,
                    revenue: sales.revenue
                };
            });

            setProducts(enrichedProducts);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (product: Product | null = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                price: product.price?.toString() || "0",
                cost_price: product.cost_price?.toString() || "0",
                stock: product.stock?.toString() || "0"
            });
        } else {
            setEditingProduct(null);
            setFormData({ name: "", price: "", cost_price: "", stock: "" });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { data: business } = await supabase.from('businesses').select('id').eq('user_id', session.user.id).single();
            if (!business) return;

            const productData = {
                business_id: business.id,
                name: formData.name,
                price: parseInt(formData.price) || 0,
                cost_price: parseInt(formData.cost_price) || 0,
                stock: parseInt(formData.stock) || 0
            };

            if (editingProduct) {
                await supabase.from('products').update(productData).eq('id', editingProduct.id);
            } else {
                await supabase.from('products').insert([productData]);
            }

            fetchProducts();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Gagal menyimpan produk.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus produk ini?")) return;
        try {
            await supabase.from('products').delete().eq('id', id);
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    // Filtered Data
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Metrics
    const lowStockProducts = products.filter(p => p.stock <= 5).sort((a,b) => a.stock - b.stock);
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.stock > 0).length;
    const totalRevenue = products.reduce((acc, p) => acc + (p.revenue || 0), 0);
    const totalUnitsSold = products.reduce((acc, p) => acc + (p.unitsSold || 0), 0);

    // Top Products Chart Data (Sorted by real revenue)
    const sortedByRev = [...products].sort((a,b) => (b.revenue || 0) - (a.revenue || 0));
    const topProductsList = sortedByRev.slice(0, 5).filter(p => (p.revenue || 0) > 0);
    const otherRev = sortedByRev.slice(5).reduce((acc, p) => acc + (p.revenue || 0), 0);
    
    const chartData = topProductsList.map((p, i) => ({
        name: p.name,
        value: p.revenue || 0,
        color: CHART_COLORS[i % CHART_COLORS.length]
    }));
    
    if (otherRev > 0) {
        chartData.push({ name: "Others", value: otherRev, color: CHART_COLORS[5] });
    }
    
    const chartTotal = chartData.reduce((acc, d) => acc + d.value, 0);

    return (
        <div className="-m-8 min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 font-sans p-8 flex justify-center">
            <div className="flex gap-8 w-full max-w-[1600px]">
                
                {/* ── Main Column ───────────────────────────────────────── */}
                <div className="flex-1 min-w-0 flex flex-col h-[calc(100vh-137px)] overflow-y-auto custom-scrollbar pr-2">
                    
                    {/* Tabs & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                        <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-[-1px]">
                            {TABS.map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? "border-orange-500 text-orange-600 dark:text-orange-500" : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 pb-3">
                            <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                                <Plus size={14} /> Tambah Produk
                            </button>
                        </div>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 shrink-0">
                        <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
                            <p className="text-xs font-medium text-zinc-500 mb-2">Total Produk</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{totalProducts}</p>
                            <p className="text-[10px] font-semibold flex items-center gap-1 text-emerald-600 dark:text-emerald-500"><TrendingUp size={12}/> Updated <span className="text-zinc-400 font-normal">just now</span></p>
                        </div>
                        <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
                            <p className="text-xs font-medium text-zinc-500 mb-2">Produk Aktif</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{activeProducts}</p>
                            <p className="text-[10px] font-semibold flex items-center gap-1 text-emerald-600 dark:text-emerald-500"><TrendingUp size={12}/> Ready stock <span className="text-zinc-400 font-normal">items</span></p>
                        </div>
                        <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm col-span-2 md:col-span-1">
                            <p className="text-xs font-medium text-zinc-500 mb-2">Total Omzet</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Rp {(totalRevenue / 1000).toLocaleString('id-ID')}k</p>
                            <p className="text-[10px] font-semibold flex items-center gap-1 text-emerald-600 dark:text-emerald-500"><TrendingUp size={12}/> All time <span className="text-zinc-400 font-normal">revenue</span></p>
                        </div>
                        <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
                            <p className="text-xs font-medium text-zinc-500 mb-2">Terjual</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{totalUnitsSold.toLocaleString('id-ID')}</p>
                            <p className="text-[10px] font-semibold flex items-center gap-1 text-emerald-600 dark:text-emerald-500"><TrendingUp size={12}/> All time <span className="text-zinc-400 font-normal">sales</span></p>
                        </div>
                        <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
                            <p className="text-xs font-medium text-zinc-500 mb-2">Stok Menipis</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{lowStockProducts.length}</p>
                            {lowStockProducts.length > 0 ? (
                                <p className="text-[10px] font-semibold flex items-center gap-1 text-rose-600 dark:text-rose-500"><AlertCircle size={12}/> Needs attention <span className="text-zinc-400 font-normal">soon</span></p>
                            ) : (
                                <p className="text-[10px] font-semibold flex items-center gap-1 text-emerald-600 dark:text-emerald-500"><Check size={12}/> Stock healthy <span className="text-zinc-400 font-normal">overall</span></p>
                            )}
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col flex-1 shrink-0 overflow-hidden mb-8">
                        
                        {/* Table Toolbar */}
                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 gap-4">
                            <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Semua Produk</div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari produk..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto custom-scrollbar flex-1">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-orange-500 w-8 h-8 mb-4" />
                                    <p className="text-sm text-zinc-500">Loading products...</p>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                    <Box size={40} className="text-zinc-300 dark:text-zinc-700 mb-4" />
                                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Belum ada produk</p>
                                    <p className="text-xs text-zinc-500 mt-1">Coba ubah pencarian atau tambah produk baru.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left whitespace-nowrap min-w-[800px]">
                                    <thead className="sticky top-0 bg-zinc-50/95 dark:bg-[#111]/95 backdrop-blur z-10 border-b border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            <th className="px-4 py-3 w-10 text-center"><input type="checkbox" className="rounded border-zinc-300 dark:border-zinc-700 bg-transparent text-orange-500" /></th>
                                            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Produk</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">SKU</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Harga</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Terjual</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Omzet</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-center">Stok</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map(p => (
                                            <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-[#161616] transition-colors group">
                                                <td className="px-4 py-4 text-center"><input type="checkbox" className="rounded border-zinc-300 dark:border-zinc-700 bg-transparent text-orange-500" /></td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                                                            <Package size={18} className="text-zinc-400" />
                                                        </div>
                                                        <div className="max-w-[200px]">
                                                            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">{p.name}</p>
                                                            <p className="text-[11px] text-zinc-500 truncate mt-0.5">Produk Fisik</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-xs font-mono text-zinc-500">{p.id.slice(0,8).toUpperCase()}</td>
                                                <td className="px-4 py-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Rp {p.price.toLocaleString('id-ID')}</td>
                                                <td className="px-4 py-4 text-xs font-medium text-zinc-700 dark:text-zinc-300 text-right">{p.unitsSold?.toLocaleString() || 0}</td>
                                                <td className="px-4 py-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-right">Rp {((p.revenue || 0)/1000).toLocaleString('id-ID')}k</td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`text-sm font-bold ${p.stock <= 5 ? 'text-rose-600 dark:text-rose-500 line-through decoration-rose-500/30' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                                        {p.stock}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleOpenModal(p)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors"><Edit2 size={16}/></button>
                                                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors"><Trash2 size={16}/></button>
                                                        <button className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded transition-colors"><MoreHorizontal size={16}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between text-xs text-zinc-500 bg-zinc-50/50 dark:bg-transparent">
                            <span>Showing 1 to {filteredProducts.length} of {filteredProducts.length} results</span>
                            <div className="flex gap-1">
                                <button className="px-2 py-1 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-[#161616] hover:bg-zinc-50 dark:hover:bg-zinc-900">&lt;</button>
                                <button className="px-2.5 py-1 border border-orange-500 rounded bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-500 font-semibold">1</button>
                                <button className="px-2 py-1 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-[#161616] hover:bg-zinc-50 dark:hover:bg-zinc-900">&gt;</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Sidebar (Right) ───────────────────────────────────────── */}
                <div className="hidden xl:flex flex-col w-[320px] shrink-0 h-[calc(100vh-137px)] overflow-y-auto custom-scrollbar border-l border-zinc-200 dark:border-zinc-800 pl-8 space-y-8 pb-8">
                    
                    {/* Top Products Chart */}
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Produk Terlaris</h3>
                        {chartData.length > 0 ? (
                            <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
                                <div className="h-40 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={70}
                                                stroke="none"
                                                dataKey="value"
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `Rp ${(value as number / 1000).toLocaleString('id-ID')}k`} contentStyle={{ borderRadius: '8px', border: '1px solid #333', background: '#111', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 space-y-2">
                                    {chartData.map((d, i) => (
                                        <div key={i} className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                                <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">{d.name}</span>
                                            </div>
                                            <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100 shrink-0 ml-2">
                                                {((d.value / chartTotal) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center shadow-sm">
                                <p className="text-xs text-zinc-500">Data penjualan belum cukup untuk menampilkan grafik.</p>
                            </div>
                        )}
                    </div>

                    {/* Low Stock Alerts */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Stok Menipis</h3>
                        </div>
                        {lowStockProducts.length === 0 ? (
                            <p className="text-xs text-zinc-500">Semua produk stoknya aman.</p>
                        ) : (
                            <div className="space-y-3">
                                {lowStockProducts.slice(0,5).map(p => (
                                    <div key={p.id} className="flex items-center justify-between text-[11px] group cursor-pointer">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                            <span className="text-zinc-700 dark:text-zinc-300 truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{p.name}</span>
                                        </div>
                                        <span className="font-medium text-rose-600 dark:text-rose-500 shrink-0 ml-2">
                                            {p.stock} sisa
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Modal Add/Edit */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-[#0a0a0a]">
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"><X size={18}/></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Nama Produk *</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-shadow" placeholder="cth: Kopi Susu Gula Aren" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Harga Modal (HPP) *</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">Rp</span>
                                            <input required type="number" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-shadow" placeholder="0" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Harga Jual *</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">Rp</span>
                                            <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-shadow" placeholder="0" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Stok Tersedia *</label>
                                    <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-shadow" placeholder="0" />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">Batal</button>
                                    <button type="submit" disabled={isSaving} className="flex-1 py-2.5 rounded-lg bg-orange-600 text-white font-medium text-sm hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                        {isSaving && <Loader2 size={16} className="animate-spin" />}
                                        {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
