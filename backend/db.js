const mysql = require('mysql2/promise');
require('dotenv').config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

let pool;

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
      major VARCHAR(255) DEFAULT NULL,
      desired_career VARCHAR(255) DEFAULT NULL,
      language_proficiency VARCHAR(255) DEFAULT NULL,
      career_roadmap LONGTEXT DEFAULT NULL,
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
      score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
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
      subject_id INT DEFAULT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      deadline DATETIME NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const certificatesTable = `
    CREATE TABLE IF NOT EXISTS certificates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'studying',
      score VARCHAR(50) DEFAULT NULL,
      exam_date DATE DEFAULT NULL,
      expiry_date DATE DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const companiesTable = `
    CREATE TABLE IF NOT EXISTS companies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      position VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'not_applied',
      note TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const interviewsTable = `
    CREATE TABLE IF NOT EXISTS interviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      company_id INT NOT NULL,
      interview_time DATETIME NOT NULL,
      location VARCHAR(255) DEFAULT NULL,
      note TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const careerGoalsTable = `
    CREATE TABLE IF NOT EXISTS career_goals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      progress INT NOT NULL DEFAULT 0,
      target_date DATE DEFAULT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
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

    // Migration check: Add missing columns to 'users' table
    const columnsToAdd = [
      { name: 'fullname', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'email', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'major', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'desired_career', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'language_proficiency', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'career_roadmap', type: 'LONGTEXT DEFAULT NULL' }
    ];

    for (const col of columnsToAdd) {
      const [colExist] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = ?",
        [DB_NAME || 'student_planner', col.name]
      );
      if (colExist.length === 0) {
        console.log(`Migrating 'users' table: adding column '${col.name}'...`);
        await connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type};`);
      }
    }

    await connection.query(subjectsTable);
    console.log("Table 'subjects' verified/created.");

    await connection.query(schedulesTable);
    console.log("Table 'schedules' verified/created.");

    await connection.query(assignmentsTable);
    console.log("Table 'assignments' verified/created.");

    await connection.query(certificatesTable);
    console.log("Table 'certificates' verified/created.");

    await connection.query(companiesTable);
    console.log("Table 'companies' verified/created.");

    await connection.query(interviewsTable);
    console.log("Table 'interviews' verified/created.");

    await connection.query(careerGoalsTable);
    console.log("Table 'career_goals' verified/created.");

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
