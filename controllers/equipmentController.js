const db = require('../lib/db');
const { validationResult, body } = require('express-validator');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Validation rules
const validateEquipment = [
  body('name').trim().notEmpty().withMessage('Nama aset wajib diisi').isLength({ max: 255 }),
  body('code').trim().notEmpty().withMessage('Kode aset wajib diisi').isLength({ max: 100 }),
  body('acquisition_type')
    .isIn(['procurement', 'grant']).withMessage('Jenis perolehan tidak valid'),
  body('acquisition_date')
    .notEmpty().withMessage('Tanggal perolehan wajib diisi')
    .isDate().withMessage('Format tanggal tidak valid'),
  body('condition')
    .isIn(['good', 'minor_damage', 'major_damage']).withMessage('Kondisi tidak valid'),
  body('status')
    .isIn(['available', 'in_use', 'maintenance', 'retired']).withMessage('Status tidak valid'),
  body('acquisition_cost').optional({ checkFalsy: true }).isDecimal().withMessage('Biaya perolehan harus berupa angka'),
  body('depreciation_value').optional({ checkFalsy: true }).isDecimal(),
  body('useful_life').optional({ checkFalsy: true }).isInt({ min: 0 }),
];

// Helper: format currency
const formatRupiah = (val) => {
  if (!val) return '-';
  return 'Rp ' + Number(val).toLocaleString('id-ID');
};

// GET /equipments
const index = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const conditionFilter = req.query.condition || '';
    const statusFilter = req.query.status || '';
    const categoryFilter = req.query.category_id || '';

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const offset = (page - 1) * limit;

    let whereClause = `WHERE a.type = 'equipment'`;
    const params = [];

    if (q) {
      whereClause += ` AND (a.name LIKE ? OR a.code LIKE ? OR e.specification LIKE ? OR e.brand LIKE ? OR e.serial_number LIKE ?)`;
      const likeQ = `%${q}%`;
      params.push(likeQ, likeQ, likeQ, likeQ, likeQ);
    }
    if (conditionFilter) {
      whereClause += ` AND a.\`condition\` = ?`;
      params.push(conditionFilter);
    }
    if (statusFilter) {
      whereClause += ` AND a.status = ?`;
      params.push(statusFilter);
    }
    if (categoryFilter) {
      whereClause += ` AND e.category_id = ?`;
      params.push(categoryFilter);
    }

    // Hitung total baris untuk jumlah halaman
    const [[{ totalRows }]] = await db.query(`
      SELECT COUNT(*) AS totalRows
      FROM assets a
      JOIN equipments e ON e.asset_id = a.id
      ${whereClause}
    `, params);
    const totalPages = Math.max(1, Math.ceil(totalRows / limit));

    const [equipments] = await db.query(`
      SELECT
        a.id, a.name, a.code, a.acquisition_type, a.acquisition_date,
        a.acquisition_cost, a.condition, a.status, a.created_at,
        e.id AS equipment_id, e.brand, e.model, e.serial_number,
        e.specification, e.photo, e.category_id,
        ec.name AS category_name
      FROM assets a
      JOIN equipments e ON e.asset_id = a.id
      LEFT JOIN equipment_categories ec ON ec.id = e.category_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Daftar kategori untuk dropdown filter
    const [categories] = await db.query(
      'SELECT id, code, name FROM equipment_categories ORDER BY name ASC'
    );

    res.render('equipments/index', {
      title: 'Aset Peralatan',
      equipments,
      q,
      conditionFilter,
      statusFilter,
      categoryFilter,
      categories,
      user: req.session.email,
      success: req.session.success || null,
      error: req.session.error || null,
      formatRupiah,
      pagination: { page, limit, totalRows, totalPages },
    });
    delete req.session.success;
    delete req.session.error;
  } catch (err) {
    next(err);
  }
};

// GET /equipments/create
const create = async (req, res, next) => {
  try {
    const [categories] = await db.query('SELECT id, code, name FROM equipment_categories ORDER BY name ASC');
    res.render('equipments/create', {
      title: 'Tambah Aset Peralatan',
      user: req.session.email,
      errors: [],
      old: {},
      categories,
    });
  } catch (err) {
    next(err);
  }
};

// POST /equipments
const store = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    if (req.file) fs.unlinkSync(req.file.path);
    const [categories] = await db.query('SELECT id, code, name FROM equipment_categories ORDER BY name ASC');
    return res.render('equipments/create', {
      title: 'Tambah Aset Peralatan',
      user: req.session.email,
      errors: errors.array(),
      old: req.body,
      categories,
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      name, code, acquisition_type, acquisition_date, acquisition_cost,
      asset_grant_id, condition, status,
      brand, model, serial_number, specification, purchase_link,
      depreciation_value, useful_life, category_id
    } = req.body;

    // Cek unique code
    const [existing] = await conn.query('SELECT id FROM assets WHERE code = ?', [code]);
    if (existing.length > 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      await conn.rollback();
      const [categories] = await db.query('SELECT id, code, name FROM equipment_categories ORDER BY name ASC');
      return res.render('equipments/create', {
        title: 'Tambah Aset Peralatan',
        user: req.session.email,
        errors: [{ path: 'code', msg: 'Kode aset sudah digunakan' }],
        old: req.body,
        categories,
      });
    }

    // Insert assets
    const [assetResult] = await conn.query(`
      INSERT INTO assets 
        (name, code, type, acquisition_type, acquisition_date, acquisition_cost, asset_grant_id, \`condition\`, status, created_at, updated_at)
      VALUES (?, ?, 'equipment', ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      name, code, acquisition_type, acquisition_date,
      acquisition_cost || null, asset_grant_id || null,
      condition, status
    ]);
    const assetId = assetResult.insertId;

    // Photo path
    const photoPath = req.file ? `/uploads/equipment/${req.file.filename}` : null;

    // Insert equipments
    await conn.query(`
      INSERT INTO equipments 
        (asset_id, category_id, brand, model, serial_number, specification, purchase_link, photo, depreciation_value, useful_life, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      assetId, category_id || null,
      brand || null, model || null, serial_number || null,
      specification || null, purchase_link || null, photoPath,
      depreciation_value || null, useful_life || null
    ]);

    await conn.commit();
    req.session.success = 'Aset peralatan berhasil ditambahkan';
    res.redirect('/equipments');
  } catch (err) {
    await conn.rollback();
    if (req.file) fs.unlinkSync(req.file.path);
    next(err);
  } finally {
    conn.release();
  }
};

// GET /equipments/:id
const show = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.*, e.id AS equipment_id, e.brand, e.model, e.serial_number,
        e.specification, e.photo, e.purchase_link, e.depreciation_value,
        e.useful_life, e.category_id,
        ec.name AS category_name, ec.code AS category_code
      FROM assets a
      JOIN equipments e ON e.asset_id = a.id
      LEFT JOIN equipment_categories ec ON ec.id = e.category_id
      WHERE a.id = ? AND a.type = 'equipment'
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).render('error', { message: 'Aset tidak ditemukan', error: { status: 404, stack: '' } });
    }

    res.render('equipments/show', {
      title: rows[0].name,
      user: req.session.email,
      equipment: rows[0],
      formatRupiah,
    });
  } catch (err) {
    next(err);
  }
};

// GET /equipments/:id/edit
const edit = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, e.id AS equipment_id, e.brand, e.model, e.serial_number,
        e.specification, e.photo, e.purchase_link, e.depreciation_value,
        e.useful_life, e.category_id
      FROM assets a
      JOIN equipments e ON e.asset_id = a.id
      WHERE a.id = ? AND a.type = 'equipment'
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).render('error', { message: 'Aset tidak ditemukan', error: { status: 404, stack: '' } });
    }

    const [categories] = await db.query('SELECT id, code, name FROM equipment_categories ORDER BY name ASC');
    res.render('equipments/edit', {
      title: 'Edit Aset Peralatan',
      user: req.session.email,
      equipment: rows[0],
      errors: [],
      categories,
    });
  } catch (err) {
    next(err);
  }
};

// POST /equipments/:id (PUT via method-override)
const update = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    if (req.file) fs.unlinkSync(req.file.path);
    const [rows] = await db.query(
      'SELECT a.*, e.brand, e.model, e.serial_number, e.specification, e.photo, e.purchase_link, e.depreciation_value, e.useful_life, e.category_id FROM assets a JOIN equipments e ON e.asset_id = a.id WHERE a.id = ?',
      [req.params.id]
    );
    const [categories] = await db.query('SELECT id, code, name FROM equipment_categories ORDER BY name ASC');
    return res.render('equipments/edit', {
      title: 'Edit Aset Peralatan',
      user: req.session.email,
      equipment: rows[0],
      errors: errors.array(),
      categories,
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      name, code, acquisition_type, acquisition_date, acquisition_cost,
      condition, status, brand, model, serial_number, specification,
      purchase_link, depreciation_value, useful_life, remove_photo, category_id
    } = req.body;

    // Cek unique code (exclude self)
    const [existing] = await conn.query('SELECT id FROM assets WHERE code = ? AND id != ?', [code, req.params.id]);
    if (existing.length > 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      const [rows] = await conn.query(
        'SELECT a.*, e.brand, e.model, e.serial_number, e.specification, e.photo, e.purchase_link, e.depreciation_value, e.useful_life, e.category_id FROM assets a JOIN equipments e ON e.asset_id = a.id WHERE a.id = ?',
        [req.params.id]
      );
      const [categories] = await db.query('SELECT id, code, name FROM equipment_categories ORDER BY name ASC');
      await conn.rollback();
      return res.render('equipments/edit', {
        title: 'Edit Aset Peralatan',
        user: req.session.email,
        equipment: rows[0],
        errors: [{ path: 'code', msg: 'Kode aset sudah digunakan' }],
        categories,
      });
    }

    // Ambil foto lama
    const [oldEquip] = await conn.query('SELECT photo FROM equipments WHERE asset_id = ?', [req.params.id]);
    const oldPhoto = oldEquip[0]?.photo;

    // Update assets
    await conn.query(`
      UPDATE assets SET name=?, code=?, acquisition_type=?, acquisition_date=?, acquisition_cost=?, \`condition\`=?, status=?, updated_at=NOW()
      WHERE id=?
    `, [name, code, acquisition_type, acquisition_date, acquisition_cost || null, condition, status, req.params.id]);

    // Tentukan photo path
    let photoPath = oldPhoto;
    if (req.file) {
      if (oldPhoto) {
        const oldFilePath = path.join(__dirname, '../public', oldPhoto);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
      photoPath = `/uploads/equipment/${req.file.filename}`;
    } else if (remove_photo === '1') {
      if (oldPhoto) {
        const oldFilePath = path.join(__dirname, '../public', oldPhoto);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
      photoPath = null;
    }

    // Update equipments
    await conn.query(`
      UPDATE equipments SET category_id=?, brand=?, model=?, serial_number=?, specification=?, purchase_link=?, photo=?, depreciation_value=?, useful_life=?, updated_at=NOW()
      WHERE asset_id=?
    `, [
      category_id || null,
      brand || null, model || null, serial_number || null,
      specification || null, purchase_link || null, photoPath,
      depreciation_value || null, useful_life || null, req.params.id
    ]);

    await conn.commit();
    req.session.success = 'Aset peralatan berhasil diperbarui';
    res.redirect('/equipments');
  } catch (err) {
    await conn.rollback();
    if (req.file) fs.unlinkSync(req.file.path);
    next(err);
  } finally {
    conn.release();
  }
};

// DELETE /equipments/:id
const destroy = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT e.photo FROM assets a JOIN equipments e ON e.asset_id = a.id WHERE a.id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });
    }

    const photo = rows[0].photo;

    await conn.query('DELETE FROM equipments WHERE asset_id = ?', [req.params.id]);
    await conn.query('DELETE FROM assets WHERE id = ?', [req.params.id]);

    if (photo) {
      const filePath = path.join(__dirname, '../public', photo);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await conn.commit();
    req.session.success = 'Aset peralatan berhasil dihapus';
    res.redirect('/equipments');
  } catch (err) {
    await conn.rollback();
    req.session.error = 'Gagal menghapus aset. Silakan coba lagi.';
    res.redirect('/equipments');
  } finally {
    conn.release();
  }
};

// GET /equipments/export?format=xlsx|csv
const exportData = async (req, res, next) => {
  try {
    const format = req.query.format || 'xlsx';
    const q = req.query.q || '';
    const conditionFilter = req.query.condition || '';
    const statusFilter = req.query.status || '';
    const categoryFilter = req.query.category_id || '';

    let whereClause = `WHERE a.type = 'equipment'`;
    const params = [];
    if (q) {
      whereClause += ` AND (a.name LIKE ? OR a.code LIKE ? OR e.brand LIKE ?)`;
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    if (conditionFilter) { whereClause += ` AND a.\`condition\` = ?`; params.push(conditionFilter); }
    if (statusFilter) { whereClause += ` AND a.status = ?`; params.push(statusFilter); }
    if (categoryFilter) { whereClause += ` AND e.category_id = ?`; params.push(categoryFilter); }

    const [equipments] = await db.query(`
      SELECT
        a.code, a.name, e.brand, e.model, e.serial_number,
        ec.name AS category_name,
        a.acquisition_type, a.acquisition_date, a.acquisition_cost,
        a.\`condition\`, a.status, e.specification, a.created_at
      FROM assets a
      JOIN equipments e ON e.asset_id = a.id
      LEFT JOIN equipment_categories ec ON ec.id = e.category_id
      ${whereClause}
      ORDER BY a.created_at DESC
    `, params);

    const conditionLabels = { good: 'Baik', minor_damage: 'Rusak Ringan', major_damage: 'Rusak Berat' };
    const statusLabels = { available: 'Tersedia', in_use: 'Digunakan', maintenance: 'Dalam Perbaikan', retired: 'Tidak Aktif' };
    const typeLabels = { procurement: 'Pembelian', grant: 'Hibah' };

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FacultyWare';
    const sheet = workbook.addWorksheet('Aset Peralatan');

    sheet.columns = [
      { header: 'Kode Aset', key: 'code', width: 15 },
      { header: 'Nama Aset', key: 'name', width: 30 },
      { header: 'Kategori', key: 'category_name', width: 20 },
      { header: 'Merek', key: 'brand', width: 15 },
      { header: 'Model', key: 'model', width: 15 },
      { header: 'No. Seri', key: 'serial_number', width: 20 },
      { header: 'Jenis Perolehan', key: 'acquisition_type', width: 18 },
      { header: 'Tanggal Perolehan', key: 'acquisition_date', width: 20 },
      { header: 'Biaya Perolehan (Rp)', key: 'acquisition_cost', width: 22 },
      { header: 'Kondisi', key: 'condition', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Spesifikasi', key: 'specification', width: 40 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };

    equipments.forEach(eq => {
      sheet.addRow({
        code: eq.code,
        name: eq.name,
        category_name: eq.category_name || '-',
        brand: eq.brand || '-',
        model: eq.model || '-',
        serial_number: eq.serial_number || '-',
        acquisition_type: typeLabels[eq.acquisition_type] || eq.acquisition_type,
        acquisition_date: eq.acquisition_date ? new Date(eq.acquisition_date).toLocaleDateString('id-ID') : '-',
        acquisition_cost: eq.acquisition_cost ? Number(eq.acquisition_cost) : 0,
        condition: conditionLabels[eq.condition] || eq.condition,
        status: statusLabels[eq.status] || eq.status,
        specification: eq.specification || '-',
      });
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="aset-peralatan.csv"');
      await workbook.csv.write(res);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="aset-peralatan.xlsx"');
      await workbook.xlsx.write(res);
    }
    res.end();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  validateEquipment,
  index,
  create,
  store,
  show,
  edit,
  update,
  destroy,
  exportData,
};
