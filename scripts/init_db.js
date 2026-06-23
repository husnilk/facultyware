const db = require('../lib/db');
const bcrypt = require('bcryptjs');

async function init() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        email_verified_at TIMESTAMP NULL,
        password VARCHAR(255) NOT NULL,
        remember_token VARCHAR(100) NULL,
        created_at TIMESTAMP NULL,
        updated_at TIMESTAMP NULL
      )
    `);
    console.log('Users table created or already exists.');

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', ['admin@admin.com']);
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash('password', 10);
      await db.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        ['Admin', 'admin@admin.com', hashedPassword]
      );
      console.log('Test user created. Email: admin@admin.com | Password: password');
    } else {
      console.log('Test user already exists.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

init();