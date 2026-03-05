const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 30000),
    keepAlive: true,
});

async function main() {
    try {
        const file = path.join(__dirname, 'migrations', '013_add_chat.sql');
        const sql = fs.readFileSync(file, 'utf8');
        console.log('Running 013_add_chat.sql');
        await pool.query(sql);
        console.log('Migration complete');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err.message || err);
        process.exit(1);
    } finally {
        if (pool) await pool.end();
    }
}

main();
