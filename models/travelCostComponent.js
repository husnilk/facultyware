const db = require('../lib/db');

class TravelCostComponent {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM travel_cost_components ORDER BY name ASC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM travel_cost_components WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return rows[0];
  }
}

module.exports = TravelCostComponent;
