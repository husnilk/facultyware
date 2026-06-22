const db = require('../lib/db');
const bcrypt = require('bcryptjs');

async function seed() {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    console.log("=== Memulai Seeding RBAC ===");

    // 1. ROLES
    console.log("\n[1/5] Menyiapkan Roles...");
    const roles = [
      { name: 'admin', guard_name: 'web' },
      { name: 'wadir', guard_name: 'web' }
    ];
    for (const r of roles) {
      // Menggunakan query INSERT dengan ON DUPLICATE KEY UPDATE untuk idempoten
      await connection.query(
        `INSERT INTO roles (name, guard_name) VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE guard_name=VALUES(guard_name)`,
        [r.name, r.guard_name]
      );
      console.log(`+ Role '${r.name}' dibuat / sudah ada.`);
    }

    // 2. PERMISSIONS
    console.log("\n[2/5] Menyiapkan Permissions...");
    const permissions = [
      'manage_procurement', 'manage_approval', 'manage_vendor', 'manage_po', 'manage_receiving'
    ];
    for (const p of permissions) {
      await connection.query(
        `INSERT INTO permissions (name, guard_name) VALUES (?, 'web')
         ON DUPLICATE KEY UPDATE guard_name=VALUES(guard_name)`,
        [p]
      );
      console.log(`+ Permission '${p}' dibuat / sudah ada.`);
    }

    // Ambil ID Roles dan Permissions dari database untuk mapping relasi
    const [dbRoles] = await connection.query('SELECT id, name FROM roles');
    const roleMap = {};
    dbRoles.forEach(r => roleMap[r.name] = r.id);

    const [dbPerms] = await connection.query('SELECT id, name FROM permissions');
    const permMap = {};
    dbPerms.forEach(p => permMap[p.name] = p.id);

    // 3. ROLE_HAS_PERMISSIONS
    console.log("\n[3/5] Menautkan Permissions ke Roles...");
    const rolePermissions = {
      admin: ['manage_procurement', 'manage_vendor', 'manage_po', 'manage_receiving'],
      wadir: ['manage_approval']
    };

    for (const [roleName, perms] of Object.entries(rolePermissions)) {
      const roleId = roleMap[roleName];
      if (!roleId) continue;

      for (const permName of perms) {
        const permId = permMap[permName];
        if (!permId) continue;

        // INSERT IGNORE agar tidak error jika relasi sudah ada
        await connection.query(
          `INSERT IGNORE INTO role_has_permissions (permission_id, role_id) VALUES (?, ?)`,
          [permId, roleId]
        );
      }
      console.log(`+ Role '${roleName}' ditautkan dengan permissions: ${perms.join(', ')}.`);
    }

    // 4. USERS
    console.log("\n[4/5] Menyiapkan User Tes...");
    const users = [
      { name: 'Admin SIP', email: 'admin@unand.ac.id', password: 'admin123', role: 'admin' },
      { name: 'Wakil Dekan', email: 'wadek@unand.ac.id', password: 'wadek123', role: 'wadir' }
    ];

    for (const u of users) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await connection.query(
        `INSERT INTO users (name, email, password, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password), updated_at=NOW()`,
        [u.name, u.email, hashedPassword]
      );
      console.log(`+ User '${u.email}' dibuat / diperbarui.`);
    }

    // 5. MODEL_HAS_ROLES
    console.log("\n[5/5] Menautkan User ke Roles...");
    for (const u of users) {
      const [userRows] = await connection.query('SELECT id FROM users WHERE email = ?', [u.email]);
      if (userRows.length === 0) continue;
      const userId = userRows[0].id;

      const roleId = roleMap[u.role];
      if (!roleId) continue;

      await connection.query(
        `INSERT IGNORE INTO model_has_roles (role_id, model_type, model_id)
         VALUES (?, 'App\\\\Models\\\\User', ?)`,
        [roleId, userId]
      );
      console.log(`+ User '${u.email}' ditautkan ke role '${u.role}'.`);
    }

    await connection.commit();
    console.log("\n=== Seeding RBAC Selesai Berhasil ===");
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("\nGagal melakukan seeding RBAC:", err);
  } finally {
    if (connection) connection.release();
    db.end(); // Tutup pool agar proses Node.js bisa exit
  }
}

seed();
