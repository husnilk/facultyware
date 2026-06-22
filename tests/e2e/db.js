// Koneksi database khusus test. Tiap spec membuat koneksinya sendiri lewat
// createTestDb() sehingga menutup satu koneksi tidak pernah mengganggu spec lain
// (berbeda dengan pool bersama lib/db yang dipakai aplikasi).
const mysql = require('mysql2');
require('dotenv').config();

function createTestDb() {
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  if (process.env.DB_SOCKET_PATH) {
    config.socketPath = process.env.DB_SOCKET_PATH;
  } else {
    config.host = process.env.DB_HOST;
    if (process.env.DB_PORT) config.port = Number(process.env.DB_PORT);
  }

  const isRemote = !process.env.DB_SOCKET_PATH
    && process.env.DB_HOST
    && process.env.DB_HOST !== 'localhost'
    && process.env.DB_HOST !== '127.0.0.1';
  if (isRemote) {
    config.ssl = { rejectUnauthorized: false };
  }

  return mysql.createConnection(config).promise();
}

module.exports = { createTestDb };
