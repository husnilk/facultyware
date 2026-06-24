// ============================================================
// GLOBAL SETUP: Reset database ke kondisi awal sebelum test
// Dipanggil otomatis oleh Playwright sebelum semua test jalan
// ============================================================
const mysql = require('mysql2/promise');
require('dotenv').config();

async function globalSetup() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'facultyware',
  });

  console.log('🔄 Resetting database to initial state...');

  // Reset status survey
  await db.query('UPDATE surveys SET is_active=1 WHERE id IN (1,2)');
  await db.query('UPDATE surveys SET is_active=0 WHERE id=3');

  // Reset PIN invitations supaya bisa dipakai ulang
  await db.query('UPDATE survey_invitations SET is_used=0, used_at=NULL WHERE id IN (1,2)');

  // Hapus responses dari test sebelumnya
  await db.query('DELETE FROM survey_answer_options WHERE survey_answer_id IN (SELECT id FROM survey_answers WHERE survey_response_id IN (SELECT id FROM survey_responses WHERE survey_id IN (1,2)))');
  await db.query('DELETE FROM survey_answers WHERE survey_response_id IN (SELECT id FROM survey_responses WHERE survey_id IN (1,2))');
  await db.query('DELETE FROM survey_responses WHERE survey_id IN (1,2)');

  console.log('✅ Database reset complete');

  await db.end();
}

module.exports = globalSetup;