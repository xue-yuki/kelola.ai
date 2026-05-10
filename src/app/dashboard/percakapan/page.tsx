"use client";

import { useState, useEffect, useRef } from "react";
import {
    Search, Loader2, MessageCircle,
    CheckCircle2, Truck, Settings2, Clock, XCircle,
    ShoppingBag, Phone, Package, ArrowLeft, RefreshCw
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ConvSummary = {
    customer_wa: string;
    customer_name: string;
    last_message: string;
    last_role: "user" | "assistant";
    last_time: string;
    has_pending: boolean;
};

type Message = {
    id: string;
    role: "user" | "assistant";
    message: string;
    created_at: string;
};

type Order = {
    id: string;
    customer_name: string;
    items: any;
    total: number;
    status: string;
    created_at: string;
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
    menunggu:   { label: "Menunggu",   color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  icon: Clock },
    diproses:   { label: "Diproses",   color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: Settings2 },
    dikirim:    { label: "Dikirim",    color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    icon: Truck },
    lunas:      { label: "Lunas",      color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 },
    dibatalkan: { label: "Dibatalkan", color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20",    icon: XCircle },
};

const NEXT_STATUSES: Record<string, string[]> = {
    menunggu:   ["diproses", "dibatalkan"],
    diproses:   ["dikirim",  "dibatalkan"],
    dikirim:    ["lunas",    "dibatalkan"],
    lunas:      [],
    dibatalkan: [],
};

function timeLabel(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffH = (now.getTime() - d.getTime()) / 3600000;
    if (diffH < 24 && d.getDate() === now.getDate())
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    if (diffH < 48) return "Kemarin";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function PercakapanPage() {
    const supabase = createClient();
    const [businessId, setBusinessId] = useState("");
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [convList, setConvList] = useState<ConvSummary[]>([]);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<ConvSummary | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

    // Mobile: "list" | "chat"
    const [mobileView, setMobileView] = useState<"list" | "chat">("list");

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => { loadConversations(); }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadConversations = async () => {
        setIsLoadingList(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: biz } = await supabase
                .from("businesses").select("id")
                .eq("user_id", session.user.id).single();
            if (!biz) return;
            setBusinessId(biz.id);

            const [{ data: convs }, { data: customers }, { data: pendingOrders }] = await Promise.all([
                supabase.from("conversations")
                    .select("customer_wa, role, message, created_at")
                    .eq("business_id", biz.id)
                    .order("created_at", { ascending: false })
                    .limit(500),
                supabase.from("customers")
                    .select("wa_number, name")
                    .eq("business_id", biz.id),
                supabase.from("orders")
                    .select("customer_name, status")
                    .eq("business_id", biz.id)
                    .in("status", ["menunggu", "diproses", "dikirim"]),
            ]);

            const customerMap: Record<string, string> = {};
            customers?.forEach(c => { customerMap[c.wa_number] = c.name; });

            const pendingNames = new Set(pendingOrders?.map(o => o.customer_name.toLowerCase()) || []);

            const grouped: Record<string, ConvSummary> = {};
            convs?.forEach(c => {
                if (!grouped[c.customer_wa]) {
                    const name = customerMap[c.customer_wa] || c.customer_wa;
                    grouped[c.customer_wa] = {
                        customer_wa: c.customer_wa,
                        customer_name: name,
                        last_message: c.message,
                        last_role: c.role as "user" | "assistant",
                        last_time: c.created_at,
                        has_pending: pendingNames.has(name.toLowerCase()),
                    };
                }
            });

            setConvList(Object.values(grouped));
        } finally {
            setIsLoadingList(false);
        }
    };

    const selectConversation = async (conv: ConvSummary) => {
        setSelected(conv);
        setMobileView("chat");
        setIsLoadingChat(true);
        setMessages([]);
        setOrders([]);

        try {
            const [{ data: msgs }, { data: ords }] = await Promise.all([
                supabase.from("conversations")
                    .select("id, role, message, created_at")
                    .eq("business_id", businessId)
                    .eq("customer_wa", conv.customer_wa)
                    .order("created_at", { ascending: true }),
                supabase.from("orders")
                    .select("id, customer_name, items, total, status, created_at")
                    .eq("business_id", businessId)
                    .ilike("customer_name", conv.customer_name)
                    .order("created_at", { ascending: false })
                    .limit(5),
            ]);
            setMessages(msgs || []);
            setOrders(ords || []);
        } finally {
            setIsLoadingChat(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdatingOrder(orderId);
        try {
            await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (!["menunggu", "diproses", "dikirim"].includes(newStatus)) {
                setConvList(prev => prev.map(c =>
                    c.customer_wa === selected?.customer_wa ? { ...c, has_pending: false } : c
                ));
            }
        } finally {
            setUpdatingOrder(null);
        }
    };

    const filtered = convList.filter(c =>
        c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        c.customer_wa.includes(search)
    );

    const activeOrder = orders.find(o => ["menunggu", "diproses", "dikirim"].includes(o.status));
    const pastOrders = orders.filter(o => !["menunggu", "diproses", "dikirim"].includes(o.status));

    // ── Conversation List Panel ──────────────────────────────────────────
    const ListPanel = (
        <div className={`flex-col flex-none w-full lg:w-80 border-r border-white/5 ${mobileView === "chat" ? "hidden lg:flex" : "flex"}`}>
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <div className="flex-1">
                    <h2 className="font-black text-white/90 text-base mb-3">Percakapan</h2>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5 focus-within:border-orange-500/30 transition-colors">
                        <Search size={13} className="text-white/30 flex-shrink-0" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari pelanggan..."
                            className="bg-transparent text-sm text-white/80 placeholder:text-white/20 outline-none w-full"
                        />
                    </div>
                </div>
                <button onClick={loadConversations} className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors mt-1 flex-shrink-0">
                    <RefreshCw size={15} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isLoadingList ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="animate-spin text-orange-400 w-6 h-6" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-white/20">
                        <MessageCircle size={32} />
                        <p className="text-xs font-bold">Belum ada percakapan</p>
                    </div>
                ) : (
                    filtered.map(conv => {
                        const isActive = selected?.customer_wa === conv.customer_wa;
                        return (
                            <button
                                key={conv.customer_wa}
                                onClick={() => selectConversation(conv)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left border-b border-white/[0.03] ${isActive ? "bg-orange-500/10 border-l-2 border-l-orange-500" : "hover:bg-white/[0.03] active:bg-white/[0.06]"}`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/20 border border-orange-500/20 flex items-center justify-center">
                                        <span className="text-base font-black text-orange-400">
                                            {conv.customer_name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    {conv.has_pending && (
                                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-[#0e0e0e]" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className={`text-sm font-bold truncate ${isActive ? "text-orange-400" : "text-white/90"}`}>
                                            {conv.customer_name}
                                        </p>
                                        <span className="text-[10px] text-white/30 flex-shrink-0 ml-2">
                                            {timeLabel(conv.last_time)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/40 truncate">
                                        {conv.last_role === "assistant" ? "🤖 " : ""}{conv.last_message}
                                    </p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );

    // ── Chat Panel ───────────────────────────────────────────────────────
    const ChatPanel = (
        <div className={`flex-col flex-1 min-w-0 ${mobileView === "list" ? "hidden lg:flex" : "flex"}`}>
            {!selected ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/20">
                    <MessageCircle size={48} />
                    <p className="font-bold text-sm">Pilih percakapan untuk mulai</p>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-[#0e0e0e] flex-shrink-0">
                        {/* Back button (mobile only) */}
                        <button
                            onClick={() => setMobileView("list")}
                            className="lg:hidden p-1.5 -ml-1 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/20 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-black text-orange-400">
                                {selected.customer_name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white/90 leading-none mb-0.5">{selected.customer_name}</p>
                            <p className="text-[11px] text-white/30 flex items-center gap-1">
                                <Phone size={9} /> {selected.customer_wa}
                            </p>
                        </div>
                        {orders.length > 0 && (
                            <span className="text-[10px] font-bold text-white/30 flex items-center gap-1 flex-shrink-0">
                                <ShoppingBag size={11} /> {orders.length}
                            </span>
                        )}
                    </div>

                    {/* Active Order Card */}
                    {activeOrder && (() => {
                        const st = STATUS_CFG[activeOrder.status];
                        const StatusIcon = st.icon;
                        const nextStatuses = NEXT_STATUSES[activeOrder.status] || [];
                        let items: any[] = [];
                        try { items = typeof activeOrder.items === "string" ? JSON.parse(activeOrder.items) : activeOrder.items || []; } catch {}

                        return (
                            <div className={`mx-3 mt-3 p-3.5 rounded-2xl border ${st.bg} ${st.border} flex-shrink-0`}>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <StatusIcon size={14} className={st.color} />
                                    <p className="text-xs font-bold text-white/60">
                                        Pesanan Aktif · <span className={st.color}>{st.label}</span>
                                    </p>
                                </div>
                                <p className="text-xs text-white/60 mb-3 flex items-start gap-1.5">
                                    <Package size={11} className="flex-shrink-0 mt-0.5" />
                                    <span>{items.map((i: any) => `${i.name} x${i.qty}`).join(", ")} — Rp {activeOrder.total?.toLocaleString("id-ID")}</span>
                                </p>
                                {nextStatuses.length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                        {nextStatuses.map(ns => {
                                            const nst = STATUS_CFG[ns];
                                            const NIcon = nst.icon;
                                            const isUpdating = updatingOrder === activeOrder.id;
                                            return (
                                                <button
                                                    key={ns}
                                                    onClick={() => updateOrderStatus(activeOrder.id, ns)}
                                                    disabled={isUpdating}
                                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 disabled:opacity-50 ${nst.bg} ${nst.border} ${nst.color}`}
                                                >
                                                    {isUpdating ? <Loader2 size={11} className="animate-spin" /> : <NIcon size={11} />}
                                                    {nst.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
                        {isLoadingChat ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="animate-spin text-orange-400 w-8 h-8" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-white/20 text-sm font-bold">
                                Belum ada pesan
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                const isUser = msg.role === "user";
                                const showTime = i === messages.length - 1 || messages[i + 1]?.role !== msg.role;
                                return (
                                    <div key={msg.id} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                                        <div className={`max-w-[80%] sm:max-w-[70%] flex flex-col ${isUser ? "items-start" : "items-end"} gap-0.5`}>
                                            <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                                isUser
                                                    ? "bg-white/[0.07] text-white/80 rounded-tl-sm"
                                                    : "bg-orange-500/20 text-white/90 rounded-tr-sm border border-orange-500/20"
                                            }`}>
                                                {msg.message}
                                            </div>
                                            {showTime && (
                                                <span className="text-[10px] text-white/20 px-1">
                                                    {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Past Orders */}
                    {pastOrders.length > 0 && (
                        <div className="px-3 pb-3 flex-shrink-0 border-t border-white/5 pt-3">
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">Riwayat Pesanan</p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {pastOrders.map(o => {
                                    const st = STATUS_CFG[o.status] ?? STATUS_CFG.lunas;
                                    return (
                                        <div key={o.id} className={`flex-shrink-0 px-3 py-1.5 rounded-xl border ${st.bg} ${st.border} text-xs flex items-center gap-2`}>
                                            <span className={`font-bold ${st.color}`}>{st.label}</span>
                                            <span className="text-white/40">Rp {o.total?.toLocaleString("id-ID")}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    return (
        <div className="h-[calc(100vh-8rem)] flex rounded-3xl overflow-hidden border border-white/5 bg-[#0e0e0e]">
            {ListPanel}
            {ChatPanel}
        </div>
    );
}
