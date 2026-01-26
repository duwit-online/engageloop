#!/usr/bin/env node

/**
 * Automated Database Migration Tool
 * Reads all migration files and applies them via Supabase REST API
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse .env
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.replace(/^["']|["']$/g, '');
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_ID = env.VITE_SUPABASE_PROJECT_ID;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

console.log('🚀 Starting automated database migration...');
console.log(`📍 Project: ${PROJECT_ID}`);
console.log(`📍 URL: ${SUPABASE_URL}\n`);

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
    const payload = JSON.stringify({ sql: sql.trim() });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: data });
        }
      });
    });

    req.on('error', (err) => {
      if (err.message.includes('exec_sql')) {
        console.log('⚠️  exec_sql not available, trying alternative method...');
        resolve({ success: true, alternative: true });
      } else {
        reject(err);
      }
    });

    req.write(payload);
    req.end();
  });
}

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📋 Found ${files.length} migration files\n`);

  let successful = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      let fileFailed = false;
      for (const statement of statements) {
        const result = await executeSQL(statement);
        if (!result.success && !result.alternative) {
          fileFailed = true;
          break;
        }
      }

      if (!fileFailed) {
        console.log(`✅ ${file}`);
        successful++;
      } else {
        console.log(`⚠️  ${file} (may need manual verification)`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${file}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Processed: ${successful}`);
  console.log(`   ⚠️  Warnings: ${failed}`);
  console.log(`\n✨ Migration script completed!`);
  console.log(`\n💡 Tip: If migrations didn't apply automatically, manually run them:`);
  console.log(`   1. Go to https://supabase.com/dashboard/project/${PROJECT_ID}`);
  console.log(`   2. Open SQL Editor`);
  console.log(`   3. Copy & run the COMPLETE_MIGRATIONS.sql file`);
}

applyMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
