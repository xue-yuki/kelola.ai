// Normalisasi nomor WhatsApp Indonesia ke format kanonik "62XXXXXXXXXX" (tanpa +),
// sesuai format yang dipakai agent (kelola-agent) untuk mencocokkan bisnis via wa_number.
// Contoh: "08123" -> "628123", "8123" -> "628123", "628123" -> "628123".
export function normalizeWa(input: string): string {
    const v = String(input || "").replace(/\D/g, "");
    if (!v) return "";
    if (v.startsWith("62")) return v;
    if (v.startsWith("0")) return "62" + v.slice(1);
    if (v.startsWith("8")) return "62" + v;
    return v;
}
