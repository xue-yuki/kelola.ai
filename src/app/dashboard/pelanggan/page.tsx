"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Users, Calendar, ShoppingBag, Phone,
    Loader2, LayoutGrid, List, MessageSquare, Plus,
    X, Edit2, Trash2, MapPin, Clock, Truck,
    Settings2, CheckCircle2, XCircle, Trophy, Medal, Crown, ArrowUpDown, ArrowRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Customer = {
    id: string;
    business_id: string;
    wa_number: string;
    name: string;
    address: string;
    created_at: string;
    order_count?: number;
    total_spent?: number;
    last_message?: string;
    last_message_at?: string;
};

type Order = {
    id: string;
    total: number;
    status: string;
    created_at: string;
    items: any;
};

const COLORS = [
    "from-orange-500 to-orange-400",
    "from-blue-500 to-blue-400",
    "from-indigo-500 to-indigo-400",
    "from-emerald-500 to-emerald-400",
    "from-purple-500 to-purple-400",
    "from-rose-500 to-rose-400",
];

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    menunggu:   { label: "Menunggu",   color: "text-orange-600 dark:text-orange-400",  icon: Clock },
    diproses:   { label: "Diproses",   color: "text-amber-600 dark:text-amber-400",   icon: Settings2 },
    dikirim:    { label: "Dikirim",    color: "text-blue-600 dark:text-blue-400",    icon: Truck },
    lunas:      { label: "Lunas",      color: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
    dibatalkan: { label: "Dibatalkan", color: "text-rose-600 dark:text-rose-400",    icon: XCircle },
};

function timeAgo(iso: string) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} mnt lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} hari lalu`;
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function waLink(wa: string) {
    let num = (wa || "").replace(/\D/g, "");
    if (num.startsWith("0")) num = "62" + num.slice(1);
    else if (!num.startsWith("62")) num = "62" + num;
    return `https://wa.me/${num}`;
}

type SortOption = "newest" | "highest_spend" | "most_orders" | "alphabetical";

export default function PelangganPage() {
    const supabase = createClient();
    const [businessId, setBusinessId] = useState("");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Detail panel
    const [selected, setSelected] = useState<Customer | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    // CRUD
    const [showAddModal, setShowAddModal] = useState(false);
    const [editTarget, setEditTarget] = useState<Customer | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({ name: "", wa_number: "", address: "" });

    const realtimeRef = useRef<any>(null);

    useEffect(() => { fetchAll(); }, []);
    useEffect(() => () => { if (realtimeRef.current) supabase.removeChannel(realtimeRef.current); }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: biz } = await supabase.from("businesses")
                .select("id").eq("user_id", session.user.id).single();
            if (!biz) return;
            setBusinessId(biz.id);

            const [{ data: custs }, { data: orders }, { data: convs }] = await Promise.all([
                supabase.from("customers").select("*")
                    .eq("business_id", biz.id).order("created_at", { ascending: false }),
                supabase.from("orders").select("customer_name, total, status, created_at")
                    .eq("business_id", biz.id).neq("status", "dibatalkan"),
                supabase.from("conversations").select("customer_wa, message, created_at")
                    .eq("business_id", biz.id).order("created_at", { ascending: false }).limit(1000),
            ]);

            // order stats per customer name
            const orderMap: Record<string, { count: number; total: number }> = {};
            orders?.forEach(o => {
                const key = o.customer_name?.toLowerCase() ?? "";
                if (!key) return;
                if (!orderMap[key]) orderMap[key] = { count: 0, total: 0 };
                orderMap[key].count++;
                orderMap[key].total += o.total || 0;
            });

            // last message per wa_number
            const msgMap: Record<string, { message: string; created_at: string }> = {};
            convs?.forEach(c => {
                if (!msgMap[c.customer_wa]) msgMap[c.customer_wa] = { message: c.message, created_at: c.created_at };
            });

            const enriched: Customer[] = (custs || []).map(c => ({
                ...c,
                order_count: orderMap[c.name?.toLowerCase()]?.count || 0,
                total_spent: orderMap[c.name?.toLowerCase()]?.total || 0,
                last_message: msgMap[c.wa_number]?.message || "",
                last_message_at: msgMap[c.wa_number]?.created_at || "",
            }));

            setCustomers(enriched);
            setupRealtime(biz.id);
        } finally {
            setIsLoading(false);
        }
    };

    const setupRealtime = (bizId: string) => {
        if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = supabase.channel("pelanggan_conv_rt")
            .on("postgres_changes", {
                event: "INSERT", schema: "public", table: "conversations",
                filter: `business_id=eq.${bizId}`,
            }, payload => {
                const conv = payload.new as any;
                setCustomers(prev => prev.map(c =>
                    c.wa_number === conv.customer_wa
                        ? { ...c, last_message: conv.message, last_message_at: conv.created_at }
                        : c
                ));
                setSelected(prev =>
                    prev?.wa_number === conv.customer_wa
                        ? { ...prev, last_message: conv.message, last_message_at: conv.created_at }
                        : prev
                );
            })
            .subscribe();
    };

    const selectCustomer = async (c: Customer) => {
        setSelected(c);
        setIsLoadingOrders(true);
        const { data } = await supabase.from("orders")
            .select("id, total, status, created_at, items")
            .eq("business_id", businessId)
            .ilike("customer_name", c.name)
            .order("created_at", { ascending: false })
            .limit(10);
        setSelectedOrders(data || []);
        setIsLoadingOrders(false);
    };

    const openAdd = () => {
        setForm({ name: "", wa_number: "", address: "" });
        setShowAddModal(true);
    };

    const openEdit = (c: Customer, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setForm({ name: c.name, wa_number: c.wa_number, address: c.address || "" });
        setEditTarget(c);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.wa_number.trim()) return;
        setIsSaving(true);
        try {
            const cleanWa = form.wa_number.replace(/\D/g, "");
            if (editTarget) {
                await supabase.from("customers").update({
                    name: form.name.trim(), wa_number: cleanWa, address: form.address.trim(),
                }).eq("id", editTarget.id);
                const updated = { ...editTarget, name: form.name.trim(), wa_number: cleanWa, address: form.address.trim() };
                setCustomers(prev => prev.map(c => c.id === editTarget.id ? updated : c));
                if (selected?.id === editTarget.id) setSelected(updated);
                setEditTarget(null);
            } else {
                const { data } = await supabase.from("customers").insert({
                    business_id: businessId,
                    name: form.name.trim(), wa_number: cleanWa, address: form.address.trim(),
                }).select().single();
                if (data) setCustomers(prev => [{ ...data, order_count: 0, total_spent: 0 }, ...prev]);
                setShowAddModal(false);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        await supabase.from("customers").delete().eq("id", deleteTarget.id);
        setCustomers(prev => prev.filter(c => c.id !== deleteTarget.id));
        if (selected?.id === deleteTarget.id) setSelected(null);
        setDeleteTarget(null);
        setIsDeleting(false);
    };

    // Filter & Sort Logic
    const filtered = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.wa_number?.includes(searchTerm)
    );

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === "highest_spend") return (b.total_spent || 0) - (a.total_spent || 0);
        if (sortBy === "most_orders") return (b.order_count || 0) - (a.order_count || 0);
        if (sortBy === "alphabetical") return a.name.localeCompare(b.name);
        // newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const topSpenders = [...customers]
        .filter(c => (c.total_spent || 0) > 0)
        .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
        .slice(0, 3);

    return (
        <div className="-m-8 min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 font-sans p-8">
            <div className="flex gap-6 h-full max-w-[1600px] mx-auto">
                {/* ── Main Column ───────────────────────────────────────── */}
                <div className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto custom-scrollbar pr-2">
                    
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-8 shrink-0">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Customer Intelligence</h1>
                            <p className="text-sm text-zinc-500 mt-1">Manage and analyze your customer base to drive loyalty.</p>
                        </div>
                        <button onClick={openAdd}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm shrink-0">
                            <Plus size={16} /> Add Customer
                        </button>
                    </div>

                    {/* Leaderboard Section */}
                    {!isLoading && topSpenders.length > 0 && (
                        <div className="mb-8 shrink-0">
                            <div className="flex items-center gap-2 mb-4">
                                <Trophy size={16} className="text-amber-500" />
                                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">Top Spenders Leaderboard</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {topSpenders.map((cust, idx) => {
                                    const rankColor = idx === 0 ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" :
                                                      idx === 1 ? "text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700" :
                                                                  "text-amber-700 dark:text-amber-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30";
                                    const RankIcon = idx === 0 ? Crown : Medal;
                                    return (
                                        <div key={cust.id} onClick={() => selectCustomer(cust)}
                                            className="bg-white dark:bg-[#111] rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4 cursor-pointer hover:border-orange-500/50 transition-colors shadow-sm">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border shrink-0 ${rankColor}`}>
                                                <RankIcon size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{cust.name}</p>
                                                <p className="text-xs text-zinc-500">{cust.order_count} Orders</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs text-zinc-400 mb-0.5">Total Spent</p>
                                                <p className="text-sm font-bold text-orange-600 dark:text-orange-500">
                                                    Rp {cust.total_spent?.toLocaleString("id-ID")}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6 shrink-0">
                        <div className="flex-1 relative group">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors" />
                            <input type="text" placeholder="Search by name or WhatsApp..."
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 shadow-sm" />
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {/* Sort Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowSortMenu(!showSortMenu)}
                                    className="flex items-center gap-2 bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm"
                                >
                                    <ArrowUpDown size={14} className="text-zinc-400" />
                                    Sort by: {sortBy === "newest" ? "Newest" : sortBy === "highest_spend" ? "Highest Spend" : sortBy === "most_orders" ? "Most Orders" : "A-Z"}
                                </button>
                                
                                <AnimatePresence>
                                    {showSortMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#161616] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-20 py-1"
                                            >
                                                {[
                                                    { id: "newest", label: "Newest Joined" },
                                                    { id: "highest_spend", label: "Highest Spend" },
                                                    { id: "most_orders", label: "Most Orders" },
                                                    { id: "alphabetical", label: "Alphabetical (A-Z)" },
                                                ].map(opt => (
                                                    <button key={opt.id}
                                                        onClick={() => { setSortBy(opt.id as SortOption); setShowSortMenu(false); }}
                                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-[#222] transition-colors ${sortBy === opt.id ? "text-orange-600 dark:text-orange-500 font-medium" : "text-zinc-700 dark:text-zinc-300"}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* View Toggle */}
                            <div className="flex p-1 bg-zinc-200/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-lg gap-0.5">
                                {(["grid", "list"] as const).map(m => (
                                    <button key={m} onClick={() => setViewMode(m)}
                                        className={`p-1.5 rounded transition-all ${viewMode === m ? "bg-white dark:bg-[#222] text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
                                        {m === "grid" ? <LayoutGrid size={16} /> : <List size={16} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <Loader2 className="animate-spin w-8 h-8 text-orange-500 mb-4" />
                            <p className="text-zinc-400 font-medium text-sm">Loading database...</p>
                        </div>
                    ) : sorted.length === 0 ? (
                        <div className="bg-white dark:bg-[#111] rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 py-32 text-center">
                            <Users size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
                            <h2 className="text-base font-semibold text-zinc-600 dark:text-zinc-400">No customers found</h2>
                            <p className="text-zinc-500 text-sm mt-1">Data is automatically collected when a transaction occurs.</p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
                            {sorted.map((c, i) => {
                                const isActive = selected?.id === c.id;
                                return (
                                    <motion.div key={c.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        onClick={() => selectCustomer(c)}
                                        className={`bg-white dark:bg-[#111] rounded-xl border p-5 cursor-pointer transition-all group ${
                                            isActive ? "border-orange-500 ring-1 ring-orange-500 shadow-md" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-sm"
                                        }`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center text-sm font-bold text-white shadow-sm`}>
                                                    {c.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className={`font-semibold text-sm truncate transition-colors ${isActive ? "text-orange-600 dark:text-orange-500" : "text-zinc-900 dark:text-zinc-100"}`}>{c.name}</h3>
                                                    <p className="text-[11px] font-mono text-zinc-500 mt-0.5">{c.wa_number || "—"}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => window.open(waLink(c.wa_number), "_blank")}
                                                    className="w-7 h-7 flex items-center justify-center rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all">
                                                    <MessageSquare size={13} />
                                                </button>
                                                <button onClick={e => openEdit(c, e)}
                                                    className="w-7 h-7 flex items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                                                    <Edit2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 py-3 border-y border-zinc-100 dark:border-zinc-800/50 mb-3">
                                            <div>
                                                <p className="text-[10px] font-medium text-zinc-500 mb-0.5">Orders</p>
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{c.order_count || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-medium text-zinc-500 mb-0.5">Total Spent</p>
                                                <p className="text-sm font-semibold text-orange-600 dark:text-orange-500">
                                                    {c.total_spent ? `Rp ${c.total_spent.toLocaleString("id-ID")}` : "—"}
                                                </p>
                                            </div>
                                        </div>
                                        {c.last_message ? (
                                            <div className="flex items-start justify-between min-w-0">
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate pr-2 flex-1">💬 {c.last_message}</p>
                                                <span className="text-[10px] text-zinc-400 shrink-0">{timeAgo(c.last_message_at!)}</span>
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-zinc-400 italic">No chat history</p>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#111] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-8">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                                        {["Customer", "WhatsApp", "Orders", "Total Spent", "Last Message", ""].map(h => (
                                            <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted.map((c, i) => (
                                        <tr key={c.id} onClick={() => selectCustomer(c)}
                                            className={`border-b border-zinc-100 dark:border-zinc-800/50 cursor-pointer transition-colors ${selected?.id === c.id ? "bg-orange-50 dark:bg-orange-500/5" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                                                        {c.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{c.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-xs font-mono text-zinc-500">{c.wa_number || "—"}</td>
                                            <td className="px-5 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{c.order_count || 0}</td>
                                            <td className="px-5 py-3 text-sm font-semibold text-orange-600 dark:text-orange-500">
                                                {c.total_spent ? `Rp ${c.total_spent.toLocaleString("id-ID")}` : "—"}
                                            </td>
                                            <td className="px-5 py-3 max-w-[200px]">
                                                <p className="text-[12px] text-zinc-600 dark:text-zinc-400 truncate">{c.last_message || "—"}</p>
                                                {c.last_message_at && <p className="text-[10px] text-zinc-400 mt-0.5">{timeAgo(c.last_message_at)}</p>}
                                            </td>
                                            <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => window.open(waLink(c.wa_number), "_blank")}
                                                        className="p-1.5 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                                                        <MessageSquare size={16} />
                                                    </button>
                                                    <button onClick={e => openEdit(c, e)}
                                                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(c)}
                                                        className="p-1.5 rounded text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Detail Slide-over (Right Panel) ─────────────────────────────────── */}
                <AnimatePresence>
                    {selected && (
                        <motion.div
                            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }}
                            transition={{ type: "spring", stiffness: 320, damping: 32 }}
                            className="w-[340px] flex-shrink-0 hidden lg:flex flex-col border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a]"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${COLORS[sorted.findIndex(c => c.id === selected.id) % COLORS.length] || COLORS[0]} flex items-center justify-center text-lg font-bold text-white shrink-0 shadow-sm`}>
                                        {selected.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">{selected.name}</p>
                                        <p className="text-xs font-mono text-zinc-500 mt-0.5">{selected.wa_number}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors shrink-0">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
                                    <div className="bg-white dark:bg-[#0a0a0a] p-4">
                                        <p className="text-[11px] font-medium text-zinc-500 mb-1">Total Orders</p>
                                        <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{selected.order_count || 0}</p>
                                    </div>
                                    <div className="bg-white dark:bg-[#0a0a0a] p-4">
                                        <p className="text-[11px] font-medium text-zinc-500 mb-1">Lifetime Value</p>
                                        <p className="text-lg font-bold text-orange-600 dark:text-orange-500 leading-tight mt-1">
                                            {selected.total_spent ? `Rp ${selected.total_spent.toLocaleString("id-ID")}` : "Rp 0"}
                                        </p>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-6 space-y-4 border-b border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-start gap-3 text-sm">
                                        <MapPin size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-zinc-900 dark:text-zinc-100">{selected.address || "No address provided"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar size={16} className="text-zinc-400 shrink-0" />
                                        <p className="text-zinc-600 dark:text-zinc-400">Customer since <span className="font-medium text-zinc-900 dark:text-zinc-100">{new Date(selected.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span></p>
                                    </div>
                                </div>

                                {/* Orders */}
                                <div className="p-6">
                                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">Recent Orders</p>
                                    {isLoadingOrders ? (
                                        <div className="flex justify-center py-5"><Loader2 className="animate-spin text-orange-500 w-5 h-5" /></div>
                                    ) : selectedOrders.length === 0 ? (
                                        <p className="text-sm text-zinc-400 italic">No order history</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedOrders.map(o => {
                                                const st = STATUS_CFG[o.status] ?? STATUS_CFG.lunas;
                                                return (
                                                    <div key={o.id} className="flex items-center justify-between group">
                                                        <div>
                                                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 transition-colors">Rp {o.total?.toLocaleString("id-ID")}</p>
                                                            <p className="text-[11px] text-zinc-500 mt-0.5">{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                                                        </div>
                                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium border ${st.bg} ${st.border} ${st.color}`}>
                                                            {st.label}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions (Bottom Sticky) */}
                            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#111] grid gap-2 shrink-0">
                                <a href={waLink(selected.wa_number)} target="_blank" rel="noopener noreferrer"
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                                    <MessageSquare size={16} /> Open in WhatsApp
                                </a>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => openEdit(selected)}
                                        className="py-2 bg-white dark:bg-[#161616] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                                        <Edit2 size={14} /> Edit
                                    </button>
                                    <button onClick={() => setDeleteTarget(selected)}
                                        className="py-2 bg-white dark:bg-[#161616] border border-zinc-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-200 dark:hover:border-rose-900/50 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Add / Edit Modal ──────────────────────────────────── */}
                <AnimatePresence>
                    {(showAddModal || editTarget) && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => { setShowAddModal(false); setEditTarget(null); }}>
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">{editTarget ? "Edit Customer" : "Add Customer"}</h2>
                                    <button onClick={() => { setShowAddModal(false); setEditTarget(null); }}
                                        className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {([
                                        { label: "Full Name *", key: "name", placeholder: "e.g. Budi Santoso" },
                                        { label: "WhatsApp Number *", key: "wa_number", placeholder: "e.g. 6281234567890" },
                                        { label: "Address", key: "address", placeholder: "Full delivery address" },
                                    ] as const).map(({ label, key, placeholder }) => (
                                        <div key={key}>
                                            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">{label}</label>
                                            <input
                                                value={form[key]}
                                                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                                placeholder={placeholder}
                                                className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-shadow" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 mt-8">
                                    <button onClick={() => { setShowAddModal(false); setEditTarget(null); }}
                                        className="flex-1 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={handleSave} disabled={isSaving || !form.name.trim() || !form.wa_number.trim()}
                                        className="flex-1 py-2.5 rounded-lg bg-orange-600 text-white font-medium text-sm hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                        {isSaving && <Loader2 size={16} className="animate-spin" />}
                                        {editTarget ? "Save Changes" : "Add Customer"}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Delete Confirm ────────────────────────────────────── */}
                <AnimatePresence>
                    {deleteTarget && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => setDeleteTarget(null)}>
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 w-full max-w-sm shadow-xl text-center">
                                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center mx-auto mb-5">
                                    <Trash2 size={24} className="text-rose-600 dark:text-rose-400" />
                                </div>
                                <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 mb-2">Delete Customer?</h2>
                                <p className="text-sm text-zinc-500 mb-8">
                                    <span className="font-medium text-zinc-900 dark:text-zinc-300">{deleteTarget.name}</span> will be permanently deleted. This action cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setDeleteTarget(null)}
                                        className="flex-1 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={handleDelete} disabled={isDeleting}
                                        className="flex-1 py-2.5 rounded-lg bg-rose-600 text-white font-medium text-sm hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                        {isDeleting && <Loader2 size={16} className="animate-spin" />}
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
