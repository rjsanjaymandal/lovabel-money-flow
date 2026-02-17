
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
  'transactions',
  'budgets',
  'lend_borrow',
  'user_stats',
  'user_achievements',
  'achievements',
  'profiles' // Added profiles just in case
];

async function backup() {
  console.log('🚀 Starting backup...');
  const backupData: Record<string, unknown[]> = {};

  for (const table of TABLES) {
    console.log(`📦 Backing up ${table}...`);
    const { data, error } = await supabase.from(table).select('*');
    
    if (error) {
      console.warn(`⚠️ Could not backup ${table}: ${error.message}`);
      continue;
    }

    if (data) {
      backupData[table] = data;
      console.log(`✅ ${table}: ${data.length} records`);
    }
  }

  const outputPath = path.join(__dirname, '../backup_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2));
  console.log(`\n💾 Backup saved to ${outputPath}`);
}

backup().catch(console.error);
