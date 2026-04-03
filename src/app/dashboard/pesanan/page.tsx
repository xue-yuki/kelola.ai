"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Calendar,
    MessageCircle,
    Globe,
    Zap,
    Download,
    Loader2,
    ShoppingBag,
    ChevronRight,
    Truck,
    Settings2,
    CheckCircle2,
    XCircle,
    Clock,
    PackageCheck,
    AlertCircle,
    X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STATUS_OPTIONS = [
    { label: "Semua Status", value: "all" },
    { label: "Menunggu", value: "menunggu" },
    { label: "Diproses", value: "diproses" },
    { label: "Dikirim", value: "dikirim" },
    { label: "Lunas", value: "lunas" },
    { label: "Dibatalkan", value: "dibatalkan" },
];

const CHANNEL_OPTIONS = [
    { label: "Semua Saluran", value: "all" },
    { label: "WhatsApp", value: "whatsapp" },
    { label: "Telegram", value: "telegram" },
    { label: "Offline", value: "offline" },
];

type Order = {
    id: string;
    customer_name: string;
    customer_wa?: string;
    channel: string;
    created_at: string;
    total: number;
    status: string;
    items?: any;
};

type Toast = {
    id: string;
    type: "success" | "error" | "loading";
    message: string;
};

function getStatusConfig(status: string) {
    switch (status?.toLowerCase()) {
        case "lunas":
            return { bg: "bg-emerald-500", text: "text-white", label: "Lunas", icon: CheckCircle2, dot: "bg-emerald-400" };
        case "dikirim":
            return { bg: "bg-blue-500", text: "text-white", label: "Dikirim", icon: Truck, dot: "bg-blue-400" };
        case "diproses":
            return { bg: "bg-amber-500", text: "text-white", label: "Diproses", icon: Settings2, dot: "bg-amber-400" };
        case "menunggu":
            return { bg: "bg-orange-500", text: "text-white", label: "Menunggu", icon: Clock, dot: "bg-orange-400" };
        case "dibatalkan":
            return { bg: "bg-rose-500", text: "text-white", label: "Dibatalkan", icon: XCircle, dot: "bg-rose-400" };
        default:
            return { bg: "bg-slate-400", text: "text-white", label: status, icon: Clock, dot: "bg-slate-300" };
    }
}

// Toast notification component
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    useEffect(() => {
        if (toast.type !== "loading") {
            const t = setTimeout(() => onDismiss(toast.id), 3500);
            return () => clearTimeout(t);
        }
    }, [toast]);

    const icons = {
        success: <CheckCircle2 size={18} className="text-emerald-500" />,
        error: <AlertCircle size={18} className="text-rose-500" />,
        loading: <Loader2 size={18} className="animate-spin text-orange-500" />,
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className="flex items-center gap-3 bg-white border border-slate-100 shadow-xl rounded-2xl px-5 py-3.5 min-w-[280px] max-w-sm"
        >
            {icons[toast.type]}
            <p className="text-sm font-bold text-slate-800 flex-1">{toast.message}</p>
            {toast.type !== "loading" && (
                <button onClick={() => onDismiss(toast.id)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={14} />
                </button>
            )}
        </motion.div>
    );
}

// Confirm Modal
function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel,
    confirmColor,
    isLoading,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel: string;
    confirmColor: string;
    isLoading: boolean;
}) {
    if (!isOpen) return null;
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
                        <p className="text-sm text-slate-500 font-medium mb-7">{description}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-70 flex items-center justify-center gap-2 ${confirmColor}`}
                            >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                {isLoading ? "Memproses..." : confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function PesananPage() {
    const supabase = createClient();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [channelFilter, setChannelFilter] = useState("all");

    // Action states
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [modal, setModal] = useState<{
        isOpen: boolean;
        orderId: string;
        orderName: string;
        action: "diproses" | "dikirim" | "lunas" | null;
    }>({ isOpen: false, orderId: "", orderName: "", action: null });

    useEffect(() => {
        fetchOrders();

        const subscription = supabase
            .channel("orders_updates")
            .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [statusFilter, channelFilter]);

    const addToast = (type: Toast["type"], message: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, message }]);
        return id;
    };

    const dismissToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) return;

            const { data: business } = await supabase
                .from("businesses")
                .select("id")
                .eq("user_id", session.user.id)
                .single();

            if (!business) return;

            let query = supabase
                .from("orders")
                .select("*")
                .eq("business_id", business.id)
                .order("created_at", { ascending: false });

            if (statusFilter !== "all") {
                query = query.eq("status", statusFilter);
            }
            if (channelFilter !== "all") {
                query = query.eq("channel", channelFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (orderId: string, orderName: string, action: "diproses" | "dikirim" | "lunas") => {
        setModal({ isOpen: true, orderId, orderName, action });
    };

    const closeModal = () => {
        setModal({ isOpen: false, orderId: "", orderName: "", action: null });
    };

    const handleUpdateStatus = async () => {
        if (!modal.orderId || !modal.action) return;

        setActionLoading(modal.orderId);
        const loadingToastId = addToast("loading", `Mengupdate status ke "${modal.action}"...`);
        closeModal();

        try {
            const response = await fetch("/api/orders/update-status", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: modal.orderId,
                    newStatus: modal.action,
                }),
            });

            const result = await response.json();
            dismissToast(loadingToastId);

            if (response.ok) {
                const labels: Record<string, string> = {
                    diproses: "sedang diproses 🍳",
                    dikirim: "sudah dikirim 🚀",
                    lunas: "selesai / lunas ✅",
                };
                addToast("success", `Pesanan berhasil ditandai "${labels[modal.action!] || modal.action}"`);
                await fetchOrders();
            } else {
                addToast("error", result.error || "Gagal update status pesanan");
            }
        } catch (err) {
            dismissToast(loadingToastId);
            addToast("error", "Terjadi kesalahan koneksi. Coba lagi ya!");
        } finally {
            setActionLoading(null);
        }
    };

    const filteredOrders = orders.filter((order) =>
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const canProcess = (status: string) => status === "menunggu";
    const canShip = (status: string) => status === "diproses" || status === "menunggu";
    const canComplete = (status: string) => status === "dikirim";
    const isTerminal = (status: string) => status === "lunas" || status === "dibatalkan";

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Toast Notifications */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
                    ))}
                </AnimatePresence>
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                onConfirm={handleUpdateStatus}
                isLoading={!!actionLoading}
                title={
                    modal.action === "diproses" ? "🍳 Tandai Pesanan Diproses?" :
                    modal.action === "dikirim" ? "🚀 Kirim Pesanan Ini?" :
                    "✅ Tandai Pesanan Selesai?"
                }
                description={
                    modal.action === "diproses"
                        ? `Pesanan dari "${modal.orderName}" akan ditandai sedang diproses.`
                        : modal.action === "dikirim"
                        ? `Pesanan dari "${modal.orderName}" akan ditandai sudah dikirim ke customer. 📦`
                        : `Pesanan dari "${modal.orderName}" akan ditandai selesai / lunas. Tindakan ini tidak bisa dibatalkan.`
                }
                confirmLabel={
                    modal.action === "diproses" ? "Ya, Proses Sekarang" :
                    modal.action === "dikirim" ? "Ya, Kirim Sekarang" :
                    "Ya, Tandai Selesai"
                }
                confirmColor={
                    modal.action === "diproses" ? "bg-amber-500 hover:bg-amber-600" :
                    modal.action === "dikirim" ? "bg-blue-600 hover:bg-blue-700" :
                    "bg-emerald-600 hover:bg-emerald-700"
                }
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-bold text-[#1A1A2E] tracking-tight mb-2">Manajemen Pesanan</h1>
                    <p className="text-sm font-medium text-[#6B7280]">
                        Pantau dan kelola semua transaksi bisnismu di sini.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Legend */}
                    <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        {[
                            { label: "Proses", color: "bg-amber-500" },
                            { label: "Kirim", color: "bg-blue-500" },
                            { label: "Selesai", color: "bg-emerald-500" },
                        ].map((s) => (
                            <div key={s.label} className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
                            </div>
                        ))}
                    </div>
                    <button className="flex items-center justify-center gap-2 bg-white border border-[#F0EEE9] px-6 py-2.5 rounded-full text-[#1A1A2E] font-bold hover:bg-[#FAFAF8] transition-all shadow-sm">
                        <Download size={18} />
                        Export Laporan
                    </button>
                </div>
            </div>

            {/* Pill Filters Bar */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Search bar */}
                    <div className="flex-1 relative group">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF6B2B] transition-colors"
                            size={20}
                        />
                        <input
                            type="text"
                            placeholder="Cari nama pelanggan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-[#F0EEE9] rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium focus:ring-4 focus:ring-[#FF6B2B]/5 focus:border-[#FF6B2B]/20 transition-all outline-none"
                        />
                    </div>

                    {/* Channel Pill Filter */}
                    <div className="flex flex-wrap items-center gap-2 p-1 bg-white border border-[#F0EEE9] rounded-2xl w-fit">
                        {CHANNEL_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setChannelFilter(opt.value)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                    channelFilter === opt.value
                                        ? "bg-[#1A1A2E] text-white shadow-md"
                                        : "text-[#94A3B8] hover:text-[#1A1A2E] hover:bg-[#FAFAF8]"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status Pill Filter */}
                <div className="flex flex-wrap items-center gap-2 p-1 bg-[#FAFAF8] rounded-2xl border border-[#F0EEE9] w-fit">
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setStatusFilter(opt.value)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                statusFilter === opt.value
                                    ? "bg-[#FF6B2B] text-white shadow-lg shadow-[#FF6B2B]/20"
                                    : "text-[#6B7280] hover:text-[#1A1A2E] hover:bg-white"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-[#F0EEE9] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#FAFAF8] border-b border-[#F0EEE9]">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Pelanggan</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Saluran</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Detail Pesanan</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Waktu Transaksi</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8] text-right">Total Tagihan</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8] text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#94A3B8] text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="animate-spin w-10 h-10 text-[#FF6B2B]" />
                                                <p className="text-sm font-bold text-[#6B7280]">Sinkronisasi data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredOrders.length > 0 ? (
                                    filteredOrders.map((order, idx) => {
                                        const statusCfg = getStatusConfig(order.status);
                                        const StatusIcon = statusCfg.icon;
                                        const isProcessing = actionLoading === order.id;

                                        return (
                                            <motion.tr
                                                key={order.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                className="border-b border-[#F0EEE9] hover:bg-[#FFF8F5] transition-colors group"
                                            >
                                                {/* Customer */}
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-full bg-[#FAFAF8] border border-[#F0EEE9] flex items-center justify-center text-xs font-black text-[#1A1A2E] group-hover:bg-white group-hover:text-[#FF6B2B] group-hover:border-[#FF6B2B]/20 transition-all">
                                                            {order.customer_name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[#1A1A2E] text-sm tracking-tight mb-1">{order.customer_name}</p>
                                                            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-tighter">
                                                                ID: #{order.id.slice(0, 8)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Channel */}
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        {order.channel === "whatsapp" ? (
                                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                                                                <MessageCircle size={12} /> WhatsApp
                                                            </span>
                                                        ) : order.channel === "telegram" ? (
                                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                                                                <Zap size={12} /> Telegram
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                                                                <Globe size={12} /> Offline
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Detail Pesanan */}
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1 max-w-[200px]">
                                                        {(() => {
                                                            let items = order.items;
                                                            if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = null; } }
                                                            if (!Array.isArray(items) || items.length === 0) {
                                                                return <p className="text-[11px] text-slate-400 italic">Tidak ada detail</p>;
                                                            }
                                                            return items.slice(0, 3).map((item: any, i: number) => (
                                                                <div key={i} className="flex items-center justify-between gap-2">
                                                                    <span className="text-[11px] font-semibold text-[#1A1A2E] truncate max-w-[130px]">{item.name}</span>
                                                                    <span className="text-[10px] font-black text-white bg-[#FF6B2B] rounded-full px-2 py-0.5 shrink-0">x{item.qty}</span>
                                                                </div>
                                                            ));
                                                        })()}
                                                        {(() => {
                                                            let items = order.items;
                                                            if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = null; } }
                                                            if (Array.isArray(items) && items.length > 3) {
                                                                return <p className="text-[10px] text-slate-400 font-bold">+{items.length - 3} item lainnya</p>;
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                </td>

                                                {/* Date */}
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 text-[#6B7280] font-bold text-[11px] uppercase tracking-tight">
                                                        <Calendar size={14} className="text-[#94A3B8]" />
                                                        {new Date(order.created_at).toLocaleDateString("id-ID", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                        <span className="text-slate-300">•</span>
                                                        {new Date(order.created_at).toLocaleTimeString("id-ID", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </div>
                                                </td>

                                                {/* Total */}
                                                <td className="px-6 py-5 text-right font-black text-[#1A1A2E] text-sm">
                                                    Rp {order.total?.toLocaleString("id-ID")}
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-5 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${statusCfg.bg} ${statusCfg.text}`}
                                                    >
                                                        <StatusIcon size={11} />
                                                        {statusCfg.label}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {isProcessing ? (
                                                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100">
                                                                <Loader2 size={14} className="animate-spin text-slate-400" />
                                                                <span className="text-xs font-bold text-slate-400">Memproses...</span>
                                                            </div>
                                                        ) : isTerminal(order.status) ? (
                                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
                                                                <PackageCheck size={14} />
                                                                {order.status === "lunas" ? "Selesai" : "Dibatalkan"}
                                                            </span>
                                                        ) : (
                                                            <>
                                                                {/* Tombol Proses */}
                                                                {canProcess(order.status) && (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.97 }}
                                                                        onClick={() => openModal(order.id, order.customer_name, "diproses")}
                                                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 text-[11px] font-black uppercase tracking-wider hover:bg-amber-100 transition-all border border-amber-100 hover:border-amber-200 shadow-sm"
                                                                    >
                                                                        <Settings2 size={13} />
                                                                        Proses
                                                                    </motion.button>
                                                                )}

                                                                {/* Tombol Kirim */}
                                                                {canShip(order.status) && (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.97 }}
                                                                        onClick={() => openModal(order.id, order.customer_name, "dikirim")}
                                                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20"
                                                                    >
                                                                        <Truck size={13} />
                                                                        Kirim
                                                                        <ChevronRight size={11} />
                                                                    </motion.button>
                                                                )}
                                                                {/* Tombol Selesai - hanya untuk status dikirim */}
                                                                {canComplete(order.status) && (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.97 }}
                                                                        onClick={() => openModal(order.id, order.customer_name, "lunas")}
                                                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-500/20"
                                                                    >
                                                                        <CheckCircle2 size={13} />
                                                                        Selesai
                                                                    </motion.button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-40 text-center">
                                            <div className="flex flex-col items-center gap-5">
                                                <div className="w-20 h-20 rounded-full bg-[#FAFAF8] border border-[#F0EEE9] flex items-center justify-center text-slate-200">
                                                    <ShoppingBag size={40} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-lg font-bold text-[#1A1A2E] tracking-tight text-center">
                                                        Tidak ada pesanan ditemukan
                                                    </p>
                                                    <p className="text-sm font-medium text-[#6B7280] text-center">
                                                        Coba ubah filter atau kata kunci pencarian Anda.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setStatusFilter("all");
                                                        setChannelFilter("all");
                                                        setSearchTerm("");
                                                    }}
                                                    className="mt-2 px-6 py-2.5 rounded-full bg-[#1A1A2E] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#FF6B2B] transition-all"
                                                >
                                                    Reset Filter
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
