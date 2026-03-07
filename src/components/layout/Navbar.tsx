"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
    { name: "Fitur", href: "#fitur" },
    { name: "Harga", href: "#harga" },
    { name: "Demo", href: "#demo" },
    { name: "Tentang", href: "#tentang" },
];

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("");

    // Handle scroll effect and active section tracking
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);

            // Simple active section detection based on scroll position
            const sections = navLinks.map(link => link.href.substring(1));

            for (const section of sections.reverse()) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 100) {
                        setActiveSection(`#${section}`);
                        return;
                    }
                }
            }
            if (window.scrollY < 100) setActiveSection("");
        };

        window.addEventListener("scroll", handleScroll);
        // Initial check
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Scroll to section smoothly
    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        // Only prevent default if it's an internal hash link
        if (href.startsWith("#")) {
            e.preventDefault();
            const targetId = href.substring(1);
            const element = document.getElementById(targetId);

            if (element) {
                const offsetTop = element.offsetTop - 80; // Account for navbar height
                window.scrollTo({
                    top: offsetTop,
                    behavior: "smooth"
                });
            }
            setMobileMenuOpen(false);
        }
    };

    return (
        <header className="fixed top-0 inset-x-0 z-50 flex justify-center w-full pt-4 md:pt-6 pointer-events-none px-4">
            {/* Desktop Navbar (Pill shape) */}
            <motion.div
                className={`pointer-events-auto flex items-center justify-between transition-all duration-500 rounded-[2rem] border overflow-hidden ${isScrolled
                    ? "bg-[#111111]/80 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-5xl px-6 py-3"
                    : "bg-transparent border-transparent w-full max-w-7xl px-4 py-2"
                    }`}
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
                {/* Logo */}
                <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-1 group relative z-10 w-28">
                    <span className={`font-display font-bold text-2xl tracking-tight transition-colors duration-300 ${isScrolled ? 'text-white' : 'text-text-dark'}`}>
                        kelola
                    </span>
                    <span className="text-primary font-bold text-2xl">.ai</span>
                </Link>

                {/* Desktop Nav Links */}
                <nav className="hidden md:flex items-center justify-center gap-1 relative z-10">
                    {navLinks.map((link) => {
                        const isActive = activeSection === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={(e) => scrollToSection(e, link.href)}
                                className={`relative px-5 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${isActive
                                    ? "text-white"
                                    : isScrolled ? "text-white/60 hover:text-white" : "text-text-muted hover:text-text-dark"
                                    }`}
                            >
                                <span className="relative z-10">{link.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="navbar-indicator"
                                        className="absolute inset-0 bg-white/10 border border-white/5 rounded-full -z-0"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* CTA Desktop */}
                <div className="hidden md:flex items-center justify-end gap-6 relative z-10 pr-2">
                    <Link
                        href="/login"
                        className={`text-sm font-medium transition-colors ${isScrolled ? "text-white/60 hover:text-white" : "text-text-muted hover:text-text-dark"
                            }`}
                    >
                        Masuk
                    </Link>
                    <Link
                        href="/register"
                        className="group relative inline-flex items-center justify-center p-[2px] rounded-full overflow-hidden font-medium text-sm transition-transform active:scale-95"
                    >
                        {/* Animated Border Glow */}
                        <span className="absolute inset-0 bg-gradient-to-r from-orange-400 via-rose-400 to-orange-400 opacity-70 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" />

                        {/* Inner Button Canvas */}
                        <span className="relative flex items-center justify-center bg-[#161616] px-6 py-2 rounded-full transition-all duration-300 group-hover:bg-[#111] w-full">
                            {/* Inner Shimmer */}
                            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shimmer pointer-events-none rounded-full" />

                            <span className="relative text-white font-semibold flex items-center gap-1">
                                Daftar
                                <motion.span
                                    className="text-orange-400"
                                    initial={{ x: 0 }}
                                    whileHover={{ x: 3 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    &rarr;
                                </motion.span>
                            </span>
                        </span>

                        {/* Background subtle glow */}
                        <span className="absolute -inset-2 bg-orange-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10" />
                    </Link>
                </div>

                {/* Mobile Toggle Button */}
                <div className="md:hidden flex items-center relative z-10">
                    <button
                        className={`p-2 rounded-full transition-colors ${isScrolled
                            ? "text-white hover:bg-white/10"
                            : "text-text-dark hover:bg-gray-100"
                            }`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle mobile menu"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </motion.div>

            {/* Mobile Menu Fullscreen Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="pointer-events-auto absolute top-20 inset-x-4 md:hidden bg-[#161616]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-40"
                    >
                        <div className="flex flex-col p-6">
                            <div className="space-y-1 mb-8">
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={(e) => scrollToSection(e, link.href)}
                                            className="block py-4 text-xl font-medium text-white/80 hover:text-white border-b border-white/5 active:bg-white/5 rounded-lg px-2"
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-col gap-4 mt-8"
                            >
                                <Link
                                    href="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-center w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 text-white font-semibold text-lg hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-shadow"
                                >
                                    Daftar Sekarang
                                </Link>
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-center w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-lg"
                                >
                                    Masuk ke Akun
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
