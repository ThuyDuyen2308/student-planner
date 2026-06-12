/**
 * index.js - Máy chủ Express chính của ứng dụng Student Planner
 * ----------------------------------------------------------------
 * THAY ĐỔI CHÍNH (feature/dashboard-redesign):
 *   1. [XÁC THỰC] Cập nhật Register/Login hỗ trợ fullname, email, role;
 *      kiểm tra is_blocked trước khi đăng nhập.
 *   2. [MỚI] API cập nhật hồ sơ cá nhân: PUT /api/auth/profile
 *   3. [MỚI] API đổi mật khẩu: PUT /api/auth/change-password
 *   4. [MỚI] CRUD chứng chỉ: /api/certificates
 *   5. [MỚI] CRUD công ty ứng tuyển: /api/companies
 *   6. [MỚI] CRUD lịch phỏng vấn: /api/interviews
 *   7. [MỚI] CRUD mục tiêu nghề nghiệp: /api/goals
 *   8. [MỚI] CRUD kỹ năng: /api/skills
 *   9. [MỚI] API quản trị: /api/admin/* (yêu cầu role=admin)
 *  10. [CẬP NHẬT] AI Career Advisor: /api/chat tích hợp dữ liệu cá nhân
 *      hóa và dự phòng tự tạo báo cáo khi thiếu GEMINI_API_KEY.
 */
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Kết nối cơ sở dữ liệu và các middleware xác thực
const { initializeDatabase, query } = require('./db');
const authMiddleware = require('./middleware/auth');
const adminMiddleware = require('./middleware/admin'); // [MỚI] Middleware kiểm tra quyền admin

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
  const { username, password, fullname, email } = req.body;

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

    // If username is 'admin', automatically assign the admin role
    const role = username.toLowerCase() === 'admin' ? 'admin' : 'user';

    // Insert user
    const result = await query(
      'INSERT INTO users (username, password, fullname, email, role, is_blocked) VALUES (?, ?, ?, ?, ?, ?)',
      [username.trim(), hashedPassword, fullname ? fullname.trim() : null, email ? email.trim() : null, role, 0]
    );

    const userId = result.insertId;

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
      user: { id: userId, username, role }
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

    // Check block status
    if (user.is_blocked) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, fullname: user.fullname, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// Get current user profile
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const users = await query('SELECT id, username, fullname, email, role, is_blocked, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Update personal profile
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  const { fullname, email } = req.body;
  const userId = req.user.id;

  try {
    await query(
      'UPDATE users SET fullname = ?, email = ? WHERE id = ?',
      [fullname ? fullname.trim() : null, email ? email.trim() : null, userId]
    );

    const updatedUsers = await query('SELECT id, username, fullname, email, role FROM users WHERE id = ?', [userId]);

    res.json({
      message: 'Cập nhật thông tin cá nhân thành công.',
      user: updatedUsers[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error while updating profile.' });
  }
});

// Change Password
app.put('/api/auth/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc.' });
  }

  try {
    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error while changing password.' });
  }
});

// ==========================================
// 2. SUBJECTS CRUD ENDPOINTS (Protected)
// ==========================================

// Get all subjects
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

  if (!name) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  // Default credit to 1 if not provided
  const creditValue = credit !== undefined && credit !== null && credit !== '' ? credit : 1;
  const parsedCredit = parseInt(creditValue, 10);
  if (isNaN(parsedCredit) || parsedCredit <= 0) {
    return res.status(400).json({ message: 'Credit must be a positive integer.' });
  }

  let parsedScore = null;
  if (score !== undefined && score !== null && score !== '') {
    parsedScore = parseFloat(score);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10) {
      return res.status(400).json({ message: 'Score must be a number between 0 and 10.' });
    }
  }

  try {
    const result = await query(
      'INSERT INTO subjects (user_id, name, credit, score, status) VALUES (?, ?, ?, ?, ?)',
      [userId, name.trim(), parsedCredit, parsedScore, subjectStatus]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      name: name.trim(),
      credit: parsedCredit,
      score: parsedScore,
      status: subjectStatus
    });
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

  if (!name) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  // Default credit to 1 if not provided
  const creditValue = credit !== undefined && credit !== null && credit !== '' ? credit : 1;
  const parsedCredit = parseInt(creditValue, 10);
  if (isNaN(parsedCredit) || parsedCredit <= 0) {
    return res.status(400).json({ message: 'Credit must be a positive integer.' });
  }

  let parsedScore = null;
  if (score !== undefined && score !== null && score !== '') {
    parsedScore = parseFloat(score);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10) {
      return res.status(400).json({ message: 'Score must be a number between 0 and 10.' });
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

// Get all schedules
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

    res.status(201).json({
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
    });
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

    res.json({
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
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Failed to update schedule.' });
  }
});

// ==========================================
// 4. ASSIGNMENTS / PERSONAL TASKS ENDPOINTS (Protected)
// ==========================================

// Get all assignments/tasks
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

// Add an assignment/task
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

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      subject_id: subject_id || null,
      title: title.trim(),
      description: description ? description.trim() : null,
      deadline,
      status: 'pending',
      subject_name: subjectName,
      subject_credit: subjectCredit
    });
  } catch (error) {
    console.error('Add assignment error:', error);
    res.status(500).json({ message: 'Failed to add assignment.' });
  }
});

// Update an assignment/task
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

    res.json({
      id: parseInt(assignmentId, 10),
      user_id: userId,
      subject_id: subject_id || null,
      title: title.trim(),
      description: description ? description.trim() : null,
      deadline,
      status: assignmentStatus,
      subject_name: subjectName,
      subject_credit: subjectCredit
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Failed to update assignment.' });
  }
});

// Delete an assignment/task
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
// 5. CERTIFICATES CRUD ENDPOINTS (Protected)
// ==========================================

app.get('/api/certificates', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const certs = await query('SELECT * FROM certificates WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(certs);
  } catch (error) {
    console.error('Get certs error:', error);
    res.status(500).json({ message: 'Failed to retrieve certificates.' });
  }
});

app.post('/api/certificates', authMiddleware, async (req, res) => {
  const { name, status, score, exam_date, expiry_date } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Tên chứng chỉ là bắt buộc.' });
  }

  try {
    const result = await query(
      'INSERT INTO certificates (user_id, name, status, score, exam_date, expiry_date) VALUES (?, ?, ?, ?, ?, ?)',
      [
        userId, 
        name.trim(), 
        status || 'studying', 
        score ? score.trim() : null, 
        exam_date || null, 
        expiry_date || null
      ]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      name: name.trim(),
      status: status || 'studying',
      score: score ? score.trim() : null,
      exam_date: exam_date || null,
      expiry_date: expiry_date || null
    });
  } catch (error) {
    console.error('Add cert error:', error);
    res.status(500).json({ message: 'Failed to add certificate.' });
  }
});

app.put('/api/certificates/:id', authMiddleware, async (req, res) => {
  const certId = req.params.id;
  const { name, status, score, exam_date, expiry_date } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Tên chứng chỉ là bắt buộc.' });
  }

  try {
    const certs = await query('SELECT * FROM certificates WHERE id = ? AND user_id = ?', [certId, userId]);
    if (certs.length === 0) {
      return res.status(404).json({ message: 'Certificate not found or unauthorized.' });
    }

    await query(
      'UPDATE certificates SET name = ?, status = ?, score = ?, exam_date = ?, expiry_date = ? WHERE id = ? AND user_id = ?',
      [
        name.trim(), 
        status || 'studying', 
        score ? score.trim() : null, 
        exam_date || null, 
        expiry_date || null,
        certId, 
        userId
      ]
    );

    res.json({
      id: parseInt(certId, 10),
      user_id: userId,
      name: name.trim(),
      status: status || 'studying',
      score: score ? score.trim() : null,
      exam_date: exam_date || null,
      expiry_date: expiry_date || null
    });
  } catch (error) {
    console.error('Update cert error:', error);
    res.status(500).json({ message: 'Failed to update certificate.' });
  }
});

app.delete('/api/certificates/:id', authMiddleware, async (req, res) => {
  const certId = req.params.id;
  const userId = req.user.id;

  try {
    const certs = await query('SELECT * FROM certificates WHERE id = ? AND user_id = ?', [certId, userId]);
    if (certs.length === 0) {
      return res.status(404).json({ message: 'Certificate not found or unauthorized.' });
    }

    await query('DELETE FROM certificates WHERE id = ? AND user_id = ?', [certId, userId]);
    res.json({ message: 'Certificate deleted successfully.' });
  } catch (error) {
    console.error('Delete cert error:', error);
    res.status(500).json({ message: 'Failed to delete certificate.' });
  }
});

// ==========================================
// 6. INTERNSHIP & JOB SEARCH ENDPOINTS (Protected)
// ==========================================

// Companies
app.get('/api/companies', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const companies = await query('SELECT * FROM companies WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(companies);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ message: 'Failed to retrieve companies.' });
  }
});

app.post('/api/companies', authMiddleware, async (req, res) => {
  const { name, position, status, note } = req.body;
  const userId = req.user.id;

  if (!name || !position) {
    return res.status(400).json({ message: 'Tên công ty và vị trí ứng tuyển là bắt buộc.' });
  }

  try {
    const result = await query(
      'INSERT INTO companies (user_id, name, position, status, note) VALUES (?, ?, ?, ?, ?)',
      [userId, name.trim(), position.trim(), status || 'not_applied', note ? note.trim() : null]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      name: name.trim(),
      position: position.trim(),
      status: status || 'not_applied',
      note: note ? note.trim() : null
    });
  } catch (error) {
    console.error('Add company error:', error);
    res.status(500).json({ message: 'Failed to add company.' });
  }
});

app.put('/api/companies/:id', authMiddleware, async (req, res) => {
  const companyId = req.params.id;
  const { name, position, status, note } = req.body;
  const userId = req.user.id;

  if (!name || !position) {
    return res.status(400).json({ message: 'Tên công ty và vị trí ứng tuyển là bắt buộc.' });
  }

  try {
    const comps = await query('SELECT * FROM companies WHERE id = ? AND user_id = ?', [companyId, userId]);
    if (comps.length === 0) {
      return res.status(404).json({ message: 'Company not found or unauthorized.' });
    }

    await query(
      'UPDATE companies SET name = ?, position = ?, status = ?, note = ? WHERE id = ? AND user_id = ?',
      [name.trim(), position.trim(), status || 'not_applied', note ? note.trim() : null, companyId, userId]
    );

    res.json({
      id: parseInt(companyId, 10),
      user_id: userId,
      name: name.trim(),
      position: position.trim(),
      status: status || 'not_applied',
      note: note ? note.trim() : null
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Failed to update company.' });
  }
});

app.delete('/api/companies/:id', authMiddleware, async (req, res) => {
  const companyId = req.params.id;
  const userId = req.user.id;

  try {
    const comps = await query('SELECT * FROM companies WHERE id = ? AND user_id = ?', [companyId, userId]);
    if (comps.length === 0) {
      return res.status(404).json({ message: 'Company not found or unauthorized.' });
    }

    await query('DELETE FROM companies WHERE id = ? AND user_id = ?', [companyId, userId]);
    res.json({ message: 'Company deleted successfully.' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: 'Failed to delete company.' });
  }
});

// Interviews
app.get('/api/interviews', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const interviews = await query(
      `SELECT i.*, c.name AS company_name, c.position AS company_position 
       FROM interviews i 
       INNER JOIN companies c ON i.company_id = c.id 
       WHERE i.user_id = ? 
       ORDER BY i.interview_time ASC`,
      [userId]
    );
    res.json(interviews);
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ message: 'Failed to retrieve interviews.' });
  }
});

app.post('/api/interviews', authMiddleware, async (req, res) => {
  const { company_id, interview_time, location, note } = req.body;
  const userId = req.user.id;

  if (!company_id || !interview_time) {
    return res.status(400).json({ message: 'Công ty và thời gian phỏng vấn là bắt buộc.' });
  }

  try {
    const comps = await query('SELECT * FROM companies WHERE id = ? AND user_id = ?', [company_id, userId]);
    if (comps.length === 0) {
      return res.status(400).json({ message: 'Invalid company or unauthorized.' });
    }

    const result = await query(
      'INSERT INTO interviews (user_id, company_id, interview_time, location, note) VALUES (?, ?, ?, ?, ?)',
      [userId, company_id, interview_time, location ? location.trim() : null, note ? note.trim() : null]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      company_id,
      interview_time,
      location: location ? location.trim() : null,
      note: note ? note.trim() : null,
      company_name: comps[0].name,
      company_position: comps[0].position
    });
  } catch (error) {
    console.error('Add interview error:', error);
    res.status(500).json({ message: 'Failed to add interview.' });
  }
});

app.put('/api/interviews/:id', authMiddleware, async (req, res) => {
  const interviewId = req.params.id;
  const { company_id, interview_time, location, note } = req.body;
  const userId = req.user.id;

  if (!company_id || !interview_time) {
    return res.status(400).json({ message: 'Công ty và thời gian phỏng vấn là bắt buộc.' });
  }

  try {
    const ints = await query('SELECT * FROM interviews WHERE id = ? AND user_id = ?', [interviewId, userId]);
    if (ints.length === 0) {
      return res.status(404).json({ message: 'Interview not found or unauthorized.' });
    }

    const comps = await query('SELECT * FROM companies WHERE id = ? AND user_id = ?', [company_id, userId]);
    if (comps.length === 0) {
      return res.status(400).json({ message: 'Invalid company or unauthorized.' });
    }

    await query(
      'UPDATE interviews SET company_id = ?, interview_time = ?, location = ?, note = ? WHERE id = ? AND user_id = ?',
      [company_id, interview_time, location ? location.trim() : null, note ? note.trim() : null, interviewId, userId]
    );

    res.json({
      id: parseInt(interviewId, 10),
      user_id: userId,
      company_id,
      interview_time,
      location: location ? location.trim() : null,
      note: note ? note.trim() : null,
      company_name: comps[0].name,
      company_position: comps[0].position
    });
  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({ message: 'Failed to update interview.' });
  }
});

app.delete('/api/interviews/:id', authMiddleware, async (req, res) => {
  const interviewId = req.params.id;
  const userId = req.user.id;

  try {
    const ints = await query('SELECT * FROM interviews WHERE id = ? AND user_id = ?', [interviewId, userId]);
    if (ints.length === 0) {
      return res.status(404).json({ message: 'Interview not found or unauthorized.' });
    }

    await query('DELETE FROM interviews WHERE id = ? AND user_id = ?', [interviewId, userId]);
    res.json({ message: 'Interview deleted successfully.' });
  } catch (error) {
    console.error('Delete interview error:', error);
    res.status(500).json({ message: 'Failed to delete interview.' });
  }
});

// ==========================================
// 7. CAREER GOALS ENDPOINTS (Protected)
// ==========================================

app.get('/api/goals', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const goals = await query('SELECT * FROM career_goals WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Failed to retrieve career goals.' });
  }
});

app.post('/api/goals', authMiddleware, async (req, res) => {
  const { title, progress, target_date, status } = req.body;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({ message: 'Mục tiêu nghề nghiệp là bắt buộc.' });
  }

  try {
    const result = await query(
      'INSERT INTO career_goals (user_id, title, progress, target_date, status) VALUES (?, ?, ?, ?, ?)',
      [userId, title.trim(), progress || 0, target_date || null, status || 'in_progress']
    );

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      title: title.trim(),
      progress: progress || 0,
      target_date: target_date || null,
      status: status || 'in_progress'
    });
  } catch (error) {
    console.error('Add goal error:', error);
    res.status(500).json({ message: 'Failed to add career goal.' });
  }
});

app.put('/api/goals/:id', authMiddleware, async (req, res) => {
  const goalId = req.params.id;
  const { title, progress, target_date, status } = req.body;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({ message: 'Mục tiêu nghề nghiệp là bắt buộc.' });
  }

  try {
    const goals = await query('SELECT * FROM career_goals WHERE id = ? AND user_id = ?', [goalId, userId]);
    if (goals.length === 0) {
      return res.status(404).json({ message: 'Goal not found or unauthorized.' });
    }

    await query(
      'UPDATE career_goals SET title = ?, progress = ?, target_date = ?, status = ? WHERE id = ? AND user_id = ?',
      [title.trim(), progress || 0, target_date || null, status || 'in_progress', goalId, userId]
    );

    res.json({
      id: parseInt(goalId, 10),
      user_id: userId,
      title: title.trim(),
      progress: progress || 0,
      target_date: target_date || null,
      status: status || 'in_progress'
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Failed to update career goal.' });
  }
});

app.delete('/api/goals/:id', authMiddleware, async (req, res) => {
  const goalId = req.params.id;
  const userId = req.user.id;

  try {
    const goals = await query('SELECT * FROM career_goals WHERE id = ? AND user_id = ?', [goalId, userId]);
    if (goals.length === 0) {
      return res.status(404).json({ message: 'Goal not found or unauthorized.' });
    }

    await query('DELETE FROM career_goals WHERE id = ? AND user_id = ?', [goalId, userId]);
    res.json({ message: 'Goal deleted successfully.' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Failed to delete career goal.' });
  }
});

// ==========================================
// 8. SKILLS ENDPOINTS (Protected)
// ==========================================

app.get('/api/skills', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const skills = await query('SELECT * FROM skills WHERE user_id = ? ORDER BY proficiency DESC, name ASC', [userId]);
    res.json(skills);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ message: 'Failed to retrieve skills.' });
  }
});

app.post('/api/skills', authMiddleware, async (req, res) => {
  const { name, proficiency } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Tên kỹ năng là bắt buộc.' });
  }

  try {
    const result = await query(
      'INSERT INTO skills (user_id, name, proficiency) VALUES (?, ?, ?)',
      [userId, name.trim(), proficiency || 1]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      name: name.trim(),
      proficiency: proficiency || 1
    });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ message: 'Failed to add skill.' });
  }
});

app.put('/api/skills/:id', authMiddleware, async (req, res) => {
  const skillId = req.params.id;
  const { name, proficiency } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Tên kỹ năng là bắt buộc.' });
  }

  try {
    const sks = await query('SELECT * FROM skills WHERE id = ? AND user_id = ?', [skillId, userId]);
    if (sks.length === 0) {
      return res.status(404).json({ message: 'Skill not found or unauthorized.' });
    }

    await query(
      'UPDATE skills SET name = ?, proficiency = ? WHERE id = ? AND user_id = ?',
      [name.trim(), proficiency || 1, skillId, userId]
    );

    res.json({
      id: parseInt(skillId, 10),
      user_id: userId,
      name: name.trim(),
      proficiency: proficiency || 1
    });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ message: 'Failed to update skill.' });
  }
});

app.delete('/api/skills/:id', authMiddleware, async (req, res) => {
  const skillId = req.params.id;
  const userId = req.user.id;

  try {
    const sks = await query('SELECT * FROM skills WHERE id = ? AND user_id = ?', [skillId, userId]);
    if (sks.length === 0) {
      return res.status(404).json({ message: 'Skill not found or unauthorized.' });
    }

    await query('DELETE FROM skills WHERE id = ? AND user_id = ?', [skillId, userId]);
    res.json({ message: 'Skill deleted successfully.' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ message: 'Failed to delete skill.' });
  }
});

// ==========================================
// 9. ADMIN PANEL ENDPOINTS (Protected, Admin role required)
// ==========================================

// Get all users
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  const search = req.query.search || '';
  try {
    let sql = 'SELECT id, username, fullname, email, role, is_blocked, created_at FROM users';
    const params = [];
    if (search) {
      sql += ' WHERE username LIKE ? OR email LIKE ? OR fullname LIKE ?';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    sql += ' ORDER BY created_at DESC';
    const users = await query(sql, params);
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Failed to retrieve users.' });
  }
});

// Toggle user block status
app.put('/api/admin/users/:id/block', authMiddleware, adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  const { is_blocked } = req.body;

  if (parseInt(userId, 10) === req.user.id) {
    return res.status(400).json({ message: 'Bạn không thể tự khóa tài khoản của chính mình.' });
  }

  try {
    await query('UPDATE users SET is_blocked = ? WHERE id = ?', [is_blocked ? 1 : 0, userId]);
    res.json({ message: `Tài khoản đã được ${is_blocked ? 'khóa' : 'mở khóa'} thành công.` });
  } catch (error) {
    console.error('Admin block user error:', error);
    res.status(500).json({ message: 'Failed to update user block status.' });
  }
});

// Delete user
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const userId = req.params.id;

  if (parseInt(userId, 10) === req.user.id) {
    return res.status(400).json({ message: 'Bạn không thể tự xóa tài khoản của chính mình.' });
  }

  try {
    await query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Tài khoản người dùng đã được xóa thành công.' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

// System statistics
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const usersCount = await query('SELECT COUNT(*) AS count FROM users');
    const certsCount = await query('SELECT COUNT(*) AS count FROM certificates');
    const goalsCount = await query('SELECT COUNT(*) AS count FROM career_goals');
    const companiesCount = await query('SELECT COUNT(*) AS count FROM companies');

    res.json({
      totalUsers: usersCount[0].count,
      totalCertificates: certsCount[0].count,
      totalCareerGoals: goalsCount[0].count,
      totalInternships: companiesCount[0].count
    });
  } catch (error) {
    console.error('Admin get stats error:', error);
    res.status(500).json({ message: 'Failed to retrieve admin stats.' });
  }
});


// ==========================================
// 10. CHAT AI / CAREER ADVISOR ENDPOINT (Protected)
// ==========================================
app.post('/api/chat', authMiddleware, async (req, res) => {
  const { message, history } = req.body;
  const userId = req.user.id;

  if (!message) {
    return res.status(400).json({ message: 'Message is required.' });
  }

  try {
    // Fetch user context for AI advisor
    const user = (await query('SELECT username, fullname, email FROM users WHERE id = ?', [userId]))[0] || {};
    const subjects = await query('SELECT * FROM subjects WHERE user_id = ?', [userId]);
    const schedules = await query(`
      SELECT s.*, sub.name AS subject_name 
      FROM schedules s
      INNER JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.user_id = ?
    `, [userId]);
    const assignments = await query(`
      SELECT a.*, sub.name AS subject_name 
      FROM assignments a 
      LEFT JOIN subjects sub ON a.subject_id = sub.id 
      WHERE a.user_id = ?
    `, [userId]);
    const certificates = await query('SELECT * FROM certificates WHERE user_id = ?', [userId]);
    const goals = await query('SELECT * FROM career_goals WHERE user_id = ?', [userId]);
    const skills = await query('SELECT * FROM skills WHERE user_id = ?', [userId]);
    const companies = await query('SELECT * FROM companies WHERE user_id = ?', [userId]);
    const interviews = await query(`
      SELECT i.*, c.name AS company_name, c.position AS company_position 
      FROM interviews i 
      INNER JOIN companies c ON i.company_id = c.id
      WHERE i.user_id = ?
    `, [userId]);

    // GPA calculations
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

    // Local report generator helper
    const buildLocalReport = () => {
      let r = `Chào bạn **${user.fullname || user.username}**! Tôi là **AI Career Advisor (Chế độ cục bộ)**. 

Do quản trị viên chưa cấu hình API Key cho Gemini (thiếu \`GEMINI_API_KEY\` trong file \`.env\`), tôi đã tổng hợp báo cáo và lộ trình nghề nghiệp tự động dựa trên dữ liệu tài khoản của bạn:

🎯 **Mục tiêu nghề nghiệp đã đặt:**
${goals.length > 0 ? goals.map(g => `- **${g.title}** (Tiến độ: **${g.progress}%** | Trạng thái: ${g.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện'})`).join('\n') : '- Bạn chưa đặt mục tiêu nghề nghiệp cụ thể nào. Hãy đặt mục tiêu nghề nghiệp như Frontend Developer, Backend Developer, Tester... để nhận định hướng!'}

🛠 **Bản đồ Kỹ năng hiện tại:**
${skills.length > 0 ? skills.map(s => `- **${s.name}**: ${'⭐'.repeat(s.proficiency)}/5 sao`).join('\n') : '- Bạn chưa cập nhật kỹ năng nào.'}

📜 **Chứng chỉ học thuật:**
${certificates.length > 0 ? certificates.map(c => `- **${c.name}**: Điểm số **${c.score || 'Đang học'}** | Trạng thái: ${c.status === 'obtained' ? 'Đã có' : 'Đang học'}`).join('\n') : '- Bạn chưa thêm chứng chỉ nào.'}

💼 **Thực tập & Tìm việc:**
- Bạn đang theo dõi **${companies.length} công ty ứng tuyển**.
${companies.map(c => `  + **${c.name}** (${c.position}) - Trạng thái: **${c.status === 'not_applied' ? 'Chưa ứng tuyển' : c.status === 'sent_cv' ? 'Đã gửi CV' : c.status === 'interviewing' ? 'Đang phỏng vấn' : c.status === 'passed' ? 'Đậu' : 'Trượt'}**`).join('\n')}
- Bạn có **${interviews.length} lịch phỏng vấn** sắp tới.

📚 **Tổng quan học tập & GPA:**
- Tổng số môn học: **${subjects.length}** (GPA: **${gpa4.toFixed(2)}/4.0**).

💡 **Khuyến nghị Lộ trình Nghề nghiệp:**
1. ${goals.length > 0 ? `Để đạt mục tiêu **${goals[0].title}**, bạn nên tiếp tục nâng mức thành thạo của các kỹ năng liên quan lên trên 4 sao.` : 'Đặt mục tiêu nghề nghiệp đầu tiên của bạn trong tab "Mục tiêu & Kỹ năng".'}
2. Hãy chuẩn bị thi lấy thêm các chứng chỉ ngoại ngữ hoặc chuyên môn phù hợp như **IELTS, TOEIC, MOS, hay JLPT** để làm nổi bật CV.
3. Liên tục theo dõi trạng thái ứng tuyển và chuẩn bị kỹ càng cho các lịch phỏng vấn tiếp theo.`;
      return r;
    };

    // If no API key is available
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ reply: buildLocalReport() });
    }

    // System instruction prompt for Gemini
    const systemPrompt = `Bạn là AI Career Advisor (Cố vấn nghề nghiệp AI) chuyên nghiệp tích hợp trong ứng dụng Student Planner.
Tên sinh viên: ${user.fullname || user.username} (${user.email || 'Chưa cập nhật email'}).

Dữ liệu hồ sơ của sinh viên:
1. Học tập:
   - Tổng môn học: ${subjects.length} | Tín chỉ hoàn thành: ${gradedCredits}
   - GPA: ${gpa4.toFixed(2)}/4.0 (Hệ 10: ${gpa10.toFixed(2)})
   - Chi tiết môn: ${subjects.map(s => `${s.name} (${s.credit} TC, Điểm: ${s.score || 'N/A'}, ${s.status === 'completed' ? 'Đã hoàn tất' : 'Đang học'})`).join(', ')}

2. Mục tiêu nghề nghiệp:
   - ${goals.map(g => `${g.title} (Tiến độ: ${g.progress}%, Trạng thái: ${g.status})`).join('; ') || 'Chưa thiết lập mục tiêu'}

3. Kỹ năng chuyên môn:
   - ${skills.map(s => `${s.name} (${s.proficiency}/5 sao)`).join('; ') || 'Chưa có kỹ năng nào'}

4. Chứng chỉ:
   - ${certificates.map(c => `${c.name} (Điểm: ${c.score || 'N/A'}, Trạng thái: ${c.status}, Ngày thi: ${c.exam_date || 'N/A'}, Hạn: ${c.expiry_date || 'N/A'})`).join('; ') || 'Chưa có chứng chỉ'}

5. Thực tập & Ứng tuyển:
   - Công ty: ${companies.map(c => `${c.name} (Vị trí: ${c.position}, Trạng thái: ${c.status})`).join('; ') || 'Chưa ứng tuyển công ty nào'}
   - Lịch phỏng vấn: ${interviews.map(i => `Tại ${i.company_name} lúc ${new Date(i.interview_time).toLocaleString('vi-VN')} (${i.location || 'Chưa rõ địa điểm'})`).join('; ') || 'Chưa có lịch phỏng vấn'}

Nhiệm vụ của bạn:
1. Đóng vai trò là một cố vấn nghề nghiệp thông thái, thân thiện và giàu kinh nghiệm để đưa ra định hướng chính xác nhất.
2. Trả lời các thắc mắc về:
   - Gợi ý lộ trình học cụ thể để đạt được nghề nghiệp mong muốn (như Frontend, Backend, Data Analyst, Tester...).
   - Gợi ý các kỹ năng quan trọng cần bồi dưỡng thêm dựa trên các mục tiêu nghề nghiệp và các kỹ năng hiện có của sinh viên.
   - Gợi ý các chứng chỉ (IELTS, TOEIC, MOS, JLPT, các chứng chỉ chuyên môn...) nên thi để tăng lợi thế cạnh tranh.
   - Đề xuất kế hoạch phân bổ thời gian học tập, ôn thi chứng chỉ, làm đồ án và nộp hồ sơ thực tập/tìm việc tối ưu nhất dựa trên dữ liệu hiện tại của sinh viên.
3. Đưa ra phản hồi ngắn gọn, dễ hiểu, sử dụng định dạng Markdown rõ ràng (bullet points, bolding). Hãy cổ vũ và truyền cảm hứng cho sinh viên!`;

    // Format conversation history for Gemini API
    const formattedContents = (history || []).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Add current user message
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

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
    res.status(500).json({ message: 'Lỗi khi kết nối tới Trợ lý AI Cố vấn nghề nghiệp. Vui lòng thử lại sau.' });
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
