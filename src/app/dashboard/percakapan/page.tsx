"use client";

import { useState, useEffect, useRef } from "react";
import {
    Search, Loader2, MessageCircle,
    CheckCircle2, Truck, Settings2, Clock, XCircle,
    ShoppingBag, Phone, Package, ArrowLeft, RefreshCw,
    Edit, Filter, MoreVertical, Paperclip, Smile, Link as LinkIcon, Bookmark, ChevronRight, Mail, MapPin, MoreHorizontal, FileText, X, Plus
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

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
    menunggu:   { label: "Menunggu",   color: "text-orange-600 dark:text-orange-400",  bg: "bg-orange-50 dark:bg-orange-500/10",  border: "border-orange-200 dark:border-orange-500/20",  icon: Clock },
    diproses:   { label: "Diproses",   color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/20",   icon: Settings2 },
    dikirim:    { label: "Dikirim",    color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-500/10",    border: "border-blue-200 dark:border-blue-500/20",    icon: Truck },
    lunas:      { label: "Lunas",      color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", icon: CheckCircle2 },
    dibatalkan: { label: "Dibatalkan", color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-50 dark:bg-rose-500/10",    border: "border-rose-200 dark:border-rose-500/20",    icon: XCircle },
};

const TABS = ["Semua", "Terbuka", "Menunggu"];

function timeLabel(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffH = (now.getTime() - d.getTime()) / 3600000;
    if (diffH < 24 && d.getDate() === now.getDate())
        return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    if (diffH < 48) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
    const [activeListTab, setActiveListTab] = useState("Semua");
    const [inputText, setInputText] = useState("");
    const [inputMode, setInputMode] = useState<"reply"|"note">("reply");
    
    const [isSending, setIsSending] = useState(false);
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

    const filtered = convList.filter(c => {
        const matchSearch = c.customer_name.toLowerCase().includes(search.toLowerCase()) || c.customer_wa.includes(search);
        let matchTab = true;
        if (activeListTab === "Menunggu") matchTab = c.has_pending;
        else if (activeListTab === "Terbuka") matchTab = !c.has_pending;
        return matchSearch && matchTab;
    });

    const handleSendMessage = async () => {
        if (!inputText.trim() || !selected || inputMode === "note") return;
        setIsSending(true);
        try {
            const newMsg = {
                business_id: businessId,
                customer_wa: selected.customer_wa,
                role: "assistant",
                message: inputText.trim()
            };
            const { error } = await supabase.from("conversations").insert(newMsg);
            if (error) throw error;
            
            setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", message: newMsg.message, created_at: new Date().toISOString() }]);
            setInputText("");
            loadConversations();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    // Context calculations
    const totalSpend = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    const activeOrder = orders.find(o => ["menunggu", "diproses", "dikirim"].includes(o.status));

    // ── 1. List Panel (Left) ──────────────────────────────────────────
    const ListPanel = (
        <div className={`flex-col flex-none w-full md:w-[320px] lg:w-[350px] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] ${mobileView === "chat" ? "hidden md:flex" : "flex"} h-full`}>
            {/* Header & New Button */}
            <div className="p-4 flex items-center justify-between shrink-0">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Percakapan</h2>
                <button className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors">
                    <Edit size={16} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex px-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                {TABS.map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveListTab(tab)}
                        className={`mr-4 pb-2 text-xs font-semibold border-b-2 transition-colors ${
                            activeListTab === tab 
                            ? "border-orange-500 text-orange-600 dark:text-orange-500" 
                            : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="p-4 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari percakapan..."
                            className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                        />
                    </div>
                    <button className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                        <Filter size={14} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoadingList ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-orange-500 w-5 h-5" /></div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500">No conversations found.</div>
                ) : (
                    filtered.map(conv => {
                        const isActive = selected?.customer_wa === conv.customer_wa;
                        return (
                            <button
                                key={conv.customer_wa}
                                onClick={() => selectConversation(conv)}
                                className={`w-full flex items-start gap-3 p-4 text-left border-b border-zinc-100 dark:border-zinc-800/50 transition-colors ${
                                    isActive 
                                    ? "bg-zinc-50 dark:bg-[#111] border-l-2 border-l-orange-500 pl-[14px]" 
                                    : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                                }`}
                            >
                                <div className="w-9 h-9 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-300 dark:border-zinc-700">
                                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                                        {conv.customer_name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className={`text-xs font-semibold truncate ${isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300"}`}>
                                            {conv.customer_name}
                                        </p>
                                        <span className="text-[10px] text-zinc-500 dark:text-zinc-500 shrink-0 ml-2">
                                            {timeLabel(conv.last_time)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate">
                                            {conv.last_role === "assistant" ? "Kamu: " : ""}{conv.last_message}
                                        </p>
                                        {conv.has_pending && (
                                            <div className="w-4 h-4 rounded-full bg-orange-600 flex items-center justify-center shrink-0">
                                                <span className="text-[9px] font-bold text-white">1</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );

    // ── 2. Chat Panel (Middle) ──────────────────────────────────────────
    const ChatPanel = (
        <div className={`flex-col flex-1 min-w-0 bg-white dark:bg-[#0a0a0a] h-full ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
            {!selected ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                    <MessageCircle size={32} className="mb-4 opacity-50" />
                    <p className="text-sm">Pilih percakapan untuk mulai membalas</p>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="h-16 px-4 md:px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMobileView("list")}
                                className="md:hidden p-1.5 -ml-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{selected.customer_name}</h2>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">Active</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-zinc-500 mt-0.5">+{selected.customer_wa}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-50/50 dark:bg-[#0a0a0a] space-y-6 custom-scrollbar">
                        {isLoadingChat ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-orange-500 w-6 h-6" /></div>
                        ) : (
                            <>
                                <div className="flex justify-center">
                                    <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-600">Hari ini</span>
                                </div>
                                {messages.map((msg, i) => {
                                    const isUser = msg.role === "user"; // Customer
                                    return (
                                        <div key={msg.id} className={`flex gap-3 ${isUser ? "flex-row" : "flex-row-reverse"}`}>
                                            {isUser && (
                                                <div className="w-8 h-8 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-300 dark:border-zinc-700">
                                                    <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                                                        {selected.customer_name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`flex flex-col ${isUser ? "items-start" : "items-end"} max-w-[75%]`}>
                                                <div className={`px-4 py-2.5 text-sm ${
                                                    isUser 
                                                    ? "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl rounded-tl-none" 
                                                    : "bg-zinc-800 dark:bg-[#1a1a1a] border border-zinc-700 dark:border-zinc-800 text-zinc-100 rounded-xl rounded-tr-none"
                                                }`}>
                                                    {msg.message}
                                                </div>
                                                <span className="text-[10px] text-zinc-400 mt-1.5 px-1 flex items-center gap-1">
                                                    {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                                    {!isUser && <CheckCircle2 size={10} className="text-zinc-500" />}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] p-4">
                        <div className="flex items-center gap-6 mb-3 px-2">
                            <button 
                                onClick={() => setInputMode("reply")}
                                className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${inputMode === "reply" ? "border-orange-500 text-orange-600 dark:text-orange-500" : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
                            >
                                Balas
                            </button>
                            <button 
                                onClick={() => setInputMode("note")}
                                className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${inputMode === "note" ? "border-amber-500 text-amber-600 dark:text-amber-500" : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
                            >
                                Catatan
                            </button>
                        </div>
                        <div className={`border rounded-lg transition-colors overflow-hidden ${inputMode === "note" ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50" : "bg-white dark:bg-[#111] border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-400 dark:focus-within:border-zinc-600"}`}>
                            <textarea 
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                placeholder={inputMode === "reply" ? "Ketik pesanmu..." : "Ketik catatan internal..."}
                                className="w-full bg-transparent p-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none min-h-[80px] resize-none"
                            />
                            <div className="flex items-center justify-between p-2 border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-transparent">
                                <div />
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={isSending}
                                    className={`px-4 py-1.5 rounded-md text-xs font-medium text-white flex items-center gap-2 transition-colors disabled:opacity-50 ${inputMode === "note" ? "bg-amber-600 hover:bg-amber-700" : "bg-orange-600 hover:bg-orange-700"}`}>
                                    {isSending ? <Loader2 size={14} className="animate-spin" /> : null}
                                    {inputMode === "note" ? "Tambah Catatan" : "Kirim"}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    // ── 3. Context Panel (Right) ──────────────────────────────────────────
    const ContextPanel = (
        <div className="hidden xl:flex flex-col w-[300px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] h-full overflow-y-auto custom-scrollbar">
            {selected ? (
                <>
                    {/* Customer Profile Card */}
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                                <span className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">
                                    {selected.customer_name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <button className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><MoreHorizontal size={16} /></button>
                        </div>
                            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base mb-1">{selected.customer_name}</h2>
                        <div className="flex items-center gap-1.5 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-500">Active</span>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                                <Phone size={14} className="text-zinc-400 shrink-0" />
                                <span>{selected.customer_wa}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Overview */}
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Ringkasan Pelanggan</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">Total Belanja</span>
                                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-medium">Rp {totalSpend.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">Total Pesanan</span>
                                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-medium">{orders.length}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">Terakhir Aktif</span>
                                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-medium">{new Date(selected.last_time).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Pesanan Terakhir</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {orders.length === 0 ? (
                                <p className="text-xs text-zinc-500">Belum ada pesanan.</p>
                            ) : (
                                orders.slice(0, 3).map(o => {
                                    const st = STATUS_CFG[o.status] || STATUS_CFG.lunas;
                                    return (
                                        <div key={o.id}>
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Pesanan #{o.id.slice(0,4).toUpperCase()}</p>
                                                <span className={`text-[10px] font-semibold flex items-center gap-1 ${st.color}`}>
                                                    <div className={`w-1 h-1 rounded-full bg-current`} />
                                                    {st.label}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-mono text-zinc-500">
                                                Rp {o.total?.toLocaleString("id-ID")} • {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </p>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>


                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 opacity-50">
                    <FileText size={32} className="mb-4" />
                </div>
            )}
        </div>
    );

    return (
        <div className="-m-8 h-[calc(100vh-73px)] flex overflow-hidden border-l-0 font-sans">
            {ListPanel}
            {ChatPanel}
            {ContextPanel}
        </div>
    );
}
