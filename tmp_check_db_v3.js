
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfsotfktqfgmszbknuky.supabase.co';
const supabaseKey = 'sb_publishable_85ew4GdrA9Nz98YMLzF1Jg_wNwWSnCD';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Search Room 205 ---');
    const { data: rooms, error: rError } = await supabase
        .from('rooms')
        .select('*')
        .ilike('room_number', '%205%');
    
    if (rError) {
        console.error('Room error:', rError);
        return;
    }
    console.log('Found Rooms:', rooms);

    for (const room of (rooms || [])) {
        console.log(`\n--- Tenants in Room ${room.room_number} (${room.id}) ---`);
        const { data: tenants, error: tError } = await supabase
            .from('tenants')
            .select('*')
            .eq('room_id', room.id);
        
        if (tError) {
            console.error('Tenant error:', tError);
            continue;
        }
        tenants.forEach(t => {
            console.log(`Tenant: ${t.name}, Status: ${t.status}, ID: ${t.id}`);
        });

        console.log(`\n--- Bills in Room ${room.room_number} ---`);
        const { data: bills, error: bError } = await supabase
            .from('bills')
            .select('*')
            .eq('room_id', room.id)
            .order('billing_month', { ascending: false });
        
        if (bError) {
            console.error('Bill error:', bError);
            continue;
        }
        bills.forEach(b => {
             console.log(`Bill: ${b.billing_month}, TenantID: ${b.tenant_id}, Status: ${b.status}`);
        });
    }
}

check();
