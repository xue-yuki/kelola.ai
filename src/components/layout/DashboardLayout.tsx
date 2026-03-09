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
    { name: "Kasir (POS)", href: "/dashboard/kasir", icon: Calculator, highlight: true },
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
        <div className="min-h-screen bg-[#FAFAF8] font-sans selection:bg-orange-500/30">
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
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#1A1A2E] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-6 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-1.5 group">
                        <span className="font-display font-bold text-2xl tracking-tighter text-white">kelola</span>
                        <span className="text-[#FF6B2B] font-bold text-2xl">.ai</span>
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
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
                                    ? "bg-[#FF6B2B]/10 text-[#FF6B2B] font-semibold"
                                    : "text-[#94A3B8] font-medium hover:bg-white/5 hover:text-white"
                                    }`}>
                                    {isActive && (
                                        <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-5 bg-[#FF6B2B] rounded-r-full" />
                                    )}
                                    <Icon size={18} className={isActive ? "text-[#FF6B2B]" : "text-[#94A3B8] group-hover:text-white transition-colors"} />
                                    <span className="flex-1 text-sm">{item.name}</span>
                                    {item.highlight && (
                                        <span className="px-2 py-0.5 rounded-full bg-[#FF6B2B] text-white text-[9px] font-black uppercase tracking-wider">
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
                                <div className="w-8 h-8 rounded-full bg-[#FF6B2B] text-white flex items-center justify-center font-bold text-xs shadow-lg">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{userName}</p>
                                <p className="text-[10px] text-[#94A3B8] truncate">{businessName}</p>
                            </div>
                            <ChevronDown size={14} className={`text-slate-500 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
                        </div>

                        {/* Profile Context Menu */}
                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: -20, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute bottom-full left-0 right-0 mb-2 bg-[#1A1A2E] border border-white/10 rounded-xl shadow-2xl p-1.5 z-[60]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Link href="/dashboard/pengaturan" className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#94A3B8] hover:text-white hover:bg-white/5 rounded-lg transition-all">
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
                <header className={`sticky top-0 z-30 transition-all duration-200 ${scrolled ? "bg-white/80 backdrop-blur-md border-b border-[#F0EEE9] shadow-sm" : "bg-transparent"
                    }`}>
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg bg-white shadow-sm border border-[#F0EEE9] transition-colors">
                                <Menu size={20} />
                            </button>

                            {/* Search Bar */}
                            <div className="hidden sm:flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white shadow-sm border border-[#F0EEE9] w-64 focus-within:ring-2 focus-within:ring-[#FF6B2B]/10 focus-within:border-[#FF6B2B]/20 transition-all">
                                <Search size={18} className="text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari pesanan, pelanggan..."
                                    className="bg-transparent border-none outline-none text-sm text-[#1A1A2E] placeholder:text-slate-400 w-full font-medium"
                                />
                                <div className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 text-[10px] font-black tracking-widest uppercase border border-slate-100">
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
                                        ? "bg-[#FF6B2B]/5 border-[#FF6B2B]/20 text-[#FF6B2B]"
                                        : "bg-white border-[#F0EEE9] text-slate-400 hover:text-slate-600 shadow-sm"
                                        }`}
                                >
                                    <Bell size={18} />
                                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#FF6B2B] ring-2 ring-white" />
                                </button>

                                <AnimatePresence>
                                    {isNotificationOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(26,26,46,0.12)] border border-[#F0EEE9] overflow-hidden"
                                        >
                                            <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                                                <h3 className="font-bold text-[#1A1A2E] tracking-tight">Notifikasi</h3>
                                                <span className="text-[10px] font-bold text-[#FF6B2B] bg-[#FFF3EE] px-2.5 py-1 rounded-full uppercase tracking-wider">3 Baru</span>
                                            </div>
                                            <div className="py-2">
                                                {NOTIFICATIONS.map((notif) => {
                                                    const Icon = notif.icon;
                                                    return (
                                                        <div key={notif.id} className="flex items-start gap-4 px-6 py-4 hover:bg-[#FAFAF8] transition-colors cursor-pointer group">
                                                            <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.bg} ${notif.color} group-hover:scale-105 transition-transform`}>
                                                                <Icon size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-[#1A1A2E] mb-0.5 tracking-tight group-hover:text-[#FF6B2B] transition-colors">{notif.title}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{notif.time}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="p-4 border-t border-slate-50">
                                                <button className="w-full py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-[#FF6B2B] transition-colors bg-[#FAFAF8] rounded-xl">
                                                    Lihat semua
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Divider and Plan Badge */}
                            <div className="hidden md:flex items-center gap-3">
                                <div className="w-px h-6 bg-slate-200" />
                                <div className="px-3 py-1.5 rounded-full bg-[#1A1A2E] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
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
