const db = require('../lib/db');

class TravelApproval {
  static async create(data) {
    const [result] = await db.query(`
      INSERT INTO official_travel_approvals (
        official_travel_id, approver_id, status, notes, action_date, employee_id
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    `, [
      data.official_travel_id, data.approver_id, data.status, data.notes || null, data.employee_id
    ]);
    return result.insertId;
  }

  static async findByTravelId(travelId) {
    const [rows] = await db.query(`
      SELECT ota.*, u.username as approver_username
      FROM official_travel_approvals ota
      LEFT JOIN users u ON ota.approver_id = u.id
      WHERE ota.official_travel_id = ?
      ORDER BY ota.action_date DESC
    `, [travelId]);
    return rows;
  }
}

module.exports = TravelApproval;
