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
    MessageSquare
} from "lucide-react";

const SIDEBAR_ITEMS = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Pesanan", href: "/dashboard/pesanan", icon: ShoppingCart },
    { name: "Pelanggan", href: "/dashboard/pelanggan", icon: Users },
    { name: "Produk", href: "/dashboard/produk", icon: Package },
    { name: "Kasir (POS)", href: "/dashboard/pos", icon: Calculator, highlight: true },
    { name: "WA Marketing", href: "/dashboard/wa-marketing", icon: MessageCircle },
    { name: "Laporan & Insight", href: "/dashboard/laporan", icon: BarChart3 },
    { name: "Pengaturan", href: "/dashboard/pengaturan", icon: Settings },
];

const NOTIFICATIONS = [
    { id: 1, title: "Pesanan masuk via WA", time: "Baru saja", icon: MessageSquare, color: "text-green-500", bg: "bg-green-50" },
    { id: 2, title: "Stok menipis: Kopi Arabika", time: "10 mnt lalu", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
    { id: 3, title: "Insight mingguan tersedia!", time: "2 jam lalu", icon: Sparkles, color: "text-orange-500", bg: "bg-orange-50" },
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
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-orange-500/30">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-6 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-1.5 group">
                        <span className="font-display font-bold text-2xl tracking-tighter text-[#111]">kelola</span>
                        <span className="text-orange-600 font-bold text-2xl">.ai</span>
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                        <Menu size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                    {SIDEBAR_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link key={item.name} href={item.href}>
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative ${isActive ? "bg-orange-50/50 text-orange-600 font-bold" : "text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900"
                                    }`}>
                                    {isActive && (
                                        <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-orange-500 rounded-r-full" />
                                    )}
                                    <Icon size={20} className={isActive ? "text-orange-500" : "text-slate-400 group-hover:text-slate-600 transition-colors"} />
                                    <span className="flex-1">{item.name}</span>
                                    {item.highlight && (
                                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[9px] font-black uppercase tracking-wider">
                                            Utama
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-slate-100">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-orange-500/20 transition-colors duration-500" />
                        <div className="relative z-10 flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-white/10 text-orange-400">
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white mb-1 tracking-tight">Pro Plan Aktif</p>
                                <p className="text-[10px] text-white/50 font-medium leading-relaxed">Nikmati semua fitur premium tanpa batas.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="lg:pl-72 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className={`sticky top-0 z-30 transition-all duration-200 ${scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm" : "bg-transparent"
                    }`}>
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-white shadow-sm border border-slate-100 transition-colors">
                                <Menu size={20} />
                            </button>
                            {/* Search Bar (Hidden on mobile) */}
                            <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full bg-white shadow-sm border border-slate-100 w-80 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500/30 transition-all">
                                <Search size={18} className="text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari pesanan, pelanggan..."
                                    className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
                                />
                                <div className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-bold tracking-widest uppercase">
                                    ⌘K
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-5">
                            {/* Notifications Dropdown */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => {
                                        setIsNotificationOpen(!isNotificationOpen);
                                        setIsProfileOpen(false);
                                    }}
                                    className="relative p-2.5 text-slate-400 hover:text-slate-600 rounded-xl bg-white shadow-sm border border-slate-100 transition-colors group"
                                >
                                    <Bell size={18} className="group-hover:scale-110 transition-transform" />
                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
                                </button>

                                <AnimatePresence>
                                    {isNotificationOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden"
                                        >
                                            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                                                <h3 className="font-bold text-slate-800 tracking-tight">Notifikasi</h3>
                                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">3 Baru</span>
                                            </div>
                                            <div className="py-2">
                                                {NOTIFICATIONS.map((notif) => {
                                                    const Icon = notif.icon;
                                                    return (
                                                        <div key={notif.id} className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer group">
                                                            <div className={`mt-0.5 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${notif.bg} ${notif.color} group-hover:scale-105 transition-transform`}>
                                                                <Icon size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-800 mb-0.5 tracking-tight group-hover:text-orange-600 transition-colors">{notif.title}</p>
                                                                <p className="text-xs text-slate-400 font-medium">{notif.time}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="px-5 py-3 border-t border-slate-50 text-center">
                                                <Link href="#" className="text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors">
                                                    Lihat semua notifikasi
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-6 bg-slate-200" />

                            {/* Profile Dropdown */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => {
                                        setIsProfileOpen(!isProfileOpen);
                                        setIsNotificationOpen(false);
                                    }}
                                    className="flex items-center gap-3 p-1.5 pr-3 rounded-full bg-white shadow-sm border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        {isLoadingAuth ? (
                                            <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
                                        ) : userAvatar ? (
                                            <img src={userAvatar} alt="Profile" className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-rose-500 text-white flex items-center justify-center font-bold shadow-md ring-2 ring-white">
                                                {userName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="hidden md:block text-left">
                                            {isLoadingAuth ? (
                                                <div className="h-4 w-24 bg-slate-200 animate-pulse rounded mb-1" />
                                            ) : (
                                                <p className="text-sm font-bold text-slate-900 leading-none">{userName}</p>
                                            )}
                                            {isLoadingAuth ? (
                                                <div className="h-3 w-16 bg-slate-200 animate-pulse rounded" />
                                            ) : (
                                                <p className="text-xs font-medium text-slate-500 mt-1 truncate max-w-[120px]">{businessName}</p>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
                                </button>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden"
                                        >
                                            <div className="px-5 py-4 border-b border-slate-50">
                                                <p className="text-sm font-bold text-slate-800">{userName}</p>
                                                <p className="text-xs text-slate-500 font-medium">{businessName}</p>
                                            </div>
                                            <div className="py-2">
                                                <Link href="/dashboard/pengaturan" className="flex items-center gap-3 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors">
                                                    <Settings size={16} />
                                                    Pengaturan Akun
                                                </Link>
                                            </div>
                                            <div className="py-2 border-t border-slate-50">
                                                <div className="h-[1px] bg-slate-100 my-1" />
                                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors flex items-center justify-between group">
                                                    Keluar
                                                    <LogOut size={16} className="text-rose-400 group-hover:text-rose-600 transition-colors" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
