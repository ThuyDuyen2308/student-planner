const { query } = require('../config/db');

async function saveSyncedSubjects(userId, subjects) {
  // Clear old subjects
  await query('DELETE FROM synced_subjects WHERE user_id = ?', [userId]);
  
  if (subjects.length === 0) return;

  const values = subjects.map(s => [
    userId, s.subject_code, s.subject_name, s.credits, s.lecturer,
    s.midterm_score, s.final_score, s.total_score, s.grade_letter
  ]);
  
  const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
  const flatValues = values.flat();

  await query(`
    INSERT INTO synced_subjects 
    (user_id, subject_code, subject_name, credits, lecturer, midterm_score, final_score, total_score, grade_letter)
    VALUES ${placeholders}
  `, flatValues);
}

async function saveSyncedSchedules(userId, schedules) {
  await query('DELETE FROM synced_schedules WHERE user_id = ?', [userId]);
  
  if (schedules.length === 0) return;

  const values = schedules.map(s => [
    userId, s.subject_name, s.lecturer, s.day_of_week, s.start_time, s.end_time, s.room
  ]);
  
  const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',');
  const flatValues = values.flat();

  await query(`
    INSERT INTO synced_schedules 
    (user_id, subject_name, lecturer, day_of_week, start_time, end_time, room)
    VALUES ${placeholders}
  `, flatValues);
}

async function saveSyncedExams(userId, exams) {
  await query('DELETE FROM synced_exams WHERE user_id = ?', [userId]);
  
  if (exams.length === 0) return;

  const values = exams.map(e => [
    userId, e.subject_name, e.exam_date, e.exam_time, e.room
  ]);
  
  const placeholders = values.map(() => '(?, ?, ?, ?, ?)').join(',');
  const flatValues = values.flat();

  await query(`
    INSERT INTO synced_exams 
    (user_id, subject_name, exam_date, exam_time, room)
    VALUES ${placeholders}
  `, flatValues);
}

async function getDashboardData(userId) {
  const subjects = await query('SELECT * FROM synced_subjects WHERE user_id = ?', [userId]);
  const schedules = await query('SELECT * FROM synced_schedules WHERE user_id = ?', [userId]);
  const exams = await query('SELECT * FROM synced_exams WHERE user_id = ?', [userId]);

  return { subjects, schedules, exams };
}

module.exports = {
  saveSyncedSubjects,
  saveSyncedSchedules,
  saveSyncedExams,
  getDashboardData
};
