/**
 * db.js - Module khởi tạo và quản lý kết nối cơ sở dữ liệu MySQL
 * ----------------------------------------------------------------
 * THAY ĐỔI CHÍNH (feature/dashboard-redesign):
 *   1. Thêm migration cho bảng `users`: bổ sung 4 cột mới:
 *      - fullname (VARCHAR 255): Họ và tên đầy đủ
 *      - email    (VARCHAR 255): Địa chỉ email
 *      - role     (VARCHAR 20) : Vai trò, mặc định là 'user'
 *      - is_blocked (TINYINT)  : Trạng thái khóa tài khoản (0/1)
 *   2. Tạo 5 bảng mới: certificates, companies, interviews,
 *      career_goals, skills
 *   3. Seed tài khoản admin mặc định (admin/adminpassword) tự động
 *      khi khởi động server. Nếu đã tồn tại, ép buộc cập nhật
 *      role = 'admin' và reset mật khẩu để đảm bảo luôn đăng nhập được.
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

let pool; // Pool kết nối dùng chung toàn ứng dụng

async function initializeDatabase() {
  try {
    // 1. Connect to MySQL server without a database first to verify or create the schema
    const connection = await mysql.createConnection({
      host: DB_HOST || 'localhost',
      user: DB_USER || 'root',
      password: DB_PASSWORD || '',
    });

    console.log('MySQL server connected successfully.');

    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME || 'student_planner'}\`;`);
    console.log(`Database '${DB_NAME || 'student_planner'}' verified/created.`);
    await connection.end();

    // 2. Create the connection pool with the database specified
    pool = mysql.createPool({
      host: DB_HOST || 'localhost',
      user: DB_USER || 'root',
      password: DB_PASSWORD || '',
      database: DB_NAME || 'student_planner',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // 3. Initialize tables
    await createTables();

    console.log('Database initialization completed successfully. (kết nối thành công)');
    return pool;
  } catch (error) {
    console.error('Error during database initialization:', error.message);
    throw error;
  }
}

async function createTables() {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      fullname VARCHAR(255) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      role VARCHAR(20) DEFAULT 'user',
      is_blocked TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const subjectsTable = `
    CREATE TABLE IF NOT EXISTS subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      credit INT NOT NULL,
      score DECIMAL(4,2) NULL DEFAULT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const schedulesTable = `
    CREATE TABLE IF NOT EXISTS schedules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      subject_id INT NOT NULL,
      day_of_week VARCHAR(15) NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      room VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const assignmentsTable = `
    CREATE TABLE IF NOT EXISTS assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      subject_id INT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      deadline DATETIME NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  // [MỚI] Bảng lưu chứng chỉ của sinh viên (IELTS, TOEIC, MOS...)
  const certificatesTable = `
    CREATE TABLE IF NOT EXISTS certificates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'studying',  -- 'studying' | 'obtained'
      score VARCHAR(50) DEFAULT NULL,                  -- Điểm số đạt được
      exam_date DATE DEFAULT NULL,                     -- Ngày thi
      expiry_date DATE DEFAULT NULL,                   -- Ngày hết hạn
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  // [MỚI] Bảng theo dõi công ty ứng tuyển thực tập/việc làm
  const companiesTable = `
    CREATE TABLE IF NOT EXISTS companies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      position VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'not_applied', -- not_applied|sent_cv|interviewing|passed|failed
      note TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  // [MỚI] Bảng lịch phỏng vấn - liên kết với công ty đã ứng tuyển
  const interviewsTable = `
    CREATE TABLE IF NOT EXISTS interviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      company_id INT NOT NULL,          -- Khóa ngoại tới bảng companies
      interview_time DATETIME NOT NULL,
      location VARCHAR(255) DEFAULT NULL,
      note TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  // [MỚI] Bảng lưu mục tiêu nghề nghiệp (Frontend Dev, Data Analyst...)
  const careerGoalsTable = `
    CREATE TABLE IF NOT EXISTS career_goals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      progress INT NOT NULL DEFAULT 0,      -- Tiến độ hoàn thành (0-100%)
      target_date DATE DEFAULT NULL,         -- Ngày mục tiêu hoàn thành
      status VARCHAR(50) NOT NULL DEFAULT 'in_progress', -- in_progress|completed
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  // [MỚI] Bảng lưu kỹ năng chuyên môn và đánh giá mức độ thành thạo
  const skillsTable = `
    CREATE TABLE IF NOT EXISTS skills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      proficiency INT NOT NULL DEFAULT 1,   -- Mức độ thành thạo 1-5 sao
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const connection = await pool.getConnection();
  try {
    // Schema migration check: If the old subjects table exists and doesn't contain user_id, drop old tables
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'subjects'",
      [DB_NAME || 'student_planner']
    );
    if (tables.length > 0) {
      const [columns] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'user_id'",
        [DB_NAME || 'student_planner']
      );
      if (columns.length === 0) {
        console.log("Old schema detected (missing user_id). Dropping old tables to recreate with new authenticated schema...");
        await connection.query("DROP TABLE IF EXISTS schedules;");
        await connection.query("DROP TABLE IF EXISTS subjects;");
        console.log("Old tables dropped successfully.");
      }
    }

    await connection.query(usersTable);
    console.log("Table 'users' verified/created.");

    // Migration check for users table column additions
    const [cols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
      [DB_NAME || 'student_planner']
    );
    const colNames = cols.map(c => c.COLUMN_NAME);
    if (!colNames.includes('fullname')) {
      await connection.query("ALTER TABLE users ADD COLUMN fullname VARCHAR(255) DEFAULT NULL;");
      console.log("Column 'fullname' added to users.");
    }
    if (!colNames.includes('email')) {
      await connection.query("ALTER TABLE users ADD COLUMN email VARCHAR(255) DEFAULT NULL;");
      console.log("Column 'email' added to users.");
    }
    if (!colNames.includes('role')) {
      await connection.query("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';");
      console.log("Column 'role' added to users.");
    }
    if (!colNames.includes('is_blocked')) {
      await connection.query("ALTER TABLE users ADD COLUMN is_blocked TINYINT(1) DEFAULT 0;");
      console.log("Column 'is_blocked' added to users.");
    }

    await connection.query(subjectsTable);
    console.log("Table 'subjects' verified/created.");

    // Migration for existing subjects table: check and add status, modify score
    const [statusCol] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'status'",
      [DB_NAME || 'student_planner']
    );
    if (statusCol.length === 0) {
      console.log("Adding column 'status' to table 'subjects'...");
      await connection.query("ALTER TABLE subjects ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'completed';");
      console.log("Column 'status' added successfully.");
    }

    // Always modify score to be nullable DECIMAL(4,2) to handle 10.0 and in-progress subjects
    console.log("Ensuring 'score' is DECIMAL(4,2) and nullable in 'subjects'...");
    await connection.query("ALTER TABLE subjects MODIFY COLUMN score DECIMAL(4,2) NULL DEFAULT NULL;");

    await connection.query(schedulesTable);
    console.log("Table 'schedules' verified/created.");

    await connection.query(assignmentsTable);
    console.log("Table 'assignments' verified/created.");

    // Create new tables
    await connection.query(certificatesTable);
    console.log("Table 'certificates' verified/created.");

    await connection.query(companiesTable);
    console.log("Table 'companies' verified/created.");

    await connection.query(interviewsTable);
    console.log("Table 'interviews' verified/created.");

    await connection.query(careerGoalsTable);
    console.log("Table 'career_goals' verified/created.");

    await connection.query(skillsTable);
    console.log("Table 'skills' verified/created.");

    // Seed default admin user
    const [admins] = await connection.query("SELECT * FROM users WHERE username = 'admin'");
    const bcrypt = require('bcryptjs');
    const hashedAdminPassword = bcrypt.hashSync('adminpassword', 10);
    if (admins.length === 0) {
      await connection.query(
        "INSERT INTO users (username, password, fullname, email, role) VALUES ('admin', ?, 'System Administrator', 'admin@studentplanner.com', 'admin')",
        [hashedAdminPassword]
      );
      console.log("Seeded default admin user: admin / adminpassword");
    } else {
      // If user admin exists but is not an admin, or password has been changed, force it to admin / adminpassword for ease of testing
      await connection.query(
        "UPDATE users SET role = 'admin', password = ?, fullname = 'System Administrator', email = 'admin@studentplanner.com' WHERE username = 'admin'",
        [hashedAdminPassword]
      );
      console.log("Forced existing admin user role to 'admin' and password to 'adminpassword'");
    }

  } catch (err) {
    console.error("Error creating tables:", err.message);
    throw err;
  } finally {
    connection.release();
  }
}

async function query(sql, params) {
  if (!pool) {
    throw new Error('Database pool has not been initialized. Call initializeDatabase first.');
  }
  const [results] = await pool.execute(sql, params);
  return results;
}

module.exports = {
  initializeDatabase,
  query,
  getPool: () => pool
};
