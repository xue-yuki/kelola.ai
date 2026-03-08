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
    ArrowRight
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

    // Business Data
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
            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    business_id: businessId,
                    customer_name: "Walk-in Customer",
                    total: totalAmount,
                    status: 'lunas', // Walk-in is usually paid directly
                    channel: 'offline',
                    payment_method: paymentMethod
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Update stock for each product (simplified for now)
            for (const item of cart) {
                const { error: stockError } = await supabase.rpc('decrement_stock', {
                    product_id: item.id,
                    amount: item.qty
                });
                // If RPC doesn't exist yet, we might need a direct update or a fallback
                // For now let's use a standard update to ensure it works
                await supabase.from('products').update({ stock: item.stock - item.qty }).eq('id', item.id);
            }

            setOrderSuccess(true);
            setCart([]);
            setTimeout(() => setOrderSuccess(false), 3000);
        } catch (error) {
            console.error("Checkout crash:", error);
            alert("Terjadi kesalahan saat checkout.");
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            {/* Left Side: Product Grid */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mesin Kasir</h1>
                        <p className="text-sm font-medium text-slate-500">Pilih produk untuk mulai transaksi.</p>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-4 py-2.5 text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all outline-none shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-orange-500">
                            <Loader2 className="animate-spin w-10 h-10" />
                            <p className="font-bold text-slate-400">Menyiapkan produk...</p>
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map((p) => (
                                <motion.div
                                    key={p.id}
                                    whileHover={{ y: -4 }}
                                    onClick={() => addToCart(p)}
                                    className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                        <Package size={24} />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-orange-600 transition-colors line-clamp-2">{p.name}</h3>
                                    <p className="text-orange-600 font-black text-sm">Rp {p.price.toLocaleString('id-ID')}</p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.stock <= 5 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>
                                            Stok: {p.stock}
                                        </span>
                                        <div className="p-1.5 rounded-lg bg-orange-600 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus size={14} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300">
                            <Package size={64} className="mb-4" />
                            <p className="text-lg font-black tracking-tight text-slate-400">Produk tidak ditemukan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Cart & Checkout */}
            <div className="w-full lg:w-[400px] flex flex-col gap-6">
                <div className="flex-1 bg-white rounded-[32px] border border-slate-100 shadow-2xl flex flex-col overflow-hidden">
                    {/* Cart Header */}
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <ShoppingCart size={20} className="text-slate-800" />
                                {cart.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[10px] font-black flex items-center justify-center rounded-full ring-2 ring-white">
                                        {cart.reduce((a, b) => a + b.qty, 0)}
                                    </span>
                                )}
                            </div>
                            <h2 className="font-black text-lg text-slate-900 tracking-tight">Keranjang Belanja</h2>
                        </div>
                        <button
                            onClick={() => setCart([])}
                            className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            Kosongkan
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {cart.length > 0 ? cart.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                                        <Package size={20} className="text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                                        <p className="text-xs font-black text-orange-600">Rp {item.price.toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-2 py-1">
                                        <button onClick={() => updateQty(item.id, -1)} className="p-1 text-slate-400 hover:text-slate-900 transition-colors">
                                            <Minus size={14} />
                                        </button>
                                        <span className="text-sm font-black w-6 text-center">{item.qty}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="p-1 text-slate-400 hover:text-slate-900 transition-colors">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <ShoppingCart size={48} className="mb-4 text-slate-300" />
                                    <p className="text-sm font-bold text-slate-400">Keranjang masih kosong</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Checkout Info */}
                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Metode Pembayaran</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'tunai', icon: Banknote, label: 'Tunai' },
                                    { id: 'transfer', icon: CreditCard, label: 'TF Bank' },
                                    { id: 'qris', icon: QrCode, label: 'QRIS' },
                                ].map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ${paymentMethod === method.id
                                                ? 'bg-white border-orange-500 text-orange-600 shadow-md ring-2 ring-orange-500/10'
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                            }`}
                                    >
                                        <method.icon size={18} />
                                        <span className="text-[9px] font-black uppercase tracking-tight">{method.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <span className="text-slate-500 font-bold">Total Pembayaran</span>
                            <span className="text-2xl font-black text-slate-900">Rp {totalAmount.toLocaleString('id-ID')}</span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || isProcessing}
                            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all flex items-center justify-center gap-3 shadow-xl ${orderSuccess
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20 active:scale-95 disabled:opacity-50 disabled:bg-slate-200 disabled:shadow-none'
                                }`}
                        >
                            {isProcessing ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : orderSuccess ? (
                                <><CheckCircle2 size={24} /> Selesai!</>
                            ) : (
                                <><ShoppingCart size={20} /> Proses Checkout <ArrowRight size={20} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Animation Backdrop */}
            <AnimatePresence>
                {orderSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-xl flex flex-col items-center justify-center text-emerald-500"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-emerald-500 text-white w-24 h-24 rounded-full flex items-center justify-center shadow-2xl mb-6 shadow-emerald-500/40"
                        >
                            <CheckCircle2 size={48} />
                        </motion.div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Transaksi Berhasil!</h2>
                        <p className="text-slate-500 font-medium">Data pesanan telah disimpan ke sistem.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
