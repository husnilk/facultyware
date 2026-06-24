const db = require('../lib/db');

class TravelExpense {
  static async create(data) {
    const [result] = await db.query(`
      INSERT INTO travel_expenses (
        official_travel_id, employee_id, travel_cost_component_id, amount, 
        description, receipt_file, submitted_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'submitted')
    `, [
      data.official_travel_id, data.employee_id, data.travel_cost_component_id, data.amount,
      data.description || null, data.receipt_file || null
    ]);
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT te.*, 
             tcc.name as component_name, tcc.code as component_code,
             ot.request_number, ot.purpose as travel_purpose,
             e.name as employee_name,
             u.username as fallback_username
      FROM travel_expenses te
      JOIN travel_cost_components tcc ON te.travel_cost_component_id = tcc.id
      JOIN official_travel ot ON te.official_travel_id = ot.id
      LEFT JOIN employees e ON te.employee_id = e.id
      LEFT JOIN users u ON te.employee_id = u.id
      WHERE te.id = ?
    `, [id]);
    
    if (rows.length === 0) return null;
    const row = rows[0];
    row.name = row.employee_name || row.fallback_username || `Employee #${row.employee_id}`;
    return row;
  }

  static async findBySubmittedBy(employeeId) {
    const [rows] = await db.query(`
      SELECT te.*, 
             tcc.name as component_name, tcc.code as component_code,
             ot.request_number
      FROM travel_expenses te
      JOIN travel_cost_components tcc ON te.travel_cost_component_id = tcc.id
      JOIN official_travel ot ON te.official_travel_id = ot.id
      WHERE te.employee_id = ?
      ORDER BY te.created_at DESC
    `, [employeeId]);
    return rows;
  }

  static async findAll() {
    const [rows] = await db.query(`
      SELECT te.*, 
             tcc.name as component_name, tcc.code as component_code,
             ot.request_number,
             e.name as employee_name,
             u.username as fallback_username
      FROM travel_expenses te
      JOIN travel_cost_components tcc ON te.travel_cost_component_id = tcc.id
      JOIN official_travel ot ON te.official_travel_id = ot.id
      LEFT JOIN employees e ON te.employee_id = e.id
      LEFT JOIN users u ON te.employee_id = u.id
      ORDER BY te.created_at DESC
    `);
    
    return rows.map(row => {
      row.name = row.employee_name || row.fallback_username || `Employee #${row.employee_id}`;
      return row;
    });
  }

  static async update(id, data) {
    await db.query(`
      UPDATE travel_expenses 
      SET travel_cost_component_id = ?, amount = ?, description = ?, receipt_file = IFNULL(?, receipt_file)
      WHERE id = ? AND status = 'submitted'
    `, [
      data.travel_cost_component_id, data.amount, data.description || null, data.receipt_file || null, id
    ]);
  }

  static async delete(id) {
    await db.query(`
      DELETE FROM travel_expenses 
      WHERE id = ? AND status = 'submitted'
    `, [id]);
  }

  static async verify(id, status) {
    await db.query(`
      UPDATE travel_expenses 
      SET status = ?, verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, id]);
  }

  static async findByTravelId(travelId) {
    const [rows] = await db.query(`
      SELECT te.*, 
             tcc.name as component_name, tcc.code as component_code
      FROM travel_expenses te
      JOIN travel_cost_components tcc ON te.travel_cost_component_id = tcc.id
      WHERE te.official_travel_id = ?
      ORDER BY te.created_at DESC
    `, [travelId]);
    return rows;
  }

  static async getStatsPegawai(employeeId) {
    const [rows] = await db.query(`
      SELECT 
        IFNULL(SUM(amount), 0) as total_amount,
        COUNT(*) as total_count
      FROM travel_expenses
      WHERE employee_id = ?
    `, [employeeId]);
    return rows[0];
  }

  static async getStatsPimpinan() {
    const [rows] = await db.query(`
      SELECT 
        IFNULL(SUM(amount), 0) as total_amount,
        COUNT(*) as total_count
      FROM travel_expenses
      WHERE status = 'submitted'
    `, []);
    return rows[0];
  }
}

module.exports = TravelExpense;
