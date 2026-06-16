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

  const connection = await pool.getConnection();
  try {
    await connection.query(usersTable);
    console.log("Table 'users' verified/created.");
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
