
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBills() {
  const { data, error } = await supabase
    .from('bills')
    .select('room_id, status, due_date, month, year')
    .in('status', ['unpaid', 'waiting_verify'])
    .order('room_id', { ascending: true });

  if (error) {
    console.error('Error fetching bills:', error);
    return;
  }

  console.log('Bills data:');
  console.log(JSON.stringify(data, null, 2));
}

checkBills();
