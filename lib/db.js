const mysql = require('mysql2/promise');
require('dotenv').config(); // Untuk membaca file .env

// Membuat koneksi pool agar performa lebih baik
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'facultyware',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;