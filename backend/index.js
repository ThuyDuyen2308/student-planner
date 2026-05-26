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

    // Generate JWT token
    const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
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
  const { name, credit, score } = req.body;
  const userId = req.user.id;

  if (!name || credit === undefined || score === undefined) {
    return res.status(400).json({ message: 'Name, credit, and score are required.' });
  }

  const parsedCredit = parseInt(credit, 10);
  const parsedScore = parseFloat(score);

  if (isNaN(parsedCredit) || parsedCredit <= 0) {
    return res.status(400).json({ message: 'Credit must be a positive integer.' });
  }

  if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10) {
    return res.status(400).json({ message: 'Score must be a number between 0 and 10.' });
  }

  try {
    const result = await query(
      'INSERT INTO subjects (user_id, name, credit, score) VALUES (?, ?, ?, ?)',
      [userId, name.trim(), parsedCredit, parsedScore]
    );

    const newSubject = {
      id: result.insertId,
      user_id: userId,
      name: name.trim(),
      credit: parsedCredit,
      score: parsedScore
    };

    res.status(201).json(newSubject);
  } catch (error) {
    console.error('Add subject error:', error);
    res.status(500).json({ message: 'Failed to add subject.' });
  }
});

// Update a subject
app.put('/api/subjects/:id', authMiddleware, async (req, res) => {
  const { name, credit, score } = req.body;
  const subjectId = req.params.id;
  const userId = req.user.id;

  if (!name || credit === undefined || score === undefined) {
    return res.status(400).json({ message: 'Name, credit, and score are required.' });
  }

  const parsedCredit = parseInt(credit, 10);
  const parsedScore = parseFloat(score);

  if (isNaN(parsedCredit) || parsedCredit <= 0) {
    return res.status(400).json({ message: 'Credit must be a positive integer.' });
  }

  if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10) {
    return res.status(400).json({ message: 'Score must be a number between 0 and 10.' });
  }

  try {
    // Verify subject belongs to user
    const subjects = await query('SELECT * FROM subjects WHERE id = ? AND user_id = ?', [subjectId, userId]);
    if (subjects.length === 0) {
      return res.status(404).json({ message: 'Subject not found or unauthorized.' });
    }

    await query(
      'UPDATE subjects SET name = ?, credit = ?, score = ? WHERE id = ? AND user_id = ?',
      [name.trim(), parsedCredit, parsedScore, subjectId, userId]
    );

    res.json({
      id: parseInt(subjectId, 10),
      user_id: userId,
      name: name.trim(),
      credit: parsedCredit,
      score: parsedScore
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

  if (!subject_id || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({ message: 'Subject, day of week, start time, and end time are required.' });
  }

  try {
    // 1. Verify subject belongs to user
    const subjects = await query('SELECT * FROM subjects WHERE id = ? AND user_id = ?', [subject_id, userId]);
    if (subjects.length === 0) {
      return res.status(400).json({ message: 'Invalid subject or unauthorized.' });
    }

    const targetSubject = subjects[0];

    // 2. Insert schedule
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
