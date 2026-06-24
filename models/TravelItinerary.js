const db = require('../lib/db');

class TravelItinerary {
  static async create(data) {
    const [result] = await db.query(`
      INSERT INTO official_travel_itineraries (
        official_travel_id, date, location, activity, description
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      data.official_travel_id, data.date, data.location, data.activity, data.description || null
    ]);
    return result.insertId;
  }

  static async findByTravelId(travelId) {
    const [rows] = await db.query(`
      SELECT * FROM official_travel_itineraries 
      WHERE official_travel_id = ?
      ORDER BY date ASC
    `, [travelId]);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM official_travel_itineraries WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return rows[0];
  }

  static async update(id, data) {
    await db.query(`
      UPDATE official_travel_itineraries 
      SET date = ?, location = ?, activity = ?, description = ?
      WHERE id = ?
    `, [
      data.date, data.location, data.activity, data.description || null, id
    ]);
  }

  static async delete(id) {
    await db.query('DELETE FROM official_travel_itineraries WHERE id = ?', [id]);
  }
}

module.exports = TravelItinerary;
