import Link from "next/link";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-text-dark pt-20 pb-10 text-white/80">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
                    {/* Brand Col */}
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-1 mb-4">
                            <span className="font-display font-bold text-2xl tracking-tight text-white">
                                kelola
                            </span>
                            <span className="text-primary font-bold text-2xl">.ai</span>
                        </Link>
                        <p className="text-white/60 mb-6 max-w-sm">
                            Satu Platform, Bisnis Lokal Makin Pintar. Kelola pesanan, stok, dan kasir dengan bantuan AI yang dirancang khusus untuk UMKM Indonesia.
                        </p>
                        <div className="flex items-center gap-4">
                            <SocialLink href="#" icon={<Instagram size={20} />} />
                            <SocialLink href="#" icon={<Facebook size={20} />} />
                            <SocialLink href="#" icon={<Twitter size={20} />} />
                            <SocialLink href="#" icon={<Linkedin size={20} />} />
                        </div>
                    </div>

                    {/* Links Col 1 */}
                    <div>
                        <h4 className="text-white font-medium text-lg mb-6">Produk</h4>
                        <ul className="flex flex-col gap-4">
                            <FooterLink href="#fitur">Fitur Utama</FooterLink>
                            <FooterLink href="#harga">Harga</FooterLink>
                            <FooterLink href="#demo">Lihat Demo</FooterLink>
                            <FooterLink href="#">Update Terbaru</FooterLink>
                        </ul>
                    </div>

                    {/* Links Col 2 */}
                    <div>
                        <h4 className="text-white font-medium text-lg mb-6">Perusahaan</h4>
                        <ul className="flex flex-col gap-4">
                            <FooterLink href="#tentang">Tentang Kami</FooterLink>
                            <FooterLink href="#">Kontak Support</FooterLink>
                            <FooterLink href="#">Kebijakan Privasi</FooterLink>
                            <FooterLink href="#">Syarat & Ketentuan</FooterLink>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-white/50">
                        &copy; {currentYear} Kelola.ai. Hak Cipta Dilindungi.
                    </p>
                    <p className="text-sm text-white/50 flex items-center gap-1">
                        Dibuat <span className="text-primary">oleh</span> Erlangga
                    </p>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
    return (
        <a
            href={href}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-primary hover:text-white transition-all duration-300"
        >
            {icon}
        </a>
    );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <li>
            <Link href={href} className="text-white/60 hover:text-white transition-colors">
                {children}
            </Link>
        </li>
    );
}
