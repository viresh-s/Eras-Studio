import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...rest] = trimmed.split('=');
    env[key.trim()] = rest.join('=').trim();
  }
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, serviceKey);

async function inspect() {
  console.log('--- SUPABASE DATABASE AUDIT ---');
  console.log('Connected to:', supabaseUrl);

  const tables = [
    'profiles',
    'cor_profiles',
    'cor_requests',
    'cor_members',
    'cor_opportunities',
    'cor_applications',
    'cor_application_events',
    'cor_career_information',
    'cor_skills',
    'cor_education',
    'cor_experience',
    'cor_links',
    'cor_documents',
    'cor_career_goals',
    'cor_consultations',
    'cor_activities',
    'cor_admin_notes',
    'cor_activity',
    'jobs',
    'applications'
  ];

  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact' }).limit(3);
    if (error) {
      console.log(`[-] Table "${table}": NOT FOUND (${error.message})`);
    } else {
      const rowCount = count !== null ? count : data?.length || 0;
      const columns = data && data.length > 0 ? Object.keys(data[0]) : '(0 rows, schema exists)';
      console.log(`[+] Table "${table}": EXISTS (${rowCount} rows)`);
      if (data && data.length > 0) {
        console.log(`    Columns: ${Object.keys(data[0]).join(', ')}`);
        console.log(`    Sample:`, JSON.stringify(data[0], null, 2).slice(0, 300) + '...');
      }
    }
  }
}

inspect().catch(console.error);
