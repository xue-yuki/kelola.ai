"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    QrCode,
    ShoppingCart,
    Loader2,
    CheckCircle2,
    Package,
    ArrowRight,
    Tag,
    X,
    ChevronRight,
    Search as SearchIcon
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function KasirPage() {
    const supabase = createClient();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [cart, setCart] = useState<any[]>([]);
    const [paymentMethod, setPaymentMethod] = useState("tunai");
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [activeCategory, setActiveCategory] = useState("Semua");

    const [businessId, setBusinessId] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
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
            setBusinessId(business.id);

            const { data: productsData } = await supabase
                .from('products')
                .select('*')
                .eq('business_id', business.id)
                .order('name');

            setProducts(productsData || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQty = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(1, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const handleCheckout = async () => {
        if (cart.length === 0 || !businessId) return;
        setIsProcessing(true);
        try {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    business_id: businessId,
                    customer_name: "Walk-in Customer",
                    total: totalAmount,
                    status: 'lunas',
                    channel: 'offline',
                    payment_method: paymentMethod
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            for (const item of cart) {
                await supabase.from('products').update({ stock: item.stock - item.qty }).eq('id', item.id);
            }

            setOrderSuccess(true);
            setCart([]);
            setTimeout(() => setOrderSuccess(false), 3000);
        } catch (error) {
            console.error("Checkout error:", error);
            alert("Terjadi kesalahan saat checkout.");
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = ["Semua", "Makanan", "Minuman", "Lainnya"];

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] select-none">
            {/* Left Side: Product Selection */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-[28px] font-black text-white/90 tracking-tight">Katalog Kasir</h1>
                            <p className="text-sm font-medium text-white/40">Pilih produk untuk ditambahkan ke keranjang.</p>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                            <input
                                type="text"
                                placeholder="Cari nama produk..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#161616]/90 backdrop-blur-xl border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium text-white/90 placeholder:text-white/30 focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-6 py-2.5 rounded-full text-xs font-black transition-all whitespace-nowrap border uppercase tracking-wider ${activeCategory === cat
                                        ? 'bg-white/10 text-white border-white/10 shadow-lg backdrop-blur-xl'
                                        : 'bg-[#161616]/60 text-white/40 border-white/5 hover:border-orange-500/50 backdrop-blur-xl hover:text-white'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="animate-spin w-12 h-12 text-orange-400" />
                            <p className="font-bold text-white/30 uppercase tracking-widest text-[10px]">Menyinkronkan Stok...</p>
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredProducts.map((p) => (
                                <motion.div
                                    key={p.id}
                                    whileHover={{ y: -4 }}
                                    onClick={() => addToCart(p)}
                                    className="bg-[#161616]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/5 hover:shadow-2xl hover:border-orange-500/30 transition-all cursor-pointer group relative overflow-hidden flex flex-col"
                                >
                                    <div className="w-full aspect-square rounded-xl bg-white/5 text-white/30 flex items-center justify-center mb-4 group-hover:bg-orange-500/10 group-hover:text-orange-400 transition-all relative border border-white/5 group-hover:border-orange-500/20">
                                        <Package size={32} className="group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white/90 text-sm mb-1 line-clamp-2 leading-tight group-hover:text-white transition-colors">{p.name}</h3>
                                        <p className="text-orange-400 font-black text-base">Rp {p.price.toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${p.stock <= 5 ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-white/5 border border-white/5 text-white/40'
                                            }`}>
                                            Stok: {p.stock}
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300 shadow-lg group-hover:bg-orange-500">
                                            <Plus size={16} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-4 bg-[#161616]/50 rounded-2xl border border-white/5 border-dashed">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                <SearchIcon size={40} className="opacity-20" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-white/90">Produk Tidak Ada</p>
                                <p className="text-sm font-medium">Coba gunakan kata kunci lainnya.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Billing System */}
            <div className="w-full lg:w-[420px] flex flex-col gap-6">
                <div className="flex-1 bg-[#161616]/90 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl flex flex-col overflow-hidden relative">
                    {/* Cart Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#111]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center relative shadow-[0_0_20px_rgba(255,107,43,0.1)]">
                                <ShoppingCart size={20} />
                                {cart.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 text-white text-[10px] font-black flex items-center justify-center rounded-full ring-2 ring-[#111] animate-bounce-short">
                                        {cart.reduce((a, b) => a + b.qty, 0)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-white/90 tracking-tight">Tagihan Pelanggan</h2>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Walk-in Order</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setCart([])}
                            className="text-xs font-black text-rose-500/50 hover:text-rose-400 transition-colors uppercase tracking-widest"
                        >
                            Reset
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {cart.length > 0 ? cart.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                    layout
                                    className="flex items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white/5 text-white/40 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-orange-500/30 group-hover:text-orange-400 group-hover:bg-orange-500/10 transition-all">
                                        <Package size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white/90 text-sm truncate uppercase tracking-tight">{item.name}</h4>
                                        <p className="text-xs font-black text-orange-400">Rp {item.price.toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-[#111] rounded-full p-1 border border-white/5">
                                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-all">
                                            <Minus size={12} />
                                        </button>
                                        <span className="text-xs font-black w-6 text-center text-white/90">{item.qty}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-all">
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-rose-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                        <ShoppingCart size={32} className="text-white/20" />
                                    </div>
                                    <p className="text-sm font-bold text-white/30 uppercase tracking-widest">Belum Ada Item</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Checkout Panel */}
                    <div className="p-8 bg-[#111] border-t border-white/5 space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 pl-1">Pilih Metode Pembayaran</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'tunai', icon: Banknote, label: 'Tunai' },
                                    { id: 'transfer', icon: CreditCard, label: 'Bank' },
                                    { id: 'qris', icon: QrCode, label: 'QRIS' },
                                ].map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${paymentMethod === method.id
                                            ? 'bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(255,107,43,0.15)] ring-1 ring-orange-500/20'
                                            : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white/60'
                                            }`}
                                    >
                                        <method.icon size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">{method.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="py-4 border-y border-white/5 flex items-center justify-between">
                            <div className="text-xs font-black text-white/40 uppercase tracking-widest">Total Tagihan</div>
                            <div className="text-3xl font-black text-white/90">Rp {totalAmount.toLocaleString('id-ID')}</div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || isProcessing}
                            className={`w-full py-5 rounded-full font-black text-lg tracking-tight transition-all flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden ${orderSuccess
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_30px_rgba(255,107,43,0.3)] active:scale-95 disabled:opacity-50 disabled:bg-white/10 disabled:text-white/40 disabled:border disabled:border-white/5 disabled:shadow-none'
                                }`}
                        >
                            {isProcessing ? (
                                <Loader2 className="animate-spin text-white" size={24} />
                            ) : orderSuccess ? (
                                <><CheckCircle2 size={24} /> Berhasil Terbayar!</>
                            ) : (
                                <><ShoppingCart size={22} className="opacity-50" /> Selesaikan Pembayaran <ChevronRight size={22} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Animation */}
            <AnimatePresence>
                {orderSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            className="bg-[#161616] border border-white/5 p-12 rounded-[40px] flex flex-col items-center shadow-2xl"
                        >
                            <div className="bg-orange-500 text-white w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,107,43,0.4)] mb-8">
                                <CheckCircle2 size={56} />
                            </div>
                            <h2 className="text-3xl font-black text-white/90 tracking-tight text-center">Checkout Selesai!</h2>
                            <p className="text-white/40 font-bold mt-2 uppercase tracking-widest text-xs">Pesanan baru telah dicatat</p>

                            <button
                                onClick={() => setOrderSuccess(false)}
                                className="mt-10 px-10 py-4 bg-white/10 border border-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-all shadow-xl"
                            >
                                Tutup Halaman
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
