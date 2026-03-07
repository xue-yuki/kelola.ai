"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Store, Phone, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BUSINESS_TYPES = [
    "Makanan & Minuman",
    "Fashion & Apparel",
    "Elektronik & Gadget",
    "Kesehatan & Kecantikan",
    "Jasa & Konsultasi",
    "Lainnya"
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
        waNumber: ""
    });

    const handleNext = () => setStep((s) => Math.min(s + 1, 3));
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

            // 3. Optional: AI Auto-generate dummy products
            // Using a simple mock logic here for immediate visual feedback, 
            // In production, this would call a real LLM API endpoint.
            setLoadingMessage("AI sedang membuat katalog produk...");
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI delay

            const dummyProducts = generateDummyProducts(formData.businessType, businessData.id);
            if (dummyProducts.length > 0) {
                const { error: productsError } = await supabase
                    .from('products')
                    .insert(dummyProducts);
                if (productsError) console.error("Failed to insert dummy products:", productsError);
            }

            setLoadingMessage("Selesai! Mengarahkan ke Dashboard...");
            await new Promise(resolve => setTimeout(resolve, 800)); // Brief pause for UX

            router.push("/dashboard");

        } catch (error: any) {
            console.error("Onboarding Error:", error);
            alert("Terjadi kesalahan: " + error.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-orange-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] mix-blend-screen" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl relative inset-0 z-10"
            >
                <div className="p-[1px] rounded-3xl bg-gradient-to-b from-white/10 to-white/0 overflow-hidden">
                    <div className="bg-[#111] backdrop-blur-2xl rounded-[23px] p-8 md:p-12 relative overflow-hidden">

                        {/* Progress Header */}
                        <div className="mb-10">
                            <div className="flex justify-center mb-6">
                                <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2">
                                    <Sparkles size={14} /> Kelola.ai Onboarding
                                </span>
                            </div>
                            <h2 className="text-3xl font-black text-white text-center mb-2">Mari Mulai!</h2>
                            <p className="text-white/40 text-center font-medium">Lengkapi profil bisnismu dalam 3 langkah cepat.</p>

                            <div className="flex items-center justify-center gap-2 mt-8">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-16 bg-gradient-to-r from-orange-500 to-rose-500' : i < step ? 'w-8 bg-white/40' : 'w-8 bg-white/10'}`} />
                                ))}
                            </div>
                        </div>

                        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>

                            {/* Step 1 */}
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-xl font-bold text-white block">Siapa nama bisnis kamu?</label>
                                        <div className="relative group/input">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within/input:text-orange-400">
                                                <Building2 size={24} />
                                            </div>
                                            <input
                                                required
                                                autoFocus
                                                type="text"
                                                value={formData.businessName}
                                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                                placeholder="Contoh: Kopi Senja"
                                                className="block w-full pl-12 pr-4 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all font-medium text-lg"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={!formData.businessName.trim()}
                                        className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                                    >
                                        Lanjut
                                    </button>
                                </motion.div>
                            )}

                            {/* Step 2 */}
                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-xl font-bold text-white block">Kamu jualan apa nih?</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {BUSINESS_TYPES.map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, businessType: type })}
                                                    className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${formData.businessType === type
                                                            ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                                                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                                        }`}
                                                >
                                                    <span className="font-semibold">{type}</span>
                                                    {formData.businessType === type && <CheckCircle2 size={18} className="text-orange-500" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={handlePrev} className="px-6 bg-white/5 text-white py-4 rounded-2xl font-bold hover:bg-white/10 transition-colors">
                                            Kembali
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={!formData.businessType}
                                            className="flex-1 bg-white text-black py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                                        >
                                            Lanjut
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3 */}
                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-xl font-bold text-white block">Nomor WhatsApp Bisnis</label>
                                        <p className="text-white/40 text-sm -mt-2">Digunakan untuk kirim broadcast & notifikasi pelanggan.</p>
                                        <div className="relative group/input">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within/input:text-orange-400">
                                                <Phone size={24} />
                                            </div>
                                            <input
                                                required
                                                autoFocus
                                                type="tel"
                                                value={formData.waNumber}
                                                onChange={(e) => setFormData({ ...formData, waNumber: e.target.value })}
                                                placeholder="Contoh: 081234567890"
                                                className="block w-full pl-12 pr-4 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all font-medium text-lg"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={handlePrev} className="px-6 bg-white/5 text-white py-4 rounded-2xl font-bold hover:bg-white/10 transition-colors" disabled={isLoading}>
                                            Kembali
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!formData.waNumber.trim() || isLoading}
                                            className="flex-1 relative group/btn overflow-hidden rounded-2xl transition-all disabled:opacity-50"
                                        >
                                            <span className="absolute inset-0 bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500 opacity-80" />
                                            <span className="relative w-full flex flex-col items-center justify-center bg-[#111] py-3 text-white font-bold group-hover/btn:bg-transparent transition-all min-h-[56px] rounded-[15px] m-[1px]">
                                                {isLoading ? (
                                                    <span className="flex items-center gap-2 text-sm text-center">
                                                        <Loader2 className="animate-spin" size={16} />
                                                        {loadingMessage}
                                                    </span>
                                                ) : (
                                                    "Selesai & Masuk Dashboard"
                                                )}
                                            </span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// Helper to generate mock AI catalog
function generateDummyProducts(businessType: string, businessId: string) {
    const products = [];
    if (businessType === "Makanan & Minuman") {
        products.push(
            { business_id: businessId, name: "Kopi Susu Aren", price: 20000, cost_price: 10000, stock: 50 },
            { business_id: businessId, name: "Americano Dingin", price: 18000, cost_price: 8000, stock: 50 },
            { business_id: businessId, name: "Roti Bakar Coklat", price: 25000, cost_price: 12000, stock: 30 },
            { business_id: businessId, name: "Nasi Goreng Spesial", price: 35000, cost_price: 18000, stock: 40 },
            { business_id: businessId, name: "Teh Manis Dingin", price: 8000, cost_price: 3000, stock: 100 }
        );
    } else if (businessType === "Fashion & Apparel") {
        products.push(
            { business_id: businessId, name: "Kaos Polos Hitam", price: 75000, cost_price: 40000, stock: 100 },
            { business_id: businessId, name: "Kemeja Flanel Kotak", price: 150000, cost_price: 80000, stock: 50 },
            { business_id: businessId, name: "Celana Chino Cream", price: 180000, cost_price: 90000, stock: 45 },
            { business_id: businessId, name: "Jaket Denim Basic", price: 250000, cost_price: 150000, stock: 20 },
            { business_id: businessId, name: "Topi Baseball Hitam", price: 50000, cost_price: 25000, stock: 60 }
        );
    } else {
        products.push(
            { business_id: businessId, name: "Produk Unggulan 1", price: 100000, cost_price: 50000, stock: 10 },
            { business_id: businessId, name: "Produk Hemat 2", price: 50000, cost_price: 25000, stock: 20 },
            { business_id: businessId, name: "Paket Bundle 3", price: 250000, cost_price: 150000, stock: 5 },
            { business_id: businessId, name: "Aksesoris 4", price: 25000, cost_price: 10000, stock: 50 },
            { business_id: businessId, name: "Layanan Ekstra", price: 75000, cost_price: 0, stock: 100 }
        );
    }
    return products;
}
