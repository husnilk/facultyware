const db = require('../lib/db');

async function seed() {
  try {
    console.log('Seeding lookup tables and employees...');

    // 1. Organization Unit
    await db.query(`
      INSERT INTO organization_units (id, name, code, type, description, organization_unit_id, created_at, updated_at)
      VALUES (1, 'Fakultas Teknologi Informasi', 'FTI', 'faculty', 'Fakultas Teknologi Informasi', 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE name=name
    `);
    console.log('✅ Organization Units seeded');

    // 2. Employment Statuses
    await db.query(`
      INSERT INTO employment_statuses (id, name, description, created_at, updated_at)
      VALUES (1, 'Tetap', 'Pegawai Tetap', NOW(), NOW())
      ON DUPLICATE KEY UPDATE name=name
    `);
    console.log('✅ Employment Statuses seeded');

    // 3. Employees
    // Pegawai (User ID 5)
    await db.query(`
      INSERT INTO employees (id, employee_number, national_id_number, tax_id_number, name, birth_place, birth_date, gender, religion, marital_status, address, phone_number, organization_unit_id, hire_date, employment_status_id, status, created_at, updated_at)
      VALUES (5, 'EMP001', '1234567890123456', '123456789', 'Pegawai', 'Jakarta', '1990-01-01', 'male', 'Islam', 'single', 'Jl. Pegawai No. 1', '08123456789', 1, '2020-01-01', 1, 'active', NOW(), NOW())
      ON DUPLICATE KEY UPDATE name=name
    `);
    
    // Atasan 1 (User ID 6)
    await db.query(`
      INSERT INTO employees (id, employee_number, national_id_number, tax_id_number, name, birth_place, birth_date, gender, religion, marital_status, address, phone_number, organization_unit_id, hire_date, employment_status_id, status, created_at, updated_at)
      VALUES (6, 'EMP002', '1234567890123457', '123456780', 'Atasan 1', 'Jakarta', '1985-01-01', 'male', 'Islam', 'married', 'Jl. Atasan 1 No. 1', '08123456780', 1, '2015-01-01', 1, 'active', NOW(), NOW())
      ON DUPLICATE KEY UPDATE name=name
    `);

    // Atasan 2 (User ID 7)
    await db.query(`
      INSERT INTO employees (id, employee_number, national_id_number, tax_id_number, name, birth_place, birth_date, gender, religion, marital_status, address, phone_number, organization_unit_id, hire_date, employment_status_id, status, created_at, updated_at)
      VALUES (7, 'EMP003', '1234567890123458', '123456781', 'Atasan 2', 'Jakarta', '1980-01-01', 'male', 'Islam', 'married', 'Jl. Atasan 2 No. 1', '08123456781', 1, '2010-01-01', 1, 'active', NOW(), NOW())
      ON DUPLICATE KEY UPDATE name=name
    `);
    console.log('✅ Employees seeded');

    // 4. Leave Types
    const leaveTypes = [
      [1, 'Cuti Tahunan', 'Cuti tahunan reguler', 12, 0],
      [2, 'Cuti Sakit', 'Cuti sakit dengan surat dokter', 10, 1],
      [3, 'Cuti Melahirkan', 'Cuti melahirkan pegawai wanita', 90, 1],
      [4, 'Cuti Alasan Penting', 'Cuti karena keperluan mendesak', 5, 0]
    ];

    for (const lt of leaveTypes) {
      await db.query(`
        INSERT INTO leave_types (id, name, description, default_quota, requires_attachment, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE name=name
      `, lt);
    }
    console.log('✅ Leave Types seeded');

    // 5. Leave Balances
    // For Employee 5 (Pegawai)
    for (const lt of leaveTypes) {
      await db.query(`
        INSERT INTO leave_balances (employee_id, leave_type_id, year, quota, used, remaining, created_at, updated_at)
        VALUES (5, ?, 2026, ?, 0, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE quota=quota
      `, [lt[0], lt[3], lt[3]]);
    }
    console.log('✅ Leave Balances seeded for Pegawai');

  } catch (e) {
    console.error('Seeding failed:', e);
  } finally {
    process.exit(0);
  }
}

seed();
