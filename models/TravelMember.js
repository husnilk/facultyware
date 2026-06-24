const db = require('../lib/db');

class TravelMember {
  static async create(data) {
    const [result] = await db.query(`
      INSERT INTO official_travel_members (
        official_travel_id, employee_id, role, report_date, summary, attachment
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      data.official_travel_id, data.employee_id, data.role || 'Member', 
      data.report_date || null, data.summary || null, data.attachment || null
    ]);
    return result.insertId;
  }

  static async findByTravelId(travelId) {
    const [rows] = await db.query(`
      SELECT otm.*, 
             e.name AS employee_name,
             u.username AS fallback_username
      FROM official_travel_members otm
      LEFT JOIN employees e ON otm.employee_id = e.id
      LEFT JOIN users u ON otm.employee_id = u.id
      WHERE otm.official_travel_id = ?
    `, [travelId]);
    
    return rows.map(row => {
      row.name = row.employee_name || row.fallback_username || `Employee #${row.employee_id}`;
      return row;
    });
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM official_travel_members WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return rows[0];
  }

  static async update(id, data) {
    await db.query(`
      UPDATE official_travel_members 
      SET employee_id = ?, role = ?, report_date = ?, summary = ?, attachment = IFNULL(?, attachment)
      WHERE id = ?
    `, [
      data.employee_id, data.role || 'Member', data.report_date || null, data.summary || null, data.attachment || null, id
    ]);
  }

  static async delete(id) {
    await db.query('DELETE FROM official_travel_members WHERE id = ?', [id]);
  }

  static async getAvailableEmployees() {
    const [rows] = await db.query('SELECT * FROM employees ORDER BY name ASC');
    return rows;
  }
}

module.exports = TravelMember;
