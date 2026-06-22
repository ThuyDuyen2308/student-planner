const { query } = require('../config/db');

const PUBLIC_FIELDS = 'id, username, fullname, email, avatar_url, role, is_blocked, created_at, updated_at';

async function findByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findByUsername(username) {
  const rows = await query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0] || null;
}

async function findById(id) {
  const rows = await query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function create({ username, password, fullname = null, email = null, avatar_url = null }) {
  const result = await query(
    'INSERT INTO users (username, password, fullname, email, avatar_url) VALUES (?, ?, ?, ?, ?)',
    [username, password, fullname, email, avatar_url]
  );
  return findById(result.insertId);
}

module.exports = {
  findByEmail,
  findByUsername,
  findById,
  create,
};
