const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { initializeDatabase, query } = require('./db');
const authMiddleware = require('./middleware/auth');
const { getLocalRoadmap, callGemini } = require('./careerAdvisor');

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
    const users = await query('SELECT id, username, fullname, email, major, desired_career, language_proficiency, career_roadmap, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Update user profile info
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  const { fullname, email, major, desired_career, language_proficiency } = req.body;
  const userId = req.user.id;

  try {
    await query(
      'UPDATE users SET fullname = ?, email = ?, major = ?, desired_career = ?, language_proficiency = ? WHERE id = ?',
      [
        fullname ? fullname.trim() : null,
        email ? email.trim() : null,
        major ? major.trim() : null,
        desired_career ? desired_career.trim() : null,
        language_proficiency ? language_proficiency.trim() : null,
        userId
      ]
    );
    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// Change password
app.put('/api/auth/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required.' });
  }

  try {
    const users = await query('SELECT password FROM users WHERE id = ?', [userId]);
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
    res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password.' });
  }
});

// ==========================================
// ASSIGNMENTS CRUD ENDPOINTS (Protected)
// ==========================================

// Get all assignments
app.get('/api/assignments', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const assignments = await query(
      'SELECT a.*, s.name AS subject_name FROM assignments a LEFT JOIN subjects s ON a.subject_id = s.id WHERE a.user_id = ? ORDER BY a.deadline ASC',
      [userId]
    );
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
    const result = await query(
      'INSERT INTO assignments (user_id, subject_id, title, description, deadline) VALUES (?, ?, ?, ?, ?)',
      [userId, subject_id || null, title.trim(), description ? description.trim() : null, deadline]
    );
    res.status(201).json({ id: result.insertId, message: 'Assignment added.' });
  } catch (error) {
    console.error('Add assignment error:', error);
    res.status(500).json({ message: 'Failed to add assignment.' });
  }
});

// Update assignment
app.put('/api/assignments/:id', authMiddleware, async (req, res) => {
  const assignId = req.params.id;
  const { title, description, deadline, subject_id, status } = req.body;
  const userId = req.user.id;

  try {
    await query(
      'UPDATE assignments SET title = ?, description = ?, deadline = ?, subject_id = ?, status = ? WHERE id = ? AND user_id = ?',
      [title.trim(), description ? description.trim() : null, deadline, subject_id || null, status || 'pending', assignId, userId]
    );
    res.json({ message: 'Assignment updated.' });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Failed to update assignment.' });
  }
});

// Update status of assignment
app.patch('/api/assignments/:id/status', authMiddleware, async (req, res) => {
  const assignId = req.params.id;
  const { status } = req.body;
  const userId = req.user.id;

  try {
    await query(
      'UPDATE assignments SET status = ? WHERE id = ? AND user_id = ?',
      [status, assignId, userId]
    );
    res.json({ message: 'Assignment status updated.' });
  } catch (error) {
    console.error('Update assignment status error:', error);
    res.status(500).json({ message: 'Failed to update status.' });
  }
});

// Delete assignment
app.delete('/api/assignments/:id', authMiddleware, async (req, res) => {
  const assignId = req.params.id;
  const userId = req.user.id;

  try {
    await query('DELETE FROM assignments WHERE id = ? AND user_id = ?', [assignId, userId]);
    res.json({ message: 'Assignment deleted.' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Failed to delete assignment.' });
  }
});

// ==========================================
// CAREER GOALS & SKILLS CRUD ENDPOINTS (Protected)
// ==========================================

// GET goals
app.get('/api/goals', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const goals = await query('SELECT * FROM career_goals WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Failed to retrieve goals.' });
  }
});

// POST goal
app.post('/api/goals', authMiddleware, async (req, res) => {
  const { title, progress, target_date, status } = req.body;
  const userId = req.user.id;
  if (!title) return res.status(400).json({ message: 'Title is required.' });

  try {
    const result = await query(
      'INSERT INTO career_goals (user_id, title, progress, target_date, status) VALUES (?, ?, ?, ?, ?)',
      [userId, title.trim(), progress || 0, target_date || null, status || 'in_progress']
    );
    res.status(201).json({ id: result.insertId, message: 'Goal created.' });
  } catch (error) {
    console.error('Add goal error:', error);
    res.status(500).json({ message: 'Failed to add goal.' });
  }
});

// PUT goal
app.put('/api/goals/:id', authMiddleware, async (req, res) => {
  const goalId = req.params.id;
  const { title, progress, target_date, status } = req.body;
  const userId = req.user.id;

  try {
    await query(
      'UPDATE career_goals SET title = ?, progress = ?, target_date = ?, status = ? WHERE id = ? AND user_id = ?',
      [title.trim(), progress || 0, target_date || null, status || 'in_progress', goalId, userId]
    );
    res.json({ message: 'Goal updated.' });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Failed to update goal.' });
  }
});

// DELETE goal
app.delete('/api/goals/:id', authMiddleware, async (req, res) => {
  const goalId = req.params.id;
  const userId = req.user.id;
  try {
    await query('DELETE FROM career_goals WHERE id = ? AND user_id = ?', [goalId, userId]);
    res.json({ message: 'Goal deleted.' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Failed to delete goal.' });
  }
});

// GET skills
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

// POST skill
app.post('/api/skills', authMiddleware, async (req, res) => {
  const { name, proficiency } = req.body;
  const userId = req.user.id;
  if (!name) return res.status(400).json({ message: 'Skill name is required.' });

  try {
    const result = await query(
      'INSERT INTO skills (user_id, name, proficiency) VALUES (?, ?, ?)',
      [userId, name.trim(), proficiency || 1]
    );
    res.status(201).json({ id: result.insertId, message: 'Skill added.' });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ message: 'Failed to add skill.' });
  }
});

// PUT skill
app.put('/api/skills/:id', authMiddleware, async (req, res) => {
  const skillId = req.params.id;
  const { name, proficiency } = req.body;
  const userId = req.user.id;

  try {
    await query(
      'UPDATE skills SET name = ?, proficiency = ? WHERE id = ? AND user_id = ?',
      [name.trim(), proficiency || 1, skillId, userId]
    );
    res.json({ message: 'Skill updated.' });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ message: 'Failed to update skill.' });
  }
});

// DELETE skill
app.delete('/api/skills/:id', authMiddleware, async (req, res) => {
  const skillId = req.params.id;
  const userId = req.user.id;
  try {
    await query('DELETE FROM skills WHERE id = ? AND user_id = ?', [skillId, userId]);
    res.json({ message: 'Skill deleted.' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ message: 'Failed to delete skill.' });
  }
});

// ==========================================
// CERTIFICATES CRUD ENDPOINTS (Protected)
// ==========================================

// GET certificates
app.get('/api/certificates', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const certificates = await query('SELECT * FROM certificates WHERE user_id = ? ORDER BY exam_date DESC, name ASC', [userId]);
    res.json(certificates);
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ message: 'Failed to retrieve certificates.' });
  }
});

// POST certificate
app.post('/api/certificates', authMiddleware, async (req, res) => {
  const { name, status, score, exam_date, expiry_date } = req.body;
  const userId = req.user.id;
  if (!name) return res.status(400).json({ message: 'Certificate name is required.' });

  try {
    const result = await query(
      'INSERT INTO certificates (user_id, name, status, score, exam_date, expiry_date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name.trim(), status || 'studying', score || null, exam_date || null, expiry_date || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Certificate added.' });
  } catch (error) {
    console.error('Add certificate error:', error);
    res.status(500).json({ message: 'Failed to add certificate.' });
  }
});

// PUT certificate
app.put('/api/certificates/:id', authMiddleware, async (req, res) => {
  const certId = req.params.id;
  const { name, status, score, exam_date, expiry_date } = req.body;
  const userId = req.user.id;

  try {
    await query(
      'UPDATE certificates SET name = ?, status = ?, score = ?, exam_date = ?, expiry_date = ? WHERE id = ? AND user_id = ?',
      [name.trim(), status || 'studying', score || null, exam_date || null, expiry_date || null, certId, userId]
    );
    res.json({ message: 'Certificate updated.' });
  } catch (error) {
    console.error('Update certificate error:', error);
    res.status(500).json({ message: 'Failed to update certificate.' });
  }
});

// DELETE certificate
app.delete('/api/certificates/:id', authMiddleware, async (req, res) => {
  const certId = req.params.id;
  const userId = req.user.id;
  try {
    await query('DELETE FROM certificates WHERE id = ? AND user_id = ?', [certId, userId]);
    res.json({ message: 'Certificate deleted.' });
  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({ message: 'Failed to delete certificate.' });
  }
});

// ==========================================
// INTERNSHIPS CRUD ENDPOINTS (Protected)
// ==========================================

// GET companies
app.get('/api/companies', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const companies = await query('SELECT * FROM companies WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
    res.json(companies);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ message: 'Failed to retrieve companies.' });
  }
});

// POST company
app.post('/api/companies', authMiddleware, async (req, res) => {
  const { name, position, status, note } = req.body;
  const userId = req.user.id;
  if (!name || !position) return res.status(400).json({ message: 'Company name and position are required.' });

  try {
    const result = await query(
      'INSERT INTO companies (user_id, name, position, status, note) VALUES (?, ?, ?, ?, ?)',
      [userId, name.trim(), position.trim(), status || 'not_applied', note || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Company added.' });
  } catch (error) {
    console.error('Add company error:', error);
    res.status(500).json({ message: 'Failed to add company.' });
  }
});

// PUT company
app.put('/api/companies/:id', authMiddleware, async (req, res) => {
  const companyId = req.params.id;
  const { name, position, status, note } = req.body;
  const userId = req.user.id;

  try {
    await query(
      'UPDATE companies SET name = ?, position = ?, status = ?, note = ? WHERE id = ? AND user_id = ?',
      [name.trim(), position.trim(), status || 'not_applied', note || null, companyId, userId]
    );
    res.json({ message: 'Company updated.' });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Failed to update company.' });
  }
});

// DELETE company
app.delete('/api/companies/:id', authMiddleware, async (req, res) => {
  const companyId = req.params.id;
  const userId = req.user.id;
  try {
    await query('DELETE FROM companies WHERE id = ? AND user_id = ?', [companyId, userId]);
    res.json({ message: 'Company deleted.' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: 'Failed to delete company.' });
  }
});

// GET interviews
app.get('/api/interviews', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const interviews = await query(
      'SELECT i.*, c.name AS company_name, c.position AS company_position FROM interviews i INNER JOIN companies c ON i.company_id = c.id WHERE i.user_id = ? ORDER BY i.interview_time ASC',
      [userId]
    );
    res.json(interviews);
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ message: 'Failed to retrieve interviews.' });
  }
});

// POST interview
app.post('/api/interviews', authMiddleware, async (req, res) => {
  const { company_id, interview_time, location, note } = req.body;
  const userId = req.user.id;
  if (!company_id || !interview_time) return res.status(400).json({ message: 'Company and interview time are required.' });

  try {
    const result = await query(
      'INSERT INTO interviews (user_id, company_id, interview_time, location, note) VALUES (?, ?, ?, ?, ?)',
      [userId, company_id, interview_time, location || null, note || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Interview scheduled.' });
  } catch (error) {
    console.error('Add interview error:', error);
    res.status(500).json({ message: 'Failed to add interview.' });
  }
});

// PUT interview
app.put('/api/interviews/:id', authMiddleware, async (req, res) => {
  const interviewId = req.params.id;
  const { company_id, interview_time, location, note } = req.body;
  const userId = req.user.id;

  try {
    await query(
      'UPDATE interviews SET company_id = ?, interview_time = ?, location = ?, note = ? WHERE id = ? AND user_id = ?',
      [company_id, interview_time, location || null, note || null, interviewId, userId]
    );
    res.json({ message: 'Interview updated.' });
  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({ message: 'Failed to update interview.' });
  }
});

// DELETE interview
app.delete('/api/interviews/:id', authMiddleware, async (req, res) => {
  const interviewId = req.params.id;
  const userId = req.user.id;
  try {
    await query('DELETE FROM interviews WHERE id = ? AND user_id = ?', [interviewId, userId]);
    res.json({ message: 'Interview deleted.' });
  } catch (error) {
    console.error('Delete interview error:', error);
    res.status(500).json({ message: 'Failed to delete interview.' });
  }
});

// ==========================================
// AI ROADMAP & CHAT ADVISOR ENDPOINTS (Protected)
// ==========================================

// Generate AI Career Roadmap ("Hướng mới")
app.post('/api/career/roadmap', authMiddleware, async (req, res) => {
  const { major, desired_career, language_proficiency, skills } = req.body;
  const userId = req.user.id;

  try {
    // 1. Fetch subjects to calculate GPA and summarize academic progress
    const subjects = await query('SELECT name, credit, score, status FROM subjects WHERE user_id = ?', [userId]);
    
    // Calculate GPA
    const completedSubjects = subjects.filter(s => s.status === 'completed' && s.score !== null);
    let totalCredits = 0;
    let weightedScoreSum = 0;
    completedSubjects.forEach(s => {
      totalCredits += s.credit;
      weightedScoreSum += (parseFloat(s.score) * s.credit);
    });
    const gpa = totalCredits > 0 ? (weightedScoreSum / totalCredits).toFixed(2) : null;
    const subjectsStr = subjects.map(s => `${s.name} (${s.credit} tín chỉ, điểm: ${s.score || 'N/A'}, trạng thái: ${s.status})`).join(', ');

    // 2. Decide if we use Gemini API or Local Fallback
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    let roadmapContent = '';
    let parsedInfo = null;

    if (hasGeminiKey) {
      console.log('Gemini API key detected, generating career roadmap...');
      const prompt = `
Bạn là một chuyên gia tư vấn nghề nghiệp AI chuyên nghiệp dành cho sinh viên Việt Nam.
Nhiệm vụ của bạn là phân tích thông tin định hướng nghề nghiệp của sinh viên và đưa ra một báo cáo tư vấn chi tiết, cụ thể, và có thể hành động được.

Thông tin sinh viên cung cấp:
- Ngành học: ${major || 'Công nghệ thông tin'}
- Công việc mơ ước: ${desired_career || 'Software Developer'}
- Kỹ năng hiện tại: ${skills || 'Chưa cập nhật'}
- Trình độ ngoại ngữ: ${language_proficiency || 'Chưa cập nhật'}
- Điểm học tập hiện tại (GPA): ${gpa || 'Chưa có điểm tích lũy'} (tính theo hệ 10)
- Các môn học đã học: ${subjectsStr || 'Chưa lưu môn học nào'}

Báo cáo của bạn phải viết bằng tiếng Việt, sử dụng định dạng Markdown chuyên nghiệp và đẹp mắt, bao gồm 4 phần chính sau:

### 1. Phân tích định hướng & Đánh giá khoảng cách kỹ năng (Gap Analysis)
- Đánh giá mức độ phù hợp giữa ngành học hiện tại và công việc mơ ước.
- So sánh các kỹ năng hiện có với các yêu cầu thực tế của thị trường tuyển dụng đối với công việc mơ ước. Chỉ ra những kỹ năng quan trọng còn thiếu.

### 2. Lộ trình phát triển chi tiết (Roadmap Timeline)
- Chia lộ trình ra làm 4 giai đoạn cụ thể (mỗi giai đoạn tương ứng với khoảng 3-6 tháng học tập hoặc theo học kỳ).
- Ở mỗi giai đoạn, chỉ rõ:
  + Mục tiêu chính cần đạt được.
  + Các kiến thức chuyên môn và kỹ năng thực tế cần học (ví dụ: học framework nào, công nghệ gì).
  + Các dự án thực tế nên làm để bổ sung vào portfolio.

### 3. Đề xuất kỹ năng & Chứng chỉ học thuật phù hợp
- Đề xuất cụ thể danh sách 3-5 kỹ năng thực tiễn nhất cần học thêm (ví dụ: Git, React, Docker, SQL, UI/UX,...). Ghi rõ lý do tại sao kỹ năng này quan trọng đối với công việc mơ ước.
- Đề xuất cụ thể 2-3 chứng chỉ phù hợp nhất (ví dụ: IELTS 6.5+, AWS Certified Cloud Practitioner, TOEFL, JLPT N3, ISTQB, Certified ScrumMaster,...) kèm thời điểm thích hợp trong lộ trình để thi.

### 4. Kế hoạch chuẩn bị thực tập & Tìm việc (Internship & Placement Guide)
- Hướng dẫn chuẩn bị CV/Resume, LinkedIn, portfolio cho vị trí công việc mơ ước.
- Đề xuất các bước tìm kiếm cơ hội thực tập (Internship), cách thức tiếp cận doanh nghiệp.
- Gợi ý 3 vị trí công việc hoặc loại hình doanh nghiệp phù hợp nhất để thực tập (ví dụ: Product Company, Outsource Agency, Startup...).

Yêu cầu định dạng: Báo cáo trả về phải là một chuỗi Markdown hoàn chỉnh, sử dụng các thẻ tiêu đề (H3, H4), danh sách gạch đầu dòng, bảng biểu, các định dạng in đậm/in nghiêng một cách rõ ràng và thu hút thị giác.
`;
      try {
        roadmapContent = await callGemini(prompt);
      } catch (geminiError) {
        console.error('Error calling Gemini API for roadmap, falling back to local templates:', geminiError);
        parsedInfo = getLocalRoadmap(desired_career, major, skills, language_proficiency, gpa, subjectsStr);
        roadmapContent = parsedInfo.markdown;
      }
    } else {
      console.log('No Gemini API key in env. Using local career advisor templates.');
      parsedInfo = getLocalRoadmap(desired_career, major, skills, language_proficiency, gpa, subjectsStr);
      roadmapContent = parsedInfo.markdown;
    }

    // 3. Save to database
    await query(
      'UPDATE users SET major = ?, desired_career = ?, language_proficiency = ?, career_roadmap = ? WHERE id = ?',
      [major || null, desired_career || null, language_proficiency || null, roadmapContent, userId]
    );

    // 4. Return results
    res.json({
      roadmap: roadmapContent,
      suggestedSkills: parsedInfo ? parsedInfo.suggestedSkills : [],
      suggestedCerts: parsedInfo ? parsedInfo.suggestedCerts : []
    });

  } catch (error) {
    console.error('Generate roadmap error:', error);
    res.status(500).json({ message: 'Failed to generate career roadmap.' });
  }
});

// AI Career Advisor Chat
app.post('/api/chat', authMiddleware, async (req, res) => {
  const { message, history } = req.body;
  const userId = req.user.id;

  if (!message) {
    return res.status(400).json({ message: 'Message is required.' });
  }

  try {
    // 1. Gather student context from DB
    const [user] = await query('SELECT major, desired_career, language_proficiency FROM users WHERE id = ?', [userId]);
    const subjects = await query('SELECT name, credit, score, status FROM subjects WHERE user_id = ?', [userId]);
    const skills = await query('SELECT name, proficiency FROM skills WHERE user_id = ?', [userId]);
    const goals = await query('SELECT title, progress, status FROM career_goals WHERE user_id = ?', [userId]);
    const certs = await query('SELECT name, status, score FROM certificates WHERE user_id = ?', [userId]);
    const companies = await query('SELECT name, position, status FROM companies WHERE user_id = ?', [userId]);
    const interviews = await query(
      'SELECT i.interview_time, i.location, c.name AS company_name, c.position FROM interviews i INNER JOIN companies c ON i.company_id = c.id WHERE i.user_id = ?',
      [userId]
    );

    // Calculate GPA
    const completedSubjects = subjects.filter(s => s.status === 'completed' && s.score !== null);
    let totalCredits = 0;
    let weightedScoreSum = 0;
    completedSubjects.forEach(s => {
      totalCredits += s.credit;
      weightedScoreSum += (parseFloat(s.score) * s.credit);
    });
    const gpa = totalCredits > 0 ? (weightedScoreSum / totalCredits).toFixed(2) : 'N/A';

    // Compile Context Text
    const contextText = `
[BỐI CẢNH SINH VIÊN]
- Chuyên ngành: ${user.major || 'Chưa cập nhật'}
- Nghề nghiệp mơ ước: ${user.desired_career || 'Chưa cập nhật'}
- Trình độ ngoại ngữ: ${user.language_proficiency || 'Chưa cập nhật'}
- GPA hiện tại: ${gpa}
- Danh sách môn học: ${subjects.map(s => `${s.name} (${s.credit} tín chỉ, Điểm: ${s.score || 'N/A'}, Trạng thái: ${s.status})`).join(', ') || 'Chưa có'}
- Kỹ năng hiện có: ${skills.map(s => `${s.name} (${s.proficiency}/5 sao)`).join(', ') || 'Chưa có'}
- Mục tiêu sự nghiệp: ${goals.map(g => `${g.title} (Tiến độ: ${g.progress}%, Trạng thái: ${g.status})`).join(', ') || 'Chưa có'}
- Chứng chỉ học thuật: ${certs.map(c => `${c.name} (${c.status === 'obtained' ? 'Đã đạt' : 'Đang học'}, Điểm: ${c.score || 'N/A'})`).join(', ') || 'Chưa có'}
- Thực tập & việc làm: ${companies.map(c => `${c.position} tại ${c.name} (Trạng thái: ${c.status})`).join(', ') || 'Chưa ứng tuyển'}
- Lịch phỏng vấn sắp tới: ${interviews.map(i => `Phỏng vấn tại ${i.company_name} lúc ${new Date(i.interview_time).toLocaleString('vi-VN')} tại ${i.location || 'Online'}`).join(', ') || 'Không có'}
`;

    // 2. Decide if we call Gemini API or return mock chatbot advisor responses
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;

    if (hasGeminiKey) {
      // Build conversation system instruction & prompt
      const systemInstruction = `
Bạn là "Cố vấn Sự nghiệp AI" (AI Career Advisor) được tích hợp trong ứng dụng Student Planner của sinh viên.
Nhiệm vụ của bạn là giải đáp các thắc mắc, đưa ra lời khuyên, định hướng học tập, thi chứng chỉ, viết CV, thực tập và xin việc dựa trên thông tin hồ sơ của sinh viên.
Hãy luôn lịch sự, khuyến khích, chuyên nghiệp và trả lời bằng tiếng Việt. Sử dụng định dạng Markdown rõ ràng.

Dưới đây là thông tin chi tiết về sinh viên này:
${contextText}

Lịch sử trò chuyện gần đây:
${(history || []).map(h => `${h.sender === 'user' ? 'Sinh viên' : 'Cố vấn AI'}: ${h.text}`).join('\n')}

Hãy trả lời câu hỏi hiện tại của sinh viên một cách trực tiếp, ngắn gọn và hữu ích.
`;

      const prompt = `${systemInstruction}\n\nSinh viên hỏi: ${message}\nCố vấn AI:`;
      try {
        const reply = await callGemini(prompt);
        return res.json({ reply });
      } catch (geminiError) {
        console.error('Error calling Gemini API for chatbot, fallback to local reply:', geminiError);
      }
    }

    // Local rule-based chatbot replies
    const msg = message.toLowerCase();
    let reply = "";

    if (msg.includes('lộ trình') || msg.includes('career') || msg.includes('roadmap') || msg.includes('hướng đi')) {
      reply = `Chào bạn! Tôi thấy chuyên ngành của bạn là **${user.major || 'Chưa cập nhật'}** và bạn mong muốn trở thành **${user.desired_career || 'Software Developer'}**. 
Để xem lộ trình chi tiết từng bước, bạn hãy chuyển sang tab **"Hướng mới"** ở thanh điều hướng bên trái và bấm nút **"Phân tích & Tạo lộ trình"**. 
Ở đó tôi sẽ phân tích chi tiết Gap Analysis, chia lộ trình thành 4 giai đoạn, gợi ý kỹ năng bổ sung và chứng chỉ cần thi cụ thể nhất cho bạn!`;
    } else if (msg.includes('chứng chỉ') || msg.includes('bằng cấp') || msg.includes('tiếng anh') || msg.includes('ielts') || msg.includes('toeic')) {
      reply = `Dựa trên định hướng **${user.desired_career || 'Software Developer'}** và trình độ ngoại ngữ **${user.language_proficiency || 'Chưa cập nhật'}** của bạn, tôi khuyên bạn nên tập trung vào các chứng chỉ sau:
1. **Ngoại ngữ:** Nếu chưa đạt mục tiêu, hãy thi **IELTS 6.0+** hoặc **TOEIC 700+** vì đây là tấm vé thông hành vào các công ty đa quốc gia.
2. **Chuyên môn:** 
   - Với lập trình: Nên học thi **AWS Certified Cloud Practitioner** hoặc **Google Cloud Digital Leader**.
   - Với kiểm thử: Chứng chỉ **ISTQB Foundation** là tiêu chuẩn vàng.
   - Với quản lý: **Certified ScrumMaster (CSM)** hoặc **PSM I** rất tốt cho các vai trò quản trị.
Bạn có thể theo dõi tiến độ thi chứng chỉ tại tab **"Chứng chỉ"** nhé!`;
    } else if (msg.includes('kỹ năng') || msg.includes('học gì') || msg.includes('ngôn ngữ') || msg.includes('framework')) {
      reply = `Chào bạn! Hiện tại bạn đang có các kỹ năng: *${skills.map(s => s.name).join(', ') || 'Chưa cập nhật'}*.
Để phục vụ tốt nhất cho vai trò **${user.desired_career || 'Software Developer'}**, bạn nên bổ sung các kỹ năng sau:
- **Kỹ năng chuyên môn:** Học sâu về Git, RESTful API, thiết kế database và viết Unit Tests.
- **Kỹ năng mềm:** Rèn luyện thêm kỹ năng làm việc nhóm, tư duy giải quyết vấn đề và kỹ năng thuyết trình.
Bạn có thể tự do thêm các kỹ năng cần học vào tab **"Mục tiêu & Kỹ năng"** để theo dõi hàng ngày!`;
    } else if (msg.includes('thực tập') || msg.includes('xin việc') || msg.includes('cv') || msg.includes('phỏng vấn')) {
      reply = `Để chuẩn bị tốt nhất cho quá trình thực tập vị trí **${user.desired_career || 'Software Developer'}**:
1. **CV & Portfolio:** Hãy chuẩn bị một CV đẹp mắt (tập trung vào các dự án cá nhân và các kỹ năng chuyên môn).
2. **Theo dõi tuyển dụng:** Bạn có thể thêm các công ty bạn muốn ứng tuyển vào tab **"Thực tập & Tìm việc"** để theo dõi trạng thái ứng tuyển (Đã nộp, Phỏng vấn, Nhận offer).
3. **Phỏng vấn:** Hãy ôn tập kỹ các câu hỏi về thuật toán, SQL, OOP và kiến thức ngôn ngữ lập trình bạn sử dụng.
${interviews.length > 0 ? `Chúc bạn tự tin trong buổi phỏng vấn sắp tới vào ngày ${new Date(interviews[0].interview_time).toLocaleDateString('vi-VN')} nhé!` : 'Bạn có thể lên lịch phỏng vấn thử tại tab Thực tập & Tìm việc để luyện tập.'}`;
    } else {
      reply = `Chào bạn! Tôi là Cố vấn Sự nghiệp AI của bạn. 
Tôi đã đọc hồ sơ học tập của bạn (GPA: **${gpa}**, ngành: **${user.major || 'Chưa cập nhật'}**, đích đến: **${user.desired_career || 'Chưa cập nhật'}**).
Bạn có thể hỏi tôi về:
- Lộ trình phát triển sự nghiệp từng giai đoạn.
- Đề xuất các chứng chỉ nghề nghiệp và ngoại ngữ phù hợp.
- Kỹ năng cần bổ sung để thu hẹp khoảng cách tuyển dụng.
- Lời khuyên chuẩn bị CV và phỏng vấn thực tập.
Bạn muốn thảo luận về chủ đề nào trước?`;
    }

    res.json({ reply });
  } catch (error) {
    console.error('AIChat error:', error);
    res.status(500).json({ message: 'Internal server error in AI chat.' });
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
