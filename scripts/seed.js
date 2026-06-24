const db = require('../lib/db');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('Seeding data...');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    // ============================================================
    // 1. USERS
    // Kenapa users dulu: employees.id FK ke users.id
    // Password di-hash bcrypt karena indexController pakai bcrypt.compare
    // Kalau plain text, login tidak akan pernah berhasil
    // ============================================================
    await db.query(`
      INSERT INTO users (id, name, email, password, created_at, updated_at) VALUES
      (1, 'Admin FTI', 'admin@fti.ac.id', ?, NOW(), NOW()),
      (2, 'Rifaqila', 'rifaqila@fti.ac.id', ?, NOW(), NOW())
    `, [adminPassword, userPassword]);
    console.log('✅ Users inserted');

    // ============================================================
    // 2. ORGANIZATION UNITS
    // Kenapa perlu: employees.organization_unit_id FK ke sini
    // organization_unit_id = 1 karena self-reference ke dirinya sendiri
    // unit paling atas tidak punya parent, merujuk ke dirinya sendiri
    // ============================================================
    await db.query(`
      INSERT INTO organization_units (id, name, code, parent_id, type, organization_unit_id, created_at, updated_at) VALUES
      (1, 'Fakultas Teknologi Informasi', 'FTI', NULL, 'faculty', 1, NOW(), NOW())
    `);
    console.log('✅ Organization units inserted');

    // ============================================================
    // 3. EMPLOYMENT STATUSES
    // Kenapa perlu: employees.employment_status_id FK ke sini
    // ============================================================
    await db.query(`
      INSERT INTO employment_statuses (id, name, description, created_at, updated_at) VALUES
      (1, 'Tetap', 'Pegawai Tetap', NOW(), NOW())
    `);
    console.log('✅ Employment statuses inserted');

    // ============================================================
    // 4. EMPLOYEES
    // Kenapa perlu: surveys.created_by FK ke employees.id
    // Kenapa id = 1: employees.id FK ke users.id
    // Jadi id employee harus sama dengan id user yang bersangkutan
    // Hanya insert admin (id=1) karena hanya admin yang buat survey
    // ============================================================
    await db.query(`
      INSERT INTO employees (id, employee_number, name, birth_place, birth_date, gender, marital_status, address, organization_unit_id, hire_date, employment_status_id, status, created_at, updated_at) VALUES
      (1, 'EMP001', 'Admin FTI', 'Jakarta', '1980-01-01', 'male', 'married', 'Jl. Kampus No.1', 1, '2010-01-01', 1, 'active', NOW(), NOW())
    `);
    console.log('✅ Employees inserted');

    // ============================================================
    // 5. ROLES
    // Kenapa 2 role: admin untuk kelola hasil, respondent untuk isi survey
    // guard_name 'web' konvensi Spatie Permission yang dipakai DB ini
    // ============================================================
    await db.query(`
      INSERT INTO roles (id, name, guard_name, created_at, updated_at) VALUES
      (1, 'admin', 'web', NOW(), NOW()),
      (2, 'respondent', 'web', NOW(), NOW())
    `);
    console.log('✅ Roles inserted');

    // ============================================================
    // 6. PERMISSIONS
    // Kenapa perlu: role_has_permissions.permission_id FK ke sini
    // Permission dibuat per fitur supaya ACL granular
    // survey.view   → lihat daftar survey
    // survey.fill   → isi survey
    // survey.admin  → akses halaman admin
    // survey.export → download CSV
    // ============================================================
    await db.query(`
      INSERT INTO permissions (id, name, guard_name, created_at, updated_at) VALUES
      (1, 'survey.view', 'web', NOW(), NOW()),
      (2, 'survey.fill', 'web', NOW(), NOW()),
      (3, 'survey.admin', 'web', NOW(), NOW()),
      (4, 'survey.export', 'web', NOW(), NOW())
    `);
    console.log('✅ Permissions inserted');

    // ============================================================
    // 7. ROLE HAS PERMISSIONS
    // admin dapat semua permission (1,2,3,4)
    // respondent hanya bisa view dan fill (1,2)
    // ============================================================
    await db.query(`
      INSERT INTO role_has_permissions (permission_id, role_id) VALUES
      (1, 1), (2, 1), (3, 1), (4, 1),
      (1, 2), (2, 2)
    `);
    console.log('✅ Role permissions assigned');

    // ============================================================
    // 8. MODEL HAS ROLES
    // Admin FTI (1) = admin, Rifaqila (2) = respondent
    // model_type 'App\\Models\\User' konvensi Spatie Permission
    // model_id adalah id user yang dapat role tersebut
    // ============================================================
    await db.query(`
      INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES
      (1, 'App\\\\Models\\\\User', 1),
      (2, 'App\\\\Models\\\\User', 2)
    `);
    console.log('✅ Roles assigned to users');

    // ============================================================
    // 9. SURVEYS
    // is_active = 1 sudah dipublikasikan, tampil di list respondent
    // is_active = 0 draft, tidak tampil untuk test filter
    // created_by dan employee_id = 1 karena admin yang buat survey
    // 💡 TIPS TAMBAH/HAPUS SURVEY DUMMY:
    // Tambah baris baru di dalam tanda kurung bawah ini untuk menambahkan survey default baru,
    // atau hapus baris yang ada jika ingin menghapus survey tertentu.
    // ============================================================
    await db.query(`
      INSERT INTO surveys (id, title, description, start_date, end_date, is_active, created_by, employee_id, created_at, updated_at) VALUES
      (1, 'Survey Kepuasan Layanan Akademik', 'Survey untuk mengukur tingkat kepuasan mahasiswa terhadap layanan akademik FTI', '2026-01-01', '2026-12-31', 1, 1, 1, NOW(), NOW()),
      (2, 'Survey Evaluasi Fasilitas Kampus', 'Survey untuk mengevaluasi kondisi dan kelengkapan fasilitas kampus', '2026-01-01', '2026-12-31', 1, 1, 1, NOW(), NOW()),
      (3, 'Survey Draft Belum Aktif', 'Survey ini belum dipublikasikan', '2026-01-01', '2026-12-31', 0, 1, 1, NOW(), NOW())
    `);
    console.log('✅ Surveys inserted');

    // ============================================================
    // 10. SURVEY QUESTIONS
    // 3 tipe: single_choice, multiple_choice, short_answer
    // Semua tipe ada supaya bisa test rendering semua tipe di form
    // 💡 TIPS TAMBAH/HAPUS PERTANYAAN DUMMY:
    // Tambah atau hapus baris di kueri INSERT di bawah ini untuk mengedit bank pertanyaan kuesioner.
    // Tipe pertanyaan yang didukung: 'single_choice' (pilihan ganda), 'multiple_choice' (checkbox), atau 'short_answer' (esai).
    // ============================================================
    await db.query(`
      INSERT INTO survey_questions (id, question_text, type, is_active, created_at, updated_at) VALUES
      (1, 'Bagaimana penilaian Anda terhadap kecepatan pelayanan akademik?', 'single_choice', 1, NOW(), NOW()),
      (2, 'Fasilitas apa saja yang menurut Anda perlu ditingkatkan?', 'multiple_choice', 1, NOW(), NOW()),
      (3, 'Berikan saran Anda untuk peningkatan layanan akademik.', 'short_answer', 1, NOW(), NOW()),
      (4, 'Bagaimana penilaian Anda terhadap kebersihan kampus?', 'single_choice', 1, NOW(), NOW()),
      (5, 'Layanan digital apa yang Anda gunakan paling sering?', 'multiple_choice', 1, NOW(), NOW())
    `);
    console.log('✅ Questions inserted');

    // ============================================================
    // 11. SURVEY QUESTION OPTIONS
    // Hanya untuk single_choice dan multiple_choice
    // short_answer tidak punya opsi karena jawabannya bebas diketik
    // weight dipakai untuk hitung skor di fitur statistik nanti
    // ============================================================
    await db.query(`
      INSERT INTO survey_question_options (id, survey_question_id, option_text, weight, created_at, updated_at) VALUES
      (1, 1, 'Sangat Baik', 4, NOW(), NOW()),
      (2, 1, 'Baik', 3, NOW(), NOW()),
      (3, 1, 'Cukup', 2, NOW(), NOW()),
      (4, 1, 'Kurang', 1, NOW(), NOW()),
      (5, 2, 'Perpustakaan', 1, NOW(), NOW()),
      (6, 2, 'Laboratorium', 1, NOW(), NOW()),
      (7, 2, 'Ruang Kelas', 1, NOW(), NOW()),
      (8, 2, 'Kantin', 1, NOW(), NOW()),
      (9, 4, 'Sangat Bersih', 4, NOW(), NOW()),
      (10, 4, 'Bersih', 3, NOW(), NOW()),
      (11, 4, 'Cukup Bersih', 2, NOW(), NOW()),
      (12, 4, 'Kotor', 1, NOW(), NOW()),
      (13, 5, 'SIAKAD', 1, NOW(), NOW()),
      (14, 5, 'E-Learning', 1, NOW(), NOW()),
      (15, 5, 'Portal Mahasiswa', 1, NOW(), NOW())
    `);
    console.log('✅ Question options inserted');

    // ============================================================
    // 12. SURVEY QUESTION ASSIGNMENTS
    // Mapping pertanyaan ke survey
    // Satu pertanyaan bisa dipakai di banyak survey (reusable)
    // order menentukan urutan tampil pertanyaan di form
    // ============================================================
    await db.query(`
      INSERT INTO survey_question_assignments (survey_id, survey_question_id, \`order\`, created_at, updated_at) VALUES
      (1, 1, 1, NOW(), NOW()),
      (1, 2, 2, NOW(), NOW()),
      (1, 3, 3, NOW(), NOW()),
      (2, 4, 1, NOW(), NOW()),
      (2, 5, 2, NOW(), NOW())
    `);
    console.log('✅ Question assignments inserted');

    // ============================================================
    // 13. SURVEY INVITATIONS + PIN
    // PIN unik per undangan per survey
    // is_used = 0 PIN belum dipakai
    // Setelah submit survey, is_used di-update jadi 1
    // Hanya Rifaqila yang punya undangan karena dia satu-satunya
    // respondent di sistem dummy kita
    // ============================================================
    await db.query(`
      INSERT INTO survey_invitations (id, survey_id, name, email, phone, pin, is_used, used_at, created_at, updated_at) VALUES
      (1, 1, 'Rifaqila', 'rifaqila@fti.ac.id', '08123456789', 'PIN001', 0, NULL, NOW(), NOW()),
      (2, 2, 'Rifaqila', 'rifaqila@fti.ac.id', '08123456789', 'PIN002', 0, NULL, NOW(), NOW())
    `);
    console.log('✅ Invitations inserted');

    console.log('');
    console.log('🎉 Seeding selesai!');
    console.log('─────────────────────────────────────────────────');
    console.log('Login admin      → admin@fti.ac.id    | admin123');
    console.log('Login respondent → rifaqila@fti.ac.id | user123');
    console.log('─────────────────────────────────────────────────');
    console.log('PIN survey 1 → PIN001');
    console.log('PIN survey 2 → PIN002');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding gagal:', err.message);
    process.exit(1);
  }
}

seed();