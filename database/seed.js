// Seed sample data into database
const fs = require('fs');
const path = require('path');

const dotenv = require(path.join(__dirname, '../server/node_modules/dotenv'));
const mysql = require(path.join(__dirname, '../server/node_modules/mysql2/promise'));

dotenv.config({ path: path.join(__dirname, '../server/.env') });

async function seedDatabase() {
  console.log('🌱 Seeding School Management System Database...');

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
      database: databaseName,
      multipleStatements: true,
    });

    console.log(`✅ Connected to database '${databaseName}'`);

    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');

    console.log('🌱 Executing seed.sql...');
    await connection.query(seedSql);

    console.log('🎉 Database seeded successfully with demo users, students, teachers, classes, attendance, exams, and fees!');
  } catch (err) {
    console.error('❌ Database seeding error:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

seedDatabase();
