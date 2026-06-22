const db = require('../lib/db');
const { resolveSort, toSelectOptions } = require('../lib/sort');

// Opsi urutan daftar pengadaan (whitelist aman untuk ORDER BY).
const PENGADAAN_SORTS = {
  terbaru: { label: 'Terbaru',      orderBy: 'p.id DESC' },
  terlama: { label: 'Terlama',      orderBy: 'p.id ASC' },
  judul:   { label: 'Judul (A-Z)',  orderBy: 'p.title ASC, p.id DESC' },
  status:  { label: 'Status',       orderBy: 'p.status ASC, p.id DESC' },
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

// Nomor pengadaan sendiri (PGD-YYYYMMDD-XXXX). Pengadaan kini bisa menggabungkan
// banyak permintaan, jadi tidak lagi memakai request_number salah satu permintaan.
async function generateProcurementNumber() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const prefix = `PGD-${dateStr}-`;
  const [rows] = await db.query(
    'SELECT request_number FROM inventory_procurements WHERE request_number LIKE ? ORDER BY id DESC LIMIT 1',
    [`${prefix}%`]
  );
  let seq = 1;
  if (rows.length) {
    const n = parseInt(rows[0].request_number.slice(prefix.length), 10);
    if (!isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

// GET /pengadaan -> daftar pengadaan (+ jumlah permintaan yang digabung)
exports.index = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let where = '';
    const params = [];
    if (search) {
      where = 'WHERE p.request_number LIKE ? OR p.title LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    const sort = resolveSort(req.query.sort, PENGADAAN_SORTS, 'terbaru');

    const [procurements] = await db.query(
      `SELECT p.*, e.name AS creator_name,
              (SELECT COUNT(*) FROM inventory_requests r WHERE r.inventory_procurement_id = p.id) AS request_count
         FROM inventory_procurements p
         LEFT JOIN employees e ON p.employee_id = e.id
         ${where}
         ORDER BY ${sort.orderBy} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM inventory_procurements p ${where}`,
      params
    );
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    res.render('pengadaan/index', {
      title: 'Daftar Pengadaan Barang',
      user: req.session.username,
      procurements,
      search,
      currentPage: page,
      totalPages,
      limit,
      sort: sort.key,
      sortOptions: toSelectOptions(PENGADAAN_SORTS)
    });
  } catch (error) {
    next(error);
  }
};

// GET /pengadaan/create -> daftar permintaan approved yang BELUM dikonsolidasi,
// lengkap dengan barangnya, untuk dipilih (multi) dan digabung jadi satu pengadaan.
exports.create = async (req, res, next) => {
  try {
    const requests = await getConsolidatableRequests();
    res.render('pengadaan/create', {
      title: 'Buat Pengadaan Baru',
      user: req.session.username,
      requests,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// Ambil permintaan approved yang belum tergabung ke pengadaan mana pun + barangnya.
async function getConsolidatableRequests() {
  const [requests] = await db.query(
    `SELECT r.id, r.request_number, r.title, r.request_date, e.name AS requester_name
       FROM inventory_requests r
       LEFT JOIN employees e ON r.employee_id = e.id
      WHERE r.status = 'approved' AND r.inventory_procurement_id IS NULL
      ORDER BY r.id DESC`
  );
  for (const r of requests) {
    const [items] = await db.query(
      'SELECT item_name, quantity FROM inventory_request_details WHERE inventory_request_id = ? ORDER BY id ASC',
      [r.id]
    );
    r.items = items;
  }
  return requests;
}

// POST /pengadaan/create -> buat SATU pengadaan dari BANYAK permintaan terpilih.
exports.store = async (req, res, next) => {
  const title = (req.body.title || '').trim();
  // Checkbox dengan nama sama: bisa string (1 dipilih) atau array (banyak).
  let selected = req.body.request_number || [];
  if (!Array.isArray(selected)) selected = [selected];
  selected = selected.filter(Boolean);

  const currentEmployeeId = await resolveEmployeeId(req.session.userId);

  const renderError = async (message) => {
    const requests = await getConsolidatableRequests();
    res.render('pengadaan/create', {
      title: 'Buat Pengadaan Baru',
      user: req.session.username,
      requests,
      error: message
    });
  };

  if (!title) return renderError('Judul pengadaan wajib diisi.');
  if (selected.length === 0) return renderError('Pilih minimal satu permintaan untuk digabung.');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Pengadaan = konsolidasi murni (tanpa gerbang approval tersendiri). Dibuat
    // langsung 'approved' sehingga siap dijadikan sumber PO. Persetujuan ada di
    // tahap Permintaan (kebutuhan) dan tahap PO (belanja/harga).
    const procNumber = await generateProcurementNumber();
    const [procResult] = await conn.execute(
      `INSERT INTO inventory_procurements (request_number, title, status, created_by, employee_id, created_at, updated_at)
       VALUES (?, ?, 'approved', ?, ?, NOW(), NOW())`,
      [procNumber, title, currentEmployeeId, currentEmployeeId]
    );
    const procurementId = procResult.insertId;

    let totalItems = 0;
    for (const reqNumber of selected) {
      // Pastikan permintaan approved & belum dikonsolidasi (kunci baris).
      const [reqRows] = await conn.execute(
        `SELECT id FROM inventory_requests
          WHERE request_number = ? AND status = 'approved' AND inventory_procurement_id IS NULL
          FOR UPDATE`,
        [reqNumber]
      );
      if (reqRows.length === 0) {
        throw new Error(`Permintaan ${reqNumber} tidak valid (sudah dikonsolidasi atau tidak disetujui).`);
      }
      const reqId = reqRows[0].id;

      // Tandai permintaan tergabung ke pengadaan ini.
      await conn.execute(
        'UPDATE inventory_requests SET inventory_procurement_id = ?, updated_at = NOW() WHERE id = ?',
        [procurementId, reqId]
      );

      // Salin barang permintaan ke item pengadaan.
      const [itemRows] = await conn.execute(
        'SELECT item_id, item_name, quantity FROM inventory_request_details WHERE inventory_request_id = ?',
        [reqId]
      );
      for (const item of itemRows) {
        await conn.execute(
          `INSERT INTO inventory_procurement_items (inventory_procurement_id, item_id, item_name, quantity, created_at, updated_at)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [procurementId, item.item_id, item.item_name, item.quantity]
        );
        totalItems++;
      }
    }

    if (totalItems === 0) {
      throw new Error('Permintaan terpilih tidak memiliki barang.');
    }

    await conn.commit();
    res.redirect('/pengadaan');
  } catch (error) {
    await conn.rollback();
    console.error('Error saving procurement:', error);
    await renderError(error.message);
  } finally {
    conn.release();
  }
};

// GET /pengadaan/:id -> detail pengadaan + permintaan yang digabung + barang
exports.detail = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [procurementRows] = await db.query(
      `SELECT p.*, e.name AS creator_name
         FROM inventory_procurements p
         LEFT JOIN employees e ON p.employee_id = e.id
        WHERE p.id = ?`,
      [id]
    );
    if (procurementRows.length === 0) {
      return res.status(404).render('error', {
        message: 'Data pengadaan tidak ditemukan.',
        error: { status: 404, stack: '' }
      });
    }
    const procurement = procurementRows[0];

    const [requests] = await db.query(
      `SELECT r.id, r.request_number, r.request_date, r.status, r.title, e.name AS requester_name
         FROM inventory_requests r
         LEFT JOIN employees e ON r.employee_id = e.id
        WHERE r.inventory_procurement_id = ?
        ORDER BY r.id ASC`,
      [id]
    );

    // Barang per permintaan -> diambil langsung dari sumbernya (request_details),
    // sehingga jelas barang mana berasal dari permintaan mana.
    if (requests.length > 0) {
      const reqIds = requests.map((r) => r.id);
      const [details] = await db.query(
        `SELECT inventory_request_id, item_name, quantity
           FROM inventory_request_details
          WHERE inventory_request_id IN (?)
          ORDER BY id ASC`,
        [reqIds]
      );
      const byReq = {};
      for (const d of details) {
        (byReq[d.inventory_request_id] = byReq[d.inventory_request_id] || []).push(d);
      }
      requests.forEach((r) => { r.items = byReq[r.id] || []; });
    }

    res.render('pengadaan/detail', {
      title: `Detail Pengadaan ${procurement.request_number}`,
      user: req.session.username,
      procurement,
      requests
    });
  } catch (error) {
    next(error);
  }
};

// GET /pengadaan/api/request/:requestNumber/items -> AJAX lookup (dipertahankan)
exports.requestItems = async (req, res, next) => {
  try {
    const { requestNumber } = req.params;
    const [requestRows] = await db.query(
      'SELECT id FROM inventory_requests WHERE request_number = ?',
      [requestNumber]
    );
    if (requestRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan.' });
    }
    const [items] = await db.query(
      'SELECT item_id, item_name as name, quantity FROM inventory_request_details WHERE inventory_request_id = ? ORDER BY id ASC',
      [requestRows[0].id]
    );
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
