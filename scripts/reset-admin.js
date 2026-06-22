const bcrypt = require("bcryptjs");
const db = require("../lib/db");

async function resetAdmin() {
  try {
    const passwordHash = await bcrypt.hash("password", 10);

    const [rows] = await db.query(
      `
      SELECT id
      FROM users
      WHERE id = 1 OR email = ? OR name = ?
      LIMIT 1
      `,
      ["admin@facultyware.test", "Admin Facultyware"]
    );

    if (rows.length > 0) {
      await db.query(
        `
        UPDATE users
        SET name = ?,
            email = ?,
            password = ?,
            updated_at = NOW()
        WHERE id = ?
        `,
        ["Admin Facultyware", "admin@facultyware.test", passwordHash, rows[0].id]
      );

      console.log("Admin berhasil direset.");
    } else {
      await db.query(
        `
        INSERT INTO users (name, email, password, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
        `,
        ["Admin Facultyware", "admin@facultyware.test", passwordHash]
      );

      console.log("Admin berhasil dibuat.");
    }

    console.log("Login:");
    console.log("Email/Nama : admin@facultyware.test");
    console.log("Password   : password");

    process.exit(0);
  } catch (err) {
    console.error("Gagal reset admin:", err);
    process.exit(1);
  }
}

resetAdmin();