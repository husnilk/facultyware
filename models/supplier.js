const db = require("../lib/db");

class Supplier {
  /**
   * Mengambil semua data supplier dengan filter pencarian opsional.
   * @param {string} search - Pencarian berdasarkan nama atau kode supplier.
   * @returns {Promise<Array>} List supplier.
   */
  static async findAll(search = "", orderBy = "id ASC") {
    let query = "SELECT * FROM suppliers";
    const params = [];

    if (search && search.trim() !== "") {
      query += " WHERE name LIKE ? OR code LIKE ?";
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    // `orderBy` selalu berasal dari whitelist controller (bukan input mentah).
    query += " ORDER BY " + orderBy;
    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Mengambil data supplier berdasarkan ID.
   * @param {number|string} id - ID supplier.
   * @returns {Promise<Object|null>} Objek supplier atau null.
   */
  static async findById(id) {
    const [rows] = await db.query("SELECT * FROM suppliers WHERE id = ?", [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Menyimpan data supplier baru ke database.
   * @param {Object} data - Objek data supplier ({ name, code, email, phone, address }).
   * @returns {Promise<number>} Inserted ID.
   */
  static async create(data) {
    const { name, code, email, phone, address } = data;
    const [result] = await db.query(
      `INSERT INTO suppliers (name, code, email, phone, address, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, code, email || null, phone || null, address || null]
    );
    return result.insertId;
  }

  /**
   * Memperbarui data supplier yang sudah ada di database.
   * @param {number|string} id - ID supplier.
   * @param {Object} data - Objek data supplier baru.
   * @returns {Promise<boolean>} Status keberhasilan.
   */
  static async update(id, data) {
    const { name, code, email, phone, address } = data;
    const [result] = await db.query(
      `UPDATE suppliers 
          SET name = ?, code = ?, email = ?, phone = ?, address = ?, updated_at = NOW() 
        WHERE id = ?`,
      [name, code, email || null, phone || null, address || null, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Menghapus data supplier berdasarkan ID.
   * @param {number|string} id - ID supplier.
   * @returns {Promise<boolean>} Status keberhasilan.
   */
  static async delete(id) {
    const [result] = await db.query("DELETE FROM suppliers WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  /**
   * Memeriksa apakah kode supplier sudah digunakan oleh supplier lain (unik).
   * @param {string} code - Kode supplier.
   * @param {number|string} excludeId - ID supplier yang dikecualikan (opsional).
   * @returns {Promise<boolean>} True jika kode sudah dipakai.
   */
  static async codeExists(code, excludeId = null) {
    let query = "SELECT COUNT(*) as count FROM suppliers WHERE code = ?";
    const params = [code];

    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const [rows] = await db.query(query, params);
    return rows[0].count > 0;
  }

  /**
   * Memeriksa apakah supplier sudah dihubungkan ke data Purchase Order.
   * @param {number|string} id - ID supplier.
   * @returns {Promise<boolean>} True jika supplier sedang digunakan.
   */
  static async isReferenced(id) {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM inventory_purchases WHERE supplier_id = ?",
      [id]
    );
    return rows[0].count > 0;
  }
}

module.exports = Supplier;
