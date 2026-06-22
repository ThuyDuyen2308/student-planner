const { query } = require('../config/db');

async function create({ user_id, title, filename, filepath, filetype, filesize, subject_name = null }) {
  const result = await query(
    'INSERT INTO documents (user_id, title, filename, filepath, filetype, filesize, subject_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user_id, title, filename, filepath, filetype, filesize, subject_name]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const rows = await query('SELECT * FROM documents WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findByUserId(user_id) {
  const rows = await query('SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
  return rows;
}

async function remove(id, user_id) {
  const result = await query('DELETE FROM documents WHERE id = ? AND user_id = ?', [id, user_id]);
  return result.affectedRows > 0;
}

module.exports = {
  create,
  findById,
  findByUserId,
  remove,
};
