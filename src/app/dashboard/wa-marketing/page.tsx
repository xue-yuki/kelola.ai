"use client";

import { useState, useEffect, useRef } from "react";
import {
    Send, Users, Sparkles, MessageSquare,
    History, Loader2, CheckCircle2, AlertCircle,
    Copy, ArrowRight, WifiOff, RefreshCw, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3001";

type Customer = { wa_number: string; name: string; last_order_at?: string; order_count?: number };

type BroadcastState = { running: boolean; sent: number; failed: number; total: number };

const TEMPLATES = [
    { id: 1, name: "Promo Flash Sale", text: "Halo [Nama]! Spesial untuk kamu, dapatkan Flash Sale 50% untuk produk pilihan hari ini saja. Yuk pesan sekarang! 🛒" },
    { id: 2, name: "Sapaan Pelanggan", text: "Hai [Nama], sudah lama ya tidak mampir ke toko kami. Ada produk baru lho! Kapan mau order lagi? 😊" },
    { id: 3, name: "Update Stok", text: "Kabar gembira [Nama]! Stok produk yang kamu tunggu sudah tersedia kembali. Segera amankan sebelum kehabisan! ✅" },
];

export default function WAMarketingPage() {
    const supabase = createClient();
    const [message, setMessage] = useState("");
    const [businessId, setBusinessId] = useState("");

    // Real customer data
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [loyalCustomers, setLoyalCustomers] = useState<Customer[]>([]);
    const [inactiveCustomers, setInactiveCustomers] = useState<Customer[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

    const [selectedSegment, setSelectedSegment] = useState<"all" | "loyal" | "inactive">("all");
    const [botConnected, setBotConnected] = useState<boolean | null>(null);

    // Broadcast state
    const [isSending, setIsSending] = useState(false);
    const [broadcastProgress, setBroadcastProgress] = useState<BroadcastState | null>(null);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState("");
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        loadData();
        checkBotStatus();
    }, []);

    const checkBotStatus = async () => {
        try {
            const res = await fetch(`${AGENT_URL}/api/status/check`, { signal: AbortSignal.timeout(3000) });
            const data = await res.json();
            setBotConnected(data.status === "connected");
        } catch {
            setBotConnected(false);
        }
    };

    const loadData = async () => {
        setIsLoadingCustomers(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: biz } = await supabase
                .from("businesses").select("id")
                .eq("user_id", session.user.id).single();
            if (!biz) return;
            setBusinessId(biz.id);

            // Fetch customers + order counts
            const [{ data: customers }, { data: orders }] = await Promise.all([
                supabase.from("customers").select("wa_number, name").eq("business_id", biz.id),
                supabase.from("orders")
                    .select("customer_name, created_at, status")
                    .eq("business_id", biz.id)
                    .neq("status", "dibatalkan"),
            ]);

            if (!customers) return;

            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            // Map customer name → order info
            const orderMap: Record<string, { count: number; lastAt: Date }> = {};
            orders?.forEach(o => {
                const key = o.customer_name?.toLowerCase();
                if (!key) return;
                if (!orderMap[key]) orderMap[key] = { count: 0, lastAt: new Date(0) };
                orderMap[key].count++;
                const d = new Date(o.created_at);
                if (d > orderMap[key].lastAt) orderMap[key].lastAt = d;
            });

            const enriched: Customer[] = customers.map(c => {
                const info = orderMap[c.name?.toLowerCase()] || { count: 0, lastAt: new Date(0) };
                return {
                    wa_number: c.wa_number,
                    name: c.name,
                    last_order_at: info.lastAt.toISOString(),
                    order_count: info.count,
                };
            });

            setAllCustomers(enriched);

            // Loyal: top 20% by order count (min 1 order)
            const withOrders = enriched.filter(c => (c.order_count || 0) > 0);
            const topCount = Math.max(1, Math.ceil(withOrders.length * 0.2));
            const sorted = [...withOrders].sort((a, b) => (b.order_count || 0) - (a.order_count || 0));
            setLoyalCustomers(sorted.slice(0, topCount));

            // Inactive: last order > 30 days ago (or no order)
            const inactive = enriched.filter(c => {
                const last = new Date(c.last_order_at || 0);
                return last < thirtyDaysAgo;
            });
            setInactiveCustomers(inactive);
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    const getSegmentRecipients = (): Customer[] => {
        if (selectedSegment === "loyal") return loyalCustomers;
        if (selectedSegment === "inactive") return inactiveCustomers;
        return allCustomers;
    };

    const recipients = getSegmentRecipients();

    const handleSend = async () => {
        if (!message.trim() || recipients.length === 0) return;
        setError("");

        if (!botConnected) {
            setError("Bot WhatsApp belum terhubung. Hubungkan dulu di halaman Pengaturan.");
            return;
        }

        setIsSending(true);
        setBroadcastProgress({ running: true, sent: 0, failed: 0, total: recipients.length });

        try {
            const res = await fetch(`${AGENT_URL}/api/broadcast`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipients: recipients.map(c => ({ number: c.wa_number, name: c.name })),
                    template: message,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Gagal memulai broadcast");
            }

            // Poll progress every 1.5s
            pollRef.current = setInterval(async () => {
                try {
                    const statusRes = await fetch(`${AGENT_URL}/api/broadcast/status`);
                    const state: BroadcastState = await statusRes.json();
                    setBroadcastProgress(state);

                    if (!state.running) {
                        clearInterval(pollRef.current!);
                        setIsSending(false);
                        if (state.sent > 0 || state.failed > 0) {
                            setIsSent(true);
                            setTimeout(() => setIsSent(false), 6000);
                        } else {
                            setError("Broadcast gagal dimulai. Pastikan bot terhubung dan coba lagi.");
                        }
                    }
                } catch {
                    // keep polling on network error
                }
            }, 1500);
        } catch (err: any) {
            setError(err.message);
            setIsSending(false);
            setBroadcastProgress(null);
        }
    };

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

    const segmentConfig = [
        { id: "all" as const, name: "Semua Pelanggan", icon: Users, customers: allCustomers },
        { id: "loyal" as const, name: "Pelanggan Setia (Top 20%)", icon: Sparkles, customers: loyalCustomers },
        { id: "inactive" as const, name: "Tidak Aktif > 30 Hari", icon: History, customers: inactiveCustomers },
    ];

    const progress = broadcastProgress
        ? Math.round(((broadcastProgress.sent + broadcastProgress.failed) / broadcastProgress.total) * 100)
        : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white/90 tracking-tight mb-2">WhatsApp Marketing</h1>
                    <p className="text-white/40 font-medium">Kirim promosi dan sapa pelangganmu secara massal.</p>
                </div>
                {/* Bot Status */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold ${
                    botConnected === null ? "border-white/10 text-white/30" :
                    botConnected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" :
                    "border-rose-500/30 bg-rose-500/10 text-rose-400"
                }`}>
                    {botConnected === null ? <Loader2 size={12} className="animate-spin" /> :
                     botConnected ? <><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Bot Terhubung</> :
                     <><WifiOff size={12} />Bot Tidak Terhubung</>}
                </div>
            </div>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        <span className="flex-1">{error}</span>
                        <button onClick={() => setError("")}><X size={16} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Composer (Left) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#161616]/90 backdrop-blur-2xl p-8 rounded-[32px] border border-white/5 shadow-2xl flex flex-col gap-6">
                        {/* Segment Picker */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Target Audiens</label>
                                <button onClick={loadData} className="text-white/30 hover:text-white/60 transition-colors p-1">
                                    <RefreshCw size={13} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {segmentConfig.map((seg) => {
                                    const Icon = seg.icon;
                                    const isActive = selectedSegment === seg.id;
                                    return (
                                        <button
                                            key={seg.id}
                                            onClick={() => setSelectedSegment(seg.id)}
                                            className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                                                isActive
                                                    ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20"
                                                    : "bg-white/5 border-white/5 text-white/50 hover:border-white/10 hover:text-white/80"
                                            }`}
                                        >
                                            <Icon size={18} />
                                            <div>
                                                <p className="text-xs font-black tracking-tight">{seg.name}</p>
                                                {isLoadingCustomers ? (
                                                    <p className={`text-[10px] font-bold ${isActive ? "text-white/60" : "text-white/30"}`}>Memuat...</p>
                                                ) : (
                                                    <p className={`text-[10px] font-bold ${isActive ? "text-white/60" : "text-white/30"}`}>
                                                        {seg.customers.length} Pelanggan
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Message Composer */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Isi Pesan Broadcast</label>
                                <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                                    Gunakan [Nama] untuk personalisasi
                                </span>
                            </div>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tulis pesan promosi kamu di sini..."
                                className="w-full h-48 bg-[#111] border border-white/5 rounded-[24px] p-6 text-sm font-medium text-white/90 placeholder:text-white/30 focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all outline-none resize-none"
                            />
                        </div>

                        {/* Progress Bar (saat sending) */}
                        {isSending && broadcastProgress && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-white/40">
                                    <span>Mengirim pesan... {broadcastProgress.sent + broadcastProgress.failed}/{broadcastProgress.total}</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-orange-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                                {broadcastProgress.failed > 0 && (
                                    <p className="text-[10px] text-rose-400 font-bold">{broadcastProgress.failed} pesan gagal terkirim</p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex-1 text-[10px] font-bold text-white/40 flex items-center gap-2">
                                <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
                                Pesan dikirim satu per satu dengan jeda 2 detik untuk menghindari banned.
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={isSending || !message.trim() || recipients.length === 0}
                                className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${
                                    isSending
                                        ? "bg-white/5 text-white/50"
                                        : "bg-orange-500 text-white hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:bg-white/5 disabled:text-white/30 shadow-orange-500/20"
                                }`}
                            >
                                {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                {isSending
                                    ? `Mengirim ${progress}%`
                                    : `Kirim ke ${recipients.length} Pelanggan`}
                            </button>
                        </div>
                    </div>

                    {/* Quick Templates */}
                    <div className="bg-[#161616]/90 backdrop-blur-2xl p-8 rounded-[32px] border border-white/5 shadow-2xl space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                <Copy size={18} />
                            </div>
                            <h3 className="font-black text-white/90 tracking-tight">Template Cepat</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {TEMPLATES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setMessage(t.text)}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left hover:border-orange-500/30 hover:bg-white/10 hover:shadow-2xl transition-all group"
                                >
                                    <p className="font-black text-xs text-white/90 mb-2 truncate uppercase tracking-widest">{t.name}</p>
                                    <p className="text-[10px] text-white/40 font-medium line-clamp-3 leading-relaxed mb-4 group-hover:text-white/60 transition-colors">{t.text}</p>
                                    <p className="text-[9px] font-black text-orange-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Gunakan <ArrowRight size={10} /></p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview (Right) */}
                <div className="space-y-6">
                    <div className="bg-[#161616]/90 backdrop-blur-2xl p-8 rounded-[32px] border border-white/5 shadow-2xl flex flex-col items-center">
                        <div className="w-full flex items-center justify-between mb-8">
                            <h3 className="font-black text-xs uppercase tracking-widest text-white/40">Preview Pesan</h3>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                            </div>
                        </div>
                        {/* Phone Mockup */}
                        <div className="relative w-64 h-[440px] bg-black rounded-[40px] border-[6px] border-[#111] shadow-2xl p-2">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#111] rounded-b-[20px]" />
                            <div className="h-full bg-[#111b21] rounded-[30px] overflow-hidden flex flex-col border border-white/5">
                                <div className="bg-[#202c33] p-3 pt-6 flex items-center gap-2 border-b border-white/5">
                                    <div className="w-6 h-6 rounded-full bg-white/10" />
                                    <div className="w-20 h-2 bg-white/20 rounded" />
                                </div>
                                <div className="flex-1 p-3 overflow-y-auto bg-[#0b141a]">
                                    {message && (
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="bg-[#005c4b] p-3 rounded-2xl rounded-tr-none shadow-sm ml-4"
                                        >
                                            <p className="text-[10px] text-white/90 font-medium leading-[1.4] whitespace-pre-wrap">
                                                {message.replace(/\[Nama\]/gi, recipients[0]?.name || "Budi")}
                                            </p>
                                            <p className="text-[8px] text-white/50 text-right mt-1">11:08 ✓✓</p>
                                        </motion.div>
                                    )}
                                </div>
                                <div className="bg-[#202c33] p-3 flex items-center gap-2 border-t border-white/5">
                                    <div className="w-full h-8 bg-[#2a3942] rounded-full" />
                                    <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
                                        <Send size={12} className="text-[#111b21]" fill="currentColor" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reach Estimate */}
                    <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 p-8 rounded-[32px] text-white/90 overflow-hidden relative backdrop-blur-xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="text-orange-400" size={20} />
                                <h4 className="font-black tracking-tight">Estimasi Jangkauan</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/50 font-bold uppercase tracking-widest">Akan Dikirim</span>
                                    <span className="font-black text-xl text-white">{recipients.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/50 font-bold uppercase tracking-widest">Estimasi Waktu</span>
                                    <span className="font-black text-xl text-white">
                                        ~{Math.ceil(recipients.length * 2 / 60)} mnt
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/50 font-bold uppercase tracking-widest">Rate Dibaca</span>
                                    <span className="font-black text-xl text-white">~85%</span>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-[10px] font-bold text-white/40 leading-relaxed">
                                        WhatsApp memiliki open rate 4x lebih tinggi dibanding Email Marketing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {isSent && broadcastProgress && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#161616] border border-white/10 rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-rose-500" />
                            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-white/90 tracking-tight mb-2">Broadcast Selesai!</h2>
                            <p className="text-sm font-medium text-white/40 mb-2 leading-relaxed">
                                <strong className="text-emerald-400">{broadcastProgress.sent}</strong> pesan terkirim
                                {broadcastProgress.failed > 0 && (
                                    <>, <strong className="text-rose-400">{broadcastProgress.failed}</strong> gagal</>
                                )}
                            </p>
                            <p className="text-xs text-white/30 mb-8">
                                dari total {broadcastProgress.total} pelanggan
                            </p>
                            <button
                                onClick={() => { setIsSent(false); setBroadcastProgress(null); }}
                                className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                Kembali ke Menu
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
