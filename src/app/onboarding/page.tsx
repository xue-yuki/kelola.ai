"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2,
    Store,
    Phone,
    Loader2,
    Sparkles,
    CheckCircle2,
    Coffee,
    ShoppingBag,
    Laptop,
    Heart,
    Briefcase,
    LayoutGrid,
    ArrowRight,
    ArrowLeft,
    QrCode
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BUSINESS_TYPES = [
    { name: "Makanan & Minuman", icon: Coffee },
    { name: "Fashion & Apparel", icon: ShoppingBag },
    { name: "Elektronik & Gadget", icon: Laptop },
    { name: "Kesehatan & Kecantikan", icon: Heart },
    { name: "Jasa & Konsultasi", icon: Briefcase },
    { name: "Lainnya", icon: LayoutGrid }
];

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [formData, setFormData] = useState({
        businessName: "",
        businessType: "",
        businessDescription: "",
        waNumber: ""
    });
    
    // QR Code state
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [waStatus, setWaStatus] = useState("disconnected");

    useEffect(() => {
        let pollInterval: NodeJS.Timeout;
        if (step === 4) {
            pollInterval = setInterval(async () => {
                try {
                    const res = await fetch('http://localhost:3001/api/qr/1');
                    const data = await res.json();
                    if (data.qr) setQrCode(data.qr);
                    setWaStatus(data.status);

                    if (data.status === 'connected') {
                        clearInterval(pollInterval);
                    }
                } catch (err) {
                    console.error("Agent API error:", err);
                }
            }, 2000);
        }
        return () => clearInterval(pollInterval);
    }, [step]);

    const handleNext = () => setStep((s) => Math.min(s + 1, 4));
    const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLoadingMessage("Mendaftarkan bisnismu...");

        try {
            // 1. Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error("Gagal mengambil data user");

            // 2. Insert into businesses table
            const { data: businessData, error: businessError } = await supabase
                .from('businesses')
                .insert([
                    {
                        user_id: user.id,
                        business_name: formData.businessName,
                        business_type: formData.businessType,
                        wa_number: formData.waNumber,
                    }
                ])
                .select()
                .single();

            if (businessError) throw businessError;

            // 3. AI Auto-generate dummy products via OpenRouter
            setLoadingMessage("AI sedang membuat katalog produk...");

            const aiResponse = await fetch('/api/generate-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId: businessData.id,
                    businessName: formData.businessName,
                    businessType: formData.businessType,
                    businessDescription: formData.businessDescription
                })
            });

            if (!aiResponse.ok) {
                console.error("AI Generation failed, falling back to basic data...");
            }

            setLoadingMessage("Selesai! Menyiapkan QR WhatsApp...");
            await new Promise((resolve) => setTimeout(resolve, 800)); // Brief pause for UX

            setIsLoading(false);
            setStep(4);

        } catch (error: any) {
            console.error("Onboarding Error:", error);
            alert("Terjadi kesalahan: " + error.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[100dvh] w-full bg-[#050505] flex flex-col lg:flex-row overflow-hidden font-sans selection:bg-orange-500/30">
            {/* Left Panel: Cover & Progress (Full Screen Height) */}
            <div className="relative lg:w-5/12 min-h-[25vh] lg:min-h-full flex flex-col justify-between p-6 lg:p-12 xl:p-16 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5 bg-[#0a0a0a]">
                {/* Immersive Background Canvas */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-[#0a0a0a]" />
                    <motion.div
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-[30%] -right-[20%] w-[80vw] lg:w-[40vw] h-[80vw] lg:h-[40vw] bg-rose-500/20 rounded-full blur-[140px] mix-blend-screen"
                    />
                    <motion.div
                        animate={{ rotate: -360, scale: [1, 1.3, 1] }}
                        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-[20%] -left-[20%] w-[80vw] lg:w-[40vw] h-[80vw] lg:h-[40vw] bg-orange-500/20 rounded-full blur-[140px] mix-blend-screen"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505]/80" />
                </div>

                {/* Left Content */}
                <div className="relative z-20 flex-1 flex flex-col">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center">
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <span className="font-bold text-white tracking-widest text-sm xl:text-base">
                            kelola<span className="text-orange-500">.ai</span>
                        </span>
                    </div>

                    <div className="mt-auto mb-auto py-12 lg:py-0">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight"
                        >
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">
                                Ekspansi
                            </span>
                            <br />
                            Bisnismu
                            <br />
                            Dimulai.
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-white/50 text-lg xl:text-xl max-w-sm font-medium"
                        >
                            Hanya butuh tiga langkah untuk mengatur asisten AI dan sistem operasional pertamamu.
                        </motion.p>
                    </div>

                    <div className="hidden lg:block">
                        <p className="text-white/30 text-sm font-semibold uppercase tracking-widest mb-4">Langkah {step} dari 4</p>
                        <div className="flex items-center gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="relative flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            width: step > i ? "100%" : step === i ? "100%" : "0%",
                                        }}
                                        className={`absolute inset-y-0 left-0 rounded-full ${step >= i
                                                ? 'bg-gradient-to-r from-orange-500 to-rose-500 shadow-[0_0_15px_rgba(249,115,22,0.8)]'
                                                : ''
                                            }`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Full Screen Form area */}
            <div className="relative lg:w-7/12 flex-1 flex flex-col justify-center bg-[#050505] p-6 sm:p-8 lg:p-12 overflow-y-auto">
                {/* Mobile progress indicator */}
                <div className="lg:hidden mb-12">
                    <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">Langkah {step} dari 4</p>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={false}
                                    animate={{ width: step >= i ? "100%" : "0%" }}
                                    className="h-full bg-gradient-to-r from-orange-500 to-rose-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full max-w-2xl mx-auto xl:mx-0">
                    <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
                        <AnimatePresence mode="wait">

                            {/* Step 1 */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="mb-6">
                                        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4 text-orange-400">
                                            <Building2 size={32} />
                                        </div>
                                        <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">Siapa nama bisnismu?</h3>
                                        <p className="text-white/40 text-base sm:text-lg">Gunakan nama yang mudah diingat dan diucapkan pelanggan.</p>
                                    </div>

                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-white/30 group-focus-within/input:text-orange-400 transition-colors z-10">
                                            <Store size={24} />
                                        </div>
                                        <input
                                            required
                                            autoFocus
                                            type="text"
                                            value={formData.businessName}
                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                            placeholder="Cth: Kopi Senja"
                                            className="block w-full pl-16 pr-6 py-6 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all font-medium text-xl sm:text-2xl shadow-inner relative z-0"
                                        />
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={!formData.businessName.trim()}
                                            className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95 disabled:hover:scale-100"
                                        >
                                            Lanjutkan <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2 */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="mb-6">
                                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Pilih Kategori Bisnis</h3>
                                        <p className="text-white/40">Bantu kami menyesuaikan AI untukmu.</p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                        {BUSINESS_TYPES.map((type) => {
                                            const Icon = type.icon;
                                            const isSelected = formData.businessType === type.name;
                                            return (
                                                <motion.button
                                                    key={type.name}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, businessType: type.name })}
                                                    className={`relative p-5 sm:p-6 rounded-2xl border text-left flex flex-col items-start gap-4 transition-all duration-300 ${isSelected
                                                            ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/50'
                                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
                                                        }`}
                                                >
                                                    <div className={`p-3 rounded-xl transition-colors ${isSelected ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white/10 text-white/60'}`}>
                                                        <Icon size={24} />
                                                    </div>
                                                    <span className={`font-semibold text-sm sm:text-base leading-tight mt-1 ${isSelected ? 'text-orange-400' : 'text-white/80'}`}>{type.name}</span>
                                                    {isSelected && (
                                                        <motion.div layoutId="check" className="absolute top-5 right-5 text-orange-400">
                                                            <CheckCircle2 size={20} />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    <AnimatePresence mode="popLayout">
                                        {formData.businessType && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, height: 0 }}
                                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                                exit={{ opacity: 0, y: -10, height: 0 }}
                                                className="space-y-4 pt-6 mt-6 border-t border-white/5 overflow-hidden"
                                            >
                                                <label className="text-base sm:text-lg font-bold text-white block">Deskripsikan produk/layananmu ✨</label>
                                                <div className="relative group/input">
                                                    <textarea
                                                        value={formData.businessDescription}
                                                        onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                                                        placeholder="Cth: Kami menjual kopi susu kekinian, matcha latte, dan toast bakar dengan berbagai varian rasa..."
                                                        rows={2}
                                                        className="block w-full p-4 sm:p-5 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all font-medium resize-none shadow-inner text-base lg:text-lg min-h-[100px]"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-6 gap-4">
                                        <button
                                            type="button"
                                            onClick={handlePrev}
                                            className="w-full sm:w-auto flex justify-center items-center gap-2 text-white/50 hover:text-white font-semibold transition-colors py-4 px-6"
                                        >
                                            <ArrowLeft size={20} /> Kembali
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={!formData.businessType || !formData.businessDescription.trim()}
                                            className="group w-full sm:w-auto flex justify-center items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all disabled:opacity-50 hover:scale-[1.02] disabled:hover:scale-100"
                                        >
                                            Lanjutkan <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3 */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="mb-6">
                                        <div className="w-16 h-16 bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl flex items-center justify-center mb-4 text-[#25D366]">
                                            <Phone size={32} />
                                        </div>
                                        <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">Nomor WhatsApp Bisnis</h3>
                                        <p className="text-white/40 text-base sm:text-lg">Nomor HP yang dihubungkan untuk menerima order otomatis.</p>
                                    </div>

                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-white/30 group-focus-within/input:text-[#25D366] transition-colors z-10 w-auto border-r border-white/10 pr-4">
                                            <span className="font-bold text-xl sm:text-2xl mt-0.5">+62</span>
                                        </div>
                                        <input
                                            required
                                            autoFocus
                                            type="tel"
                                            value={formData.waNumber}
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/\D/g, '');
                                                if (val.startsWith('62')) val = val.substring(2);
                                                if (val.startsWith('0')) val = val.substring(1);
                                                setFormData({ ...formData, waNumber: val })
                                            }}
                                            placeholder="812 3456 7890"
                                            className="block w-full pl-[5.5rem] sm:pl-[6rem] pr-6 py-6 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366]/50 transition-all font-medium text-xl sm:text-2xl tracking-widest shadow-inner"
                                        />
                                    </div>

                                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-10 gap-4">
                                        <button
                                            type="button"
                                            onClick={handlePrev}
                                            disabled={isLoading}
                                            className="w-full sm:w-auto flex justify-center items-center gap-2 text-white/50 hover:text-white font-semibold transition-colors disabled:opacity-50 py-4 px-6"
                                        >
                                            <ArrowLeft size={20} /> Kembali
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={!formData.waNumber.trim() || isLoading}
                                            className="group w-full sm:w-auto relative flex justify-center items-center gap-3 bg-gradient-to-r from-orange-500 to-rose-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95 disabled:hover:scale-100 overflow-hidden"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center gap-3">
                                                    <Loader2 className="animate-spin" size={24} />
                                                    Menyimpan...
                                                </span>
                                            ) : (
                                                <>
                                                    Lanjutkan <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {isLoading && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex justify-center"
                                        >
                                            <p className="inline-flex items-center gap-2 text-sm font-medium text-orange-400 bg-orange-500/10 px-4 py-2 rounded-full mt-4">
                                                <Sparkles size={16} /> {loadingMessage}
                                            </p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* Step 4: WhatsApp QR */}
                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="mb-6">
                                        <div className="w-16 h-16 bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl flex items-center justify-center mb-4 text-[#25D366]">
                                            <QrCode size={32} />
                                        </div>
                                        <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">Tautkan Kelola.ai ke WhatsApp</h3>
                                        <p className="text-white/40 text-base sm:text-lg">Buka WhatsApp di HP Anda {'>'} Perangkat Tertaut {'>'} Tautkan Perangkat. Lalu scan kode QR di bawah ini.</p>
                                    </div>

                                    <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-[2rem] relative min-h-[360px]">
                                        {waStatus === 'connected' ? (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4">
                                                <div className="w-24 h-24 bg-[#25D366]/20 text-[#25D366] rounded-full flex items-center justify-center border border-[#25D366]/30">
                                                    <CheckCircle2 size={48} />
                                                </div>
                                                <span className="text-2xl font-bold text-white mt-4 tracking-tight">WhatsApp Terhubung!</span>
                                                <p className="text-[#25D366] font-medium text-center">Asisten AI Anda siap melayani pelanggan kapan saja.</p>
                                            </motion.div>
                                        ) : qrCode ? (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-6">
                                                <div className="p-4 bg-white rounded-3xl shadow-[0_0_50px_rgba(37,211,102,0.15)] ring-8 ring-white/5 relative overflow-hidden">
                                                    {/* Scanning animation overlay */}
                                                    <motion.div 
                                                        animate={{ top: ['0%', '100%', '0%'] }} 
                                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} 
                                                        className="absolute inset-x-0 h-1 bg-[#25D366] shadow-[0_0_20px_#25d366]" 
                                                    />
                                                    <img src={qrCode} alt="WhatsApp QR Code" className="w-60 h-60 object-contain relative z-10" />
                                                </div>
                                                <p className="text-white/50 text-sm font-medium flex items-center gap-2">
                                                    <Loader2 size={16} className="animate-spin text-orange-400" /> Sedang menunggu koneksi...
                                                </p>
                                            </motion.div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-4 text-white/50">
                                                <Loader2 size={32} className="animate-spin text-[#25D366]" />
                                                <span className="font-medium text-lg">Memuat QR Code...</span>
                                                <span className="text-sm">Pastikan Agent sedang berjalan di background.</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-10 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => router.push("/dashboard")}
                                            className="w-full sm:w-auto flex justify-center items-center gap-2 text-white/50 hover:text-white font-semibold transition-colors py-4 px-6"
                                        >
                                            {waStatus === 'connected' ? '' : 'Lewati (Nanti Saja)'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => router.push("/dashboard")}
                                            className="group w-full sm:w-auto relative flex justify-center items-center gap-3 bg-gradient-to-r from-orange-500 to-rose-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
                                        >
                                            Mulai Dashboard <Sparkles size={22} className="group-hover:animate-pulse" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>
            </div>
        </div>
    );
}
