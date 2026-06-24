const db = require('../lib/db');

class OfficialTravel {
  static async create(data) {
    const status = data.status || 'draft';
    const [result] = await db.query(`
      INSERT INTO official_travel (
        request_number, purpose, destination, start_date, end_date, 
        invitation_file, status, submitted_by, submitted_by_id, submitted_at,
        travel_outcome, outcome_followup
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    `, [
      data.request_number, data.purpose, data.destination, data.start_date, data.end_date,
      data.invitation_file || null, status, data.submitted_by, data.submitted_by_id,
      data.travel_outcome || null, data.outcome_followup || null
    ]);
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT ot.*, 
             u.username as submitter_username,
             e.name as submitter_name
      FROM official_travel ot
      LEFT JOIN users u ON ot.submitted_by_id = u.id
      LEFT JOIN employees e ON u.id = e.user_id
      WHERE ot.id = ?
    `, [id]);
    
    if (rows.length === 0) return null;
    return rows[0];
  }

  static async findBySubmittedBy(userId, search = '', status = '') {
    let sql = `
      SELECT * FROM official_travel 
      WHERE submitted_by_id = ?
    `;
    const params = [userId];

    if (search) {
      sql += ` AND (destination LIKE ? OR purpose LIKE ? OR request_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC`;

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async findAll() {
    const [rows] = await db.query(`
      SELECT ot.*, 
             u.username as submitter_username,
             e.name as submitter_name
      FROM official_travel ot
      LEFT JOIN users u ON ot.submitted_by_id = u.id
      LEFT JOIN employees e ON u.id = e.user_id
      ORDER BY ot.created_at DESC
    `);
    return rows;
  }

  static async update(id, data) {
    await db.query(`
      UPDATE official_travel 
      SET purpose = ?, destination = ?, start_date = ?, end_date = ?, invitation_file = IFNULL(?, invitation_file)
      WHERE id = ? AND (status = 'draft' OR status = 'pending')
    `, [
      data.purpose, data.destination, data.start_date, data.end_date, data.invitation_file || null, id
    ]);
  }

  static async updateStatus(id, status, approvedBy = null, approvedById = null) {
    if (status === 'approved' || status === 'rejected') {
      await db.query(`
        UPDATE official_travel 
        SET status = ?, approved_by = ?, approved_by_id = ?, approved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [status, approvedBy, approvedById, id]);
    } else {
      await db.query(`
        UPDATE official_travel 
        SET status = ?
        WHERE id = ?
      `, [status, id]);
    }
  }

  static async delete(id) {
    await db.query(`
      DELETE FROM official_travel 
      WHERE id = ? AND (status = 'draft' OR status = 'pending')
    `, [id]);
  }

  static async updateOutcome(id, outcome, followup) {
    await db.query(`
      UPDATE official_travel 
      SET travel_outcome = ?, outcome_followup = ?, status = 'completed'
      WHERE id = ? AND (status = 'approved' OR status = 'completed')
    `, [outcome, followup, id]);
  }

  static async getStatsPegawai(userId) {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM official_travel
      WHERE submitted_by_id = ?
    `, [userId]);
    return rows[0];
  }

  static async getStatsPimpinan() {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM official_travel
    `);
    return rows[0];
  }
}

module.exports = OfficialTravel;
