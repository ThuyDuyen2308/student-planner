const { query } = require('../config/db');

const PUBLIC_FIELDS = 'id, username, fullname, email, role, is_blocked, created_at, updated_at';

async function findByUsername(username) {
  const rows = await query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0] || null;
}

async function findById(id) {
  const rows = await query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function create({ username, password, fullname = null, email = null }) {
  const result = await query(
    'INSERT INTO users (username, password, fullname, email) VALUES (?, ?, ?, ?)',
    [username, password, fullname, email]
  );
  return findById(result.insertId);
}

module.exports = {
  findByUsername,
  findById,
  create,
};
