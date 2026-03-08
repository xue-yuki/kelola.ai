import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { businessId, businessType } = await request.json();

        if (!businessId || !businessType) {
            return NextResponse.json({ error: 'Missing businessId or businessType' }, { status: 400 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY is not set');
            return NextResponse.json({ error: 'AI Service configuration missing' }, { status: 500 });
        }

        // 1. Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://kelola.ai', // Optional but recommended
                'X-Title': 'Kelola.ai', // Optional but recommended
            },
            body: JSON.stringify({
                model: 'anthropic/claude-3.5-haiku',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a retail expert assistant. Generate 5 realistic products for a specific business type. Provide exactly 5 products in a raw JSON array format. Each product object must have: name (string), price (integer, in IDR, e.g. 50000), stock (integer, e.g. 20), and cost_price (integer, e.g. 35000). Do not include any other text or markdown, just the JSON array.'
                    },
                    {
                        role: 'user',
                        content: `Generate products for a business type: ${businessType}`
                    }
                ],
                response_format: { type: 'json_object' }
            }),
        });

        const data = await response.json();
        let products = [];

        try {
            // Some models might wrap it in a root object, let's try to extract the array
            const content = data.choices[0].message.content;
            const parsed = JSON.parse(content);
            products = Array.isArray(parsed) ? parsed : (parsed.products || []);
        } catch (e) {
            console.error('Failed to parse AI response:', e);
            return NextResponse.json({ error: 'Failed to generate products' }, { status: 500 });
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
