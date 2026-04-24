import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { businessId, businessName, businessType, businessDescription } = await request.json();

        if (!businessId || !businessType) {
            return NextResponse.json({ error: 'Missing businessId or businessType' }, { status: 400 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY is not set');
            return NextResponse.json({ error: 'AI Service configuration missing' }, { status: 500 });
        }

        // 1. Call OpenRouter API with Gemini
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://kelola.ai',
                'X-Title': 'Kelola.ai',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    {
                        role: 'user',
                        content: `Kamu adalah ahli retail Indonesia. Buatkan 5 produk untuk bisnis berikut:

Nama Bisnis: ${businessName || 'Tidak disebutkan'}
Kategori: ${businessType}
Deskripsi Produk: ${businessDescription || 'Tidak ada deskripsi'}

PENTING: Balas HANYA dengan JSON array, tanpa markdown atau teks lain.
Format: [{"name":"Nama Produk","price":50000,"stock":20,"cost_price":35000}, ...]

Pastikan:
- Nama produk sesuai deskripsi yang diberikan
- Harga realistis dalam Rupiah (integer)
- Stock antara 10-50
- cost_price sekitar 60-70% dari price`
                    }
                ],
            }),
        });

        if (!response.ok) {
            console.error('OpenRouter API error:', response.status, await response.text());
            return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 });
        }

        const data = await response.json();
        let products = [];

        try {
            let content = data.choices?.[0]?.message?.content || '';
            // Clean markdown if present
            content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(content);
            products = Array.isArray(parsed) ? parsed : (parsed.products || []);
        } catch (e) {
            console.error('Failed to parse AI response:', e, data);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        if (products.length === 0) {
            return NextResponse.json({ error: 'No products generated' }, { status: 500 });
        }

        // 2. Prepare for Supabase insertion
        const supabase = await createClient();
        const productsToInsert = products.slice(0, 5).map((p: any) => ({
            business_id: businessId,
            name: p.name,
            price: Number(p.price),
            stock: Number(p.stock) || 0,
            cost_price: Number(p.cost_price) || 0
        }));

        const { error: insertError } = await supabase
            .from('products')
            .insert(productsToInsert);

        if (insertError) {
            console.error('Supabase insertion error:', insertError);
            return NextResponse.json({ error: 'Failed to save products' }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: productsToInsert.length });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
