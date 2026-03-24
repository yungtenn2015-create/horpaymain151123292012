
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfsotfktqfgmszbknuky.supabase.co';
const supabaseKey = 'sb_publishable_85ew4GdrA9Nz98YMLzF1Jg_wNwWSnCD';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- All Rooms ---');
    const { data: rooms, error: rError } = await supabase
        .from('rooms')
        .select('id, room_number, status, dorm_id');
    
    if (rError) {
        console.error('Room error:', rError);
        return;
    }
    rooms.forEach(r => {
        console.log(`Room: ${r.room_number}, Status: ${r.status}, ID: ${r.id}, Dorm: ${r.dorm_id}`);
    });
}

check();
