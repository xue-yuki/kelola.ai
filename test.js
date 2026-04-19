import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../kelola-agent/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Mocking a fake order to test insertion...");
    
    // We attempt an insertion that mimics saveOrder
    // If table columns are missing, we will get the exact error code
    const mockOrder = {
        business_id: '00000000-0000-0000-0000-000000000000', // random uuid, will fail fkey if not exists, but missing col throws first
        customer_name: 'test',
        customer_address: 'test',
        channel: 'whatsapp',
        total: 100,
        status: 'menunggu',
        items: []
    };

    const { error: oError } = await supabase.from('orders').insert(mockOrder);
    if (oError) {
        console.error("Orders Error Dump:", oError);
    } else {
        console.log("Order simulated insert passed! Schema must exist.");
    }
}
test();
