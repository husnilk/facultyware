const db = require('../lib/db');

class TravelDocument {
  static async create(data) {
    const [result] = await db.query(`
      INSERT INTO official_travel_documents (
        official_travel_id, title, file_path, file_type, uploaded_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      data.official_travel_id, data.title, data.file_path, data.file_type
    ]);
    return result.insertId;
  }

  static async findByTravelId(travelId) {
    const [rows] = await db.query(`
      SELECT * FROM official_travel_documents 
      WHERE official_travel_id = ?
      ORDER BY uploaded_at DESC
    `, [travelId]);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM official_travel_documents WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM official_travel_documents WHERE id = ?', [id]);
  }

  static async findByUserId(userId) {
    const [rows] = await db.query(`
      SELECT otd.* 
      FROM official_travel_documents otd
      JOIN official_travel ot ON otd.official_travel_id = ot.id
      WHERE ot.submitted_by_id = ?
      ORDER BY otd.uploaded_at DESC
    `, [userId]);
    return rows;
  }
}

module.exports = TravelDocument;
