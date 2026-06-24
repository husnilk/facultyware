const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mysql = require('mysql2/promise');
require('dotenv').config();

const sqlPath = "D:\\arifah\\SMT 4\\REAL PWEB A\\db_tb_pweb_v2.sql";

async function setup() {
  console.log('🏁 Starting database setup...');
  console.log(`Connection Config:`);
  console.log(`- Host: ${process.env.DB_HOST}`);
  console.log(`- Port: ${process.env.DB_PORT || 3306}`);
  console.log(`- User: ${process.env.DB_USER}`);
  console.log(`- Database: ${process.env.DB_NAME}`);
  console.log(`-----------------------------------`);

  let connection;
  try {
    // 1. Read and parse SQL schema file
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found at: ${sqlPath}`);
    }

    console.log('📖 Reading SQL schema file...');
    const buffer = fs.readFileSync(sqlPath);
    let sqlText;
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      sqlText = buffer.toString('utf16le');
    } else {
      sqlText = buffer.toString('utf8');
    }
    
    // Strip UTF BOM if present
    sqlText = sqlText.replace(/^\ufeff/, '');

    const dbName = process.env.DB_NAME || 'facultyware';
    console.log(`🧹 Cleaning SQL schema and substituting database name with "${dbName}"...`);
    
    // Replace schema references
    sqlText = sqlText.replace(/CREATE SCHEMA IF NOT EXISTS `facultyware`/g, `CREATE SCHEMA IF NOT EXISTS \`${dbName}\``);
    sqlText = sqlText.replace(/USE `facultyware`/g, `USE \`${dbName}\``);
    sqlText = sqlText.replace(/`facultyware`\./g, `\`${dbName}\`.`);

    // Split SQL by semicolon followed by newline
    const statements = sqlText
      .split(/;\s*[\r\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📦 Found ${statements.length} SQL statements to execute.`);

    // 2. Connect to MySQL Server (first without database to ensure we can create it if it doesn't exist)
    console.log('🔌 Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });

    console.log('🚀 Executing SQL schema statements...');
    let successCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await connection.query(stmt);
        successCount++;
      } catch (err) {
        // Log query error but continue (some drop tables might fail if they don't exist)
        console.warn(`⚠️ Warning in statement ${i + 1}: ${err.message}`);
      }
    }
    console.log(`✅ Executed ${successCount}/${statements.length} statements successfully.`);
    await connection.end();

    // 3. Run the Seeder
    console.log('\n🌱 Running seeder...');
    execSync('node scripts/seed.js', { stdio: 'inherit' });
    
    console.log('\n🎉 Database setup and seeding completed successfully!');
  } catch (err) {
    console.error('\n❌ Database setup failed:', err.message);
    if (connection) {
      try { await connection.end(); } catch (_) {}
    }
    process.exit(1);
  }
}

setup();
