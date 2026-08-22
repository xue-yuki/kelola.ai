// LLM caller — AI-PaaS Claude Haiku 4.5

const AI_URL = process.env.AI_PAAS_URL || "https://ai.paas.id/v1/chat/completions";
const AI_MODEL = process.env.AI_PAAS_MODEL || "claude-haiku-4-5";
const AI_KEY = process.env.AI_PAAS_API_KEY || "";

export async function callLLM({
    system,
    user,
    maxTokens = 800,
}: {
    system: string;
    user: string;
    maxTokens?: number;
}): Promise<string> {
    if (!AI_KEY) throw new Error("AI_PAAS_API_KEY belum diset di .env");

    const res = await fetch(AI_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${AI_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: AI_MODEL,
            max_tokens: maxTokens,
            messages: [
                { role: "system", content: system },
                { role: "user", content: user },
            ],
        }),
    });

    const data = await res.json();
    if (!res.ok || !data.choices?.[0]?.message?.content) {
        throw new Error(`LLM error: ${JSON.stringify(data).slice(0, 300)}`);
    }
    return data.choices[0].message.content as string;
}

export const SYSTEM_PROMPT_ANALYST = `Kamu adalah "Kelola AI" — analis bisnis untuk UMKM Indonesia yang ramah dan langsung ke inti.

ATURAN KETAT:
- JANGAN mengarang angka. Semua angka HARUS berasal dari data yang aku berikan.
- Jawab dalam Bahasa Indonesia santai (bukan formal, bukan slang berlebihan).
- Format: 1-2 paragraf pendek, langsung ke inti, natural — JANGAN pakai bullet points, JANGAN pakai heading markdown.
- Jangan mulai dengan "Berdasarkan data..." atau "Menurut analisis...". Langsung ke jawabannya.
- Boleh pakai 1-2 emoji yang relevan (opsional).
- Kalau data kosong / minim, kasih tips memulai yang relevan buat UMKM.
- Fokus pada INSIGHT bisnis yang actionable, bukan cuma restate angka.`;
