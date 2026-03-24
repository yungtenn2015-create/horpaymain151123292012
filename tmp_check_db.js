
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data: rooms, error: rError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_number', '205');
    
    if (rError) {
        console.error('Room error:', rError);
        return;
    }
    console.log('Rooms:', rooms);

    if (rooms && rooms.length > 0) {
        const { data: tenants, error: tError } = await supabase
            .from('tenants')
            .select('*')
            .eq('room_id', rooms[0].id);
        
        if (tError) {
            console.error('Tenant error:', tError);
            return;
        }
        console.log('Tenants:', tenants);

        const { data: bills, error: bError } = await supabase
            .from('bills')
            .select('*')
            .eq('room_id', rooms[0].id)
            .eq('billing_month', '2026-03-01');
        
        if (bError) {
            console.error('Bill error:', bError);
            return;
        }
        console.log('Bills:', bills);
    }
}

check();
