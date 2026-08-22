"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Copy, ThumbsUp, ThumbsDown, Info, Shield, History, Plus, Trash2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { createClient } from "@/lib/supabase/client";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type PresetKey = "top-products" | "week-summary" | "top-customers";

type ApiData =
    | { type: "top-products"; title: string; items: { name: string; qty: number; changePct: number }[] }
    | { type: "week-summary"; title: string; daily: { name: string; total: number; orders: number }[]; totals: { revenue: number; orders: number; avg: number; changePct: number } }
    | { type: "top-customers"; title: string; items: { name: string; total_orders: number; last_order_at?: string }[] }
    | { type: "dynamic"; chart_type: "bar" | "line" | "donut"; title: string; points: { name: string; value: number; extra?: number }[]; total: number; period_label: string }
    | null;

type Message = {
    id: string;
    role: "user" | "ai";
    text: string;
    data?: ApiData;
    loading?: boolean;
    error?: string;
    createdAt: string;
};

const PRESETS: { key: PresetKey; label: string; question: string }[] = [
    { key: "top-products", label: "Produk paling laku", question: "Produk apa yang paling laku bulan ini?" },
    { key: "week-summary", label: "Ringkas penjualan", question: "Ringkas penjualan minggu ini." },
    { key: "top-customers", label: "Pelanggan aktif", question: "Siapa pelanggan paling aktif?" },
];

// ─────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────

export default function TanyaKelolaPage() {
    const supabase = createClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // ─── History state ──────────────────────────────────────
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [history, setHistory] = useState<{ id: string; title: string; updated_at: string }[]>([]);
    const [historyOpen, setHistoryOpen] = useState(false);
    const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load business id + history awal
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: biz } = await supabase.from("businesses").select("id").eq("user_id", user.id).single();
            if (!biz) return;
            setBusinessId(biz.id);
            await refreshHistory(biz.id);
            // Purge chat lama > 24 jam (client-side call, aman via RLS)
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            await supabase.from("chat_sessions").delete().eq("business_id", biz.id).lt("updated_at", dayAgo);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function refreshHistory(bizId: string) {
        const { data } = await supabase
            .from("chat_sessions")
            .select("id, title, updated_at")
            .eq("business_id", bizId)
            .order("updated_at", { ascending: false })
            .limit(3);
        setHistory(data || []);
    }

    // Auto-save (debounced) tiap kali messages berubah
    useEffect(() => {
        if (!businessId || messages.length === 0) return;
        if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = setTimeout(async () => {
            const title = (messages.find((m) => m.role === "user")?.text || "Chat baru").slice(0, 60);
            if (currentSessionId) {
                await supabase.from("chat_sessions").update({ messages, title }).eq("id", currentSessionId);
            } else {
                // enforce max 3: kalau udah 3, hapus yang paling lama sebelum insert
                const { data: all } = await supabase.from("chat_sessions").select("id").eq("business_id", businessId).order("updated_at", { ascending: false });
                if (all && all.length >= 3) {
                    const toDelete = all.slice(2).map((r) => r.id);
                    if (toDelete.length) await supabase.from("chat_sessions").delete().in("id", toDelete);
                }
                const { data: created } = await supabase.from("chat_sessions").insert({ business_id: businessId, title, messages }).select("id").single();
                if (created) setCurrentSessionId(created.id);
            }
            await refreshHistory(businessId);
        }, 800);
        return () => { if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, businessId]);

    async function loadSession(sessionId: string) {
        const { data } = await supabase.from("chat_sessions").select("id, messages").eq("id", sessionId).single();
        if (data) {
            setCurrentSessionId(data.id);
            setMessages((data.messages as Message[]) || []);
            setHistoryOpen(false);
        }
    }

    function newChat() {
        setMessages([]);
        setCurrentSessionId(null);
        setInput("");
        setHistoryOpen(false);
    }

    async function deleteSession(sessionId: string, e: React.MouseEvent) {
        e.stopPropagation();
        await supabase.from("chat_sessions").delete().eq("id", sessionId);
        if (sessionId === currentSessionId) newChat();
        if (businessId) await refreshHistory(businessId);
    }

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages]);

    const nowStr = () => new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    async function ask({ preset, question }: { preset?: PresetKey; question?: string }) {
        const q = question || PRESETS.find((p) => p.key === preset)?.question || "";
        if (!q.trim() || isSending) return;

        const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: q, createdAt: nowStr() };
        const aiMsg: Message = { id: `a-${Date.now()}`, role: "ai", text: "", loading: true, createdAt: nowStr() };
        setMessages((prev) => [...prev, userMsg, aiMsg]);
        setInput("");
        setIsSending(true);

        try {
            const res = await fetch("/api/tanya-kelola", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(preset ? { preset } : { question: q }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal memuat");
            setMessages((prev) => prev.map((m) => m.id === aiMsg.id ? { ...m, loading: false, text: data.text, data: data.data } : m));
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
            setMessages((prev) => prev.map((m) => m.id === aiMsg.id ? { ...m, loading: false, error: msg } : m));
        } finally {
            setIsSending(false);
        }
    }

    const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            ask({ question: input });
        }
    };

    const isEmpty = messages.length === 0;

    return (
        <div className="relative -m-8 h-[calc(100vh-6.5rem)] max-h-[calc(100vh-6.5rem)] bg-white dark:bg-[#090909] text-zinc-900 dark:text-zinc-900 dark:text-[#F5F5F5] overflow-hidden flex flex-col">
            {/* Fine technical grid background */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(0,0,0,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.04) 1px, transparent 1px)",
                    backgroundSize: "72px 72px",
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 hidden dark:block"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
                    backgroundSize: "72px 72px",
                }}
            />

            {/* Ambient panels — hidden on tablet/mobile */}
            {/* Main content */}
            <div className="relative flex-1 flex flex-col min-h-0 mx-auto w-full max-w-[860px] px-4 md:px-6">
                {/* Top actions bar */}
                <div className="flex items-center justify-end gap-2 pt-4 pb-1 shrink-0">
                    <button
                        onClick={newChat}
                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] text-[12px] text-zinc-700 dark:text-[#F5F5F5] hover:bg-zinc-50 dark:hover:bg-[#151515] transition-colors"
                        title="Chat baru"
                    >
                        <Plus size={13} />
                        <span>Baru</span>
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setHistoryOpen((v) => !v)}
                            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] text-[12px] text-zinc-700 dark:text-[#F5F5F5] hover:bg-zinc-50 dark:hover:bg-[#151515] transition-colors"
                        >
                            <History size={13} />
                            <span>Riwayat</span>
                            {history.length > 0 && (
                                <span className="text-[10px] text-zinc-400 dark:text-[#666] font-mono">{history.length}</span>
                            )}
                        </button>
                        {historyOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-[280px] rounded-md border border-zinc-200 dark:border-[#242424] bg-white dark:bg-[#0D0D0D] shadow-lg z-20 overflow-hidden">
                                <div className="px-3 py-2 border-b border-zinc-100 dark:border-[#1B1B1B] flex items-center justify-between">
                                    <span className="text-[11px] text-zinc-500 dark:text-[#A1A1A1] uppercase tracking-wider">Riwayat 24 Jam</span>
                                    <span className="text-[10px] text-zinc-400 dark:text-[#666]">max 3</span>
                                </div>
                                {history.length === 0 ? (
                                    <div className="px-3 py-6 text-center text-[12px] text-zinc-400 dark:text-[#666]">
                                        Belum ada riwayat chat
                                    </div>
                                ) : (
                                    <div className="max-h-[240px] overflow-y-auto scrollbar-hide">
                                        {history.map((h) => (
                                            <div
                                                key={h.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => loadSession(h.id)}
                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); loadSession(h.id); } }}
                                                className={`group w-full text-left px-3 py-2 border-b border-zinc-100 dark:border-[#1B1B1B] last:border-b-0 hover:bg-zinc-50 dark:hover:bg-[#151515] transition-colors flex items-start gap-2 cursor-pointer ${
                                                    h.id === currentSessionId ? "bg-orange-50/50 dark:bg-[#FF8A00]/[0.06]" : ""
                                                }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[12px] text-zinc-900 dark:text-[#F5F5F5] truncate">{h.title}</p>
                                                    <p className="text-[10px] text-zinc-400 dark:text-[#666] font-mono mt-0.5">
                                                        {new Date(h.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => deleteSession(h.id, e)}
                                                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 dark:text-[#666] dark:hover:text-[#F87171] transition-opacity shrink-0"
                                                    title="Hapus"
                                                    aria-label="Hapus"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {/* Scrollable chat area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 md:py-8 flex flex-col scrollbar-hide">
                    {isEmpty ? (
                        <EmptyHero />
                    ) : (
                        <div className="space-y-8 pb-4 min-w-0">
                            {messages.map((m) => (m.role === "user" ? <UserBubble key={m.id} m={m} /> : <AiBubble key={m.id} m={m} />))}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>

                {/* Composer — always visible at bottom */}
                <div className="shrink-0 py-4 md:py-5">
                    <Composer
                        value={input}
                        onChange={setInput}
                        onSubmit={() => ask({ question: input })}
                        onKeyDown={onKey}
                        disabled={isSending}
                        variant={isEmpty ? "hero" : "docked"}
                        onPresetClick={(k) => ask({ preset: k })}
                    />
                </div>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════
// Empty Hero
// ═════════════════════════════════════════════════════════════════

function EmptyHero() {
    return (
        <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center text-center py-16">
            <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-[28px] md:text-[32px] font-semibold text-zinc-900 dark:text-[#F5F5F5] leading-tight tracking-tight max-w-[520px]"
                style={{ letterSpacing: "-0.025em" }}
            >
                Apa yang ingin kamu ketahui tentang bisnismu?
            </motion.h1>
            <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="text-[14px] text-zinc-500 dark:text-[#A1A1A1] mt-3 max-w-[440px]"
            >
                Kelola AI membantu kamu memahami penjualan, pelanggan, dan produk.
            </motion.p>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════
// User Bubble (right-aligned)
// ═════════════════════════════════════════════════════════════════

function UserBubble({ m }: { m: Message }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="flex justify-end"
        >
            <div className="max-w-[75%] rounded-xl border border-zinc-200 dark:border-[#242424] bg-zinc-100 dark:bg-[#181818] px-4 py-2.5">
                <p className="text-[14px] text-zinc-900 dark:text-[#F5F5F5] leading-relaxed whitespace-pre-wrap">{m.text}</p>
                <p className="text-[10px] text-zinc-400 dark:text-[#666] mt-1 text-right">{m.createdAt}</p>
            </div>
        </motion.div>
    );
}

// ═════════════════════════════════════════════════════════════════
// AI Bubble (left-aligned, progressive reveal)
// ═════════════════════════════════════════════════════════════════

function AiBubble({ m }: { m: Message }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="space-y-3 min-w-0"
        >
            {/* Header */}
            <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-zinc-900 dark:text-[#F5F5F5]">Kelola AI</span>
                <span className="text-[11px] text-zinc-400 dark:text-[#666]">{m.createdAt}</span>
            </div>

            {/* Body */}
            {m.loading ? (
                <div className="flex items-center gap-2 text-zinc-500 dark:text-[#A1A1A1]">
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A00] animate-pulse" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A00] animate-pulse [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A00] animate-pulse [animation-delay:300ms]" />
                    </div>
                    <span className="text-[13px]">Menganalisa data bisnismu…</span>
                </div>
            ) : m.error ? (
                <p className="text-[13px] text-[#F87171]">Gagal memuat: {m.error}</p>
            ) : (
                <>
                    <p className="text-[15px] leading-[1.7] text-zinc-900 dark:text-[#F5F5F5] whitespace-pre-wrap">{m.text}</p>

                    {m.data && <DataCard data={m.data} />}

                    {/* Chat actions */}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={() => navigator.clipboard.writeText(m.text)}
                            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 dark:text-[#666] hover:text-zinc-500 dark:text-[#A1A1A1] transition-colors"
                        >
                            <Copy size={11} /> Salin
                        </button>
                        <button className="inline-flex items-center gap-1 text-[11px] text-zinc-400 dark:text-[#666] hover:text-zinc-500 dark:text-[#A1A1A1] transition-colors">
                            <ThumbsUp size={11} />
                        </button>
                        <button className="inline-flex items-center gap-1 text-[11px] text-zinc-400 dark:text-[#666] hover:text-zinc-500 dark:text-[#A1A1A1] transition-colors">
                            <ThumbsDown size={11} />
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    );
}

// ═════════════════════════════════════════════════════════════════
// Data Card — 3 variants
// ═════════════════════════════════════════════════════════════════

function DataCard({ data }: { data: NonNullable<ApiData> }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.1 }}
            className="rounded-xl border border-zinc-200 dark:border-[#292929] bg-white dark:bg-[rgba(17,17,17,0.92)] backdrop-blur-sm overflow-hidden min-w-0 max-w-full"
            style={{ fontVariantNumeric: "tabular-nums" }}
        >
            <div className="px-5 py-3 border-b border-zinc-200 dark:border-[#242424]">
                <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-[#F5F5F5]" style={{ letterSpacing: "-0.01em" }}>
                    {data.title}
                </h3>
            </div>
            <div className="p-5 overflow-hidden">
                {data.type === "top-products" && <TopProductsChart items={data.items} />}
                {data.type === "week-summary" && <WeekSummaryChart daily={data.daily} totals={data.totals} />}
                {data.type === "top-customers" && <TopCustomersTable items={data.items} />}
                {data.type === "dynamic" && <DynamicChart chartType={data.chart_type} points={data.points} total={data.total} periodLabel={data.period_label} />}
            </div>
        </motion.div>
    );
}

function TopProductsChart({ items }: { items: { name: string; qty: number; changePct: number }[] }) {
    const max = Math.max(...items.map((i) => i.qty), 1);
    return (
        <div className="space-y-2.5">
            <div className="grid grid-cols-[24px_1fr_60px_60px] gap-3 text-[11px] text-zinc-400 dark:text-[#666] uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-[#1B1B1B]">
                <div>#</div>
                <div>Produk</div>
                <div className="text-right">Terjual</div>
                <div className="text-right">Perubahan</div>
            </div>
            {items.map((p, i) => {
                const pct = Math.round((p.qty / max) * 100);
                const up = p.changePct >= 0;
                return (
                    <div key={i} className="grid grid-cols-[24px_1fr_60px_60px] gap-3 items-center">
                        <div className="text-[12px] text-zinc-400 dark:text-[#666] font-mono">{String(i + 1).padStart(2, "0")}</div>
                        <div className="min-w-0">
                            <div className="text-[13px] text-zinc-900 dark:text-[#F5F5F5] mb-1 truncate">{p.name}</div>
                            <div className="h-1 rounded-full bg-zinc-200 dark:bg-[#252525] overflow-hidden">
                                <div className="h-full rounded-full bg-[#FF8A00]" style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                        <div className="text-right text-[13px] text-zinc-900 dark:text-[#F5F5F5]">{p.qty}</div>
                        <div className={`text-right text-[12px] ${up ? "text-[#4ADE80]" : "text-[#F87171]"}`}>
                            {up ? "+" : ""}{p.changePct}%
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function WeekSummaryChart({ daily, totals }: { daily: { name: string; total: number; orders: number }[]; totals: { revenue: number; orders: number; avg: number; changePct: number } }) {
    const max = Math.max(...daily.map((d) => d.total), 1);
    // Nice max rounded up untuk gridline
    const niceMax = Math.ceil(max / 10000) * 10000 || max;
    const gridLines = [0.25, 0.5, 0.75, 1];
    return (
        <div>
            <div className="grid grid-cols-3 gap-3 mb-5 pb-4 border-b border-zinc-100 dark:border-[#1B1B1B]">
                <Kpi label="Omzet" value={`Rp ${totals.revenue.toLocaleString("id-ID")}`} delta={totals.changePct} />
                <Kpi label="Pesanan" value={String(totals.orders)} />
                <Kpi label="Rata-rata" value={`Rp ${totals.avg.toLocaleString("id-ID")}`} />
            </div>

            {/* Chart with Y-axis + gridlines */}
            <div className="flex gap-3">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between text-[10px] text-zinc-400 dark:text-[#666] font-mono h-[140px] py-0 shrink-0 text-right w-12">
                    <span>{formatCompact(niceMax)}</span>
                    <span>{formatCompact(niceMax * 0.75)}</span>
                    <span>{formatCompact(niceMax * 0.5)}</span>
                    <span>{formatCompact(niceMax * 0.25)}</span>
                    <span>0</span>
                </div>

                {/* Chart area */}
                <div className="relative flex-1 h-[140px]">
                    {/* Horizontal gridlines */}
                    {gridLines.map((g, i) => (
                        <div
                            key={i}
                            className="absolute left-0 right-0 border-t border-dashed border-zinc-100 dark:border-[#1F1F1F]"
                            style={{ bottom: `${g * 100}%` }}
                        />
                    ))}
                    {/* Baseline */}
                    <div className="absolute left-0 right-0 bottom-0 border-t border-zinc-200 dark:border-[#2A2A2A]" />

                    {/* Bars */}
                    <div className="relative h-full grid grid-cols-7 gap-2 items-end">
                        {daily.map((d, i) => {
                            const h = niceMax === 0 ? 0 : Math.max(2, Math.round((d.total / niceMax) * 100));
                            return (
                                <div key={i} className="group relative flex items-end justify-center h-full">
                                    <div
                                        className="w-full max-w-[28px] rounded-t-sm bg-[#FF8A00] hover:bg-[#FF9A1F] transition-colors relative"
                                        style={{ height: `${h}%` }}
                                    >
                                        {/* Tooltip on hover */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-white dark:bg-[#0D0D0D] border border-zinc-200 dark:border-[#242424] px-2 py-1 rounded text-[10px] text-zinc-900 dark:text-[#F5F5F5] font-mono">
                                            Rp {d.total.toLocaleString("id-ID")} · {d.orders} order
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* X-axis labels */}
            <div className="flex gap-3 mt-2">
                <div className="w-12 shrink-0" />
                <div className="flex-1 grid grid-cols-7 gap-2 text-center">
                    {daily.map((d, i) => (
                        <div key={i} className="text-[10px] text-zinc-400 dark:text-[#666] font-mono">{d.name}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function formatCompact(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}Jt`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
    return String(Math.round(n));
}

function TopCustomersTable({ items }: { items: { name: string; total_orders: number; last_order_at?: string }[] }) {
    const max = Math.max(...items.map((c) => c.total_orders || 0), 1);
    return (
        <div className="space-y-2.5">
            <div className="grid grid-cols-[24px_1fr_60px] gap-3 text-[11px] text-zinc-400 dark:text-[#666] uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-[#1B1B1B]">
                <div>#</div>
                <div>Nama</div>
                <div className="text-right">Order</div>
            </div>
            {items.map((c, i) => {
                const pct = Math.round(((c.total_orders || 0) / max) * 100);
                return (
                    <div key={i} className="grid grid-cols-[24px_1fr_60px] gap-3 items-center">
                        <div className="text-[12px] text-zinc-400 dark:text-[#666] font-mono">{String(i + 1).padStart(2, "0")}</div>
                        <div className="min-w-0">
                            <div className="text-[13px] text-zinc-900 dark:text-[#F5F5F5] mb-1 truncate">{c.name}</div>
                            <div className="h-1 rounded-full bg-zinc-200 dark:bg-[#252525] overflow-hidden">
                                <div className="h-full rounded-full bg-[#FF8A00]" style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                        <div className="text-right text-[13px] text-zinc-900 dark:text-[#F5F5F5]">{c.total_orders || 0}</div>
                    </div>
                );
            })}
        </div>
    );
}

function Kpi({ label, value, delta }: { label: string; value: string; delta?: number }) {
    return (
        <div>
            <div className="text-[11px] text-zinc-400 dark:text-[#666] uppercase tracking-wider mb-1">{label}</div>
            <div className="text-[16px] font-semibold text-zinc-900 dark:text-[#F5F5F5]" style={{ letterSpacing: "-0.01em" }}>{value}</div>
            {typeof delta === "number" && delta !== 0 && (
                <div className={`text-[11px] mt-0.5 ${delta > 0 ? "text-[#4ADE80]" : "text-[#F87171]"}`}>
                    {delta > 0 ? "+" : ""}{delta}% vs minggu lalu
                </div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════
// Composer — hero (center) and docked (bottom)
// ═════════════════════════════════════════════════════════════════

function Composer({
    value,
    onChange,
    onSubmit,
    onKeyDown,
    disabled,
    variant,
    onPresetClick,
}: {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
    disabled: boolean;
    variant: "hero" | "docked";
    onPresetClick?: (k: PresetKey) => void;
}) {
    const canSend = value.trim().length > 0 && !disabled;
    return (
        <div className={variant === "docked" ? "sticky bottom-4 mt-4" : "w-full max-w-[720px] mx-auto"}>
            <div className="relative">
                <div
                    className={`w-full rounded-[14px] border transition-all bg-white dark:bg-[#0F0F0F] focus-within:border-[#FF8A00]/65 focus-within:shadow-[0_0_0_3px_rgba(255,138,0,0.06)] ${disabled ? "opacity-70" : ""}`}
                    style={{ borderColor: "#292929" }}
                >
                    <div className="flex items-start gap-2 px-4 pt-3">
                        <textarea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder="Tanya sesuatu tentang bisnismu..."
                            disabled={disabled}
                            rows={variant === "hero" ? 2 : 1}
                            className="flex-1 bg-transparent text-[14px] text-zinc-900 dark:text-[#F5F5F5] placeholder:text-zinc-400 dark:text-[#666] outline-none resize-none py-1 min-h-[24px] max-h-[160px]"
                        />
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5 border-t border-zinc-100 dark:border-[#1B1B1B] mt-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-[#666]">
                            <Info size={11} />
                            <span>Kelola AI menggunakan data bisnismu</span>
                        </div>
                        <button
                            onClick={onSubmit}
                            disabled={!canSend}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${canSend ? "bg-[#FF8A00] hover:bg-[#FF9A1F] text-white" : "bg-zinc-200 dark:bg-[#292929] text-zinc-400 dark:text-[#555]"}`}
                            aria-label="Kirim"
                        >
                            <ArrowUp size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {variant === "hero" && (
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {PRESETS.map((p) => (
                            <button
                                key={p.key}
                                onClick={() => onPresetClick?.(p.key)}
                                className="text-[12px] text-zinc-500 dark:text-[#A1A1A1] hover:text-zinc-900 dark:text-[#F5F5F5] px-3 py-1.5 rounded-full border border-zinc-200 dark:border-[#242424] hover:border-[#FF8A00]/50 hover:bg-[#FF8A00]/[0.06] transition-colors"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                )}

                <p className="text-[11px] text-zinc-400 dark:text-[#555] text-center mt-3 flex items-center justify-center gap-1.5">
                    <Shield size={10} />
                    Data bisnismu aman dan hanya digunakan untuk analisis
                </p>
            </div>
        </div>
    );
}
function DynamicChart({
    chartType,
    points,
    total,
    periodLabel,
}: {
    chartType: "bar" | "line" | "donut";
    points: { name: string; value: number; extra?: number }[];
    total: number;
    periodLabel: string;
}) {
    const orange = "#FF8A00";
    const orangeMuted = "rgba(255,138,0,0.35)";
    const donutColors = ["#FF8A00", "#FF9A1F", "#FFB35C", "#8B4513", "#4A5568", "#6B7280", "#94A3B8", "#CBD5E0"];

    const tooltipStyle = { background: "#0D0D0D", border: "1px solid #242424", borderRadius: 6, fontSize: 11 };

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-zinc-400 dark:text-[#666] uppercase tracking-wider">{periodLabel}</span>
                <span className="text-[13px] text-zinc-900 dark:text-[#F5F5F5] font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>
                    Total: {total.toLocaleString("id-ID")}
                </span>
            </div>

            <div className="w-full h-[240px] overflow-hidden" style={{ fontVariantNumeric: "tabular-nums" }}>
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === "line" ? (
                        <LineChart data={points} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "#2A2A2A" }} tickLine={false} />
                            <YAxis tick={{ fill: "#666", fontSize: 10, fontFamily: "monospace" }} tickFormatter={formatCompact} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#F5F5F5" }} itemStyle={{ color: orange }} formatter={((v: number) => v.toLocaleString("id-ID")) as unknown as never} />
                            <Line type="monotone" dataKey="value" stroke={orange} strokeWidth={2} dot={{ r: 3, fill: orange, stroke: orange }} activeDot={{ r: 5, fill: orange, stroke: "#0D0D0D", strokeWidth: 2 }} />
                        </LineChart>
                    ) : chartType === "donut" ? (
                        <PieChart>
                            <Pie data={points} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={92} paddingAngle={2} stroke="#0D0D0D" strokeWidth={2}>
                                {points.map((_, i) => (<Cell key={i} fill={donutColors[i % donutColors.length]} />))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "#F5F5F5" }} formatter={((v: number) => v.toLocaleString("id-ID")) as unknown as never} />
                            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#A1A1A1" }} />
                        </PieChart>
                    ) : (
                        <BarChart data={points} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "#2A2A2A" }} tickLine={false} interval={0} angle={points.length > 6 ? -30 : 0} textAnchor={points.length > 6 ? "end" : "middle"} height={points.length > 6 ? 50 : 30} />
                            <YAxis tick={{ fill: "#666", fontSize: 10, fontFamily: "monospace" }} tickFormatter={formatCompact} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#F5F5F5" }} itemStyle={{ color: orange }} cursor={{ fill: orangeMuted, opacity: 0.15 }} formatter={((v: number) => v.toLocaleString("id-ID")) as unknown as never} />
                            <Bar dataKey="value" fill={orange} radius={[3, 3, 0, 0]} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
