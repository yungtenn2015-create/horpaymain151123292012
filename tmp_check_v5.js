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
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    try {
        console.log('--- All Rooms Check ---');
        const rooms = await query('rooms?select=id,room_number,status');
        console.log('Rooms:', JSON.stringify(rooms, null, 2));

        const room205 = Array.isArray(rooms) ? rooms.find(r => r.room_number == '205') : null;
        if (room205) {
            console.log('\n--- Room 205 found! ---');
            console.log(JSON.stringify(room205, null, 2));
            const roomId = room205.id;
            
            const tenants = await query(`tenants?room_id=eq.${roomId}&select=id,name,status`);
            console.log('\n--- Tenants for Room 205 ---');
            console.log(JSON.stringify(tenants, null, 2));

            const leases = await query(`lease_contracts?room_id=eq.${roomId}&select=id,tenant_id,status`);
            console.log('\n--- Leases for Room 205 ---');
            console.log(JSON.stringify(leases, null, 2));
        } else {
            console.log('\nRoom 205 not found in the list.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
