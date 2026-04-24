"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { forceDeleteBusinessAction } from "../actions";

export default function DeleteClientBtn({ businessId, businessName }: { businessId: string, businessName: string }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`TANDA BAHAYA: Apakah Anda yakin ingin mematikan dan manghapus seluruh data milik merchant "${businessName}"? Aksi ini permanen!`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await forceDeleteBusinessAction(businessId);
            // Toast / Alert could be added here, but revalidatePath will refresh the table.
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-200 disabled:opacity-50 text-xs font-bold shadow-sm"
        >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {isDeleting ? "Menghapus..." : "Hapus"}
        </button>
    );
}
