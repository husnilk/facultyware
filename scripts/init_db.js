const db = require('../lib/db');
const bcrypt = require('bcryptjs');

async function init() {
  try {
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created or already exists.');

    // Create roles table
    await db.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
      )
    `);
    console.log('Roles table created or already exists.');

    // Create permissions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
      )
    `);
    console.log('Permissions table created or already exists.');

    // Create role_has_permissions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS role_has_permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      )
    `);
    console.log('role_has_permissions table created or already exists.');

    // Create user_has_roles table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_has_roles (
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      )
    `);
    console.log('user_has_roles table created or already exists.');

    // Seed initial data
    const [roles] = await db.query('SELECT * FROM roles WHERE name = ?', ['admin']);
    let adminRoleId;
    if (roles.length === 0) {
      const [result] = await db.query('INSERT INTO roles (name) VALUES (?)', ['admin']);
      adminRoleId = result.insertId;
      console.log('Role "admin" created.');
    } else {
      adminRoleId = roles[0].id;
    }

    const initialPermissions = ['manage_acl', 'manage_users', 'view_dashboard'];
    for (const perm of initialPermissions) {
      const [pRows] = await db.query('SELECT * FROM permissions WHERE name = ?', [perm]);
      let permId;
      if (pRows.length === 0) {
        const [pResult] = await db.query('INSERT INTO permissions (name) VALUES (?)', [perm]);
        permId = pResult.insertId;
        console.log(`Permission "${perm}" created.`);
      } else {
        permId = pRows[0].id;
      }
      
      // Link permission to admin role
      await db.query('INSERT IGNORE INTO role_has_permissions (role_id, permission_id) VALUES (?, ?)', [adminRoleId, permId]);
    }

    // Check if admin user exists and assign admin role
    const [userRows] = await db.query('SELECT * FROM users WHERE username = ?', ['admin']);
    let adminUserId;
    if (userRows.length === 0) {
      const hashedPassword = await bcrypt.hash('password', 10);
      const [uResult] = await db.query('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
      adminUserId = uResult.insertId;
      console.log('Test user "admin" created with password "password".');
    } else {
      adminUserId = userRows[0].id;
      console.log('Test user "admin" already exists.');
    }

    await db.query('INSERT IGNORE INTO user_has_roles (user_id, role_id) VALUES (?, ?)', [adminUserId, adminRoleId]);
    console.log('User "admin" assigned to "admin" role.');

    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

init();
