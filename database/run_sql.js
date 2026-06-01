/**
 * Memar Platform — Supabase SQL Runner
 * Runs: 001_initial_schema.sql → 002_rls_dev_open.sql → 001_demo_data.sql
 * Uses direct PostgreSQL connection to Supabase
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase connection string format:
// postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
// Project ref: lnhbmwercpvgegsecjhh
// We use the service_role key as password won't work — need to use the Management API instead

const SUPABASE_URL = 'https://lnhbmwercpvgegsecjhh.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuaGJtd2VyY3B2Z2Vnc2VjamhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg5ODU5NywiZXhwIjoyMDkyNDc0NTk3fQ.PmwCgUnWJH2VSdNaaCkOmCLIZbLrPcnCx5luSFhzC_M';

const BASE_DIR = 'c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/database';
const SQL_FILES = [
  path.join(BASE_DIR, 'migrations/001_initial_schema.sql'),
  path.join(BASE_DIR, 'migrations/002_rls_dev_open.sql'),
  path.join(BASE_DIR, 'seed/001_demo_data.sql'),
];

async function runSqlViaRestApi(sql, label) {
  const fetch = globalThis.fetch || (await import('node-fetch').then(m => m.default).catch(() => null));
  if (!fetch) {
    console.error('fetch not available');
    return false;
  }

  // Split SQL into individual statements and run each via rpc or direct
  // Use the pg REST endpoint - the Management API endpoint for running SQL
  const projectRef = 'lnhbmwercpvgegsecjhh';
  const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}` // Note: this needs PAT, not service key
      },
      body: JSON.stringify({ query: sql })
    });
    const data = await resp.json();
    if (resp.ok) {
      console.log(`✅ ${label} — OK`);
      return true;
    } else {
      console.log(`⚠️  ${label} — ${JSON.stringify(data)}`);
      return false;
    }
  } catch(e) {
    console.log(`❌ ${label} — ${e.message}`);
    return false;
  }
}

async function runSqlViaPostgres(sql, label) {
  // Supabase connection string (direct mode port 5432)
  // Host: db.[project-ref].supabase.co
  const client = new Client({
    host: 'db.lnhbmwercpvgegsecjhh.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log(`🔗 Connected — running ${label}...`);
    await client.query(sql);
    console.log(`✅ ${label} — Done!`);
    await client.end();
    return true;
  } catch(e) {
    console.log(`❌ ${label} — ${e.message}`);
    try { await client.end(); } catch(_) {}
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  Memar Supabase SQL Runner');
  console.log('═══════════════════════════════════════════');
  console.log('Project: lnhbmwercpvgegsecjhh.supabase.co\n');

  // Check if DB_PASSWORD is set
  if (!process.env.DB_PASSWORD) {
    console.log('⚠️  DB_PASSWORD env var not set.');
    console.log('Usage: DB_PASSWORD=<your-supabase-db-password> node run_sql.js');
    console.log('\nTo find your password: Supabase Dashboard → Settings → Database → Connection String');
    console.log('\nFalling back to browser-based approach...\n');

    // Output SQL content for manual execution
    for (const sqlFile of SQL_FILES) {
      if (!fs.existsSync(sqlFile)) {
        console.log(`⚠️  File not found: ${sqlFile}`);
        continue;
      }
      const label = path.basename(sqlFile);
      const sql = fs.readFileSync(sqlFile, 'utf8');
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`FILE: ${label}`);
      console.log(`SIZE: ${sql.length} chars, ${sql.split(';').length - 1} statements`);
      console.log(`STATUS: Ready to run in Supabase SQL Editor`);
    }
    return;
  }

  let allGood = true;
  for (const sqlFile of SQL_FILES) {
    if (!fs.existsSync(sqlFile)) {
      console.log(`⚠️  Skipping (not found): ${sqlFile}`);
      continue;
    }
    const label = path.basename(sqlFile);
    const sql = fs.readFileSync(sqlFile, 'utf8');
    const ok = await runSqlViaPostgres(sql, label);
    if (!ok) allGood = false;
    console.log('');
  }

  if (allGood) {
    console.log('\n🎉 All SQL files executed successfully!');
    console.log('Your Supabase database is now ready.\n');
  } else {
    console.log('\n⚠️  Some files had errors — check output above.\n');
  }
}

main().catch(console.error);
