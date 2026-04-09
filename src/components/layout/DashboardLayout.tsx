"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
    LayoutDashboard,
    ShoppingCart,
    Users,
    Package,
    Calculator,
    MessageCircle,
    BarChart3,
    Settings,
    Menu,
    Search,
    Bell,
    ChevronDown,
    LogOut,
    Sparkles,
    AlertTriangle,
    MessageSquare,
    Bot
} from "lucide-react";

const SIDEBAR_ITEMS = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Pesanan", href: "/dashboard/pesanan", icon: ShoppingCart },
    { name: "Pelanggan", href: "/dashboard/pelanggan", icon: Users },
    { name: "Produk", href: "/dashboard/produk", icon: Package },
    { name: "Kasir (POS)", href: "/dashboard/kasir", icon: Calculator, highlight: true },
    { name: "WA Marketing", href: "/dashboard/wa-marketing", icon: MessageCircle },
    { name: "Asisten AI", href: "/dashboard/asisten-ai", icon: Bot },
    { name: "Laporan & Insight", href: "/dashboard/laporan", icon: BarChart3 },
    { name: "Pengaturan", href: "/dashboard/pengaturan", icon: Settings },
];

const NOTIFICATIONS = [
    { id: 1, title: "Pesanan masuk via WA", time: "Baru saja", icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { id: 2, title: "Stok menipis: Kopi Arabika", time: "10 mnt lalu", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
    { id: 3, title: "Insight mingguan tersedia!", time: "2 jam lalu", icon: Sparkles, color: "text-orange-400", bg: "bg-orange-500/10" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Auth State
    const [userName, setUserName] = useState("User");
    const [userAvatar, setUserAvatar] = useState("");
    const [businessName, setBusinessName] = useState("Bisnis");
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    // Handle scroll for header styling
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Fetch Auth and Business Data
    useEffect(() => {
        let isMounted = true;

        async function loadProfile() {
            try {
                // 1. Get Session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) {
                    router.push('/auth/login');
                    return;
                }

                if (isMounted) {
                    // Extract from Google Identity metadata
                    setUserName(session.user.user_metadata.full_name || session.user.email?.split('@')[0] || "User");
                    setUserAvatar(session.user.user_metadata.avatar_url || "");
                }

                // 2. Get Business Name
                const { data: business } = await supabase
                    .from('businesses')
                    .select('business_name')
                    .eq('user_id', session.user.id)
                    .single();

                if (isMounted && business) {
                    setBusinessName(business.business_name);
                } else if (!business) {
                    // No business yet, force onboarding
                    router.push('/onboarding');
                }

            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                if (isMounted) setIsLoadingAuth(false);
            }
        }

        loadProfile();

        return () => { isMounted = false };
    }, [supabase, router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
    };

    // Close sidebar on larger screens when resizing
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Close dropdowns when clicking outside (simplified for clarity, ideally use a hook)
    useEffect(() => {
        const handleClickOutside = () => {
            setIsNotificationOpen(false);
            setIsProfileOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] font-sans selection:bg-orange-500/30 text-white">
            <style jsx global>{`
                body {
                    background-color: #0a0a0a !important;
                }
            `}</style>
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-6 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-1.5 group">
                        <span className="font-display font-bold text-2xl tracking-tighter text-white">kelola</span>
                        <span className="text-orange-400 font-bold text-2xl">.ai</span>
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                        <Menu size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
                    {SIDEBAR_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link key={item.name} href={item.href}>
                                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative ${isActive
                                    ? "bg-orange-500/10 text-orange-400 font-medium border border-orange-500/10"
                                    : "text-white/60 font-medium hover:bg-white/5 hover:text-white/90 border border-transparent"
                                    }`}>
                                    {isActive && (
                                        <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-5 bg-orange-400 rounded-r-full" />
                                    )}
                                    <Icon size={18} className={isActive ? "text-orange-400" : "text-white/40 group-hover:text-white/80 transition-colors"} />
                                    <span className="flex-1 text-sm">{item.name}</span>
                                    {item.highlight && (
                                        <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] font-black uppercase tracking-wider">
                                            POS
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* User Profile Card at Bottom */}
                <div className="p-4 mt-auto border-t border-white/5">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group cursor-pointer relative" onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileOpen(!isProfileOpen);
                    }}>
                        <div className="flex items-center gap-3">
                            {isLoadingAuth ? (
                                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                            ) : userAvatar ? (
                                <img src={userAvatar} alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-lg">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white/90 truncate">{userName}</p>
                                <p className="text-[10px] text-white/40 truncate">{businessName}</p>
                            </div>
                            <ChevronDown size={14} className={`text-white/40 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
                        </div>

                        {/* Profile Context Menu */}
                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: -20, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute bottom-full left-0 right-0 mb-2 bg-[#161616]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] p-1.5 z-[60]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Link href="/dashboard/pengaturan" className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-white/60 hover:text-white/90 hover:bg-white/5 rounded-lg transition-all">
                                        <Settings size={14} /> Pengaturan
                                    </Link>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all mt-1"
                                    >
                                        <LogOut size={14} /> Keluar
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="lg:pl-64 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className={`sticky top-0 z-30 transition-all duration-200 ${scrolled ? "bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 shadow-md shadow-black/20" : "bg-transparent"
                    }`}>
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-white/60 hover:text-white rounded-lg bg-[#161616] shadow-sm border border-white/5 transition-colors">
                                <Menu size={20} />
                            </button>

                            {/* Search Bar */}
                            <div className="hidden sm:flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#161616]/80 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] border border-white/5 w-64 focus-within:border-orange-500/30 focus-within:ring-1 focus-within:ring-orange-500/20 transition-all">
                                <Search size={18} className="text-white/30" />
                                <input
                                    type="text"
                                    placeholder="Cari pesanan, pelanggan..."
                                    className="bg-transparent border-none outline-none text-sm text-white/90 placeholder:text-white/30 w-full font-light"
                                />
                                <div className="px-2 py-0.5 rounded-md bg-white/5 text-white/40 text-[10px] font-black tracking-widest uppercase border border-white/5">
                                    ⌘K
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Notifications Dropdown */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => {
                                        setIsNotificationOpen(!isNotificationOpen);
                                        setIsProfileOpen(false);
                                    }}
                                    className={`relative p-2 rounded-lg transition-all border ${isNotificationOpen
                                        ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                                        : "bg-[#161616] border-white/5 text-white/60 hover:text-white shadow-sm"
                                        }`}
                                >
                                    <Bell size={18} />
                                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-orange-500 ring-2 ring-[#0a0a0a]" />
                                </button>

                                <AnimatePresence>
                                    {isNotificationOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 mt-4 w-80 bg-[#161616]/95 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
                                        >
                                            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                                                <h3 className="font-medium text-white/90 tracking-tight">Notifikasi</h3>
                                                <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">3 Baru</span>
                                            </div>
                                            <div className="py-2">
                                                {NOTIFICATIONS.map((notif) => {
                                                    const Icon = notif.icon;
                                                    return (
                                                        <div key={notif.id} className="flex items-start gap-4 px-6 py-4 hover:bg-[#1a1a1a] transition-colors cursor-pointer group">
                                                            <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${notif.bg} ${notif.color} group-hover:scale-105 transition-transform`}>
                                                                <Icon size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-white/90 mb-0.5 tracking-tight group-hover:text-orange-400 transition-colors">{notif.title}</p>
                                                                <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">{notif.time}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="p-4 border-t border-white/5">
                                                <button className="w-full py-3 text-xs font-semibold text-white/40 uppercase tracking-widest hover:text-orange-400 hover:bg-[#1a1a1a]/50 transition-colors bg-[#111] rounded-xl border border-transparent hover:border-white/5">
                                                    Lihat semua
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Divider and Plan Badge */}
                            <div className="hidden md:flex items-center gap-3">
                                <div className="w-px h-6 bg-white/10" />
                                <div className="px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles size={12} className="text-orange-400" />
                                    Pro Plan
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content with Global Transition */}
                <main className="flex-1 p-8">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
