// Initialize database schema
const fs = require('fs');
const path = require('path');

const dotenv = require(path.join(__dirname, '../server/node_modules/dotenv'));
const mysql = require(path.join(__dirname, '../server/node_modules/mysql2/promise'));

dotenv.config({ path: path.join(__dirname, '../server/.env') });

async function initDatabase() {
  console.log('🔄 Initializing School Management System Database...');

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const databaseName = process.env.DB_NAME || 'school_management_db';

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });

    console.log(`✅ Connected to MySQL server at ${host}:${port} as ${user}`);

    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

    console.log(`📦 Executing schema.sql on database '${databaseName}'...`);
    await connection.query(schemaSql);

    console.log('🎉 Database and tables created successfully!');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initDatabase();
