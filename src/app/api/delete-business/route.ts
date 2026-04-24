import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { businessId } = await request.json();

        if (!businessId) {
            return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
        }

        // Verify user owns this business
        const supabaseAuth = await createServerClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use service role for deletion to bypass RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verify ownership
        const { data: business } = await supabaseAdmin
            .from('businesses')
            .select('id, user_id')
            .eq('id', businessId)
            .single();

        if (!business || business.user_id !== user.id) {
            return NextResponse.json({ error: 'Business not found or not owned by user' }, { status: 403 });
        }

        // Delete in order (respect foreign keys)
        const tables = ['conversations', 'orders', 'customers', 'products'];

        for (const table of tables) {
            const { error } = await supabaseAdmin
                .from(table)
                .delete()
                .eq('business_id', businessId);

            if (error) {
                console.error(`Error deleting from ${table}:`, error);
            }
        }

        // Finally delete the business
        const { error: bizError } = await supabaseAdmin
            .from('businesses')
            .delete()
            .eq('id', businessId);

        if (bizError) {
            console.error('Error deleting business:', bizError);
            return NextResponse.json({ error: bizError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete business error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
