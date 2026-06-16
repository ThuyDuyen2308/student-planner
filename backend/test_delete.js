const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkForeignKeys() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_planner',
  });

  try {
    const query = `
      SELECT 
        TABLE_NAME, 
        COLUMN_NAME, 
        CONSTRAINT_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME
      FROM 
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE 
        REFERENCED_TABLE_SCHEMA = ?
    `;
    const [fks] = await connection.query(query, [process.env.DB_NAME || 'student_planner']);
    console.log('Foreign keys usage:');
    console.table(fks);

    const rulesQuery = `
      SELECT 
        CONSTRAINT_NAME, 
        TABLE_NAME, 
        DELETE_RULE
      FROM 
        INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
      WHERE 
        CONSTRAINT_SCHEMA = ?
    `;
    const [rules] = await connection.query(rulesQuery, [process.env.DB_NAME || 'student_planner']);
    console.log('\nReferential constraints rules:');
    console.table(rules);

  } catch (error) {
    console.error('Error checking FKs:', error);
  } finally {
    await connection.end();
  }
}

checkForeignKeys();
