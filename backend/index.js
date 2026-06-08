const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { initializeDatabase, query } = require('./db');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_student_planner_123!';

// Middlewares
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Check if user already exists
    const existingUsers = await query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    const userId = result.insertId;

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
      user: { id: userId, username }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Find user
    const users = await query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// Get current user profile
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const users = await query('SELECT id, username, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ==========================================
// 2. SUBJECTS CRUD ENDPOINTS (Protected)
// ==========================================

// Get all subjects (optional: filter by name using search query)
app.get('/api/subjects', authMiddleware, async (req, res) => {
  const search = req.query.search || '';
  const userId = req.user.id;

  try {
    let subjects;
    if (search) {
      subjects = await query(
        'SELECT * FROM subjects WHERE user_id = ? AND name LIKE ? ORDER BY name ASC',
        [userId, `%${search}%`]
      );
    } else {
      subjects = await query(
        'SELECT * FROM subjects WHERE user_id = ? ORDER BY name ASC',
        [userId]
      );
    }
    res.json(subjects);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Failed to retrieve subjects.' });
  }
});

// Add a subject
app.post('/api/subjects', authMiddleware, async (req, res) => {
  const { name, credit, score, status } = req.body;
  const userId = req.user.id;

  const subjectStatus = status || 'completed';

  if (!name || credit === undefined) {
    return res.status(400).json({ message: 'Name and credit are required.' });
  }

  const parsedCredit = parseInt(credit, 10);
  if (isNaN(parsedCredit) || parsedCredit <= 0) {
    return res.status(400).json({ message: 'Credit must be a positive integer.' });
  }

  let parsedScore = null;
  if (subjectStatus === 'completed') {
    if (score === undefined || score === null || score === '') {
      return res.status(400).json({ message: 'Score is required for completed subjects.' });
    }
    parsedScore = parseFloat(score);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10) {
      return res.status(400).json({ message: 'Score must be a number between 0 and 10.' });
    }
  } else {
    // If studying, score can be empty/null, but if provided, validate it
    if (score !== undefined && score !== null && score !== '') {
      parsedScore = parseFloat(score);
      if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10) {
        return res.status(400).json({ message: 'Score must be a number between 0 and 10.' });
      }
    }
  }

  try {
    const result = await query(
      'INSERT INTO subjects (user_id, name, credit, score, status) VALUES (?, ?, ?, ?, ?)',
      [userId, name.trim(), parsedCredit, parsedScore, subjectStatus]
    );

    const newSubject = {
      id: result.insertId,
      user_id: userId,
      name: name.trim(),
      credit: parsedCredit,
      score: parsedScore,
      status: subjectStatus
    };

    res.status(201).json(newSubject);
  } catch (error) {
    console.error('Add subject error:', error);
    res.status(500).json({ message: 'Failed to add subject.' });
  }
});

// Update a subject
app.put('/api/subjects/:id', authMiddleware, async (req, res) => {
  const { name, credit, score, status } = req.body;
  const subjectId = req.params.id;
  const userId = req.user.id;

  const subjectStatus = status || 'completed';

  if (!name || credit === undefined) {
    return res.status(400).json({ message: 'Name and credit are required.' });
  }

  const parsedCredit = parseInt(credit, 10);
  if (isNaN(parsedCredit) || parsedCredit <= 0) {
    return res.status(400).json({ message: 'Credit must be a positive integer.' });
  }

  let parsedScore = null;
  if (subjectStatus === 'completed') {
    if (score === undefined || score === null || score === '') {
      return res.status(400).json({ message: 'Score is required for completed subjects.' });
    }
    parsedScore = parseFloat(score);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10) {
      return res.status(400).json({ message: 'Score must be a number between 0 and 10.' });
    }
  } else {
    if (score !== undefined && score !== null && score !== '') {
      parsedScore = parseFloat(score);
      if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10) {
        return res.status(400).json({ message: 'Score must be a number between 0 and 10.' });
      }
    }
  }

  try {
    // Verify subject belongs to user
    const subjects = await query('SELECT * FROM subjects WHERE id = ? AND user_id = ?', [subjectId, userId]);
    if (subjects.length === 0) {
      return res.status(404).json({ message: 'Subject not found or unauthorized.' });
    }

    await query(
      'UPDATE subjects SET name = ?, credit = ?, score = ?, status = ? WHERE id = ? AND user_id = ?',
      [name.trim(), parsedCredit, parsedScore, subjectStatus, subjectId, userId]
    );

    res.json({
      id: parseInt(subjectId, 10),
      user_id: userId,
      name: name.trim(),
      credit: parsedCredit,
      score: parsedScore,
      status: subjectStatus
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ message: 'Failed to update subject.' });
  }
});

// Delete a subject
app.post('/api/subjects/delete/:id', authMiddleware, async (req, res) => {
  // Use POST /api/subjects/delete/:id or DELETE /api/subjects/:id.
  // We'll support both for robust client compatibility.
  const subjectId = req.params.id;
  const userId = req.user.id;

  try {
    const subjects = await query('SELECT * FROM subjects WHERE id = ? AND user_id = ?', [subjectId, userId]);
    if (subjects.length === 0) {
      return res.status(404).json({ message: 'Subject not found or unauthorized.' });
    }

    await query('DELETE FROM subjects WHERE id = ? AND user_id = ?', [subjectId, userId]);
    res.json({ message: 'Subject deleted successfully.' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Failed to delete subject.' });
  }
});

app.delete('/api/subjects/:id', authMiddleware, async (req, res) => {
  const subjectId = req.params.id;
  const userId = req.user.id;

  try {
    const subjects = await query('SELECT * FROM subjects WHERE id = ? AND user_id = ?', [subjectId, userId]);
    if (subjects.length === 0) {
      return res.status(404).json({ message: 'Subject not found or unauthorized.' });
    }

    await query('DELETE FROM subjects WHERE id = ? AND user_id = ?', [subjectId, userId]);
    res.json({ message: 'Subject deleted successfully.' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Failed to delete subject.' });
  }
});

// ==========================================
// 3. SCHEDULES ENDPOINTS (Protected, JOIN subjects)
// ==========================================

// Get all schedules (with optional day_of_week filter)
app.get('/api/schedules', authMiddleware, async (req, res) => {
  const { day } = req.query;
  const userId = req.user.id;

  try {
    let sql = `
      SELECT s.*, sub.name AS subject_name, sub.credit AS subject_credit, sub.score AS subject_score
      FROM schedules s
      INNER JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.user_id = ?
    `;
    const params = [userId];

    if (day) {
      sql += ' AND s.day_of_week = ?';
      params.push(day);
    }

    sql += ' ORDER BY FIELD(s.day_of_week, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"), s.start_time ASC';

    const schedules = await query(sql, params);
    res.json(schedules);
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ message: 'Failed to retrieve schedules.' });
  }
});

// Add a schedule
app.post('/api/schedules', authMiddleware, async (req, res) => {
  const { subject_id, day_of_week, start_time, end_time, room } = req.body;
  const userId = req.user.id;

  if (!subject_id || !day_of_week || !start_time || !end_time || !room || !room.trim()) {
    return res.status(400).json({ message: 'Subject, day of week, start time, end time, and room are required.' });
  }

  try {
    // 1. Verify subject belongs to user
    const subjects = await query('SELECT * FROM subjects WHERE id = ? AND user_id = ?', [subject_id, userId]);
    if (subjects.length === 0) {
      return res.status(400).json({ message: 'Invalid subject or unauthorized.' });
    }

    const targetSubject = subjects[0];

    // 2. Check for schedule conflict/overlap on the same day for this user
    const conflictingSchedules = await query(`
      SELECT s.*, sub.name AS subject_name 
      FROM schedules s
      INNER JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.user_id = ? 
        AND s.day_of_week = ? 
        AND s.start_time < ? 
        AND s.end_time > ?
    `, [userId, day_of_week, end_time, start_time]);

    if (conflictingSchedules.length > 0) {
      const conflict = conflictingSchedules[0];
      const conflictStart = conflict.start_time.substring(0, 5);
      const conflictEnd = conflict.end_time.substring(0, 5);
      return res.status(400).json({ 
        message: `Trùng lịch học! Đã có môn "${conflict.subject_name}" học từ ${conflictStart} đến ${conflictEnd} vào ngày này.` 
      });
    }

    // 3. Insert schedule
    const result = await query(
      'INSERT INTO schedules (user_id, subject_id, day_of_week, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, subject_id, day_of_week, start_time, end_time, room ? room.trim() : null]
    );

    const newSchedule = {
      id: result.insertId,
      user_id: userId,
      subject_id,
      day_of_week,
      start_time,
      end_time,
      room: room ? room.trim() : null,
      subject_name: targetSubject.name,
      subject_credit: targetSubject.credit,
      subject_score: targetSubject.score
    };

    res.status(201).json(newSchedule);
  } catch (error) {
    console.error('Add schedule error:', error);
    res.status(500).json({ message: 'Failed to add schedule.' });
  }
});

// Delete a schedule
app.delete('/api/schedules/:id', authMiddleware, async (req, res) => {
  const scheduleId = req.params.id;
  const userId = req.user.id;

  try {
    const schedules = await query('SELECT * FROM schedules WHERE id = ? AND user_id = ?', [scheduleId, userId]);
    if (schedules.length === 0) {
      return res.status(404).json({ message: 'Schedule not found or unauthorized.' });
    }

    await query('DELETE FROM schedules WHERE id = ? AND user_id = ?', [scheduleId, userId]);
    res.json({ message: 'Schedule deleted successfully.' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Failed to delete schedule.' });
  }
});

// Update a schedule
app.put('/api/schedules/:id', authMiddleware, async (req, res) => {
  const scheduleId = req.params.id;
  const { subject_id, day_of_week, start_time, end_time, room } = req.body;
  const userId = req.user.id;

  if (!subject_id || !day_of_week || !start_time || !end_time || !room || !room.trim()) {
    return res.status(400).json({ message: 'Subject, day of week, start time, end time, and room are required.' });
  }

  try {
    // 1. Verify schedule belongs to user
    const currentSchedules = await query('SELECT * FROM schedules WHERE id = ? AND user_id = ?', [scheduleId, userId]);
    if (currentSchedules.length === 0) {
      return res.status(404).json({ message: 'Schedule not found or unauthorized.' });
    }

    // 2. Verify subject belongs to user
    const subjects = await query('SELECT * FROM subjects WHERE id = ? AND user_id = ?', [subject_id, userId]);
    if (subjects.length === 0) {
      return res.status(400).json({ message: 'Invalid subject or unauthorized.' });
    }

    const targetSubject = subjects[0];

    // 3. Check for schedule conflict/overlap (excluding this schedule itself)
    const conflictingSchedules = await query(`
      SELECT s.*, sub.name AS subject_name 
      FROM schedules s
      INNER JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.user_id = ? 
        AND s.day_of_week = ? 
        AND s.start_time < ? 
        AND s.end_time > ?
        AND s.id != ?
    `, [userId, day_of_week, end_time, start_time, scheduleId]);

    if (conflictingSchedules.length > 0) {
      const conflict = conflictingSchedules[0];
      const conflictStart = conflict.start_time.substring(0, 5);
      const conflictEnd = conflict.end_time.substring(0, 5);
      return res.status(400).json({ 
        message: `Trùng lịch học! Đã có môn "${conflict.subject_name}" học từ ${conflictStart} đến ${conflictEnd} vào ngày này.` 
      });
    }

    // 4. Update schedule
    await query(
      'UPDATE schedules SET subject_id = ?, day_of_week = ?, start_time = ?, end_time = ?, room = ? WHERE id = ? AND user_id = ?',
      [subject_id, day_of_week, start_time, end_time, room ? room.trim() : null, scheduleId, userId]
    );

    const updatedSchedule = {
      id: parseInt(scheduleId, 10),
      user_id: userId,
      subject_id,
      day_of_week,
      start_time,
      end_time,
      room: room ? room.trim() : null,
      subject_name: targetSubject.name,
      subject_credit: targetSubject.credit,
      subject_score: targetSubject.score
    };

    res.json(updatedSchedule);
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Failed to update schedule.' });
  }
});

// ==========================================
// 3.5. ASSIGNMENTS CRUD ENDPOINTS (Protected)
// ==========================================

// Get all assignments
app.get('/api/assignments', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const assignments = await query(`
      SELECT a.*, sub.name AS subject_name, sub.credit AS subject_credit
      FROM assignments a
      LEFT JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.user_id = ?
      ORDER BY a.deadline ASC
    `, [userId]);
    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Failed to retrieve assignments.' });
  }
});

// Add an assignment
app.post('/api/assignments', authMiddleware, async (req, res) => {
  const { title, description, deadline, subject_id } = req.body;
  const userId = req.user.id;

  if (!title || !deadline) {
    return res.status(400).json({ message: 'Title and deadline are required.' });
  }

  try {
    let subjectName = null;
    let subjectCredit = null;

    if (subject_id) {
      const subjects = await query('SELECT * FROM subjects WHERE id = ? AND user_id = ?', [subject_id, userId]);
      if (subjects.length === 0) {
        return res.status(400).json({ message: 'Invalid subject or unauthorized.' });
      }
      subjectName = subjects[0].name;
      subjectCredit = subjects[0].credit;
    }

    const result = await query(
      'INSERT INTO assignments (user_id, subject_id, title, description, deadline, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, subject_id || null, title.trim(), description ? description.trim() : null, deadline, 'pending']
    );

    const newAssignment = {
      id: result.insertId,
      user_id: userId,
      subject_id: subject_id || null,
      title: title.trim(),
      description: description ? description.trim() : null,
      deadline,
      status: 'pending',
      subject_name: subjectName,
      subject_credit: subjectCredit
    };

    res.status(201).json(newAssignment);
  } catch (error) {
    console.error('Add assignment error:', error);
    res.status(500).json({ message: 'Failed to add assignment.' });
  }
});

// Update an assignment
app.put('/api/assignments/:id', authMiddleware, async (req, res) => {
  const assignmentId = req.params.id;
  const { title, description, deadline, subject_id, status } = req.body;
  const userId = req.user.id;

  if (!title || !deadline) {
    return res.status(400).json({ message: 'Title and deadline are required.' });
  }

  try {
    const currentAssignments = await query('SELECT * FROM assignments WHERE id = ? AND user_id = ?', [assignmentId, userId]);
    if (currentAssignments.length === 0) {
      return res.status(404).json({ message: 'Assignment not found or unauthorized.' });
    }

    let subjectName = null;
    let subjectCredit = null;

    if (subject_id) {
      const subjects = await query('SELECT * FROM subjects WHERE id = ? AND user_id = ?', [subject_id, userId]);
      if (subjects.length === 0) {
        return res.status(400).json({ message: 'Invalid subject or unauthorized.' });
      }
      subjectName = subjects[0].name;
      subjectCredit = subjects[0].credit;
    }

    const assignmentStatus = status || 'pending';

    await query(
      'UPDATE assignments SET subject_id = ?, title = ?, description = ?, deadline = ?, status = ? WHERE id = ? AND user_id = ?',
      [subject_id || null, title.trim(), description ? description.trim() : null, deadline, assignmentStatus, assignmentId, userId]
    );

    const updatedAssignment = {
      id: parseInt(assignmentId, 10),
      user_id: userId,
      subject_id: subject_id || null,
      title: title.trim(),
      description: description ? description.trim() : null,
      deadline,
      status: assignmentStatus,
      subject_name: subjectName,
      subject_credit: subjectCredit
    };

    res.json(updatedAssignment);
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Failed to update assignment.' });
  }
});

// Delete an assignment
app.delete('/api/assignments/:id', authMiddleware, async (req, res) => {
  const assignmentId = req.params.id;
  const userId = req.user.id;

  try {
    const assignments = await query('SELECT * FROM assignments WHERE id = ? AND user_id = ?', [assignmentId, userId]);
    if (assignments.length === 0) {
      return res.status(404).json({ message: 'Assignment not found or unauthorized.' });
    }

    await query('DELETE FROM assignments WHERE id = ? AND user_id = ?', [assignmentId, userId]);
    res.json({ message: 'Assignment deleted successfully.' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Failed to delete assignment.' });
  }
});

// Patch status (toggle status pending/completed)
app.patch('/api/assignments/:id/status', authMiddleware, async (req, res) => {
  const assignmentId = req.params.id;
  const { status } = req.body;
  const userId = req.user.id;

  if (!status || (status !== 'pending' && status !== 'completed')) {
    return res.status(400).json({ message: 'Valid status ("pending" or "completed") is required.' });
  }

  try {
    const assignments = await query('SELECT * FROM assignments WHERE id = ? AND user_id = ?', [assignmentId, userId]);
    if (assignments.length === 0) {
      return res.status(404).json({ message: 'Assignment not found or unauthorized.' });
    }

    await query('UPDATE assignments SET status = ? WHERE id = ? AND user_id = ?', [status, assignmentId, userId]);
    res.json({ id: parseInt(assignmentId, 10), status });
  } catch (error) {
    console.error('Toggle assignment status error:', error);
    res.status(500).json({ message: 'Failed to update assignment status.' });
  }
});

// ==========================================
// 4. CHAT AI ENDPOINT (Protected)
// ==========================================
app.post('/api/chat', authMiddleware, async (req, res) => {
  const { message, history } = req.body;
  const userId = req.user.id;

  if (!message) {
    return res.status(400).json({ message: 'Message is required.' });
  }

  try {
    // 1. Fetch subjects
    const subjects = await query('SELECT * FROM subjects WHERE user_id = ?', [userId]);

    // 2. Fetch schedules with subject names
    const schedules = await query(`
      SELECT s.*, sub.name AS subject_name 
      FROM schedules s
      INNER JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.user_id = ?
    `, [userId]);

    // 2.5. Fetch assignments with subject names
    const assignments = await query(`
      SELECT a.*, sub.name AS subject_name 
      FROM assignments a 
      LEFT JOIN subjects sub ON a.subject_id = sub.id 
      WHERE a.user_id = ?
    `, [userId]);

    // 3. GPA system calculation (only graded/completed subjects)
    const getGradePoint4 = (score) => {
      if (score === null || score === undefined) return 0.0;
      const s = parseFloat(score);
      if (s >= 9.0) return 4.0;
      if (s >= 8.5) return 3.7;
      if (s >= 8.0) return 3.5;
      if (s >= 7.0) return 3.0;
      if (s >= 6.5) return 2.5;
      if (s >= 6.0) return 2.0;
      if (s >= 5.0) return 1.5;
      if (s >= 4.0) return 1.0;
      return 0.0;
    };

    const totalCredits = subjects.reduce((sum, sub) => sum + sub.credit, 0);
    const gradedSubjects = subjects.filter(sub => sub.status === 'completed' && sub.score !== null);
    const gradedCredits = gradedSubjects.reduce((sum, sub) => sum + sub.credit, 0);
    
    const weightedScoreSum10 = gradedSubjects.reduce((sum, sub) => sum + (parseFloat(sub.score) * sub.credit), 0);
    const gpa10 = gradedCredits > 0 ? (weightedScoreSum10 / gradedCredits) : 0;
    
    const weightedScoreSum4 = gradedSubjects.reduce((sum, sub) => sum + (getGradePoint4(sub.score) * sub.credit), 0);
    const gpa4 = gradedCredits > 0 ? (weightedScoreSum4 / gradedCredits) : 0;

    // 4. Fallback if no GEMINI_API_KEY
    if (!process.env.GEMINI_API_KEY) {
      let responseText = `Chào bạn **${req.user.username}**! Tôi là **Trợ lý AI Học tập (Chế độ cục bộ)**. 

Do quản trị viên chưa cấu hình API Key cho Gemini (thiếu \`GEMINI_API_KEY\` trong file \`.env\`), tôi đang phân tích dữ liệu trực tiếp từ tài khoản của bạn:

📊 **Tóm tắt học tập của bạn:**
- Bạn có **${subjects.length} môn học** với tổng cộng **${totalCredits} tín chỉ** (Đã hoàn thành: **${gradedCredits} tín chỉ**).
- Điểm trung bình GPA tích lũy: **${gpa4.toFixed(2)}/4.0** (Hệ 10: **${gpa10.toFixed(2)}**).

${gradedSubjects.length > 0 ? `📚 **Gợi ý học tập:**
- Điểm trung bình GPA hiện tại đang ở mức **${gpa4 >= 3.2 ? 'Giỏi/Xuất sắc 🌟' : gpa4 >= 2.5 ? 'Khá 👍' : 'Cần cải thiện nhiều ⚠️'}**.
- Hãy cố gắng duy trì hoặc nâng cao điểm số của các môn học nhé!` : 'Bạn chưa có môn học nào hoàn thành có điểm số. Hãy thêm điểm môn học ở bảng điều khiển để tôi phân tích nhé!'}

📅 **Thời khóa biểu tuần này:**
- Bạn có **${schedules.length} tiết học** đã đăng ký.
${schedules.map((sch, i) => `  ${i+1}. Thứ ${sch.day_of_week === 'Sunday' ? 'Chủ nhật' : sch.day_of_week}: môn **${sch.subject_name}** (${sch.start_time.substring(0,5)} - ${sch.end_time.substring(0,5)})${sch.room ? ` tại phòng ${sch.room}` : ''}`).join('\n')}

📝 **Bài tập và Deadline sắp tới:**
- Bạn có **${assignments.filter(a => a.status === 'pending').length} bài tập cần làm**.
${assignments.map((a, i) => `  ${i+1}. [${a.status === 'completed' ? 'x' : ' '}] **${a.title}** (Môn: ${a.subject_name || 'Khác'}) - Hạn nộp: ${new Date(a.deadline).toLocaleString('vi-VN')}`).join('\n')}

*(Để có thể trò chuyện trực tiếp và hỏi bất kỳ câu hỏi nào khác với Trợ lý AI, vui lòng thêm \`GEMINI_API_KEY\` vào file \`backend/.env\` và khởi động lại server nhé!)*`;

      return res.json({ reply: responseText });
    }

    // 5. Construct System Prompt
    const systemPrompt = `Bạn là Trợ lý AI Học tập thông minh tích hợp trong ứng dụng Student Planner.
Tên sinh viên: ${req.user.username}.

Thông tin học tập hiện tại của sinh viên:
- Tổng số tín chỉ đăng ký: ${totalCredits} tín chỉ (Trong đó đã hoàn thành: ${gradedCredits} tín chỉ).
- Điểm trung bình GPA (chỉ tính trên các môn đã hoàn thành):
  + Hệ 10: ${gpa10.toFixed(2)}/10.0
  + Hệ 4: ${gpa4.toFixed(2)}/4.0
- Danh sách môn học:
${subjects.map((sub, idx) => `  ${idx + 1}. Môn: ${sub.name} | Tín chỉ: ${sub.credit} | Điểm số: ${sub.score !== null ? sub.score : 'Chưa có điểm'} | Trạng thái: ${sub.status === 'completed' ? 'Đã hoàn thành' : 'Đang học'}`).join('\n') || '  (Chưa có môn học nào)'}

- Lịch học tuần này:
${schedules.map((sch, idx) => `  ${idx + 1}. Thứ: ${sch.day_of_week} | Môn: ${sch.subject_name} | Thời gian: ${sch.start_time.substring(0, 5)} - ${sch.end_time.substring(0, 5)} | Phòng: ${sch.room || 'Chưa xếp phòng'}`).join('\n') || '  (Chưa có lịch học nào)'}

- Danh sách bài tập và Deadline:
${assignments.map((a, idx) => `  ${idx + 1}. Bài tập: ${a.title} | Môn: ${a.subject_name || 'Khác'} | Hạn nộp: ${new Date(a.deadline).toLocaleString('vi-VN')} | Trạng thái: ${a.status === 'completed' ? 'Đã hoàn thành' : 'Chưa làm'}`).join('\n') || '  (Chưa có bài tập nào)'}

Nhiệm vụ của bạn:
1. Trả lời các câu hỏi liên quan đến lịch học, danh sách môn học, bài tập/deadline và điểm số của sinh viên một cách chính xác dựa trên dữ liệu trên.
2. Đưa ra lời khuyên học tập cá nhân hóa, ví dụ: nhắc lịch học của ngày được hỏi, phân tích bài tập sắp hết hạn để nhắc sinh viên làm gấp, phân tích điểm số môn nào thấp để khuyên tập trung học hơn, hướng dẫn cách cải thiện GPA.
3. Nếu sinh viên hỏi ngoài lề học tập, hãy nhẹ nhàng hướng dẫn họ tập trung vào việc quản lý học tập và trả lời thật ngắn gọn.
4. Trả lời bằng tiếng Việt, giọng điệu thân thiện, tích cực, truyền cảm hứng và ngắn gọn (tránh các câu trả lời quá dài dòng). Sử dụng các biểu tượng cảm xúc (emoji) phù hợp.`;

    // 6. Format conversation history for Gemini API
    const formattedContents = (history || []).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Add current user message
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // 7. Make API request to Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: formattedContents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error details:', errorData);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, tôi không thể xử lý câu trả lời này.';

    res.json({ reply: replyText });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ message: 'Lỗi khi kết nối tới Trợ lý AI. Vui lòng thử lại sau.' });
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});


// Start server after database initialization
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running in development mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server due to database error:', error.message);
    process.exit(1);
  }
}

startServer();
