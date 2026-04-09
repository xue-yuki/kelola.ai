"use client";

import { useState, useEffect } from "react";
import { Bot, Save, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AsistenAIPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [instructions, setInstructions] = useState("");
    const [activeInstructions, setActiveInstructions] = useState("");
    const [businessId, setBusinessId] = useState<string | null>(null);

    useEffect(() => {
        fetchInstructions();
    }, []);

    const fetchInstructions = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: business } = await supabase
                .from('businesses')
                .select('id, ai_instructions')
                .eq('user_id', session.user.id)
                .single();

            if (business) {
                setBusinessId(business.id);
                setInstructions(business.ai_instructions || "");
                setActiveInstructions(business.ai_instructions || "");
            }
        } catch (error) {
            console.error("Error fetching AI instructions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!businessId) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('businesses')
                .update({ ai_instructions: instructions })
                .eq('id', businessId);

            if (error) throw error;

            setActiveInstructions(instructions);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving instructions:", error);
            alert("Gagal menyimpan instruksi AI.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin w-12 h-12 text-orange-400" />
                <p className="font-black text-white/30 text-[10px] uppercase tracking-widest">Memuat AI...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            {/* Page Header */}
            <div>
                <h1 className="text-[32px] font-bold text-white/90 tracking-tight flex items-center gap-3">
                    <Bot className="text-orange-400" size={32} />
                    Asisten AI
                </h1>
                <p className="text-white/40 font-medium mt-1">Atur kepribadian dan perilaku AI yang melayani pelangganmu.</p>
            </div>

            {/* Main Card */}
            <div className="bg-[#161616] border border-white/5 rounded-[32px] shadow-2xl overflow-hidden p-8 sm:p-10">
                <div className="mb-6">
                    <h2 className="font-bold text-xl text-white/90 tracking-tight">Instruksi AI Kamu</h2>
                    <p className="text-sm font-medium text-white/40 mt-1">
                        Ceritakan ke AI kamu siapa dia dan bagaimana cara melayani pelangganmu. Tulis dengan bahasa natural seperti berbicara ke karyawan baru.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className="w-full min-h-[12rem] bg-[#1a1a1a] border border-white/10 text-white rounded-2xl p-6 text-sm focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all outline-none resize-y"
                            placeholder="Contoh: Kamu adalah kasir warung mie ayam Bu Siti. Jam operasional dari jam 7 pagi sampai 9 malam. Selalu sapa pelanggan dengan ramah, tanyakan nama dan alamat sebelum memproses pesanan. Gunakan bahasa santai dan friendly."
                        />
                        <p className="text-xs font-medium text-amber-500/80 px-2 italic">
                            💡 Kosongkan untuk menggunakan instruksi default Kelola.ai
                        </p>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/5">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`w-full sm:w-auto px-8 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${
                                saveSuccess
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 translate-y-[-2px]'
                                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20 disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none'
                            }`}
                        >
                            {isSaving ? <Loader2 className="animate-spin text-white" size={18} /> : saveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                            {isSaving ? 'Menyimpan...' : saveSuccess ? 'Instruksi AI berhasil disimpan! 🤖' : 'Simpan Instruksi'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Card */}
            <div className="bg-[#161616] border border-white/5 rounded-[32px] p-8 sm:p-10 flex flex-col items-start gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                     <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        Aktif
                    </div>
                </div>

                <div className="w-full">
                    <h3 className="font-bold text-lg text-white/90 tracking-tight flex items-center gap-2">
                        📋 Instruksi Aktif Saat Ini
                    </h3>
                    
                    <div className="mt-6 bg-black/40 border border-white/5 rounded-2xl p-6 relative group">
                        {activeInstructions ? (
                            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                                {activeInstructions}
                            </p>
                        ) : (
                            <p className="text-sm text-white/30 italic font-medium">
                                Menggunakan instruksi default Kelola.ai
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
