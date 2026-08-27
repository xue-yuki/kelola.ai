"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import TrialBanner from "@/components/billing/TrialBanner";
import TrialExpiryModal from "@/components/billing/TrialExpiryModal";
import { getGlobalBannerSettings } from "@/app/actions/global-settings";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
    LayoutDashboard,
    ShoppingCart,
    Users,
    Package,
    Calculator,
    MessageCircle,
    BarChart3,
    Settings,
    CreditCard,
    Menu,
    Search,
    Bell,
    ChevronDown,
    LogOut,
    Sparkles,
    AlertTriangle,
    MessageSquare,
    Bot,
    AlertCircle,
    MessagesSquare
} from "lucide-react";

const SIDEBAR_ITEMS = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Pesanan", href: "/dashboard/pesanan", icon: ShoppingCart },
    { name: "Percakapan", href: "/dashboard/percakapan", icon: MessagesSquare },
    { name: "Pelanggan", href: "/dashboard/pelanggan", icon: Users },
    { name: "Produk", href: "/dashboard/produk", icon: Package },
    { name: "Kasir (POS)", href: "/dashboard/kasir", icon: Calculator, highlight: true },
    { name: "WA Marketing", href: "/dashboard/wa-marketing", icon: MessageCircle },
    { name: "Tanya Kelola", href: "/dashboard/tanya-kelola", icon: Sparkles },
    { name: "Asisten AI", href: "/dashboard/asisten-ai", icon: Bot },
    { name: "Laporan & Insight", href: "/dashboard/laporan", icon: BarChart3 },
    { name: "Komplain", href: "/dashboard/komplain", icon: AlertCircle, complaint: true },
    { name: "Pengaturan", href: "/dashboard/pengaturan", icon: Settings },
    { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
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

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Notifications State
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [complaintCount, setComplaintCount] = useState(0);

    // Auth State
    const [userName, setUserName] = useState("User");
    const [userAvatar, setUserAvatar] = useState("");
    const [businessName, setBusinessName] = useState("Bisnis");
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [subscriptionTier, setSubscriptionTier] = useState<string>("starter");
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    // Global Banner State
    const [globalBanner, setGlobalBanner] = useState<{ message: string, active: boolean, dismissed: boolean }>({ message: "", active: false, dismissed: false });

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
        let orderChannel: ReturnType<typeof supabase.channel> | null = null;
        let complaintChannel: ReturnType<typeof supabase.channel> | null = null;

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

                // 2. Get Business Name & ID
                const { data: business } = await supabase
                    .from('businesses')
                    .select('id, business_name, subscription_tier')
                    .eq('user_id', session.user.id)
                    .single();

                if (isMounted && business) {
                    setBusinessId(business.id);
                    setBusinessName(business.business_name);
                    setSubscriptionTier(business.subscription_tier || 'starter');
                    
                    // Fetch recent orders for notifications
                    const { data: recentOrders } = await supabase
                        .from('orders')
                        .select('id, customer_name, total, created_at, status')
                        .eq('business_id', business.id)
                        .order('created_at', { ascending: false })
                        .limit(5);

                    if (recentOrders && isMounted) {
                        setNotifications(recentOrders);
                        setUnreadCount(recentOrders.filter(o => o.status === 'menunggu').length);
                    }

                    // Fetch unresolved complaint count
                    const { count: cCount } = await supabase
                        .from('complaints')
                        .select('id', { count: 'exact', head: true })
                        .eq('business_id', business.id)
                        .eq('status', 'baru');
                    if (isMounted) setComplaintCount(cCount || 0);

                    // Listen to REALTIME table changes for push notification
                    orderChannel = supabase.channel('layout_notifications')
                        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `business_id=eq.${business.id}` }, payload => {
                            if (isMounted) {
                                setNotifications(prev => [payload.new, ...prev].slice(0, 5));
                                setUnreadCount(prev => prev + 1);
                            }
                        })
                        .subscribe();

                    complaintChannel = supabase.channel('complaint_notifications')
                        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complaints', filter: `business_id=eq.${business.id}` }, () => {
                            if (isMounted) setComplaintCount(prev => prev + 1);
                        })
                        .subscribe();

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

        async function fetchGlobalBanner() {
            try {
                const data = await getGlobalBannerSettings();
                
                if (isMounted && data) {
                    // Cek di local storage jika user sudah pernah dismiss banner ini
                    const isDismissed = localStorage.getItem(`dismissed_banner_${data.value}`) === 'true';
                    setGlobalBanner({
                        message: data.value,
                        active: data.is_active && !isDismissed,
                        dismissed: isDismissed
                    });
                }
            } catch (error) {
                console.log("No global banner found or error fetching.");
            }
        }

        loadProfile();
        fetchGlobalBanner();

        return () => {
            isMounted = false;
            if (orderChannel) supabase.removeChannel(orderChannel);
            if (complaintChannel) supabase.removeChannel(complaintChannel);
        };
    }, [supabase, router]);

    const dismissBanner = () => {
        setGlobalBanner(prev => ({ ...prev, active: false, dismissed: true }));
        localStorage.setItem(`dismissed_banner_${globalBanner.message}`, 'true');
    };

    const getPageTitle = () => {
        if (pathname === '/dashboard') return "Overview";
        const item = SIDEBAR_ITEMS.find(i => pathname.startsWith(i.href) && i.href !== '/dashboard');
        return item ? item.name : "Dashboard";
    };

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

    // Handle shortcut for Search (CMD+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setIsNotificationOpen(false);
            setIsProfileOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="min-h-screen font-sans selection:bg-orange-500/30">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-6 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-1.5 group">
                        <span className="font-display font-bold text-2xl tracking-tighter text-zinc-900 dark:text-white">kelola</span>
                        <span className="text-orange-500 font-bold text-2xl">.ai</span>
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
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
                                    ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 font-medium"
                                    : "text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 border border-transparent"
                                    }`}>
                                    {isActive && (
                                        <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-5 bg-orange-500 rounded-r-full" />
                                    )}
                                    <Icon size={18} className={isActive ? "text-orange-500" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors"} />
                                    <span className="flex-1 text-sm">{item.name}</span>
                                    {item.highlight && (
                                        <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
                                            POS
                                        </span>
                                    )}
                                    {(item as any).complaint && complaintCount > 0 && (
                                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center shadow-lg shadow-rose-500/30">
                                            {complaintCount > 9 ? "9+" : complaintCount}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* User Profile Card at Bottom */}
                <div className="p-4 mt-auto border-t border-zinc-200 dark:border-zinc-800">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group cursor-pointer relative" onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileOpen(!isProfileOpen);
                    }}>
                        <div className="flex items-center gap-3">
                            {isLoadingAuth ? (
                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                            ) : userAvatar ? (
                                <img src={userAvatar} alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-800" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{userName}</p>
                                    <span className="px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-wider">{subscriptionTier?.toLowerCase() === 'pro' ? 'Pro' : subscriptionTier?.toLowerCase() === 'basic' ? 'Basic' : 'Free'}</span>
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{businessName}</p>
                            </div>
                            <ChevronDown size={14} className={`text-zinc-500 dark:text-zinc-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
                        </div>

                        {/* Profile Context Menu */}
                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: -20, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-1.5 z-[60]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Link href="/dashboard/pengaturan" className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all">
                                        <Settings size={14} /> Pengaturan
                                    </Link>
                                    <Link href="/dashboard/billing" className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all">
                                        <CreditCard size={14} /> Billing & Langganan
                                    </Link>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all mt-1"
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
                
                {/* Global Broadcast Banner */}
                <AnimatePresence>
                    {globalBanner.active && globalBanner.message && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                            className="bg-gradient-to-r from-orange-600 to-rose-600 dark:from-orange-500 dark:to-rose-500 relative z-40 shadow-[0_4px_20px_rgba(234,88,12,0.3)]"
                        >
                            <div className="px-6 py-3 flex items-center justify-between sm:justify-center gap-4 relative">
                                <ThemeToggle />
                                <div className="flex items-center gap-3">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                    </span>
                                    <p className="text-sm font-bold text-white tracking-wide relative z-10 pr-8 sm:pr-0">
                                        {globalBanner.message}
                                    </p>
                                </div>
                                
                                <button 
                                    onClick={dismissBanner}
                                    className="sm:absolute right-4 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white/90 hover:text-white transition-colors z-10"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Top Header */}
                <header className={`sticky top-0 z-30 transition-all duration-200 ${scrolled ? "bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shadow-sm" : "bg-transparent"
                    }`}>

                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-colors">
                                <Menu size={20} />
                            </button>
                            <h1 className="hidden lg:block text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{getPageTitle()}</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Search Bar */}
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (searchQuery.trim()) {
                                    router.push(`/dashboard/pesanan?search=${encodeURIComponent(searchQuery)}`);
                                }
                            }} className="hidden sm:flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 w-64 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500/20 transition-all cursor-text" onClick={() => searchInputRef.current?.focus()}>
                                <Search size={16} className="text-zinc-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari pesanan... (⌘K)"
                                    className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 w-full font-medium"
                                />
                                <div className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-black tracking-widest uppercase border border-zinc-200 dark:border-zinc-700">
                                    ⌘K
                                </div>
                            </form>
                            {/* Theme Toggle & Notifications Dropdown */}
                            <div className="relative flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <ThemeToggle />
                                <button
                                    onClick={() => {
                                        setIsNotificationOpen(!isNotificationOpen);
                                        setIsProfileOpen(false);
                                        if (unreadCount > 0) setUnreadCount(0);
                                    }}
                                    className={`p-2.5 rounded-full transition-all ${isNotificationOpen
                                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-sm"
                                        }`}
                                >
                                    <Bell size={18} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-zinc-950" />
                                    )}
                                </button>

                                <AnimatePresence>
                                    {isNotificationOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 mt-14 w-80 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50"
                                        >
                                            <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                                <h3 className="font-medium text-zinc-900 dark:text-zinc-100 tracking-tight">Notifikasi</h3>
                                                {unreadCount > 0 && (
                                                    <span className="text-xs font-bold text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">{unreadCount} Baru</span>
                                                )}
                                            </div>
                                            <div className="py-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                {notifications.length > 0 ? notifications.map((notif) => {
                                                    const isUnread = notif.status === 'menunggu';
                                                    return (
                                                        <Link href="/dashboard/pesanan" key={notif.id} onClick={() => setIsNotificationOpen(false)} className="flex items-start gap-4 px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                                                            <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isUnread ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700'} group-hover:scale-105 transition-transform`}>
                                                                <ShoppingCart size={18} />
                                                            </div>
                                                            <div>
                                                                <p className={`text-sm tracking-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors ${isUnread ? 'font-bold text-zinc-900 dark:text-zinc-100' : 'font-medium text-zinc-600 dark:text-zinc-400'}`}>
                                                                    Pesanan dari {notif.customer_name}
                                                                </p>
                                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-widest mt-1">
                                                                    {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • Rp {notif.total?.toLocaleString('id-ID')}
                                                                </p>
                                                            </div>
                                                            {isUnread && <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 ml-auto" />}
                                                        </Link>
                                                    );
                                                }) : (
                                                    <div className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm font-medium">Belum ada pesanan terbaru</div>
                                                )}
                                            </div>
                                            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                                                <Link href="/dashboard/pesanan" onClick={() => setIsNotificationOpen(false)} className="block w-full py-3 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest hover:text-orange-600 dark:hover:text-orange-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                                    Lihat semua pesanan
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                        </div>
                    </div>
                </header>

                {/* Page Content with Global Transition */}
                <TrialBanner businessId={businessId} />
                <TrialExpiryModal businessId={businessId} />
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
