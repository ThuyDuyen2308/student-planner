const { query } = require('../config/db');

// --- Summaries ---
async function saveSummary(userId, documentId, type, content) {
  const result = await query(
    'INSERT INTO summaries (user_id, document_id, summary_type, content) VALUES (?, ?, ?, ?)',
    [userId, documentId, type, content]
  );
  return result.insertId;
}

async function getSummariesByDocument(documentId, userId) {
  const rows = await query('SELECT * FROM summaries WHERE document_id = ? AND user_id = ? ORDER BY created_at DESC', [documentId, userId]);
  return rows;
}

// --- Quizzes ---
async function saveQuiz(userId, documentId, contentJSON) {
  const result = await query(
    'INSERT INTO quizzes (user_id, document_id, quiz_type, content) VALUES (?, ?, ?, ?)',
    [userId, documentId, 'mcq', JSON.stringify(contentJSON)] // Storing all 3 types in one row's JSON for convenience
  );
  return result.insertId;
}

async function getQuizzesByDocument(documentId, userId) {
  const rows = await query('SELECT * FROM quizzes WHERE document_id = ? AND user_id = ? ORDER BY created_at DESC', [documentId, userId]);
  return rows;
}

// --- Chat History ---
async function saveChatMessage(userId, sessionId, role, content) {
  await query(
    'INSERT INTO chat_messages (user_id, session_id, role, content) VALUES (?, ?, ?, ?)',
    [userId, sessionId, role, content]
  );
}

async function getChatHistory(userId, sessionId) {
  const rows = await query('SELECT * FROM chat_messages WHERE user_id = ? AND session_id = ? ORDER BY created_at ASC', [userId, sessionId]);
  return rows;
}

// --- Study Plans ---
async function saveStudyPlan(userId, subjectName, examDate, proficiency, hours, planContentJSON) {
  const result = await query(
    'INSERT INTO study_plans (user_id, subject_name, exam_date, proficiency_level, hours_per_day, plan_content) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, subjectName, examDate, proficiency, hours, JSON.stringify(planContentJSON)]
  );
  return result.insertId;
}

async function getStudyPlans(userId) {
  const rows = await query('SELECT * FROM study_plans WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows;
}

module.exports = {
  saveSummary,
  getSummariesByDocument,
  saveQuiz,
  getQuizzesByDocument,
  saveChatMessage,
  getChatHistory,
  saveStudyPlan,
  getStudyPlans
};
