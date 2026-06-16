const { query } = require('../config/db');

const SELECT_FIELDS = 'id, subject_code, subject_name, credits';

async function findAll(search = '') {
  const trimmed = search.trim();

  if (trimmed) {
    const pattern = `%${trimmed}%`;
    return query(
      `SELECT ${SELECT_FIELDS} FROM subjects
       WHERE subject_code LIKE ? OR subject_name LIKE ?
       ORDER BY subject_code ASC`,
      [pattern, pattern]
    );
  }

  return query(`SELECT ${SELECT_FIELDS} FROM subjects ORDER BY subject_code ASC`);
}

async function findById(id) {
  const rows = await query(`SELECT ${SELECT_FIELDS} FROM subjects WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function findByCode(subjectCode) {
  const rows = await query(`SELECT ${SELECT_FIELDS} FROM subjects WHERE subject_code = ?`, [subjectCode]);
  return rows[0] || null;
}

async function create({ subject_code, subject_name, credits }) {
  const result = await query(
    'INSERT INTO subjects (subject_code, subject_name, credits) VALUES (?, ?, ?)',
    [subject_code, subject_name, credits]
  );
  return findById(result.insertId);
}

module.exports = {
  findAll,
  findById,
  findByCode,
  create,
};
