"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    Package,
    Edit2,
    Trash2,
    AlertCircle,
    Loader2,
    X,
    Check,
    LayoutGrid,
    List
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ProdukPage() {
    const supabase = createClient();
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // ... (rest of logic: fetchProducts, handleOpenModal, handleSubmit, handleDelete)
    // Keep logic identical to original but wrap in new UI

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: business } = await supabase
                .from('businesses')
                .select('id')
                .eq('user_id', session.user.id)
                .single();

            if (!business) return;

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('business_id', business.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (product: any = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                price: product.price.toString(),
                cost_price: product.cost_price.toString(),
                stock: product.stock.toString()
            });
        } else {
            setEditingProduct(null);
            setFormData({ name: "", price: "", cost_price: "", stock: "" });
        }
        setIsModalOpen(true);
    };

    const [formData, setFormData] = useState({
        name: "",
        price: "",
        cost_price: "",
        stock: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: business } = await supabase
                .from('businesses')
                .select('id')
                .eq('user_id', session.user.id)
                .single();

            if (!business) return;

            const productData = {
                business_id: business.id,
                name: formData.name,
                price: parseInt(formData.price),
                cost_price: parseInt(formData.cost_price),
                stock: parseInt(formData.stock)
            };

            if (editingProduct) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData]);
                if (error) throw error;
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
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-black text-white/90 tracking-tight mb-2">Katalog Produk</h1>
                    <p className="text-sm font-medium text-white/40">Atur stok, harga, dan semua item jualanmu.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                >
                    <Plus size={20} />
                    Tambah Produk
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 w-full relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Cari nama produk..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#161616]/90 backdrop-blur-xl border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-white/90 placeholder:text-white/30 focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500/30 transition-all outline-none"
                    />
                </div>

                <div className="flex items-center p-1 bg-[#161616]/90 backdrop-blur-xl border border-white/5 rounded-2xl">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-md border border-white/5' : 'text-white/40 hover:text-white'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-md border border-white/5' : 'text-white/40 hover:text-white'}`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-32"
                    >
                        <Loader2 className="animate-spin w-12 h-12 text-orange-400 mb-4" />
                        <p className="text-white/30 font-bold uppercase tracking-widest text-xs">Menyiapkan katalog...</p>
                    </motion.div>
                ) : filteredProducts.length > 0 ? (
                    viewMode === 'grid' ? (
                        <motion.div
                            key="grid"
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {filteredProducts.map((p) => (
                                <motion.div
                                    key={p.id}
                                    variants={item}
                                    className="bg-[#161616]/90 backdrop-blur-2xl rounded-2xl border border-white/5 p-5 group hover:shadow-2xl hover:border-white/10 transition-all relative"
                                >
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(p)} className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 hover:bg-blue-500/20 shadow-sm transition-all z-10 w-9 h-9 flex items-center justify-center">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(p.id)} className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 hover:bg-rose-500/20 shadow-sm transition-all z-10 w-9 h-9 flex items-center justify-center">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="w-full aspect-square rounded-xl bg-white/5 border border-white/10 mb-5 flex items-center justify-center overflow-hidden">
                                        <Package size={48} className="text-white/20 group-hover:text-orange-400 group-hover:scale-110 transition-all duration-500" />
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="font-bold text-white/90 group-hover:text-orange-400 transition-colors line-clamp-1">{p.name}</h3>
                                            <p className="text-xs font-bold text-white/30 mt-0.5 capitalize">Produk Fisik</p>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                            <p className="font-black text-white/90">Rp {p.price?.toLocaleString('id-ID')}</p>
                                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.stock <= 5 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-white/5 text-white/40 border border-transparent'
                                                }`}>
                                                Stok: {p.stock}
                                            </div>
                                        </div>
                                    </div>

                                    {p.stock <= 5 && (
                                        <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 p-1.5 rounded-lg justify-center uppercase tracking-widest">
                                            <AlertCircle size={10} /> Hampir Habis
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-[#161616]/90 backdrop-blur-2xl rounded-2xl border border-white/5 overflow-hidden shadow-2xl"
                        >
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#111] border-b border-white/5">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Produk</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Harga Beli (HPP)</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Harga Jual</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Stok</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((p) => (
                                        <tr key={p.id} className="border-b border-white/5 hover:bg-[#1a1a1a]/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:bg-[#111] group-hover:text-orange-400 group-hover:border-orange-500/20 transition-all">
                                                        <Package size={20} />
                                                    </div>
                                                    <p className="font-bold text-white/90 text-sm tracking-tight">{p.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-bold text-white/40 text-[11px] uppercase tracking-wider">
                                                Rp {p.cost_price?.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-5 font-black text-white/90 text-sm">
                                                Rp {p.price?.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${p.stock <= 5 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-white/5 text-white/50 border border-transparent'
                                                        }`}>
                                                        {p.stock} Unit
                                                    </span>
                                                    {p.stock <= 5 && (
                                                        <p className="text-[9px] font-bold text-rose-400 uppercase mt-1 tracking-tighter">Stok Rendah</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpenModal(p)} className="p-2.5 text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 rounded-xl transition-all">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(p.id)} className="p-2.5 text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    )
                ) : (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#161616]/90 backdrop-blur-2xl rounded-3xl border-2 border-dashed border-white/10 py-32 text-center shadow-2xl"
                    >
                        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 text-white/20">
                            <Package size={48} />
                        </div>
                        <h2 className="text-xl font-bold text-white/90 tracking-tight">Katalog Anda Masih Kosong</h2>
                        <p className="text-white/40 mt-2 mb-8 max-w-sm mx-auto font-medium">Mulai tambahkan produk pertama Anda untuk bisa mulai berjualan di Kelola.ai.</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-orange-500 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                        >
                            Tambah Produk Sekarang
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-[#1A1A2E]/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-[#161616] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-[#111]">
                                <h2 className="text-xl font-bold text-white/90 tracking-tight">
                                    {editingProduct ? '📝 Edit Produk' : '✨ Produk Baru'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-white/40 border border-transparent hover:border-white/10">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pl-1">Nama Produk</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Masukan nama lengkap produk..."
                                            className="w-full bg-[#111] border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all outline-none text-white/90 placeholder:text-white/30"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pl-1">Harga HPP</label>
                                            <input
                                                required
                                                type="number"
                                                value={formData.cost_price}
                                                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                                                placeholder="Harga beli"
                                                className="w-full bg-[#111] border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all outline-none text-white/90 placeholder:text-white/30"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pl-1">Harga Jual</label>
                                            <input
                                                required
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                placeholder="Harga jual"
                                                className="w-full bg-[#111] border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all outline-none text-white/90 placeholder:text-white/30"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pl-1">Stok Inventaris</label>
                                        <input
                                            required
                                            type="number"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                            placeholder="Jumlah stok saat ini..."
                                            className="w-full bg-[#111] border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all outline-none text-white/90 placeholder:text-white/30"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-4 rounded-full bg-white/5 text-white/60 font-bold hover:bg-white/10 transition-all border border-white/10"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-[2] bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
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
