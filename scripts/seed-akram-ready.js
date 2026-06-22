const bcrypt = require("bcryptjs");
const db = require("../lib/db");

async function seedAkramReady() {
  try {
    const passwordHash = await bcrypt.hash("password", 10);

    // 1. Employment status
    const [statusRows] = await db.query(
      "SELECT id FROM employment_statuses LIMIT 1"
    );

    let employmentStatusId;

    if (statusRows.length > 0) {
      employmentStatusId = statusRows[0].id;
    } else {
      const [statusResult] = await db.query(
        `
        INSERT INTO employment_statuses
          (name, description, created_at, updated_at)
        VALUES
          (?, ?, NOW(), NOW())
        `,
        ["Active Staff", "Default active employee status"]
      );

      employmentStatusId = statusResult.insertId;
    }

    // 2. Organization unit
    const [unitRows] = await db.query(
      "SELECT id FROM organization_units WHERE code = ? LIMIT 1",
      ["FTI"]
    );

    let organizationUnitId;

    if (unitRows.length > 0) {
      organizationUnitId = unitRows[0].id;
    } else {
      const [unitResult] = await db.query(
        `
        INSERT INTO organization_units
          (name, code, parent_id, type, description, organization_unit_id, created_at, updated_at)
        VALUES
          (?, ?, NULL, ?, ?, ?, NOW(), NOW())
        `,
        [
          "Fakultas Teknologi Informasi",
          "FTI",
          "faculty",
          "Default faculty for event testing",
          1,
        ]
      );

      organizationUnitId = unitResult.insertId;
    }

    // 3. Admin user
    const [adminRows] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      ["admin@facultyware.test"]
    );

    let adminUserId;

    if (adminRows.length > 0) {
      adminUserId = adminRows[0].id;

      await db.query(
        `
        UPDATE users
        SET name = ?, password = ?, updated_at = NOW()
        WHERE id = ?
        `,
        ["Admin Facultyware", passwordHash, adminUserId]
      );
    } else {
      const [adminResult] = await db.query(
        `
        INSERT INTO users
          (name, email, password, created_at, updated_at)
        VALUES
          (?, ?, ?, NOW(), NOW())
        `,
        ["Admin Facultyware", "admin@facultyware.test", passwordHash]
      );

      adminUserId = adminResult.insertId;
    }

    // 4. Admin employee
    const [employeeRows] = await db.query(
      "SELECT id FROM employees WHERE id = ? LIMIT 1",
      [adminUserId]
    );

    if (employeeRows.length === 0) {
      await db.query(
        `
        INSERT INTO employees
          (
            id, employee_number, national_id_number, tax_id_number,
            name, birth_place, birth_date, gender, religion, marital_status,
            address, phone_number, organization_unit_id, hire_date,
            employment_status_id, status, created_at, updated_at
          )
        VALUES
          (?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [
          adminUserId,
          "EMP-AKRAM-001",
          "Admin Facultyware",
          "Padang",
          "2000-01-01",
          "male",
          "Islam",
          "single",
          "Universitas Andalas",
          "081234567890",
          organizationUnitId,
          "2026-01-01",
          employmentStatusId,
          "active",
        ]
      );
    } else {
      await db.query(
        `
        UPDATE employees
        SET status = 'active',
            name = ?,
            updated_at = NOW()
        WHERE id = ?
        `,
        ["Admin Facultyware", adminUserId]
      );
    }

    // 5. Peserta user
    const [participantRows] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      ["peserta@facultyware.test"]
    );

    let participantUserId;

    if (participantRows.length > 0) {
      participantUserId = participantRows[0].id;

      await db.query(
        `
        UPDATE users
        SET name = ?, password = ?, updated_at = NOW()
        WHERE id = ?
        `,
        ["Peserta Demo", passwordHash, participantUserId]
      );
    } else {
      const [participantResult] = await db.query(
        `
        INSERT INTO users
          (name, email, password, created_at, updated_at)
        VALUES
          (?, ?, ?, NOW(), NOW())
        `,
        ["Peserta Demo", "peserta@facultyware.test", passwordHash]
      );

      participantUserId = participantResult.insertId;
    }

    // 6. Event demo
    const [eventRows] = await db.query(
      "SELECT id FROM events WHERE slug = ? LIMIT 1",
      ["seminar-teknologi-informasi-demo"]
    );

    let eventId;

    if (eventRows.length > 0) {
      eventId = eventRows[0].id;

      await db.query(
        `
        UPDATE events
        SET status = 'published',
            created_by = ?,
            published_by = ?,
            created_by_id = ?,
            published_by_id = ?,
            updated_at = NOW()
        WHERE id = ?
        `,
        [adminUserId, adminUserId, adminUserId, adminUserId, eventId]
      );
    } else {
      const [eventResult] = await db.query(
        `
        INSERT INTO events
          (
            title, slug, description, objectives, event_type, delivery_mode,
            start_date, end_date, start_time, end_time, venue,
            online_platform, online_link, quota, registration_deadline,
            cover_image, banner_image, status, created_by, published_by,
            published_at, created_by_id, published_by_id, created_at, updated_at
          )
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, NULL, NULL,
           ?, ?, ?, NOW(), ?, ?, NOW(), NOW())
        `,
        [
          "Seminar Teknologi Informasi Demo",
          "seminar-teknologi-informasi-demo",
          "Event demo untuk menguji reminder, check-in, dan attendance.",
          "Menguji alur reminder, validasi ticket number, attendance, rekap, dan export.",
          "seminar",
          "offline",
          "2026-06-15",
          "2026-06-15",
          "09:00:00",
          "12:00:00",
          "Aula FTI Universitas Andalas",
          100,
          "2026-06-14 23:59:00",
          "published",
          adminUserId,
          adminUserId,
          adminUserId,
          adminUserId,
        ]
      );

      eventId = eventResult.insertId;
    }

    // 7. Registration + ticket demo
    const [registrationRows] = await db.query(
      "SELECT id FROM event_registrations WHERE ticket_number = ? LIMIT 1",
      ["TICKET-AKRAM-001"]
    );

    if (registrationRows.length === 0) {
      await db.query(
        `
        INSERT INTO event_registrations
          (
            event_id, user_id, registration_number, registered_at,
            attendance_status, notes, ticket_number, qr_code, issued_at,
            certificate_number, file_path, generated_by, generated_at,
            created_at, updated_at
          )
        VALUES
          (?, ?, ?, NOW(), ?, NULL, ?, ?, NOW(), ?, NULL, NULL, NULL, NOW(), NOW())
        `,
        [
          eventId,
          participantUserId,
          "REG-AKRAM-001",
          "registered",
          "TICKET-AKRAM-001",
          "QR-TICKET-AKRAM-001",
          "CERT-AKRAM-001",
        ]
      );
    }

    console.log("Seed Akram berhasil.");
    console.log("Login:");
    console.log("Email/Nama : admin@facultyware.test");
    console.log("Password   : password");
    console.log("");
    console.log("Ticket check-in:");
    console.log("TICKET-AKRAM-001");

    process.exit(0);
  } catch (err) {
    console.error("Seed Akram gagal:", err);
    process.exit(1);
  }
}

seedAkramReady();