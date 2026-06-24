const db = require('../lib/db');

class User {
  static async findByUsernameOrEmail(identifier) {
    // Standard query for username
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [identifier]);
    if (rows.length === 0) return null;
    
    const user = rows[0];
    
    // Get user role from user_has_roles & roles
    const [roleRows] = await db.query(`
      SELECT r.name FROM roles r
      JOIN user_has_roles uhr ON r.id = uhr.role_id
      WHERE uhr.user_id = ?
    `, [user.id]);
    
    user.role = roleRows.length > 0 ? roleRows[0].name : 'pegawai';
    
    // Get associated employee data
    const [empRows] = await db.query('SELECT * FROM employees WHERE user_id = ?', [user.id]);
    if (empRows.length > 0) {
      user.employee_id = empRows[0].id;
      user.name = empRows[0].name;
    } else {
      user.employee_id = user.id; // fallback
      user.name = user.username;
    }
    
    return user;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    
    const user = rows[0];
    
    const [roleRows] = await db.query(`
      SELECT r.name FROM roles r
      JOIN user_has_roles uhr ON r.id = uhr.role_id
      WHERE uhr.user_id = ?
    `, [user.id]);
    
    user.role = roleRows.length > 0 ? roleRows[0].name : 'pegawai';
    
    const [empRows] = await db.query('SELECT * FROM employees WHERE user_id = ?', [user.id]);
    if (empRows.length > 0) {
      user.employee_id = empRows[0].id;
      user.name = empRows[0].name;
    } else {
      user.employee_id = user.id;
      user.name = user.username;
    }
    
    return user;
  }
}

module.exports = User;
