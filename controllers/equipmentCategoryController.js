const db = require('../lib/db');
const { validationResult, body } = require('express-validator');
const ExcelJS = require('exceljs');

// Validation rules
const validateCategory = [
  body('code')
    .trim()
    .notEmpty().withMessage('Kode kategori wajib diisi')
    .isLength({ max: 50 }).withMessage('Kode maksimal 50 karakter'),
  body('name')
    .trim()
    .notEmpty().withMessage('Nama kategori wajib diisi')
    .isLength({ max: 255 }).withMessage('Nama maksimal 255 karakter'),
  body('description')
    .optional({ checkFalsy: true })
    .isLength({ max: 1000 }).withMessage('Deskripsi maksimal 1000 karakter'),
];

// GET /equipment-categories
const index = async (req, res, next) => {
  try {
    const q = req.query.q || '';

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    if (q) {
      whereClause = `WHERE ec.code LIKE ? OR ec.name LIKE ? OR ec.description LIKE ?`;
      const likeQ = `%${q}%`;
      params.push(likeQ, likeQ, likeQ);
    }

    // Hitung total baris untuk jumlah halaman
    const [[{ totalRows }]] = await db.query(`
      SELECT COUNT(*) AS totalRows FROM equipment_categories ec ${whereClause}
    `, params);
    const totalPages = Math.max(1, Math.ceil(totalRows / limit));

    const [categories] = await db.query(`
      SELECT ec.*,
        COUNT(e.id) AS equipment_count
      FROM equipment_categories ec
      LEFT JOIN equipments e ON e.category_id = ec.id
      ${whereClause}
      GROUP BY ec.id
      ORDER BY ec.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.render('equipment-categories/index', {
      title: 'Kategori Aset',
      categories,
      q,
      user: req.session.email,
      success: req.session.success || null,
      error: req.session.error || null,
      pagination: { page, limit, totalRows, totalPages },
    });
    delete req.session.success;
    delete req.session.error;
  } catch (err) {
    next(err);
  }
};

// GET /equipment-categories/create
const create = (req, res) => {
  res.render('equipment-categories/create', {
    title: 'Tambah Kategori Aset',
    user: req.session.email,
    errors: [],
    old: {},
  });
};

// POST /equipment-categories
const store = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('equipment-categories/create', {
      title: 'Tambah Kategori Aset',
      user: req.session.email,
      errors: errors.array(),
      old: req.body,
    });
  }

  try {
    const { code, name, description } = req.body;

    // Cek unique code
    const [existing] = await db.query(
      'SELECT id FROM equipment_categories WHERE code = ?',
      [code]
    );
    if (existing.length > 0) {
      return res.render('equipment-categories/create', {
        title: 'Tambah Kategori Aset',
        user: req.session.email,
        errors: [{ path: 'code', msg: 'Kode kategori sudah digunakan' }],
        old: req.body,
      });
    }

    await db.query(
      `INSERT INTO equipment_categories (code, name, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
      [code, name, description || null]
    );

    req.session.success = 'Kategori berhasil ditambahkan';
    res.redirect('/equipment-categories');
  } catch (err) {
    next(err);
  }
};

// GET /equipment-categories/:id/edit
const edit = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM equipment_categories WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).render('error', {
        message: 'Kategori tidak ditemukan',
        error: { status: 404, stack: '' }
      });
    }
    res.render('equipment-categories/edit', {
      title: 'Edit Kategori Aset',
      user: req.session.email,
      category: rows[0],
      errors: [],
    });
  } catch (err) {
    next(err);
  }
};

// POST /equipment-categories/:id (method override: PUT)
const update = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const [rows] = await db.query(
      'SELECT * FROM equipment_categories WHERE id = ?',
      [req.params.id]
    );
    return res.render('equipment-categories/edit', {
      title: 'Edit Kategori Aset',
      user: req.session.email,
      category: rows[0] || req.body,
      errors: errors.array(),
    });
  }

  try {
    const { code, name, description } = req.body;

    // Cek unique code (exclude self)
    const [existing] = await db.query(
      'SELECT id FROM equipment_categories WHERE code = ? AND id != ?',
      [code, req.params.id]
    );
    if (existing.length > 0) {
      const [rows] = await db.query('SELECT * FROM equipment_categories WHERE id = ?', [req.params.id]);
      return res.render('equipment-categories/edit', {
        title: 'Edit Kategori Aset',
        user: req.session.email,
        category: rows[0],
        errors: [{ path: 'code', msg: 'Kode kategori sudah digunakan' }],
      });
    }

    await db.query(
      `UPDATE equipment_categories SET code = ?, name = ?, description = ?, updated_at = NOW() WHERE id = ?`,
      [code, name, description || null, req.params.id]
    );

    req.session.success = 'Kategori berhasil diperbarui';
    res.redirect('/equipment-categories');
  } catch (err) {
    next(err);
  }
};

// DELETE /equipment-categories/:id
const destroy = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id FROM equipment_categories WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    await db.query('DELETE FROM equipment_categories WHERE id = ?', [req.params.id]);

    req.session.success = 'Kategori berhasil dihapus';
    res.redirect('/equipment-categories');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      req.session.error = 'Kategori tidak dapat dihapus karena masih digunakan oleh aset peralatan';
    } else {
      req.session.error = 'Gagal menghapus kategori. Silakan coba lagi.';
    }
    res.redirect('/equipment-categories');
  }
};

// GET /equipment-categories/export?format=xlsx|csv
const exportData = async (req, res, next) => {
  try {
    const format = req.query.format || 'xlsx';
    const [categories] = await db.query(`
      SELECT ec.code, ec.name, ec.description,
        COUNT(e.id) AS equipment_count,
        ec.created_at
      FROM equipment_categories ec
      LEFT JOIN equipments e ON e.category_id = ec.id
      GROUP BY ec.id
      ORDER BY ec.created_at DESC
    `);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FacultyWare';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Kategori Aset');
    sheet.columns = [
      { header: 'Kode', key: 'code', width: 15 },
      { header: 'Nama Kategori', key: 'name', width: 30 },
      { header: 'Deskripsi', key: 'description', width: 40 },
      { header: 'Jumlah Aset', key: 'equipment_count', width: 15 },
      { header: 'Dibuat', key: 'created_at', width: 20 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' }
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    categories.forEach(cat => {
      sheet.addRow({
        code: cat.code,
        name: cat.name,
        description: cat.description || '-',
        equipment_count: cat.equipment_count,
        created_at: cat.created_at ? new Date(cat.created_at).toLocaleDateString('id-ID') : '-',
      });
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="kategori-aset.csv"');
      await workbook.csv.write(res);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="kategori-aset.xlsx"');
      await workbook.xlsx.write(res);
    }
    res.end();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  validateCategory,
  index,
  create,
  store,
  edit,
  update,
  destroy,
  exportData,
};
