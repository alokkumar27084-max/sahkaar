// Minimal Postgres connection using `pg`.
// Exports a `query` helper used by models.
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 30000),
  idleTimeoutMillis: 30000,
  keepAlive: true,
});

// Handle connection errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
