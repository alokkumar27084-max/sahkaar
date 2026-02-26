#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('typeof DATABASE_URL:', typeof process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected successfully!');
  release();
  process.exit(0);
});
