const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const db = require('../lib/db');
const fs = require('fs');
const path = require('path');

// =============================================
// API EQUIPMENT CATEGORIES (Fitur #6)
// =============================================

// GET /api/equipment-categories
router.get('/equipment-categories', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ec.*, COUNT(e.id) AS equipment_count
      FROM equipment_categories ec
      LEFT JOIN equipments e ON e.category_id = ec.id
      GROUP BY ec.id
      ORDER BY ec.name ASC
    `);
    res.json({ success: true, data: rows, total: rows.length, message: 'Data berhasil diambil' });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// GET /api/equipment-categories/:id
router.get('/equipment-categories/:id', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ec.*, COUNT(e.id) AS equipment_count
      FROM equipment_categories ec
      LEFT JOIN equipments e ON e.category_id = ec.id
      WHERE ec.id = ?
      GROUP BY ec.id
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, data: rows[0], message: 'Data berhasil diambil' });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// POST /api/equipment-categories
router.post('/equipment-categories', isAuthenticated, async (req, res) => {
  const { code, name, description } = req.body;
  const errors = {};
  if (!code) errors.code = 'Kode wajib diisi';
  if (!name) errors.name = 'Nama wajib diisi';
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ success: false, message: 'Validasi gagal', errors });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO equipment_categories (code, name, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [code, name, description || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, code, name, description: description || null }, message: 'Data berhasil ditambahkan' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(422).json({ success: false, message: 'Kode kategori sudah digunakan' });
    console.error('API Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/equipment-categories/:id
router.put('/equipment-categories/:id', isAuthenticated, async (req, res) => {
  const { code, name, description } = req.body;
  const errors = {};
  if (!code) errors.code = 'Kode wajib diisi';
  if (!name) errors.name = 'Nama wajib diisi';
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ success: false, message: 'Validasi gagal', errors });
  }
  try {
    const [check] = await db.query('SELECT id FROM equipment_categories WHERE id = ?', [req.params.id]);
    if (!check.length) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    await db.query(
      'UPDATE equipment_categories SET code=?, name=?, description=?, updated_at=NOW() WHERE id=?',
      [code, name, description || null, req.params.id]
    );
    res.json({ success: true, message: 'Data berhasil diperbarui' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(422).json({ success: false, message: 'Kode kategori sudah digunakan' });
    console.error('API Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// DELETE /api/equipment-categories/:id
router.delete('/equipment-categories/:id', isAuthenticated, async (req, res) => {
  try {
    const [check] = await db.query('SELECT id FROM equipment_categories WHERE id = ?', [req.params.id]);
    if (!check.length) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    await db.query('DELETE FROM equipment_categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// =============================================
// API EQUIPMENTS (Fitur #12)
// =============================================

// GET /api/equipments — JSON list dengan search & filter
router.get('/equipments', isAuthenticated, async (req, res) => {
  try {
    const q = req.query.q || '';
    const conditionFilter = req.query.condition || '';
    const statusFilter = req.query.status || '';

    let where = `WHERE a.type = 'equipment'`;
    const params = [];

    if (q) {
      where += ` AND (a.name LIKE ? OR a.code LIKE ? OR e.brand LIKE ? OR e.specification LIKE ?)`;
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (conditionFilter) { where += ` AND a.\`condition\` = ?`; params.push(conditionFilter); }
    if (statusFilter) { where += ` AND a.status = ?`; params.push(statusFilter); }

    const [rows] = await db.query(`
      SELECT a.id, a.name, a.code, a.condition, a.status,
        a.acquisition_date, a.acquisition_type, a.acquisition_cost,
        e.brand, e.model, e.serial_number, e.specification, e.photo,
        e.category_id, ec.name AS category_name
      FROM assets a
      JOIN equipments e ON e.asset_id = a.id
      LEFT JOIN equipment_categories ec ON ec.id = e.category_id
      ${where}
      ORDER BY a.created_at DESC
    `, params);

    res.json({ success: true, data: rows, total: rows.length, message: 'Data berhasil diambil' });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// GET /api/equipments/:id — JSON detail
router.get('/equipments/:id', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, e.brand, e.model, e.serial_number, e.specification,
        e.photo, e.purchase_link, e.depreciation_value, e.useful_life,
        e.category_id, ec.name AS category_name, ec.code AS category_code
      FROM assets a
      JOIN equipments e ON e.asset_id = a.id
      LEFT JOIN equipment_categories ec ON ec.id = e.category_id
      WHERE a.id = ? AND a.type = 'equipment'
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, data: rows[0], message: 'Data berhasil diambil' });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// POST /api/equipments — Buat aset baru (transaction)
router.post('/equipments', isAuthenticated, async (req, res) => {
  const { name, code, acquisition_type, acquisition_date, acquisition_cost,
    condition, status, brand, model, serial_number, specification, category_id } = req.body;

  // Validasi wajib
  const errors = {};
  if (!name) errors.name = 'Nama wajib diisi';
  if (!code) errors.code = 'Kode wajib diisi';
  if (!acquisition_type) errors.acquisition_type = 'Jenis perolehan wajib diisi';
  if (!acquisition_date) errors.acquisition_date = 'Tanggal perolehan wajib diisi';
  if (!condition) errors.condition = 'Kondisi wajib diisi';
  if (!status) errors.status = 'Status wajib diisi';
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ success: false, message: 'Validasi gagal', errors });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [asset] = await conn.query(
      `INSERT INTO assets (name, code, type, acquisition_type, acquisition_date, acquisition_cost, \`condition\`, status, created_at, updated_at)
       VALUES (?, ?, 'equipment', ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, code, acquisition_type, acquisition_date, acquisition_cost || null, condition, status]
    );
    await conn.query(
      `INSERT INTO equipments (asset_id, category_id, brand, model, serial_number, specification, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [asset.insertId, category_id || null, brand || null, model || null, serial_number || null, specification || null]
    );
    await conn.commit();
    res.status(201).json({ success: true, data: { id: asset.insertId, name, code }, message: 'Data berhasil ditambahkan' });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(422).json({ success: false, message: 'Kode aset sudah digunakan' });
    console.error('API Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  } finally {
    conn.release();
  }
});

// PUT /api/equipments/:id — Update aset (transaction)
router.put('/equipments/:id', isAuthenticated, async (req, res) => {
  const { name, code, acquisition_type, acquisition_date, acquisition_cost,
    condition, status, brand, model, serial_number, specification, category_id } = req.body;

  const errors = {};
  if (!name) errors.name = 'Nama wajib diisi';
  if (!code) errors.code = 'Kode wajib diisi';
  if (!acquisition_type) errors.acquisition_type = 'Jenis perolehan wajib diisi';
  if (!acquisition_date) errors.acquisition_date = 'Tanggal perolehan wajib diisi';
  if (!condition) errors.condition = 'Kondisi wajib diisi';
  if (!status) errors.status = 'Status wajib diisi';
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ success: false, message: 'Validasi gagal', errors });
  }

  const conn = await db.getConnection();
  try {
    const [check] = await conn.query('SELECT id FROM assets WHERE id = ? AND type = "equipment"', [req.params.id]);
    if (!check.length) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    await conn.beginTransaction();
    await conn.query(
      `UPDATE assets SET name=?, code=?, acquisition_type=?, acquisition_date=?, acquisition_cost=?, \`condition\`=?, status=?, updated_at=NOW() WHERE id=?`,
      [name, code, acquisition_type, acquisition_date, acquisition_cost || null, condition, status, req.params.id]
    );
    await conn.query(
      'UPDATE equipments SET category_id=?, brand=?, model=?, serial_number=?, specification=?, updated_at=NOW() WHERE asset_id=?',
      [category_id || null, brand || null, model || null, serial_number || null, specification || null, req.params.id]
    );
    await conn.commit();
    res.json({ success: true, message: 'Data berhasil diperbarui' });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(422).json({ success: false, message: 'Kode aset sudah digunakan' });
    console.error('API Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  } finally {
    conn.release();
  }
});

// DELETE /api/equipments/:id — Hapus aset + foto dari disk
router.delete('/equipments/:id', isAuthenticated, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query(
      'SELECT e.photo FROM assets a JOIN equipments e ON e.asset_id = a.id WHERE a.id = ? AND a.type = "equipment"',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    const photo = rows[0].photo;

    await conn.beginTransaction();
    await conn.query('DELETE FROM equipments WHERE asset_id = ?', [req.params.id]);
    await conn.query('DELETE FROM assets WHERE id = ?', [req.params.id]);
    await conn.commit();

    // Hapus foto dari disk jika ada
    if (photo) {
      const filePath = path.join(__dirname, '../public', photo);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (err) {
    await conn.rollback();
    console.error('API Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  } finally {
    conn.release();
  }
});

// =============================================
// API STATS
// =============================================

// GET /api/stats — Statistik ringkas
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM assets WHERE type = 'equipment'`);
    const [conditionStats] = await db.query(`
      SELECT \`condition\`, COUNT(*) AS count FROM assets WHERE type = 'equipment' GROUP BY \`condition\`
    `);
    const [statusStats] = await db.query(`
      SELECT status, COUNT(*) AS count FROM assets WHERE type = 'equipment' GROUP BY status
    `);
    const [categoryStats] = await db.query(`
      SELECT ec.name, COUNT(e.id) AS count
      FROM equipment_categories ec
      LEFT JOIN equipments e ON e.category_id = ec.id
      GROUP BY ec.id
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        total_equipments: total,
        by_condition: conditionStats,
        by_status: statusStats,
        by_category: categoryStats,
      },
      message: 'Data berhasil diambil'
    });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
