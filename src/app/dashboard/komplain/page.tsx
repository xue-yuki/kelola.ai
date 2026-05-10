"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    MessageCircle,
    Plus,
    Filter,
    Loader2,
    X,
    ChevronRight,
    User,
    Phone,
    Tag,
    FileText,
    Calendar,
    ShoppingBag,
    RefreshCw,
    Send,
    AlertTriangle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
    "Pesanan tidak sampai",
    "Produk rusak / tidak sesuai",
    "Salah item / kuantitas",
    "Masalah pembayaran",
    "Pelayanan kurang baik",
    "Lainnya",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
    baru:                { label: "Baru",              color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20",    icon: AlertCircle },
    diproses:            { label: "Diproses",          color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: RefreshCw },
    menunggu_pelanggan:  { label: "Tunggu Pelanggan",  color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    icon: Clock },
    selesai:             { label: "Selesai",           color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 },
    ditolak:             { label: "Ditolak",           color: "text-white/30",    bg: "bg-white/5",        border: "border-white/10",       icon: XCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    low:    { label: "Rendah",  color: "text-white/40" },
    normal: { label: "Normal",  color: "text-blue-400" },
    high:   { label: "Tinggi",  color: "text-rose-400" },
};

type Complaint = {
    id: string;
    order_id?: string;
    customer_name: string;
    customer_wa?: string;
    category: string;
    description: string;
    status: string;
    priority: string;
    source: string;
    resolution?: string;
    created_at: string;
    updated_at: string;
    resolved_at?: string;
};

type NewComplaint = {
    customer_name: string;
    customer_wa: string;
    category: string;
    description: string;
    priority: string;
};

const EMPTY_NEW: NewComplaint = {
    customer_name: "",
    customer_wa: "",
    category: CATEGORIES[0],
    description: "",
    priority: "normal",
};

function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} mnt lalu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} jam lalu`;
    return `${Math.floor(hrs / 24)} hari lalu`;
}

export default function KomplainPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [businessId, setBusinessId] = useState<string>("");

    // Filters
    const [filterStatus, setFilterStatus] = useState("semua");
    const [filterKategori, setFilterKategori] = useState("semua");

    // Detail slide-over
    const [selected, setSelected] = useState<Complaint | null>(null);
    const [resolution, setResolution] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Add modal
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newComplaint, setNewComplaint] = useState<NewComplaint>(EMPTY_NEW);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: business } = await supabase
                .from("businesses")
                .select("id")
                .eq("user_id", session.user.id)
                .single();
            if (!business) return;

            setBusinessId(business.id);

            const { data } = await supabase
                .from("complaints")
                .select("*")
                .eq("business_id", business.id)
                .order("created_at", { ascending: false });

            setComplaints(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredComplaints = complaints.filter(c => {
        if (filterStatus !== "semua" && c.status !== filterStatus) return false;
        if (filterKategori !== "semua" && c.category !== filterKategori) return false;
        return true;
    });

    const stats = {
        total:    complaints.length,
        baru:     complaints.filter(c => c.status === "baru").length,
        diproses: complaints.filter(c => c.status === "diproses" || c.status === "menunggu_pelanggan").length,
        selesai:  complaints.filter(c => c.status === "selesai").length,
    };

    const openDetail = (c: Complaint) => {
        setSelected(c);
        setResolution(c.resolution || "");
    };

    const updateStatus = async (newStatus: string) => {
        if (!selected) return;
        setIsSaving(true);
        try {
            const patch: any = {
                status: newStatus,
                resolution,
                updated_at: new Date().toISOString(),
            };
            if (newStatus === "selesai" || newStatus === "ditolak") {
                patch.resolved_at = new Date().toISOString();
            }
            await supabase.from("complaints").update(patch).eq("id", selected.id);
            const updated = { ...selected, ...patch };
            setComplaints(prev => prev.map(c => c.id === selected.id ? updated : c));
            setSelected(updated);
        } finally {
            setIsSaving(false);
        }
    };

    const submitComplaint = async () => {
        if (!newComplaint.customer_name || !newComplaint.description) return;
        setIsSubmitting(true);
        try {
            const { data } = await supabase
                .from("complaints")
                .insert({
                    business_id: businessId,
                    customer_name: newComplaint.customer_name,
                    customer_wa: newComplaint.customer_wa || null,
                    category: newComplaint.category,
                    description: newComplaint.description,
                    priority: newComplaint.priority,
                    status: "baru",
                    source: "manual",
                })
                .select()
                .single();
            if (data) setComplaints(prev => [data, ...prev]);
            setIsAddOpen(false);
            setNewComplaint(EMPTY_NEW);
        } finally {
            setIsSubmitting(false);
        }
    };

    const waLink = (wa: string, name: string) => {
        const msg = encodeURIComponent(`Halo ${name}, kami ingin menindaklanjuti komplain Anda. `);
        let num = wa.replace(/\D/g, "");
        if (num.startsWith("0")) num = "62" + num.slice(1);
        else if (!num.startsWith("62")) num = "62" + num;
        return `https://wa.me/${num}?text=${msg}`;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white/90 tracking-tight leading-none mb-2">Komplain</h1>
                    <p className="text-white/40 text-sm font-medium">Kelola dan tangani keluhan pelanggan dengan cepat.</p>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-500/20"
                >
                    <Plus size={16} /> Tambah Komplain
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Komplain", value: stats.total,    color: "text-white/90",    icon: FileText,      bg: "bg-white/5    border-white/5" },
                    { label: "Belum Ditangani", value: stats.baru,     color: "text-rose-400",    icon: AlertCircle,   bg: "bg-rose-500/10 border-rose-500/20" },
                    { label: "Sedang Diproses", value: stats.diproses, color: "text-amber-400",   icon: RefreshCw,     bg: "bg-amber-500/10 border-amber-500/20" },
                    { label: "Selesai",          value: stats.selesai,  color: "text-emerald-400", icon: CheckCircle2,  bg: "bg-emerald-500/10 border-emerald-500/20" },
                ].map(s => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className={`p-5 rounded-2xl border ${s.bg} bg-[#161616]/90 backdrop-blur-xl`}>
                            <Icon size={18} className={`${s.color} mb-3`} />
                            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                            <p className="text-xs font-bold text-white/40 mt-0.5">{s.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <Filter size={14} className="text-white/30" />
                <div className="flex gap-1.5 p-1.5 bg-[#161616]/90 rounded-xl border border-white/5">
                    {["semua", "baru", "diproses", "menunggu_pelanggan", "selesai", "ditolak"].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === s ? "bg-orange-500 text-white shadow-sm" : "text-white/40 hover:text-white/80"}`}
                        >
                            {s === "semua" ? "Semua" : STATUS_CONFIG[s]?.label ?? s}
                        </button>
                    ))}
                </div>
                <select
                    value={filterKategori}
                    onChange={e => setFilterKategori(e.target.value)}
                    className="px-3 py-2 bg-[#161616]/90 border border-white/5 rounded-xl text-xs font-bold text-white/60 outline-none"
                >
                    <option value="semua">Semua Kategori</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="animate-spin text-orange-400 w-10 h-10" />
                </div>
            ) : filteredComplaints.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-white/30">
                    <AlertCircle size={40} />
                    <p className="font-bold text-sm">Tidak ada komplain ditemukan</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredComplaints.map(c => {
                        const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.baru;
                        const StatusIcon = st.icon;
                        const pr = PRIORITY_CONFIG[c.priority] ?? PRIORITY_CONFIG.normal;
                        const isUrgent = c.status === "baru" && (Date.now() - new Date(c.created_at).getTime()) > 86400000;

                        return (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => openDetail(c)}
                                className={`flex items-center gap-4 p-5 bg-[#161616]/90 backdrop-blur-xl rounded-2xl border cursor-pointer transition-all hover:border-white/10 group ${isUrgent ? "border-rose-500/30" : "border-white/5"}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${st.bg} border ${st.border}`}>
                                    <StatusIcon size={18} className={st.color} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <p className="text-sm font-bold text-white/90 group-hover:text-orange-400 transition-colors">{c.customer_name}</p>
                                        {isUrgent && (
                                            <span className="flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md">
                                                <AlertTriangle size={9} /> &gt;24 jam
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-white/50 truncate">{c.category} · {c.description}</p>
                                </div>

                                <div className="hidden sm:flex flex-col items-end gap-1.5 flex-shrink-0">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${st.bg} ${st.border} ${st.color}`}>
                                        {st.label}
                                    </span>
                                    <span className={`text-[10px] font-bold ${pr.color}`}>{pr.label}</span>
                                </div>

                                <div className="text-right flex-shrink-0 hidden md:block">
                                    <p className="text-[10px] text-white/30 font-medium">{timeAgo(c.created_at)}</p>
                                </div>

                                <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors flex-shrink-0" />
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Detail Slide-over */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelected(null)}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-[#111] border-l border-white/10 flex flex-col shadow-2xl"
                        >
                            {/* Slide-over Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <div>
                                    <h2 className="font-bold text-white/90 text-lg">Detail Komplain</h2>
                                    <p className="text-xs text-white/40 font-medium mt-0.5">{new Date(selected.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Slide-over Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                {/* Customer Info */}
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                            <User size={14} className="text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white/90">{selected.customer_name}</p>
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Pelanggan</p>
                                        </div>
                                    </div>
                                    {selected.customer_wa && (
                                        <div className="flex items-center gap-2 text-xs text-white/50">
                                            <Phone size={12} /> {selected.customer_wa}
                                        </div>
                                    )}
                                </div>

                                {/* Category & Status & Priority */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Tag size={9} /> Kategori</p>
                                        <p className="text-xs font-bold text-white/80">{selected.category}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 flex items-center gap-1"><AlertCircle size={9} /> Prioritas</p>
                                        <p className={`text-xs font-bold ${PRIORITY_CONFIG[selected.priority]?.color}`}>
                                            {PRIORITY_CONFIG[selected.priority]?.label}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                {(() => {
                                    const st = STATUS_CONFIG[selected.status] ?? STATUS_CONFIG.baru;
                                    const StatusIcon = st.icon;
                                    return (
                                        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${st.bg} ${st.border}`}>
                                            <StatusIcon size={16} className={st.color} />
                                            <span className={`text-sm font-bold ${st.color}`}>Status: {st.label}</span>
                                        </div>
                                    );
                                })()}

                                {/* Source */}
                                <div className="flex items-center gap-2 text-xs text-white/30 font-medium">
                                    <Calendar size={12} />
                                    Masuk via {selected.source === "whatsapp" ? "WhatsApp" : selected.source === "telegram" ? "Telegram" : "Input Manual"}
                                </div>

                                {/* Description */}
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1"><FileText size={9} /> Deskripsi Keluhan</p>
                                    <p className="text-sm text-white/70 leading-relaxed">{selected.description}</p>
                                </div>

                                {/* Resolution Notes */}
                                <div>
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 block">Catatan Resolusi</label>
                                    <textarea
                                        value={resolution}
                                        onChange={e => setResolution(e.target.value)}
                                        placeholder="Tulis catatan penanganan atau solusi yang diberikan..."
                                        rows={4}
                                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-orange-500/40 transition-colors resize-none"
                                    />
                                </div>

                                {/* Status Actions */}
                                <div>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Ubah Status</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(STATUS_CONFIG).filter(([k]) => k !== selected.status).map(([key, cfg]) => {
                                            const Icon = cfg.icon;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => updateStatus(key)}
                                                    disabled={isSaving}
                                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all hover:brightness-110 ${cfg.bg} ${cfg.border} ${cfg.color}`}
                                                >
                                                    <Icon size={13} /> {cfg.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Slide-over Footer */}
                            <div className="p-6 border-t border-white/5 flex gap-3">
                                {selected.customer_wa && (
                                    <a
                                        href={waLink(selected.customer_wa, selected.customer_name)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-xl font-bold text-sm transition-all"
                                    >
                                        <MessageCircle size={15} /> Balas via WA
                                    </a>
                                )}
                                <button
                                    onClick={() => updateStatus(selected.status)}
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                    Simpan Catatan
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Add Complaint Modal */}
            <AnimatePresence>
                {isAddOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddOpen(false)}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                                <div className="flex items-center justify-between p-6 border-b border-white/5">
                                    <h2 className="font-bold text-white/90 text-lg">Tambah Komplain</h2>
                                    <button onClick={() => setIsAddOpen(false)} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Nama Pelanggan *</label>
                                        <input
                                            value={newComplaint.customer_name}
                                            onChange={e => setNewComplaint(p => ({ ...p, customer_name: e.target.value }))}
                                            placeholder="Nama pelanggan"
                                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-orange-500/40 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">No. WhatsApp</label>
                                        <input
                                            value={newComplaint.customer_wa}
                                            onChange={e => setNewComplaint(p => ({ ...p, customer_wa: e.target.value }))}
                                            placeholder="08xxxxxxx (opsional)"
                                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-orange-500/40 transition-colors"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Kategori *</label>
                                            <select
                                                value={newComplaint.category}
                                                onChange={e => setNewComplaint(p => ({ ...p, category: e.target.value }))}
                                                className="w-full px-3 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white/80 outline-none focus:border-orange-500/40 transition-colors"
                                            >
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Prioritas</label>
                                            <select
                                                value={newComplaint.priority}
                                                onChange={e => setNewComplaint(p => ({ ...p, priority: e.target.value }))}
                                                className="w-full px-3 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white/80 outline-none focus:border-orange-500/40 transition-colors"
                                            >
                                                <option value="low">Rendah</option>
                                                <option value="normal">Normal</option>
                                                <option value="high">Tinggi</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Deskripsi Keluhan *</label>
                                        <textarea
                                            value={newComplaint.description}
                                            onChange={e => setNewComplaint(p => ({ ...p, description: e.target.value }))}
                                            placeholder="Ceritakan masalah yang dialami pelanggan..."
                                            rows={4}
                                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-orange-500/40 transition-colors resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="px-6 pb-6 flex gap-3">
                                    <button
                                        onClick={() => setIsAddOpen(false)}
                                        className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 font-bold text-sm transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={submitComplaint}
                                        disabled={isSubmitting || !newComplaint.customer_name || !newComplaint.description}
                                        className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                                        Simpan
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
