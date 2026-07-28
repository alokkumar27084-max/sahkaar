const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

const isNeon = (process.env.DATABASE_URL || '').includes('neon.tech') || (process.env.DATABASE_URL || '').includes('sslmode=require');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isNeon ? { rejectUnauthorized: false } : (process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }),
  connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 30000),
  keepAlive: true,
});

async function runFile(file) {
  const sql = fs.readFileSync(file, 'utf8');
  console.log('Running', path.basename(file));
  await pool.query(sql);
}

async function main() {
  try {
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const f of files) {
      await runFile(path.join(migrationsDir, f));
    }
    console.log('Migrations complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message || err);
    process.exit(1);
  } finally {
    if (pool) await pool.end();
  }
}

main();
