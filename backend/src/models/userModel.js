// Minimal user model examples that use db.query
const db = require('../config/db');

exports.findByPhone = async (phone) => {
  const res = await db.query('SELECT id, name, phone, email, role, password_hash FROM users WHERE phone = $1', [phone]);
  return res.rows[0];
};

exports.findByEmail = async (email) => {
  const res = await db.query('SELECT id, name, phone, email, role, password_hash FROM users WHERE email = $1', [email]);
  return res.rows[0];
};

exports.findById = async (id) => {
  const res = await db.query('SELECT id, name, phone, email, role FROM users WHERE id = $1', [id]);
  return res.rows[0];
};

exports.create = async ({ name, phone, email, password_hash, role }) => {
  const res = await db.query(
    'INSERT INTO users (name, phone, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, phone, email, role',
    [name || null, phone || null, email || null, password_hash || null, role || 'customer']
  );
  return res.rows[0];
};
