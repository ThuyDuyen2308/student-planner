const mysql = require('mysql2/promise');
const config = require('./index');

let pool;

async function initializeDatabase() {
  const { host, user, password, name } = config.db;

  const connection = await mysql.createConnection({ host, user, password });
  console.log('MySQL server connected successfully.');

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${name}\`;`);
  console.log(`Database '${name}' verified/created.`);
  await connection.end();

  pool = mysql.createPool({
    host,
    user,
    password,
    database: name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  await createTables();
  console.log('Database initialization completed successfully.');
  return pool;
}

async function createTables() {
  const connection = await pool.getConnection();
  try {
    // 1. Drop old obsolete tables (if they exist)
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const tablesToDrop = [
      'certificates', 'career_goals', 'skills', 'interviews', 'companies',
      'assignments', 'schedules', 'student_subjects', 'subjects'
    ];
    for (const tbl of tablesToDrop) {
      await connection.query(`DROP TABLE IF EXISTS ${tbl}`);
      console.log(`Dropped legacy table '${tbl}' if existed.`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 2. Create/Update 'users' table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        fullname VARCHAR(255) DEFAULT NULL,
        email VARCHAR(255) UNIQUE DEFAULT NULL,
        avatar_url VARCHAR(500) DEFAULT NULL,
        role VARCHAR(20) DEFAULT 'user',
        is_blocked TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table 'users' verified/created.");

    // Migrate users table if it already exists but lacks email or avatar_url
    const userMigrations = [
      { name: 'email', def: "VARCHAR(255) UNIQUE DEFAULT NULL" },
      { name: 'avatar_url', def: "VARCHAR(500) DEFAULT NULL" }
    ];
    for (const col of userMigrations) {
      const [exist] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='users' AND COLUMN_NAME=?",
        [config.db.name, col.name]
      );
      if (exist.length === 0) {
        await connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
        console.log(`Migrated users: added column '${col.name}'.`);
      }
    }

    // 3. Create 'documents' table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        filename VARCHAR(500) NOT NULL,
        filepath VARCHAR(500) NOT NULL,
        filetype ENUM('pdf','docx','txt') NOT NULL,
        filesize INT NOT NULL,
        subject_name VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table 'documents' verified/created.");

    // 4. Create 'summaries' table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS summaries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        document_id INT NOT NULL,
        summary_type ENUM('short','medium','detailed') NOT NULL,
        content LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table 'summaries' verified/created.");

    // 5. Create 'quizzes' table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        document_id INT NOT NULL,
        quiz_type ENUM('mcq','essay','flashcard') NOT NULL,
        content LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table 'quizzes' verified/created.");

    // 6. Create 'chat_messages' table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_id VARCHAR(100) NOT NULL,
        role ENUM('user','ai') NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table 'chat_messages' verified/created.");

    // 7. Create 'study_plans' table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS study_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject_name VARCHAR(255) NOT NULL,
        exam_date DATE NOT NULL,
        proficiency_level ENUM('weak','medium','good') NOT NULL,
        hours_per_day FLOAT NOT NULL,
        plan_content LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table 'study_plans' verified/created.");

    // 8. Create 'synced_subjects' table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS synced_subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject_code VARCHAR(50),
        subject_name VARCHAR(255) NOT NULL,
        credits INT DEFAULT 0,
        lecturer VARCHAR(255),
        midterm_score FLOAT DEFAULT NULL,
        final_score FLOAT DEFAULT NULL,
        total_score FLOAT DEFAULT NULL,
        grade_letter VARCHAR(5) DEFAULT NULL,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table 'synced_subjects' verified/created.");

    // 9. Create 'synced_schedules' table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS synced_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject_name VARCHAR(255) NOT NULL,
        lecturer VARCHAR(255),
        day_of_week VARCHAR(20) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        room VARCHAR(100),
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table 'synced_schedules' verified/created.");

    // 10. Create 'synced_exams' table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS synced_exams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject_name VARCHAR(255) NOT NULL,
        exam_date DATE NOT NULL,
        exam_time TIME NOT NULL,
        room VARCHAR(100),
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table 'synced_exams' verified/created.");

    // 11. Create 'deadlines' table (replaces assignments)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS deadlines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        subject_name VARCHAR(255) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        due_date DATETIME NOT NULL,
        priority ENUM('high','medium','low') DEFAULT 'medium',
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table 'deadlines' verified/created.");

  } finally {
    connection.release();
  }
}

async function query(sql, params = []) {
  if (!pool) {
    throw new Error('Database pool has not been initialized. Call initializeDatabase first.');
  }
  const [results] = await pool.execute(sql, params);
  return results;
}

module.exports = {
  initializeDatabase,
  query,
  getPool: () => pool,
};
