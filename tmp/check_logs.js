const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim().replace(/^"|"$/g, '');
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkLogs() {
  console.log('Checking logs using ANON key...');
  const { data, error } = await supabase
    .from('line_notification_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error (Expected if RLS is on):', error.message);
    return;
  }

  console.log('Recent Logs:');
  data.forEach(log => {
    console.log(`- [${log.created_at}] Status: ${log.status}`);
    console.log(`  Error: ${log.error_message}`);
    console.log('---');
  });
}

checkLogs();
