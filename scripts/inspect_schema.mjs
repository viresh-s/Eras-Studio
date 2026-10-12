import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...rest] = trimmed.split('=');
    env[key.trim()] = rest.join('=').trim();
  }
}

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function getColumns() {
  const tables = ['cor_members', 'cor_opportunities', 'cor_applications', 'cor_application_events', 'cor_admin_notes', 'cor_consultations'];
  
  for (const t of tables) {
    // We can do an insert with empty dummy to get validation/columns or select with rpc if available, or just inspect via postgrest OpenAPI / schema:
    const res = await fetch(`${env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/?apikey=${env['SUPABASE_SERVICE_ROLE_KEY']}`);
    const spec = await res.json();
    if (spec.definitions && spec.definitions[t]) {
      console.log(`\n=== Table: ${t} ===`);
      console.log('Columns:', Object.keys(spec.definitions[t].properties));
      console.log('Required:', spec.definitions[t].required);
    }
  }
}

getColumns().catch(console.error);
