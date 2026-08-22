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
    ShoppingCart,
    Loader2,    
    CheckCircle2,
    Package,
    ArrowLeft,
    Tag,
    X,
    ChevronRight,
    Search as SearchIcon,
    Settings,
    User,
    Info,
    Edit2
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
    const [paymentMethod, setPaymentMethod] = useState("qris");
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [mobileView, setMobileView] = useState<"catalog" | "cart">("catalog");
    const [activeTab, setActiveTab] = useState("Penjualan");

    const [businessId, setBusinessId] = useState<string | null>(null);
    const [businessName, setBusinessName] = useState<string>("");
    const [qrisDataUrl, setQrisDataUrl] = useState<string | null>(null);
    const [isGeneratingQris, setIsGeneratingQris] = useState(false);
    const [qrisModalOpen, setQrisModalOpen] = useState(false);
    const [notice, setNotice] = useState("");
    const [cashReceived, setCashReceived] = useState("");

    const flashNotice = (msg: string) => {
        setNotice(msg);
        setTimeout(() => setNotice(""), 2200);
    };

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
                .select('id, business_name')
                .eq('user_id', session.user.id)
                .single();

            if (!business) return;
            setBusinessId(business.id);
            setBusinessName(business.business_name || "MERCHANT");

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
        if (product.stock <= 0) {
            flashNotice(`${product.name} stoknya habis`);
            return;
        }
        const existing = cart.find(item => item.id === product.id);
        const currentQty = existing ? existing.qty : 0;
        if (currentQty + 1 > product.stock) {
            flashNotice(`Stok ${product.name} tinggal ${product.stock}`);
            return;
        }
        setCart(prev => {
            const ex = prev.find(item => item.id === product.id);
            if (ex) {
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
        const target = cart.find(i => i.id === productId);
        if (!target) return;
        const maxStock = target.stock ?? Infinity;
        if (delta > 0 && target.qty >= maxStock) {
            flashNotice(`Stok ${target.name} cuma ${maxStock}`);
            return;
        }
        setCart(prev => prev.map(item =>
            item.id === productId
                ? { ...item, qty: Math.min(maxStock, Math.max(1, item.qty + delta)) }
                : item
        ));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    // UMKM mikro umumnya non-PKP → tidak memungut PPN. Total = subtotal.
    const totalAmount = subtotal;
    const kembalian = Math.max(0, (parseInt(cashReceived) || 0) - totalAmount);

    // Manual generator — dipanggil pas user klik "Konfirmasi & Generate QRIS"
    const generateQris = async () => {
        if (totalAmount <= 0 || !businessName) return;
        setIsGeneratingQris(true);
        setQrisDataUrl(null);
        try {
            const { generateQrisDataUrl } = await import("@/lib/qris");
            const refId = `POS${Date.now().toString(36).toUpperCase()}`;
            const { dataUrl } = await generateQrisDataUrl({
                merchantName: businessName,
                amount: totalAmount,
                referenceId: refId,
            });
            setQrisDataUrl(dataUrl);
        } catch (err) {
            console.error("QRIS gen error:", err);
            setQrisDataUrl(null);
        } finally {
            setIsGeneratingQris(false);
        }
    };

    // Buka modal + generate saat user klik konfirmasi (QRIS path)
    const openQrisModal = async () => {
        setQrisModalOpen(true);
        await generateQris();
    };

    const closeQrisModal = () => {
        setQrisModalOpen(false);
        setQrisDataUrl(null);
    };

    // Escape key = tutup modal
    useEffect(() => {
        if (!qrisModalOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeQrisModal();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [qrisModalOpen]);

    const handleCheckout = async () => {
        if (cart.length === 0 || !businessId) return;

        for (const item of cart) {
            const prod = products.find(p => p.id === item.id);
            const available = prod ? prod.stock : 0;
            if (item.qty > available) {
                flashNotice(`Stok ${item.name} tidak cukup (sisa ${available})`);
                return;
            }
        }

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
                    payment_method: paymentMethod,
                    items: cart.map(item => ({
                        name: item.name,
                        qty: item.qty,
                        price: item.price
                    }))
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            for (const item of cart) {
                const prod = products.find(p => p.id === item.id);
                const newStock = Math.max(0, (prod ? prod.stock : item.stock) - item.qty);
                await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
            }

            setProducts(prev => prev.map(p => {
                const sold = cart.find(c => c.id === p.id);
                return sold ? { ...p, stock: Math.max(0, p.stock - sold.qty) } : p;
            }));

            setOrderSuccess(true);
            setCart([]);
            setCashReceived("");
            setMobileView("catalog");
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

    // Helper for initials
    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-80px)] -m-6 bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-orange-500/30 overflow-hidden">
            {/* Toast peringatan stok */}
            <AnimatePresence>
                {notice && (
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl bg-rose-600 text-white text-sm font-semibold shadow-2xl shadow-rose-900/50 whitespace-nowrap"
                    >
                        {notice}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Left Side: Product Selection */}
            <div className={`${mobileView === "cart" ? "hidden lg:flex" : "flex"} flex-1 flex-col overflow-hidden border-r border-zinc-800/50`}>
                
                {/* Top Header */}
                <div className="h-16 shrink-0 border-b border-zinc-800/50 flex flex-col md:flex-row items-start md:items-center justify-between px-6 bg-[#0a0a0a]">
                    <div className="flex items-center gap-8 h-full w-full md:w-auto overflow-x-auto no-scrollbar">
                        <h1 className="text-xl font-bold text-white tracking-tight shrink-0">POS</h1>
                        <div className="flex gap-6 h-full">
                            {["Penjualan"].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`h-full border-b-2 font-medium text-sm transition-colors px-1 whitespace-nowrap ${activeTab === tab ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Search & Add Manual */}
                <div className="p-4 shrink-0 flex flex-col sm:flex-row gap-3 bg-[#0a0a0a]">
                    <div className="flex-1 relative flex items-center">
                        <Search className="absolute left-4 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder="Cari produk berdasarkan nama / SKU / barcode"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#141414] border border-zinc-800/80 rounded-xl pl-11 pr-12 py-2.5 text-sm font-medium text-zinc-200 placeholder:text-zinc-600 focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0f0f0f] custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <Loader2 className="animate-spin w-8 h-8 text-orange-500" />
                                <p className="font-semibold text-zinc-500 text-sm">Memuat Data...</p>
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.map((p) => (
                                    <motion.div
                                        key={p.id}
                                        whileHover={{ scale: p.stock <= 0 ? 1 : 1.02 }}
                                        onClick={() => addToCart(p)}
                                        className={`bg-[#1a1a1a] p-4 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col group ${p.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-sm hover:shadow-xl hover:shadow-black/20'}`}
                                    >
                                        <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center mb-4 relative overflow-hidden group-hover:from-zinc-700 group-hover:to-zinc-800 transition-colors border border-zinc-700/50">
                                            {/* Typography-based placeholder since we don't use images */}
                                            <span className="text-3xl font-black text-zinc-700 group-hover:text-zinc-500 transition-colors tracking-tighter">
                                                {getInitials(p.name)}
                                            </span>
                                            {/* Subtle overlay effect */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent opacity-50" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-bold text-zinc-100 text-sm line-clamp-2 leading-tight mb-1">{p.name}</h3>
                                                <p className="text-xs text-zinc-500 font-medium mb-3">SKU-{p.id.substring(0,4).toUpperCase()}</p>
                                            </div>
                                            <div>
                                                <p className="text-zinc-200 font-bold text-base tracking-tight">Rp {p.price.toLocaleString('id-ID')}</p>
                                                <p className="text-xs text-zinc-500 mt-1">Stok: {p.stock}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-3">
                                <SearchIcon size={32} className="opacity-50" />
                                <p className="text-sm font-medium">Produk tidak ditemukan.</p>
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>

            {/* Right Side: Cart System */}
            <div className={`${mobileView === "catalog" ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-[420px] bg-[#0f0f0f] border-l border-zinc-800/50 shrink-0`}>
                
                {/* Cart Header */}
                <div className="h-16 px-6 border-b border-zinc-800/50 flex items-center justify-between shrink-0 bg-[#0a0a0a]">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileView("catalog")}
                            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <h2 className="font-bold text-base text-zinc-100">Keranjang ({cart.length})</h2>
                    </div>
                    <button
                        onClick={() => setCart([])}
                        className="text-xs font-semibold text-orange-500 hover:text-orange-400 transition-colors"
                    >
                        Bersihkan
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {cart.length > 0 ? cart.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                layout
                                className="flex items-start gap-3 group"
                            >
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-zinc-200 text-sm leading-tight mb-1">{item.name}</h4>
                                    <p className="text-xs font-medium text-zinc-500 mb-2">Rp {item.price.toLocaleString('id-ID')}</p>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-full px-1 border border-zinc-800/80">
                                            <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all">
                                                <Minus size={10} strokeWidth={3} />
                                            </button>
                                            <span className="text-xs font-bold w-4 text-center text-zinc-200">{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, 1)} disabled={item.qty >= (item.stock ?? Infinity)} className="w-6 h-6 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all disabled:opacity-30 disabled:hover:bg-transparent">
                                                <Plus size={10} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <p className="font-bold text-sm text-zinc-100">Rp {(item.price * item.qty).toLocaleString('id-ID')}</p>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-zinc-600 hover:text-rose-500 transition-colors p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <ShoppingCart size={32} className="text-zinc-700 mb-3" />
                                <p className="text-sm font-medium text-zinc-500">Keranjang kosong</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Checkout Panel */}
                <div className="bg-[#0a0a0a] border-t border-zinc-800/50">
                    <div className="px-6 py-4 space-y-2 border-b border-zinc-800/50">
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>Subtotal</span>
                            <span className="text-zinc-200 font-medium">Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-zinc-800/50">
                            <span className="text-sm font-semibold text-zinc-300">Total</span>
                            <span className="text-2xl font-bold text-zinc-100 tracking-tight">Rp {totalAmount.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="mb-4">
                            <p className="text-xs font-semibold text-zinc-100 mb-3">Metode Pembayaran</p>
                            <div className="flex gap-2 p-1 bg-[#141414] rounded-xl border border-zinc-800/80">
                                {['qris', 'tunai'].map((method) => (
                                    <button
                                        key={method}
                                        onClick={() => setPaymentMethod(method)}
                                        className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                                            paymentMethod === method
                                            ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/50'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                    >
                                        {method === 'tunai' ? 'Cash' : 'QRIS'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentMethod === 'qris' && (
                            <div className="mb-6 rounded-md border border-zinc-800/80 bg-[#0D0D0D] p-3 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-md bg-[#141414] border border-zinc-800 flex items-center justify-center shrink-0">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="17" y="17" width="4" height="4" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium text-zinc-100">Pembayaran QRIS</p>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">Klik konfirmasi untuk generate QR</p>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'tunai' && (
                            <div className="mb-6 space-y-3">
                                <div>
                                    <label className="text-xs text-zinc-400 mb-1.5 block">Uang Diterima</label>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        value={cashReceived}
                                        onChange={(e) => setCashReceived(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-[#141414] border border-zinc-800/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-100 placeholder:text-zinc-600 focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setCashReceived(String(totalAmount))} className="flex-1 py-1.5 text-xs font-medium bg-[#141414] border border-zinc-800/80 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors">Uang Pas</button>
                                    <button onClick={() => setCashReceived("50000")} className="flex-1 py-1.5 text-xs font-medium bg-[#141414] border border-zinc-800/80 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors">50rb</button>
                                    <button onClick={() => setCashReceived("100000")} className="flex-1 py-1.5 text-xs font-medium bg-[#141414] border border-zinc-800/80 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors">100rb</button>
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-xs text-zinc-400">Kembalian</span>
                                    <span className={`text-sm font-bold ${(parseInt(cashReceived) || 0) >= totalAmount && cart.length > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>Rp {kembalian.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    if (paymentMethod === 'qris') {
                                        openQrisModal();
                                    } else {
                                        handleCheckout();
                                    }
                                }}
                                disabled={cart.length === 0 || isProcessing}
                                className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] ${
                                    isProcessing || orderSuccess ? 'bg-orange-600 text-white' : 'bg-orange-500 hover:bg-orange-400 text-white'
                                } disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none disabled:border disabled:border-zinc-700/50`}
                            >
                                {isProcessing
                                    ? 'Memproses...'
                                    : orderSuccess
                                        ? 'Berhasil!'
                                        : paymentMethod === 'qris'
                                            ? 'Konfirmasi & Generate QRIS'
                                            : 'Konfirmasi & Bayar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Cart Button — mobile only, shown in catalog view */}
            <AnimatePresence>
                {mobileView === "catalog" && cart.length > 0 && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setMobileView("cart")}
                        className="fixed bottom-6 right-6 lg:hidden z-50 flex items-center gap-3 bg-orange-500 text-white px-6 py-4 rounded-full shadow-[0_0_30px_rgba(249,115,22,0.4)] font-bold text-sm active:scale-95 transition-transform"
                    >
                        <ShoppingCart size={20} />
                        <span>Lihat Keranjang</span>
                        <span className="bg-white text-orange-500 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                            {cart.reduce((a, b) => a + b.qty, 0)}
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ─── QRIS Payment Modal (Linear/Vercel style) ────────────── */}
            <AnimatePresence>
                {qrisModalOpen && (
                    <>
                        {/* Backdrop — subtle, no accidental close */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
                        />
                        {/* Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div
                                role="dialog"
                                aria-modal="true"
                                aria-label="Pembayaran QRIS"
                                className="pointer-events-auto w-full max-w-[380px] rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] shadow-sm overflow-hidden"
                            >
                                {/* Header */}
                                <div className="px-5 pt-5 pb-3 border-b border-zinc-100 dark:border-[#1A1A1A]">
                                    <h2
                                        className="text-[15px] font-medium text-zinc-900 dark:text-[#F5F5F5]"
                                        style={{ letterSpacing: '-0.02em' }}
                                    >
                                        Pembayaran QRIS
                                    </h2>
                                    <p className="text-[12px] text-zinc-500 dark:text-[#A1A1A1] mt-0.5">
                                        Minta pelanggan scan QR di bawah
                                    </p>
                                </div>

                                {/* QR (polos, no chrome) */}
                                <div className="px-5 py-6 flex items-center justify-center bg-zinc-50 dark:bg-[#111]">
                                    {isGeneratingQris ? (
                                        <div className="w-[260px] h-[260px] flex items-center justify-center">
                                            <div className="w-7 h-7 border-2 border-zinc-300 dark:border-[#333] border-t-[#FF8A00] rounded-full animate-spin" />
                                        </div>
                                    ) : qrisDataUrl ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={qrisDataUrl}
                                            alt="QRIS"
                                            className="w-[260px] h-[260px] block bg-white rounded-sm"
                                        />
                                    ) : (
                                        <div className="w-[260px] h-[260px] flex items-center justify-center text-[12px] text-zinc-500 dark:text-[#A1A1A1] text-center px-6">
                                            Gagal generate QRIS.
                                            <br />
                                            Coba tutup dan ulangi.
                                        </div>
                                    )}
                                </div>

                                {/* Nominal */}
                                <div className="px-5 py-4 border-t border-zinc-100 dark:border-[#1A1A1A] flex items-center justify-between">
                                    <span className="text-[12px] text-zinc-500 dark:text-[#A1A1A1] uppercase tracking-wider">
                                        Nominal
                                    </span>
                                    <span
                                        className="text-[22px] font-medium text-zinc-900 dark:text-[#F5F5F5]"
                                        style={{ letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
                                    >
                                        Rp {totalAmount.toLocaleString('id-ID')}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="px-5 py-4 border-t border-zinc-100 dark:border-[#1A1A1A] flex gap-2">
                                    <button
                                        onClick={closeQrisModal}
                                        disabled={isProcessing}
                                        className="h-9 px-3 rounded-md border border-zinc-200 dark:border-[#242424] text-[13px] font-medium text-zinc-700 dark:text-[#F5F5F5] hover:bg-zinc-50 dark:hover:bg-[#151515] transition-colors disabled:opacity-40"
                                    >
                                        Batalkan
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await handleCheckout();
                                            closeQrisModal();
                                        }}
                                        disabled={isProcessing || !qrisDataUrl}
                                        className="flex-1 h-9 rounded-md bg-[#FF8A00] hover:bg-[#FF9D2E] text-white text-[13px] font-medium transition-colors disabled:opacity-40 disabled:bg-[#FF8A00]"
                                    >
                                        {isProcessing ? 'Memproses…' : 'Bayar & Selesai'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Success Animation Overlay */}
            <AnimatePresence>
                {orderSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-[#141414] border border-zinc-800/80 p-10 rounded-3xl flex flex-col items-center shadow-2xl shadow-black"
                        >
                            <div className="w-20 h-20 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight mb-2 text-center">Pembayaran Berhasil</h2>
                            <p className="text-zinc-400 text-sm mb-8 text-center">Transaksi telah tersimpan ke dalam riwayat.</p>
                            <button
                                onClick={() => setOrderSuccess(false)}
                                className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
                            >
                                Kembali ke POS
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

