const https = require('https');

const url = 'https://pfsotfktqfgmszbknuky.supabase.co';
const key = 'sb_publishable_85ew4GdrA9Nz98YMLzF1Jg_wNwWSnCD';

function query(path) {
    return new Promise((resolve, reject) => {
        https.get(`${url}/rest/v1/${path}`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function run() {
    try {
        console.log('--- Room 205 Check ---');
        const rooms = await query('rooms?room_number=eq.205&select=*,tenants(*)');
        console.log('Room & Tenants:', JSON.stringify(rooms, null, 2));

        if (rooms.length > 0) {
            const roomId = rooms[0].id;
            console.log('\n--- Active Leases for Room 205 ---');
            const leases = await query(`lease_contracts?room_id=eq.${roomId}&status=eq.active`);
            console.log('Active Leases:', JSON.stringify(leases, null, 2));

            console.log('\n--- Active Tenants for Room 205 ---');
            const tenants = await query(`tenants?room_id=eq.${roomId}&status=eq.active`);
            console.log('Active Tenants:', JSON.stringify(tenants, null, 2));
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
