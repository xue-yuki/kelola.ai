"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Users, Calendar, ShoppingBag, Phone,
    Loader2, LayoutGrid, List, MessageSquare, Plus,
    X, Edit2, Trash2, MapPin, Clock, Truck,
    Settings2, CheckCircle2, XCircle
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
    menunggu:   { label: "Menunggu",   color: "text-orange-400",  icon: Clock },
    diproses:   { label: "Diproses",   color: "text-amber-400",   icon: Settings2 },
    dikirim:    { label: "Dikirim",    color: "text-blue-400",    icon: Truck },
    lunas:      { label: "Lunas",      color: "text-emerald-400", icon: CheckCircle2 },
    dibatalkan: { label: "Dibatalkan", color: "text-rose-400",    icon: XCircle },
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

export default function PelangganPage() {
    const supabase = createClient();
    const [businessId, setBusinessId] = useState("");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

            // last message per wa_number (convs already sorted desc)
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
                // update selected panel too
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

    const filtered = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.wa_number?.includes(searchTerm)
    );

    return (
        <div className="flex gap-6 max-w-[1400px] mx-auto pb-10">
            {/* ── Main Column ───────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[28px] font-black text-white/90 tracking-tight">Database Pelanggan</h1>
                        <p className="text-sm font-medium text-white/40">Kenali pelangganmu lebih dekat untuk meningkatkan loyalitas.</p>
                    </div>
                    <button onClick={openAdd}
                        className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-[0_0_20px_rgba(255,107,43,0.25)] flex-shrink-0">
                        <Plus size={17} /> Tambah
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex gap-3">
                    <div className="flex-1 relative group">
                        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-400 transition-colors" />
                        <input type="text" placeholder="Cari nama atau nomor WA..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-[#161616]/90 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white/90 placeholder:text-white/30 focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500/30 outline-none transition-all" />
                    </div>
                    <div className="flex p-1 bg-[#161616]/90 border border-white/5 rounded-xl gap-0.5">
                        {(["grid", "list"] as const).map(m => (
                            <button key={m} onClick={() => setViewMode(m)}
                                className={`p-2 rounded-lg transition-all ${viewMode === m ? "bg-white/10 text-white" : "text-white/30 hover:text-white"}`}>
                                {m === "grid" ? <LayoutGrid size={18} /> : <List size={18} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="animate-spin w-10 h-10 text-orange-400 mb-4" />
                        <p className="text-white/30 font-bold uppercase tracking-widest text-xs">Memuat data...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-[#161616]/90 rounded-3xl border-2 border-dashed border-white/10 py-32 text-center">
                        <Users size={48} className="mx-auto text-white/10 mb-4" />
                        <h2 className="text-lg font-bold text-white/50">Belum ada pelanggan</h2>
                        <p className="text-white/30 text-sm mt-1">Data terkumpul otomatis saat ada transaksi WA.</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map((c, i) => {
                            const isActive = selected?.id === c.id;
                            return (
                                <motion.div key={c.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    onClick={() => selectCustomer(c)}
                                    className={`bg-[#161616]/90 backdrop-blur-2xl rounded-2xl border p-5 cursor-pointer transition-all group ${
                                        isActive ? "border-orange-500/40 shadow-[0_0_20px_rgba(255,107,43,0.08)]" : "border-white/5 hover:border-white/10 hover:shadow-xl"
                                    }`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${COLORS[i % COLORS.length]} flex items-center justify-center text-lg font-bold text-white shadow-lg`}>
                                            {c.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => window.open(waLink(c.wa_number), "_blank")}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/30 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all">
                                                <MessageSquare size={14} />
                                            </button>
                                            <button onClick={e => openEdit(c, e)}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/30 hover:bg-white/10 hover:text-white transition-all">
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className={`font-bold text-sm truncate transition-colors ${isActive ? "text-orange-400" : "text-white/90 group-hover:text-white"}`}>{c.name}</h3>
                                            <p className="text-[10px] font-mono text-white/30 mt-0.5">{c.wa_number || "—"}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/5">
                                            <div>
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Pesanan</p>
                                                <p className="text-xs font-bold text-white/70">{c.order_count || 0}x</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Total Belanja</p>
                                                <p className="text-xs font-bold text-orange-400">
                                                    {c.total_spent ? `Rp ${c.total_spent.toLocaleString("id-ID")}` : "—"}
                                                </p>
                                            </div>
                                        </div>
                                        {c.last_message ? (
                                            <div className="flex items-start gap-2 min-w-0">
                                                <p className="text-[10px] text-white/30 truncate flex-1">💬 {c.last_message}</p>
                                                <span className="text-[9px] text-white/20 flex-shrink-0">{timeAgo(c.last_message_at!)}</span>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-white/15">Belum ada percakapan</p>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-[#161616]/90 rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#111] border-b border-white/5">
                                    {["Pelanggan", "Nomor WA", "Pesanan", "Total Belanja", "Pesan Terakhir", ""].map(h => (
                                        <th key={h} className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-white/30">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c, i) => (
                                    <tr key={c.id} onClick={() => selectCustomer(c)}
                                        className={`border-b border-white/[0.04] cursor-pointer transition-colors ${selected?.id === c.id ? "bg-orange-500/5" : "hover:bg-white/[0.02]"}`}>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${COLORS[i % COLORS.length]} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
                                                    {c.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <p className="font-bold text-sm text-white/90">{c.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-mono text-white/40">{c.wa_number || "—"}</td>
                                        <td className="px-5 py-4 text-xs font-bold text-white/60">{c.order_count || 0}x</td>
                                        <td className="px-5 py-4 text-xs font-bold text-orange-400">
                                            {c.total_spent ? `Rp ${c.total_spent.toLocaleString("id-ID")}` : "—"}
                                        </td>
                                        <td className="px-5 py-4 max-w-[180px]">
                                            <p className="text-[11px] text-white/40 truncate">{c.last_message || "—"}</p>
                                            {c.last_message_at && <p className="text-[9px] text-white/20 mt-0.5">{timeAgo(c.last_message_at)}</p>}
                                        </td>
                                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => window.open(waLink(c.wa_number), "_blank")}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-400/60 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all">
                                                    <MessageSquare size={14} />
                                                </button>
                                                <button onClick={e => openEdit(c, e)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-white transition-all">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(c)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-white/20 hover:bg-rose-500/10 hover:text-rose-400 transition-all">
                                                    <Trash2 size={14} />
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

            {/* ── Detail Slide-over ─────────────────────────────────── */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }}
                        transition={{ type: "spring", stiffness: 320, damping: 32 }}
                        className="w-72 flex-shrink-0 hidden lg:block"
                    >
                        <div className="sticky top-6 bg-[#161616]/95 backdrop-blur-2xl rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="p-4 border-b border-white/5 flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${COLORS[filtered.findIndex(c => c.id === selected.id) % COLORS.length]} flex items-center justify-center text-base font-bold text-white flex-shrink-0`}>
                                    {selected.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white/90 text-sm truncate">{selected.name}</p>
                                    <p className="text-[10px] font-mono text-white/30 truncate">{selected.wa_number}</p>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors flex-shrink-0">
                                    <X size={15} />
                                </button>
                            </div>

                            <div className="overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar">
                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2 p-4 border-b border-white/5">
                                    <div className="bg-white/[0.03] rounded-xl p-3">
                                        <p className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-1">Pesanan</p>
                                        <p className="text-2xl font-black text-white/90">{selected.order_count || 0}</p>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-xl p-3">
                                        <p className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-1">Total</p>
                                        <p className="text-sm font-black text-orange-400 leading-tight">
                                            {selected.total_spent ? `Rp ${selected.total_spent.toLocaleString("id-ID")}` : "Rp 0"}
                                        </p>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 space-y-3 border-b border-white/5">
                                    <div className="flex items-start gap-2.5">
                                        <MapPin size={12} className="text-white/25 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Alamat</p>
                                            <p className="text-xs text-white/60 leading-relaxed">{selected.address || "—"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <Calendar size={12} className="text-white/25 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Terdaftar</p>
                                            <p className="text-xs text-white/60">{new Date(selected.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                                        </div>
                                    </div>
                                    {selected.last_message && (
                                        <div className="flex items-start gap-2.5">
                                            <MessageSquare size={12} className="text-white/25 mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                                                    Pesan Terakhir · <span className="text-orange-400">{timeAgo(selected.last_message_at!)}</span>
                                                </p>
                                                <p className="text-xs text-white/50 leading-relaxed line-clamp-2 mt-0.5">{selected.last_message}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Orders */}
                                <div className="p-4 border-b border-white/5">
                                    <p className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-3">Riwayat Pesanan</p>
                                    {isLoadingOrders ? (
                                        <div className="flex justify-center py-5"><Loader2 className="animate-spin text-orange-400 w-5 h-5" /></div>
                                    ) : selectedOrders.length === 0 ? (
                                        <p className="text-xs text-white/20 text-center py-4">Belum ada pesanan</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedOrders.map(o => {
                                                const st = STATUS_CFG[o.status] ?? STATUS_CFG.lunas;
                                                const StatusIcon = st.icon;
                                                return (
                                                    <div key={o.id} className="bg-white/[0.03] rounded-xl p-3 flex items-center justify-between gap-2">
                                                        <div>
                                                            <p className="text-xs font-bold text-white/80">Rp {o.total?.toLocaleString("id-ID")}</p>
                                                            <p className="text-[10px] text-white/30">{new Date(o.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                                                        </div>
                                                        <div className={`flex items-center gap-1 text-[10px] font-bold flex-shrink-0 ${st.color}`}>
                                                            <StatusIcon size={11} /> {st.label}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="p-4 space-y-2">
                                    <a href={waLink(selected.wa_number)} target="_blank" rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all">
                                        <MessageSquare size={13} /> Chat via WhatsApp
                                    </a>
                                    <button onClick={() => openEdit(selected)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 text-white/60 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-all">
                                        <Edit2 size={13} /> Edit Data
                                    </button>
                                    <button onClick={() => setDeleteTarget(selected)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500/5 border border-rose-500/10 text-rose-400/60 rounded-xl text-xs font-bold hover:bg-rose-500/10 hover:text-rose-400 transition-all">
                                        <Trash2 size={13} /> Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Add / Edit Modal ──────────────────────────────────── */}
            <AnimatePresence>
                {(showAddModal || editTarget) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => { setShowAddModal(false); setEditTarget(null); }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#161616] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-black text-lg text-white/90">{editTarget ? "Edit Pelanggan" : "Tambah Pelanggan"}</h2>
                                <button onClick={() => { setShowAddModal(false); setEditTarget(null); }}
                                    className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {([
                                    { label: "Nama Lengkap *", key: "name", placeholder: "Contoh: Budi Santoso" },
                                    { label: "Nomor WhatsApp *", key: "wa_number", placeholder: "Contoh: 6281234567890" },
                                    { label: "Alamat", key: "address", placeholder: "Jl. Contoh No. 1, Kota" },
                                ] as const).map(({ label, key, placeholder }) => (
                                    <div key={key}>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">{label}</label>
                                        <input
                                            value={form[key]}
                                            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/20 focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 outline-none transition-all" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button onClick={() => { setShowAddModal(false); setEditTarget(null); }}
                                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 font-bold text-sm hover:bg-white/10 transition-all">
                                    Batal
                                </button>
                                <button onClick={handleSave} disabled={isSaving || !form.name.trim() || !form.wa_number.trim()}
                                    className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                    {isSaving && <Loader2 size={15} className="animate-spin" />}
                                    {editTarget ? "Simpan" : "Tambah"}
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
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setDeleteTarget(null)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#161616] border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
                            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5">
                                <Trash2 size={26} className="text-rose-400" />
                            </div>
                            <h2 className="font-black text-lg text-white/90 mb-2">Hapus Pelanggan?</h2>
                            <p className="text-sm text-white/40 mb-8">
                                <span className="text-white/70 font-bold">{deleteTarget.name}</span> akan dihapus permanen.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 font-bold text-sm hover:bg-white/10 transition-all">
                                    Batal
                                </button>
                                <button onClick={handleDelete} disabled={isDeleting}
                                    className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                    {isDeleting && <Loader2 size={15} className="animate-spin" />}
                                    Hapus
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
