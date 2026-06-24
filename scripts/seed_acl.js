require('dotenv').config();
const db = require('../lib/db');
const bcrypt = require('bcryptjs');

const roles = ['admin', 'viewer'];

// Permissions untuk equipments dan categories
const permissions = [
  'equipments.view',
  'equipments.create',
  'equipments.edit',
  'equipments.delete',
  'equipments.export',
  'equipment_categories.view',
  'equipment_categories.create',
  'equipment_categories.edit',
  'equipment_categories.delete',
  'equipment_categories.export',
];

// Role -> Permission mapping
const rolePermissions = {
  admin: permissions,
  viewer: permissions.filter(p => p.endsWith('.view') || p.endsWith('.export')),
};

// Test users
const testUsers = [
  { name: 'Admin User', email: 'admin@facultyware.com', password: 'password', role: 'admin' },
  { name: 'Viewer User', email: 'viewer@facultyware.com', password: 'password', role: 'viewer' },
];

async function seed() {
  try {
    console.log('=== FacultyWare ACL Seeder ===\n');
    console.log('CATATAN: Tidak ada perubahan struktur database dalam seeder ini.\n');

    // 1. Seed Roles (menggunakan tabel roles dari DB dosen)
    console.log('[Roles] Seeding...');
    const roleIds = {};
    for (const roleName of roles) {
      const [existing] = await db.query(
        `SELECT id FROM roles WHERE name = ? AND guard_name = 'web'`,
        [roleName]
      );
      if (existing.length > 0) {
        roleIds[roleName] = existing[0].id;
        console.log(`  Role "${roleName}": already exists (id=${existing[0].id})`);
      } else {
        const [result] = await db.query(
          `INSERT INTO roles (name, guard_name, created_at, updated_at) VALUES (?, 'web', NOW(), NOW())`,
          [roleName]
        );
        roleIds[roleName] = result.insertId;
        console.log(`  Role "${roleName}": CREATED (id=${result.insertId})`);
      }
    }

    // 2. Seed Permissions (menggunakan tabel permissions dari DB dosen)
    console.log('\n[Permissions] Seeding...');
    const permIds = {};
    for (const permName of permissions) {
      const [existing] = await db.query(
        `SELECT id FROM permissions WHERE name = ? AND guard_name = 'web'`,
        [permName]
      );
      if (existing.length > 0) {
        permIds[permName] = existing[0].id;
        console.log(`  Permission "${permName}": already exists`);
      } else {
        const [result] = await db.query(
          `INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES (?, 'web', NOW(), NOW())`,
          [permName]
        );
        permIds[permName] = result.insertId;
        console.log(`  Permission "${permName}": CREATED`);
      }
    }

    // 3. Seed role_has_permissions
    console.log('\n[role_has_permissions] Seeding...');
    for (const [roleName, perms] of Object.entries(rolePermissions)) {
      const roleId = roleIds[roleName];
      for (const permName of perms) {
        const permId = permIds[permName];
        const [existing] = await db.query(
          `SELECT 1 FROM role_has_permissions WHERE role_id = ? AND permission_id = ?`,
          [roleId, permId]
        );
        if (existing.length === 0) {
          await db.query(
            `INSERT INTO role_has_permissions (role_id, permission_id) VALUES (?, ?)`,
            [roleId, permId]
          );
          console.log(`  ${roleName} -> ${permName}: LINKED`);
        }
      }
    }
    console.log('  role_has_permissions: OK');

    // 4. Seed test users
    console.log('\n[Test Users] Seeding...');
    for (const u of testUsers) {
      const [existing] = await db.query(`SELECT id FROM users WHERE email = ?`, [u.email]);
      let userId;
      if (existing.length > 0) {
        userId = existing[0].id;
        console.log(`  User "${u.email}": already exists (id=${userId})`);
      } else {
        const hashed = await bcrypt.hash(u.password, 10);
        const [result] = await db.query(
          `INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
          [u.name, u.email, hashed]
        );
        userId = result.insertId;
        console.log(`  User "${u.email}": CREATED (id=${userId})`);
      }

      // Assign role via model_has_roles (Spatie-style)
      const roleId = roleIds[u.role];
      const [existingRole] = await db.query(
        `SELECT 1 FROM model_has_roles WHERE model_id = ? AND model_type = 'User' AND role_id = ?`,
        [userId, roleId]
      );
      if (existingRole.length === 0) {
        await db.query(
          `INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES (?, 'User', ?)`,
          [roleId, userId]
        );
        console.log(`    -> Role "${u.role}" assigned`);
      } else {
        console.log(`    -> Role "${u.role}" already assigned`);
      }
    }

    console.log('\n✅ Seeding selesai!');
    console.log('\nTest Accounts:');
    for (const u of testUsers) {
      console.log(`  ${u.email} / ${u.password} (${u.role})`);
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error seeding:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();
