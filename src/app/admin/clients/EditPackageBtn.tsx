"use client";

import { useState } from "react";
import { Edit2, Loader2, RefreshCw } from "lucide-react";
import { updateBusinessPackageAction } from "../actions";

export default function EditPackageBtn({ businessId, currentTier }: { businessId: string, currentTier?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTier, setSelectedTier] = useState(currentTier || 'Starter');
    const [resetToken, setResetToken] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateBusinessPackageAction(businessId, selectedTier, resetToken);
            setIsOpen(false);
            setResetToken(false);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors border border-primary/20 text-xs font-bold shadow-sm"
            >
                <Edit2 size={14} /> Atur
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-xl p-4 z-50">
                        <h4 className="font-bold text-text-dark text-sm mb-3">Ubah Paket Berlangganan</h4>
                        
                        <div className="space-y-2 mb-4">
                            {['Starter', 'Basic', 'Pro'].map((t) => (
                                <label key={t} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors ${selectedTier === t ? 'bg-primary/10 border-primary/30' : 'border-gray-100 hover:bg-gray-50'}`}>
                                    <input 
                                        type="radio" 
                                        name="tier" 
                                        value={t} 
                                        checked={selectedTier === t} 
                                        onChange={() => setSelectedTier(t)}
                                        className="accent-primary"
                                    />
                                    <span className={`text-sm ${selectedTier === t ? 'text-primary font-bold' : 'text-text-muted font-medium'}`}>{t}</span>
                                </label>
                            ))}
                        </div>

                        <label className="flex items-start gap-2 mb-4 text-xs text-text-muted cursor-pointer p-2 bg-red-50 rounded-lg border border-red-100 group transition-colors">
                            <input 
                                type="checkbox" 
                                checked={resetToken} 
                                onChange={(e) => setResetToken(e.target.checked)} 
                                className="mt-0.5 accent-red-500"
                            />
                            <span className="group-hover:text-text-dark transition-colors">
                                <b className="text-red-500">Reset Token?</b> Centang jika ini siklus tagihan baru.
                            </span>
                        </label>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="flex-1 py-2 text-xs font-bold text-text-muted hover:bg-gray-100 rounded-lg transition-all"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 py-2 bg-primary hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : "Simpan"}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
