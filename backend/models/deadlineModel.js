const { query } = require('../config/db');

async function create({ user_id, title, subject_name, description, due_date, priority }) {
  const result = await query(
    'INSERT INTO deadlines (user_id, title, subject_name, description, due_date, priority) VALUES (?, ?, ?, ?, ?, ?)',
    [user_id, title, subject_name, description, due_date, priority || 'medium']
  );
  return findById(result.insertId);
}

async function findById(id) {
  const rows = await query('SELECT * FROM deadlines WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findByUserId(user_id) {
  const rows = await query('SELECT * FROM deadlines WHERE user_id = ? ORDER BY due_date ASC', [user_id]);
  return rows;
}

async function update(id, user_id, { title, subject_name, description, due_date, priority, status }) {
  const result = await query(
    'UPDATE deadlines SET title = ?, subject_name = ?, description = ?, due_date = ?, priority = ?, status = ? WHERE id = ? AND user_id = ?',
    [title, subject_name, description, due_date, priority, status, id, user_id]
  );
  if (result.affectedRows === 0) return null;
  return findById(id);
}

async function remove(id, user_id) {
  const result = await query('DELETE FROM deadlines WHERE id = ? AND user_id = ?', [id, user_id]);
  return result.affectedRows > 0;
}

module.exports = {
  create,
  findById,
  findByUserId,
  update,
  remove,
};
