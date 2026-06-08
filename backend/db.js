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
