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

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled
                    ? "bg-white/80 backdrop-blur-md shadow-sm py-3"
                    : "bg-transparent py-5"
                }`}
        >
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-1 group">
                        <span className="font-display font-bold text-2xl tracking-tight text-text-dark">
                            kelola
                        </span>
                        <span className="text-primary font-bold text-2xl">.ai</span>
                        <div className="w-2 h-2 rounded-full bg-primary mb-1 ml-0.5 group-hover:animate-ping" />
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-text-muted hover:text-primary transition-colors font-medium text-sm"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* CTA & Mobile Toggle */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="#daftar"
                            className="hidden md:inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-primary text-white font-medium text-sm hover:bg-secondary hover:shadow-[0_0_20px_rgba(255,107,43,0.4)] transition-all duration-300"
                        >
                            Coba Gratis
                        </Link>

                        <button
                            className="md:hidden text-text-dark p-2 -mr-2"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-t mt-3 overflow-hidden"
                    >
                        <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-text-dark hover:text-primary font-medium text-lg py-2 border-b border-gray-100"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <Link
                                href="#daftar"
                                onClick={() => setMobileMenuOpen(false)}
                                className="mt-4 flex items-center justify-center w-full px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-secondary transition-colors"
                            >
                                Coba Gratis Sekarang
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
