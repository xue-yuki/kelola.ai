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
    X,
    Filter,
    Columns,
    Plus,
    MoreHorizontal,
    Receipt
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const TABS = [
    { label: "All Orders", value: "all" },
    { label: "Menunggu", value: "menunggu" },
    { label: "Diproses", value: "diproses" },
    { label: "Dikirim", value: "dikirim" },
    { label: "Selesai", value: "lunas" },
    { label: "Dibatalkan", value: "dibatalkan" },
];

type Order = {
    id: string;
    customer_name: string;
    customer_address?: string;
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
            return { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", label: "Selesai", dot: "bg-emerald-500" };
        case "dikirim":
            return { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-600 dark:text-blue-400", label: "Dikirim", dot: "bg-blue-500" };
        case "diproses":
            return { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-600 dark:text-amber-400", label: "Diproses", dot: "bg-amber-500" };
        case "menunggu":
            return { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-600 dark:text-orange-400", label: "Menunggu", dot: "bg-orange-500" };
        case "dibatalkan":
            return { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-600 dark:text-rose-400", label: "Dibatalkan", dot: "bg-rose-500" };
        default:
            return { bg: "bg-zinc-500/10", border: "border-zinc-500/20", text: "text-zinc-600 dark:text-zinc-400", label: status, dot: "bg-zinc-500" };
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
        success: <CheckCircle2 size={16} className="text-emerald-500" />,
        error: <AlertCircle size={16} className="text-rose-500" />,
        loading: <Loader2 size={16} className="animate-spin text-orange-500" />,
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-lg px-4 py-3 min-w-[280px] max-w-sm"
        >
            {icons[toast.type]}
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 flex-1">{toast.message}</p>
            {toast.type !== "loading" && (
                <button onClick={() => onDismiss(toast.id)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
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
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">{title}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">{description}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`flex-1 py-2 rounded-md text-white font-medium text-xs transition-all disabled:opacity-70 flex items-center justify-center gap-2 ${confirmColor}`}
                            >
                                {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
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
    const [activeTab, setActiveTab] = useState("all");
    
    // Side Panel State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
    }, []); // Fetch all, we'll filter on client for tabs to make it snappy

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

            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .eq("business_id", business.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setOrders(data || []);
            
            // Update selected order if it was open
            if (selectedOrder && data) {
                const updated = data.find(o => o.id === selectedOrder.id);
                if (updated) setSelectedOrder(updated);
            }
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
        const loadingToastId = addToast("loading", `Mengupdate status...`);
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
                addToast("success", `Status pesanan berhasil diperbarui.`);
                await fetchOrders();
            } else {
                addToast("error", result.error || "Gagal update status pesanan");
            }
        } catch (err) {
            dismissToast(loadingToastId);
            addToast("error", "Terjadi kesalahan koneksi.");
        } finally {
            setActionLoading(null);
        }
    };

    const filteredOrders = orders
        .filter(o => activeTab === "all" || o.status === activeTab)
        .filter(o => o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()));

    // Metrics Calculation
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const ordersCompleted = orders.filter(o => o.status === 'lunas').length;
    const ordersCancelled = orders.filter(o => o.status === 'dibatalkan').length;

    const canProcess = (status: string) => status === "menunggu";
    const canShip = (status: string) => status === "diproses" || status === "menunggu";
    const canComplete = (status: string) => status === "dikirim";

    return (
        <div className="-m-8 bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 min-h-[calc(100vh-73px)] font-sans border-l-0 flex flex-col">
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
                title="Konfirmasi Status"
                description={`Apakah Anda yakin ingin mengubah status pesanan dari "${modal.orderName}"?`}
                confirmLabel="Ya, Lanjutkan"
                confirmColor="bg-orange-600 hover:bg-orange-700"
            />

            {/* Top Bar with Tabs and Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 pt-4 sticky top-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar w-full md:w-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`pb-4 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                                activeTab === tab.value 
                                ? "border-orange-500 text-orange-600 dark:text-orange-500" 
                                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3 pb-4 mt-4 md:mt-0 overflow-x-auto w-full md:w-auto shrink-0">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                        <Download size={14} /> Export
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                        <Filter size={14} /> Filters
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors shadow-sm shadow-orange-500/20 whitespace-nowrap">
                        <Plus size={14} /> New Order
                    </button>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col min-h-0 relative">
                
                {/* Metrics Row */}
                <div className="flex overflow-x-auto gap-4 pb-4 mb-2 custom-scrollbar shrink-0">
                    <div className="min-w-[200px] flex-1 p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hover:bg-zinc-50 dark:hover:bg-[#111] transition-colors">
                        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2">Total Orders (All)</p>
                        <div>
                            <h3 className="text-2xl font-mono tracking-tight font-medium text-zinc-900 dark:text-zinc-100">{totalOrders.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="min-w-[200px] flex-1 p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hover:bg-zinc-50 dark:hover:bg-[#111] transition-colors">
                        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2">Total Revenue (All)</p>
                        <div>
                            <h3 className="text-2xl font-mono tracking-tight font-medium text-zinc-900 dark:text-zinc-100">Rp {totalRevenue.toLocaleString("id-ID")}</h3>
                        </div>
                    </div>
                    <div className="min-w-[200px] flex-1 p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hover:bg-zinc-50 dark:hover:bg-[#111] transition-colors">
                        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2">Average Order Value</p>
                        <div>
                            <h3 className="text-2xl font-mono tracking-tight font-medium text-zinc-900 dark:text-zinc-100">Rp {avgOrderValue.toLocaleString("id-ID", {maximumFractionDigits:0})}</h3>
                        </div>
                    </div>
                    <div className="min-w-[200px] flex-1 p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hover:bg-zinc-50 dark:hover:bg-[#111] transition-colors">
                        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2">Orders Completed</p>
                        <div>
                            <h3 className="text-2xl font-mono tracking-tight font-medium text-zinc-900 dark:text-zinc-100">{ordersCompleted.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="min-w-[200px] flex-1 p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hover:bg-zinc-50 dark:hover:bg-[#111] transition-colors">
                        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2">Orders Cancelled</p>
                        <div>
                            <h3 className="text-2xl font-mono tracking-tight font-medium text-zinc-900 dark:text-zinc-100">{ordersCancelled.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                {/* Table Card */}
                <div className="border border-zinc-200 dark:border-zinc-800 flex flex-col flex-1 min-h-0 bg-white dark:bg-[#0a0a0a]">
                    {/* Table Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 gap-4 shrink-0">
                        <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">All Orders</h2>
                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Search orders..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 pr-4 py-1.5 text-xs bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors w-full sm:w-64 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500"
                                />
                            </div>
                            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                <Filter size={14} /> Filters
                            </button>
                            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                <Columns size={14} /> Columns
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead className="sticky top-0 bg-zinc-50 dark:bg-[#111] z-10 outline outline-1 outline-zinc-200 dark:outline-zinc-800">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pl-6">Order ID</th>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Channel</th>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Amount</th>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">Items</th>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="animate-spin w-6 h-6 text-orange-500" />
                                                <p className="text-xs text-zinc-500">Loading orders...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => {
                                        const cfg = getStatusConfig(order.status);
                                        let itemsArr = [];
                                        try {
                                            itemsArr = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                                        } catch(e) {}
                                        
                                        return (
                                            <tr 
                                                key={order.id} 
                                                onClick={() => setSelectedOrder(order)}
                                                className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-[#111] transition-colors cursor-pointer group"
                                            >
                                                <td className="px-4 py-3 pl-6 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                                                    ORD-{order.id.slice(0,6).toUpperCase()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{order.customer_name?.replace(/@lid|@s\.whatsapp\.net/g, "") || "Unknown"}</p>
                                                </td>
                                                <td className="px-4 py-3 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                                                    {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} {new Date(order.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                                                        {cfg.label}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 capitalize">
                                                    {order.channel}
                                                </td>
                                                <td className="px-4 py-3 text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 text-right">
                                                    Rp {order.total?.toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-4 py-3 text-xs font-mono text-zinc-600 dark:text-zinc-400 text-center">
                                                    {itemsArr.length}
                                                </td>
                                                <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                                                    <button className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                                        <MoreHorizontal size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-20 text-center text-xs text-zinc-500">
                                            No orders found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Footer */}
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Showing 1 to {filteredOrders.length} of {orders.length} results
                        </p>
                        <div className="flex items-center gap-2">
                            <select className="text-[11px] bg-transparent border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-zinc-700 dark:text-zinc-300 outline-none focus:border-orange-500">
                                <option>10 per page</option>
                                <option>50 per page</option>
                            </select>
                        </div>
                    </div>
                </div>

            </div>

            {/* Side Panel Overlay & Drawer */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: "100%", opacity: 0.5 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0.5 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-[450px] bg-white dark:bg-[#0a0a0a] border-l border-zinc-200 dark:border-zinc-800 z-50 shadow-2xl flex flex-col"
                        >
                            {/* Panel Header */}
                            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Order Details</h2>
                                <button onClick={() => setSelectedOrder(null)} className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Panel Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                
                                {/* Order ID Header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-mono font-medium text-zinc-900 dark:text-zinc-100">ORD-{selectedOrder.id.slice(0,6).toUpperCase()}</h3>
                                        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-1">
                                            {new Date(selectedOrder.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                    {(() => {
                                        const cfg = getStatusConfig(selectedOrder.status);
                                        return (
                                            <div className={`inline-flex items-center px-2.5 py-1 rounded border text-[10px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                                                {cfg.label}
                                            </div>
                                        )
                                    })()}
                                </div>

                                {/* Customer Card */}
                                <div>
                                    <h4 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Customer</h4>
                                    <div className="flex items-center gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                                        <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                                            {selectedOrder.customer_name?.charAt(0).toUpperCase() || "?"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedOrder.customer_name?.replace(/@lid|@s\.whatsapp\.net/g, "") || "Unknown"}</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{selectedOrder.customer_wa || "No contact info"}</p>
                                        </div>
                                        <button className="ml-auto text-[10px] font-semibold px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                            View profile
                                        </button>
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div>
                                    <h4 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Order Summary</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-zinc-500 dark:text-zinc-400">Subtotal</span>
                                            <span className="font-mono text-zinc-900 dark:text-zinc-100">Rp {selectedOrder.total?.toLocaleString("id-ID")}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-zinc-500 dark:text-zinc-400">Discount</span>
                                            <span className="font-mono text-rose-600 dark:text-rose-500">- Rp 0</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-zinc-500 dark:text-zinc-400">Tax</span>
                                            <span className="font-mono text-zinc-900 dark:text-zinc-100">Rp 0</span>
                                        </div>
                                        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between">
                                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Total</span>
                                            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 text-lg">Rp {selectedOrder.total?.toLocaleString("id-ID")}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Channel */}
                                <div>
                                    <h4 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Payment</h4>
                                    <div className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="px-2 py-1 rounded bg-[#111] text-[10px] font-bold text-white uppercase tracking-wider">
                                                {selectedOrder.channel}
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Channel Transaksi</p>
                                                <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">ID: pay_{selectedOrder.id.slice(0,8)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div>
                                    <h4 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Items</h4>
                                    <div className="space-y-4">
                                        {(() => {
                                            let itemsArr = [];
                                            try { itemsArr = typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : (selectedOrder.items || []); } catch(e) {}
                                            
                                            if (itemsArr.length === 0) return <p className="text-xs text-zinc-500 italic">No items details</p>;
                                            
                                            return itemsArr.map((item: any, idx: number) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="w-12 h-12 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                                                        <ShoppingBag size={16} className="text-zinc-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
                                                        <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-1">Qty: {item.qty}</p>
                                                    </div>
                                                    <div className="text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 text-right shrink-0">
                                                        Rp {(item.price || 0).toLocaleString("id-ID")}
                                                    </div>
                                                </div>
                                            ))
                                        })()}
                                    </div>
                                    
                                    <button className="w-full mt-6 py-2 flex items-center justify-center gap-2 text-xs font-medium border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                        <Receipt size={14} /> View invoice
                                    </button>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111] grid grid-cols-2 gap-3 shrink-0">
                                {canProcess(selectedOrder.status) && (
                                    <button 
                                        onClick={() => openModal(selectedOrder.id, selectedOrder.customer_name, "diproses")}
                                        className="col-span-2 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                                    >
                                        Proses Pesanan
                                    </button>
                                )}
                                {canShip(selectedOrder.status) && (
                                    <button 
                                        onClick={() => openModal(selectedOrder.id, selectedOrder.customer_name, "dikirim")}
                                        className="col-span-2 py-2 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Kirim Pesanan
                                    </button>
                                )}
                                {canComplete(selectedOrder.status) && (
                                    <button 
                                        onClick={() => openModal(selectedOrder.id, selectedOrder.customer_name, "lunas")}
                                        className="col-span-2 py-2 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
                                    >
                                        Tandai Selesai
                                    </button>
                                )}
                                
                                {(!canProcess(selectedOrder.status) && !canShip(selectedOrder.status) && !canComplete(selectedOrder.status)) && (
                                    <p className="col-span-2 text-center text-[10px] text-zinc-500 italic py-2">
                                        Tidak ada aksi tersedia untuk pesanan ini.
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
