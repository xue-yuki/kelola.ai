"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings, Shield, Menu, X, ArrowLeft, MessageSquareCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ADMIN_LINKS = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Kelola Klien", href: "/admin/clients", icon: Users },
    { name: "Logs AI Chat", href: "/admin/logs", icon: MessageSquareCode },
    { name: "Sistem Ops", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield size={20} className="text-primary" />
                    <span className="font-bold tracking-tight text-text-dark">Super Admin</span>
                </div>
                <button onClick={() => setIsOpen(true)} className="p-2 bg-gray-50 rounded-lg text-text-muted hover:text-primary border border-gray-200">
                    <Menu size={20} />
                </button>
            </div>

            {/* Backdrop overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-40 bg-text-dark/40 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`fixed lg:sticky top-0 left-0 z-50 h-[100dvh] w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-lg lg:shadow-none ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="p-6 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                            <Shield size={18} />
                        </div>
                        <div>
                            <span className="block font-bold text-lg tracking-tight text-text-dark leading-none">Kelola.ai<span className="text-primary ml-1 text-sm">Admin</span></span>
                            <span className="block text-[10px] text-text-muted uppercase tracking-widest mt-1">Platform Control</span>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden p-1.5 bg-gray-50 rounded-md text-text-muted hover:text-text-dark">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    <p className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-text-muted/60 mb-2">Menu Utama</p>
                    {ADMIN_LINKS.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive 
                                    ? "bg-primary/10 text-primary font-bold border border-primary/20 shadow-sm" 
                                    : "text-text-muted font-medium hover:bg-gray-50 hover:text-text-dark"
                                }`}>
                                    <Icon size={18} />
                                    <span className="text-sm">{link.name}</span>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-gray-100">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center mb-4">
                        <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1">Logged in as</p>
                        <p className="text-xs text-text-dark font-bold truncate">{userEmail}</p>
                    </div>

                    <Link href="/dashboard" className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-text-muted bg-white hover:bg-gray-50 hover:text-text-dark font-bold text-sm transition-all border border-gray-200">
                        <ArrowLeft size={16} /> Keluar Admin
                    </Link>
                </div>
            </motion.aside>
        </>
    );
}
