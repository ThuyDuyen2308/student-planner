const { query } = require('../config/db');

const FIELDS = `
  s.id, s.user_id, s.subject_id, s.day_of_week, s.start_time, s.end_time, s.room,
  ss.name AS subject_name, ss.credit
`;
const JOIN = 'FROM schedules s LEFT JOIN student_subjects ss ON s.subject_id = ss.id';

async function findAllByUser(userId) {
  return query(
    `SELECT ${FIELDS} ${JOIN} WHERE s.user_id = ? ORDER BY FIELD(s.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), s.start_time ASC`,
    [userId]
  );
}

async function findById(id, userId) {
  const rows = await query(
    `SELECT ${FIELDS} ${JOIN} WHERE s.id = ? AND s.user_id = ?`,
    [id, userId]
  );
  return rows[0] || null;
}

async function create({ user_id, subject_id, day_of_week, start_time, end_time, room }) {
  const result = await query(
    'INSERT INTO schedules (user_id, subject_id, day_of_week, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?)',
    [user_id, subject_id, day_of_week, start_time, end_time, room]
  );
  return findById(result.insertId, user_id);
}

async function update(id, userId, { subject_id, day_of_week, start_time, end_time, room }) {
  await query(
    'UPDATE schedules SET subject_id=?, day_of_week=?, start_time=?, end_time=?, room=? WHERE id=? AND user_id=?',
    [subject_id, day_of_week, start_time, end_time, room, id, userId]
  );
  return findById(id, userId);
}

async function remove(id, userId) {
  await query('DELETE FROM schedules WHERE id=? AND user_id=?', [id, userId]);
}

module.exports = { findAllByUser, findById, create, update, remove };
