
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfsotfktqfgmszbknuky.supabase.co';
const supabaseKey = 'sb_publishable_85ew4GdrA9Nz98YMLzF1Jg_wNwWSnCD';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Room 205 ---');
    const { data: rooms, error: rError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_number', '205');
    
    if (rError) {
        console.error('Room error:', rError);
        return;
    }
    console.log('Room Status:', rooms?.[0]?.status);
    console.log('Room Details:', rooms?.[0]);

    if (rooms && rooms.length > 0) {
        console.log('\n--- Tenants in Room 205 ---');
        const { data: tenants, error: tError } = await supabase
            .from('tenants')
            .select('*')
            .eq('room_id', rooms[0].id);
        
        if (tError) {
            console.error('Tenant error:', tError);
            return;
        }
        tenants.forEach(t => {
            console.log(`Tenant: ${t.name}, Status: ${t.status}, ID: ${t.id}`);
        });

        console.log('\n--- Bills for Room 205 (March 2026) ---');
        const { data: bills, error: bError } = await supabase
            .from('bills')
            .select('*')
            .eq('room_id', rooms[0].id)
            .eq('billing_month', '2026-03-01');
        
        if (bError) {
            console.error('Bill error:', bError);
            return;
        }
        bills.forEach(b => {
             console.log(`Bill ID: ${b.id}, Tenant ID: ${b.tenant_id}, Status: ${b.status}, Total: ${b.total_amount}`);
        });
    }
}

check();
