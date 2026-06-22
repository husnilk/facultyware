const db = require('../lib/db');
const PDFDocument = require('pdfkit');
const { resolveSort, toSelectOptions } = require('../lib/sort');

// Opsi urutan daftar permintaan (whitelist aman untuk ORDER BY).
const REQUEST_SORTS = {
  terbaru: { label: 'Terbaru',     orderBy: 'r.id DESC' },
  terlama: { label: 'Terlama',     orderBy: 'r.id ASC' },
  judul:   { label: 'Judul (A-Z)', orderBy: 'title ASC, r.id DESC' },
  status:  { label: 'Status',      orderBy: 'r.status ASC, r.id DESC' },
};

// Helper: Resolve logged-in user name to employee ID.
async function resolveEmployeeId(userId) {
  try {
    if (userId) {
      const [users] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
      if (users.length > 0) {
        const [employees] = await db.query('SELECT id FROM employees WHERE name = ? LIMIT 1', [users[0].name]);
        if (employees.length > 0) {
          return employees[0].id;
        }
      }
    }
    const [any] = await db.query('SELECT id FROM employees ORDER BY id ASC LIMIT 1');
    if (any.length > 0) {
      return any[0].id;
    }
  } catch (error) {
    console.error('Error resolving employee ID:', error);
  }
  return null;
}

// Helper: Generate sequential request number (PRQ-YYYYMMDD-XXXX)
async function generateRequestNumber() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const prefix = `PRQ-${dateStr}-`;

  const [rows] = await db.query(
    'SELECT request_number FROM inventory_requests WHERE request_number LIKE ? ORDER BY id DESC LIMIT 1',
    [`${prefix}%`]
  );

  let nextNum = 1;
  if (rows.length > 0) {
    const lastNumber = rows[0].request_number;
    const lastSeq = parseInt(lastNumber.replace(prefix, ''), 10);
    if (!isNaN(lastSeq)) {
      nextNum = lastSeq + 1;
    }
  }

  const seqStr = String(nextNum).padStart(4, '0');
  return `${prefix}${seqStr}`;
}

// GET /procurement -> index (daftar)
const index = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const employeeId = await resolveEmployeeId(req.session.userId);

    // Cari berdasarkan nomor pengajuan atau nama barang detail
    let query = `
      SELECT r.*,
             COALESCE(NULLIF(r.title, ''), CONCAT(
               COALESCE((SELECT item_name FROM inventory_request_details WHERE inventory_request_id = r.id ORDER BY id LIMIT 1), 'Permintaan Barang'),
               CASE WHEN (SELECT COUNT(*) FROM inventory_request_details WHERE inventory_request_id = r.id) > 1
                    THEN CONCAT(' +', (SELECT COUNT(*) FROM inventory_request_details WHERE inventory_request_id = r.id) - 1, ' lainnya')
                    ELSE '' END
             )) AS title,
             (SELECT pur.status FROM inventory_purchases pur
               WHERE pur.inventory_procurement_id = r.inventory_procurement_id
               ORDER BY pur.id DESC LIMIT 1) AS po_status
      FROM inventory_requests r
      WHERE r.employee_id = ?
    `;
    let queryParams = [employeeId];

    if (search) {
      query += ` AND (r.request_number LIKE ? OR EXISTS (
        SELECT 1 FROM inventory_request_details WHERE inventory_request_id = r.id AND item_name LIKE ?
      ))`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const sort = resolveSort(req.query.sort, REQUEST_SORTS, 'terbaru');
    query += ` ORDER BY ${sort.orderBy} LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [procurements] = await db.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM inventory_requests r 
      WHERE r.employee_id = ?
    `;
    let countParams = [employeeId];

    if (search) {
      countQuery += ` AND (r.request_number LIKE ? OR EXISTS (
        SELECT 1 FROM inventory_request_details WHERE inventory_request_id = r.id AND item_name LIKE ?
      ))`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await db.query(countQuery, countParams);
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    res.render('inventory-procurement/index', {
      title: 'Permintaan Barang',
      user: req.session.username,
      procurements,
      search,
      currentPage: page,
      totalPages,
      limit,
      sort: sort.key,
      sortOptions: toSelectOptions(REQUEST_SORTS)
    });
  } catch (error) {
    next(error);
  }
};

// GET /procurement/create -> form buat
const create = async (req, res, next) => {
  try {
    res.render('inventory-procurement/create', {
      title: 'Buat Permintaan Barang',
      user: req.session.username,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// POST /procurement/create -> simpan
const store = async (req, res, next) => {
  const { item_name, quantity } = req.body;
  const title = (req.body.title || '').trim() || null;
  const employeeId = await resolveEmployeeId(req.session.userId);

  // Check if items exist
  const items = [];
  if (Array.isArray(item_name)) {
    for (let i = 0; i < item_name.length; i++) {
      const name = item_name[i]?.trim();
      const qty = parseInt(quantity[i]);
      if (name) {
        if (isNaN(qty) || qty <= 0) {
          return res.render('inventory-procurement/create', {
            title: 'Buat Permintaan Barang',
            user: req.session.username,
            error: 'Jumlah barang (quantity) harus berupa angka lebih dari 0.'
          });
        }
        items.push({ name, qty });
      }
    }
  } else if (item_name && item_name.trim() !== '') {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.render('inventory-procurement/create', {
        title: 'Buat Permintaan Barang',
        user: req.session.username,
        error: 'Jumlah barang (quantity) harus berupa angka lebih dari 0.'
      });
    }
    items.push({ name: item_name.trim(), qty });
  }

  if (items.length === 0) {
    return res.render('inventory-procurement/create', {
      title: 'Buat Permintaan Barang',
      user: req.session.username,
      error: 'Minimal harus menambahkan 1 barang permintaan.'
    });
  }

  const requestNumber = await generateRequestNumber();
  const requestDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const approvedById = 0;
  const status = 'pending'; // Status HARUS 'pending' (bukan submitted/draft)

  // Transaction
  try {
    await db.query('START TRANSACTION');

    const [headerResult] = await db.query(
      `INSERT INTO inventory_requests (request_number, title, employee_id, request_date, status, approved_by_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [requestNumber, title, employeeId, requestDate, status, approvedById]
    );

    const requestId = headerResult.insertId;

    for (const item of items) {
      await db.query(
        `INSERT INTO inventory_request_details (inventory_request_id, item_id, item_name, specification, quantity, created_at, updated_at)
         VALUES (?, NULL, ?, NULL, ?, NOW(), NOW())`,
        [requestId, item.name, item.qty]
      );
    }

    await db.query('COMMIT');
    res.redirect('/procurement');
  } catch (error) {
    await db.query('ROLLBACK');
    next(error);
  }
};

// GET /procurement/:id -> detail
const detail = async (req, res, next) => {
  const { id } = req.params;
  const employeeId = await resolveEmployeeId(req.session.userId);

  try {
    const [procurementRows] = await db.query(
      `SELECT r.*, e.name AS pemohon_name,
              COALESCE(NULLIF(r.title, ''), CONCAT(
                COALESCE((SELECT item_name FROM inventory_request_details WHERE inventory_request_id = r.id ORDER BY id LIMIT 1), 'Permintaan Barang'),
                CASE WHEN (SELECT COUNT(*) FROM inventory_request_details WHERE inventory_request_id = r.id) > 1
                     THEN CONCAT(' +', (SELECT COUNT(*) FROM inventory_request_details WHERE inventory_request_id = r.id) - 1, ' lainnya')
                     ELSE '' END
              )) AS title
       FROM inventory_requests r
       LEFT JOIN employees e ON r.employee_id = e.id
       WHERE r.id = ? AND r.employee_id = ?`,
      [id, employeeId]
    );

    if (procurementRows.length === 0) {
      return res.status(404).render('error', {
        message: 'Permintaan barang tidak ditemukan atau Anda tidak memiliki akses.',
        error: { status: 404, stack: '' }
      });
    }

    const procurement = procurementRows[0];

    const [items] = await db.query(
      'SELECT * FROM inventory_request_details WHERE inventory_request_id = ?',
      [id]
    );

    let po = null;
    if (procurement.inventory_procurement_id) {
      const [poRows] = await db.query(
        'SELECT * FROM inventory_purchases WHERE inventory_procurement_id = ? LIMIT 1',
        [procurement.inventory_procurement_id]
      );
      if (poRows.length > 0) {
        po = poRows[0];
      }
    }

    // Alasan penolakan (bila ditolak) -> dari catatan persetujuan Wakil Dekan.
    let rejectionNote = null;
    if (procurement.status === 'rejected') {
      const [noteRows] = await db.query(
        `SELECT notes FROM inventory_request_approvals
          WHERE inventory_request_id = ? AND status = 'rejected'
          ORDER BY id DESC LIMIT 1`,
        [id]
      );
      if (noteRows.length > 0) rejectionNote = noteRows[0].notes;
    }

    res.render('inventory-procurement/detail', {
      title: `Detail ${procurement.request_number}`,
      user: req.session.username,
      procurement,
      items,
      po,
      rejectionNote
    });
  } catch (error) {
    next(error);
  }
};

// POST /procurement/:id/edit -> update draf/pending (modal)
const update = async (req, res, next) => {
  const { id } = req.params;
  const { item_name, quantity } = req.body;
  const employeeId = await resolveEmployeeId(req.session.userId);

  try {
    const [rows] = await db.query('SELECT status FROM inventory_requests WHERE id = ? AND employee_id = ?', [id, employeeId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    }

    // Hanya status pending yang boleh diubah
    if (rows[0].status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Hanya permintaan dengan status Pending yang dapat diubah.' });
    }

    const items = [];
    if (Array.isArray(item_name)) {
      for (let i = 0; i < item_name.length; i++) {
        const name = item_name[i]?.trim();
        const qty = parseInt(quantity[i]);
        if (name) {
          if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ success: false, message: 'Jumlah barang harus lebih dari 0.' });
          }
          items.push({ name, qty });
        }
      }
    } else if (item_name && item_name.trim() !== '') {
      const qty = parseInt(quantity);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: 'Jumlah barang harus lebih dari 0.' });
      }
      items.push({ name: item_name.trim(), qty });
    }

    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'Minimal harus menambahkan 1 barang permintaan.' });
    }

    // Process Update
    await db.query('START TRANSACTION');

    await db.query(
      'UPDATE inventory_requests SET updated_at = NOW() WHERE id = ?',
      [id]
    );

    // Remove old items
    await db.query('DELETE FROM inventory_request_details WHERE inventory_request_id = ?', [id]);

    // Insert new items
    for (const item of items) {
      await db.query(
        `INSERT INTO inventory_request_details (inventory_request_id, item_id, item_name, specification, quantity, created_at, updated_at)
         VALUES (?, NULL, ?, NULL, ?, NOW(), NOW())`,
        [id, item.name, item.qty]
      );
    }

    await db.query('COMMIT');
    res.json({ success: true, message: 'Berhasil memperbarui permintaan.' });
  } catch (error) {
    await db.query('ROLLBACK');
    next(error);
  }
};

// POST /procurement/:id/delete -> hapus draf/pending (modal)
const destroy = async (req, res, next) => {
  const { id } = req.params;
  const employeeId = await resolveEmployeeId(req.session.userId);

  try {
    const [rows] = await db.query('SELECT status FROM inventory_requests WHERE id = ? AND employee_id = ?', [id, employeeId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    }

    if (rows[0].status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Hanya permintaan dengan status Pending yang dapat dihapus.' });
    }

    await db.query('START TRANSACTION');
    await db.query('DELETE FROM inventory_request_details WHERE inventory_request_id = ?', [id]);
    await db.query('DELETE FROM inventory_requests WHERE id = ?', [id]);
    await db.query('COMMIT');

    res.json({ success: true, message: 'Berhasil menghapus permintaan.' });
  } catch (error) {
    await db.query('ROLLBACK');
    next(error);
  }
};

// POST /procurement/:id/submit -> kirim ke Wadir (no-op sekarang karena langsung pending)
const submit = async (req, res, next) => {
  res.json({ success: true, message: 'Permintaan sudah otomatis terkirim dengan status pending.' });
};

// GET /procurement/:id/export -> download PDF
const exportPDF = async (req, res, next) => {
  const { id } = req.params;
  const employeeId = await resolveEmployeeId(req.session.userId);

  try {
    const [procurementRows] = await db.query(
      `SELECT r.*, e.name as requester_name 
       FROM inventory_requests r 
       JOIN employees e ON r.employee_id = e.id 
       WHERE r.id = ? AND r.employee_id = ?`,
      [id, employeeId]
    );

    if (procurementRows.length === 0) {
      return res.status(404).render('error', {
        message: 'Permintaan barang tidak ditemukan.',
        error: { status: 404, stack: '' }
      });
    }

    const procurement = procurementRows[0];
    const [items] = await db.query(
      'SELECT * FROM inventory_request_details WHERE inventory_request_id = ?',
      [id]
    );

    // Set virtual title
    procurement.title = items.length
      ? (items[0].item_name + (items.length > 1 ? ` +${items.length - 1} lainnya` : ''))
      : 'Permintaan Barang';

    // Initialize PDFKit
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Request-${procurement.request_number}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Document Header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('FORMULIR PERMINTAAN BARANG', { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Fakultas Teknologi Informasi - Universitas Andalas', { align: 'center' });
    doc.moveDown(1.5);

    // Horizontal line
    doc.moveTo(50, 110).lineTo(562, 110).stroke();
    doc.moveDown(1.5);

    // Info Requisition
    doc.font('Helvetica-Bold').fontSize(11).text('Informasi Permintaan:');
    doc.moveDown(0.5);

    const formattedDate = procurement.request_date ? new Date(procurement.request_date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) : '-';

    doc.font('Helvetica').fontSize(10);
    doc.text(`Nomor Permintaan : ${procurement.request_number}`);
    doc.text(`Judul Requisition  : ${procurement.title}`);
    doc.text(`Tanggal Pengajuan  : ${formattedDate}`);
    doc.text(`Pemohon            : ${procurement.requester_name}`);
    doc.text(`Status             : ${procurement.status.toUpperCase()}`);
    doc.moveDown(2);

    // Items table header
    doc.font('Helvetica-Bold').text('Daftar Barang Permintaan:');
    doc.moveDown(0.5);

    // Draw Table Header
    const tableTop = 260;
    doc.rect(50, tableTop, 512, 20).fill('#f1f5f9');
    doc.fillColor('#0f172a').font('Helvetica-Bold');
    doc.text('No.', 60, tableTop + 5, { width: 30 });
    doc.text('Nama Barang', 110, tableTop + 5, { width: 300 });
    doc.text('Jumlah (Quantity)', 430, tableTop + 5, { width: 120, align: 'right' });

    let currentY = tableTop + 20;
    doc.font('Helvetica').fillColor('#334155');

    // Draw Table Items
    items.forEach((item, index) => {
      // Row borders
      doc.rect(50, currentY, 512, 20).stroke('#e2e8f0');
      doc.text(String(index + 1), 60, currentY + 5, { width: 30 });
      doc.text(item.item_name, 110, currentY + 5, { width: 300 });
      doc.text(String(item.quantity), 430, currentY + 5, { width: 120, align: 'right' });
      currentY += 20;
    });

    doc.moveDown(3);

    // Signature Area
    const sigY = doc.y + 40;
    doc.fontSize(10);
    doc.text('Pemohon,', 70, sigY);
    doc.text('Wakil Direktur Bidang Sarana & Prasarana,', 330, sigY, { width: 220, align: 'center' });

    doc.moveDown(4);
    const signNameY = doc.y + 40;
    doc.font('Helvetica-Bold').text(procurement.requester_name, 70, signNameY);
    doc.text('(..................................................)', 330, signNameY, { width: 220, align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// GET /api/procurement -> REST API JSON
const apiList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const employeeId = await resolveEmployeeId(req.session.userId);

    const [items] = await db.query(
      `SELECT *,
              COALESCE(NULLIF(title, ''), CONCAT(
                COALESCE((SELECT item_name FROM inventory_request_details WHERE inventory_request_id = inventory_requests.id ORDER BY id LIMIT 1), 'Permintaan Barang'),
                CASE WHEN (SELECT COUNT(*) FROM inventory_request_details WHERE inventory_request_id = inventory_requests.id) > 1
                     THEN CONCAT(' +', (SELECT COUNT(*) FROM inventory_request_details WHERE inventory_request_id = inventory_requests.id) - 1, ' lainnya')
                     ELSE '' END
              )) AS title
       FROM inventory_requests WHERE employee_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`,
      [employeeId, limit, offset]
    );

    const [countRows] = await db.query(
      'SELECT COUNT(*) as total FROM inventory_requests WHERE employee_id = ?',
      [employeeId]
    );

    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    res.json({
      status: 'success',
      data: {
        items,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  index,
  create,
  store,
  detail,
  update,
  destroy,
  submit,
  exportPDF,
  apiList
};
