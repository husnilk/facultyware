const db = require('../lib/db');
const bcrypt = require('bcryptjs');

async function seedACL() {
  try {
    console.log('Starting ACL Seeding...');

    // 1. Clear existing roles & permissions mapping for testing (optional but safe)
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE role_has_permissions');
    await db.query('TRUNCATE TABLE model_has_roles');
    await db.query('TRUNCATE TABLE model_has_permissions');
    await db.query('TRUNCATE TABLE roles');
    await db.query('TRUNCATE TABLE permissions');
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Truncated ACL tables.');

    // 2. Insert Roles
    const roles = ['admin', 'panitia', 'peserta'];
    const roleIds = {};
    for (const role of roles) {
      const [res] = await db.query(
        'INSERT INTO roles (name, guard_name, created_at, updated_at) VALUES (?, "web", NOW(), NOW())',
        [role]
      );
      roleIds[role] = res.insertId;
      console.log(`Role inserted: ${role} (ID: ${res.insertId})`);
    }

    // 3. Insert Permissions
    const permissions = [
      // Dashboard
      'view_dashboard',
      // Event
      'manage_events',
      'view_events',
      'register_events',
      // Panitia
      'manage_committee',
      // Registrasi & Tiket
      'view_registrations',
      'view_tickets',
      'view_own_tickets',
      'download_own_tickets',
      // Reminder & Attendance
      'manage_reminders',
      'checkin_participants',
      'view_attendance',
      'export_attendance',
      // Peserta & Sertifikat
      'manage_participants',
      'view_participants',
      'manage_certificates',
      'view_certificates',
      'view_own_certificates',
      'preview_own_certificates',
      'download_own_certificates',
      // Laporan
      'manage_reports',
      'view_reports'
    ];

    const permIds = {};
    for (const perm of permissions) {
      const [res] = await db.query(
        'INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES (?, "web", NOW(), NOW())',
        [perm]
      );
      permIds[perm] = res.insertId;
    }
    console.log(`Inserted ${permissions.length} permissions.`);

    // 4. Map Roles to Permissions
    const rolePermissions = {
      admin: permissions, // admin gets all permissions
      panitia: [
        'view_dashboard',
        'view_events',
        'view_registrations',
        'view_tickets',
        'checkin_participants',
        'view_attendance',
        'export_attendance',
        'view_participants',
        'view_certificates'
      ],
      peserta: [
        'view_dashboard',
        'view_events',
        'register_events',
        'view_own_tickets',
        'download_own_tickets',
        'view_own_certificates',
        'preview_own_certificates',
        'download_own_certificates'
      ]
    };

    for (const [role, perms] of Object.entries(rolePermissions)) {
      const rId = roleIds[role];
      for (const permName of perms) {
        const pId = permIds[permName];
        await db.query(
          'INSERT INTO role_has_permissions (permission_id, role_id) VALUES (?, ?)',
          [pId, rId]
        );
      }
      console.log(`Mapped ${perms.length} permissions to role: ${role}`);
    }

    // 5. Assign Roles to existing/new users
    const passwordHash = await bcrypt.hash('password', 10);

    const usersToCreate = [
      { name: 'Admin Facultyware', email: 'admin@facultyware.test', role: 'admin' },
      { name: 'Panitia Demo', email: 'panitia@facultyware.test', role: 'panitia' },
      { name: 'Peserta Demo', email: 'peserta@facultyware.test', role: 'peserta' }
    ];

    for (const u of usersToCreate) {
      // Find if user already exists
      const [rows] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [u.email]);
      let uId;
      if (rows.length > 0) {
        uId = rows[0].id;
        await db.query('UPDATE users SET name = ?, password = ? WHERE id = ?', [u.name, passwordHash, uId]);
        console.log(`Updated user: ${u.email} (ID: ${uId})`);
      } else {
        const [res] = await db.query(
          'INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [u.name, u.email, passwordHash]
        );
        uId = res.insertId;
        console.log(`Created user: ${u.email} (ID: ${uId})`);
      }

      // Assign role in model_has_roles
      const roleId = roleIds[u.role];
      await db.query(
        'INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES (?, "App\\Models\\User", ?)',
        [roleId, uId]
      );
      console.log(`Assigned role: ${u.role} to user ID: ${uId}`);
    }

    console.log('ACL Seeding Completed Successfully.');
    process.exit(0);
  } catch (err) {
    console.error('ACL Seeding Failed:', err);
    process.exit(1);
  }
}

seedACL();
