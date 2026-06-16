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
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      fullname VARCHAR(255) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      role VARCHAR(20) DEFAULT 'user',
      is_blocked TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const subjectsTable = `
    CREATE TABLE IF NOT EXISTS subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject_code VARCHAR(50) NOT NULL UNIQUE,
      subject_name VARCHAR(255) NOT NULL,
      credits INT NOT NULL DEFAULT 3,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const connection = await pool.getConnection();
  try {
    await connection.query(usersTable);
    console.log("Table 'users' verified/created.");

    await connection.query(subjectsTable);
    console.log("Table 'subjects' verified/created.");

    await migrateLegacySubjectsTable(connection);
    await seedSubjectsIfEmpty(connection);
  } finally {
    connection.release();
  }
}

async function migrateLegacySubjectsTable(connection) {
  const dbName = config.db.name;
  const [tables] = await connection.query(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'subjects'",
    [dbName]
  );

  if (tables.length === 0) return;

  const [columns] = await connection.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'subject_code'",
    [dbName]
  );

  if (columns.length > 0) return;

  console.log("Legacy subjects table detected. Renaming to 'student_subjects'...");
  await connection.query('RENAME TABLE subjects TO student_subjects');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject_code VARCHAR(50) NOT NULL UNIQUE,
      subject_name VARCHAR(255) NOT NULL,
      credits INT NOT NULL DEFAULT 3,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("Subject catalog table created.");
}

async function seedSubjectsIfEmpty(connection) {
  const [rows] = await connection.query('SELECT COUNT(*) AS total FROM subjects');
  if (rows[0].total > 0) return;

  const sampleSubjects = [
    ['CS101', 'Introduction to Programming', 3],
    ['CS201', 'Data Structures and Algorithms', 4],
    ['CS301', 'Database Systems', 3],
    ['CS302', 'Software Engineering', 3],
    ['MATH101', 'Calculus I', 4],
    ['ENG101', 'Academic English', 2],
  ];

  for (const [subject_code, subject_name, credits] of sampleSubjects) {
    await connection.query(
      'INSERT INTO subjects (subject_code, subject_name, credits) VALUES (?, ?, ?)',
      [subject_code, subject_name, credits]
    );
  }

  console.log(`Seeded ${sampleSubjects.length} sample subjects.`);
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
