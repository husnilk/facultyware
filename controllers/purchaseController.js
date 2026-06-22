const db = require('../lib/db');       // Utility koneksi database
const PDFDocument = require('pdfkit'); // Library untuk generate PDF
const { resolveSort, toSelectOptions } = require('../lib/sort');

// Opsi urutan daftar PO (whitelist aman untuk ORDER BY).
const PURCHASE_SORTS = {
  terbaru:  { label: 'Terbaru',        orderBy: 'id DESC' },
  terlama:  { label: 'Terlama',        orderBy: 'id ASC' },
  supplier: { label: 'Supplier (A-Z)', orderBy: 'supplier ASC, id DESC' },
  status:   { label: 'Status',         orderBy: 'status ASC, id DESC' },
};

// Helper: Resolve raw item name to item id.
async function resolveItemId(rawName) {
  const name = (rawName || 'Barang').trim() || 'Barang';
  const [found] = await db.query('SELECT id FROM items WHERE name = ? LIMIT 1', [name]);
  if (found.length) return found[0].id;
  const code = 'ITM-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
  const [res] = await db.query(
    'INSERT INTO items (name, code, unit, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
    [name, code, 'unit']
  );
  return res.insertId;
}

// Daftar PO
exports.index = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const search = req.query.search || '';
    const limit = 10;
    const offset = (page - 1) * limit;
    const sort = resolveSort(req.query.sort, PURCHASE_SORTS, 'terbaru');

    const [purchases] = await db.query(
      `SELECT * FROM inventory_purchases
       WHERE supplier LIKE ? OR purchase_number LIKE ?
       ORDER BY ${sort.orderBy}
       LIMIT ? OFFSET ?`,
      [`%${search}%`, `%${search}%`, limit, offset]
    );

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM inventory_purchases WHERE supplier LIKE ? OR purchase_number LIKE ?`,
      [`%${search}%`, `%${search}%`]
    );
    const totalPages = Math.max(1, Math.ceil(countRows[0].total / limit));

    res.render('purchase/index', {
      title: 'Daftar Purchase Order', user: req.session.username, purchases, search,
      currentPage: page, totalPages,
      sort: sort.key, sortOptions: toSelectOptions(PURCHASE_SORTS)
    });
  } catch (err) { next(err); }
};

// Form Create PO
exports.create = async (req, res, next) => {
  try {
    const [procurements] = await db.query(
      `SELECT *, 
              COALESCE(title, (SELECT item_name FROM inventory_procurement_items WHERE inventory_procurement_id = inventory_procurements.id LIMIT 1)) as title 
       FROM inventory_procurements 
       WHERE status='approved' 
       AND id NOT IN (SELECT inventory_procurement_id FROM inventory_purchases WHERE inventory_procurement_id IS NOT NULL)`
    );

    const [suppliers] = await db.query('SELECT id, name, code FROM suppliers ORDER BY name ASC');

    res.render('purchase/create', { 
      title: 'Buat Purchase Order', 
      user: req.session.username, 
      procurements, 
      suppliers, 
      error: null 
    });
  } catch (err) { next(err); }
};

// Simpan PO Baru
exports.store = async (req, res, next) => {
  try {
    const { purchase_date, supplier_id, inventory_procurement_id } = req.body;
    const rawPrices = req.body.prices || req.body['prices[]'];
    const pricesArray = Array.isArray(rawPrices) ? rawPrices : (rawPrices ? [rawPrices] : []);

    const [suppliers] = await db.query('SELECT id, name FROM suppliers ORDER BY name ASC');
    const [procurements] = await db.query(
      `SELECT *, 
              COALESCE(title, (SELECT item_name FROM inventory_procurement_items WHERE inventory_procurement_id = inventory_procurements.id LIMIT 1)) as title 
       FROM inventory_procurements 
       WHERE status='approved' 
       AND id NOT IN (SELECT inventory_procurement_id FROM inventory_purchases WHERE inventory_procurement_id IS NOT NULL)`
    );

    if (!purchase_date || !supplier_id || !inventory_procurement_id) {
      return res.render('purchase/create', { 
        title: 'Buat Purchase Order', 
        user: req.session.username, 
        procurements, 
        suppliers, 
        error: 'Field wajib diisi!' 
      });
    }

    // Ambil detail supplier
    const [supplierRows] = await db.query('SELECT name FROM suppliers WHERE id = ?', [supplier_id]);
    if (supplierRows.length === 0) {
      return res.render('purchase/create', { 
        title: 'Buat Purchase Order', 
        user: req.session.username, 
        procurements, 
        suppliers, 
        error: 'Supplier yang dipilih tidak valid!' 
      });
    }
    const supplierName = supplierRows[0].name;

    const [dupRows] = await db.query(
      `SELECT COUNT(*) as cnt FROM inventory_purchases WHERE inventory_procurement_id=?`,
      [inventory_procurement_id]
    );
    if (dupRows[0].cnt > 0) {
      return res.render('purchase/create', { 
        title: 'Buat Purchase Order', 
        user: req.session.username, 
        procurements, 
        suppliers, 
        error: 'PO sudah ada untuk permintaan ini!' 
      });
    }

    const now = new Date(purchase_date || Date.now());
    const prefix = `PO-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}`;
    const [countRows] = await db.query(`SELECT COUNT(*) as cnt FROM inventory_purchases`);
    const purchase_number = `${prefix}-${String(countRows[0].cnt+1).padStart(4,'0')}`;

    // PO baru menunggu persetujuan (gerbang ke-2: Wadir menimbang harga/anggaran).
    const [result] = await db.query(
      `INSERT INTO inventory_purchases (purchase_number, inventory_procurement_id, purchase_date, supplier, supplier_id, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?, NOW(), NOW())`,
      [purchase_number, inventory_procurement_id, purchase_date, supplierName, supplier_id, 'pending']
    );

    const [items] = await db.query(
      `SELECT * FROM inventory_procurement_items WHERE inventory_procurement_id=? ORDER BY id ASC`,
      [inventory_procurement_id]
    );

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const price = parseFloat(pricesArray[i]) || 0;
      const itemId = item.item_id || await resolveItemId(item.item_name);
      await db.query(
        `INSERT INTO inventory_purchase_items (inventory_purchase_id, item_id, quantity, price, created_at, updated_at)
         VALUES (?,?,?,?, NOW(), NOW())`,
        [result.insertId, itemId, item.quantity, price]
      );
    }

    res.redirect('/purchase');
  } catch (err) { next(err); }
};

// Detail PO
exports.detail = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [poRows] = await db.query(
      `SELECT pur.*,
              COALESCE(NULLIF(proc.title, ''),
                       (SELECT item_name FROM inventory_procurement_items WHERE inventory_procurement_id = proc.id LIMIT 1),
                       'Pengadaan') AS procurement_title
         FROM inventory_purchases pur
         LEFT JOIN inventory_procurements proc ON proc.id = pur.inventory_procurement_id
        WHERE pur.id = ?`,
      [id]
    );
    if (!poRows || poRows.length === 0) return res.status(404).send('PO not found');
    const po = poRows[0];

    const [items] = await db.query(
      `SELECT i.name, pi.quantity, pi.price, (pi.quantity*pi.price) as subtotal
       FROM inventory_purchase_items pi
       JOIN items i ON pi.item_id=i.id
       WHERE pi.inventory_purchase_id=?`,
      [id]
    );

    const total = items.reduce((sum, it) => sum + Number(it.subtotal || 0), 0);

    res.render('purchase/detail', { title: 'Detail Purchase Order', user: req.session.username, po, items, total });
  } catch (err) { next(err); }
};

// Update Status PO -> completed (hanya boleh setelah disetujui)
exports.updateStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    await db.query(
      `UPDATE inventory_purchases SET status='completed', updated_at = NOW() WHERE id=? AND status='approved'`,
      [id]
    );
    res.redirect(`/purchase/${id}`);
  } catch (err) { next(err); }
};

// Persetujuan PO oleh Wakil Dekan (gerbang ke-2, sadar-harga).
// approved_by merujuk employees.id; session.userId = users.id yang 1:1 dengan employees.id.
exports.approve = async (req, res, next) => {
  try {
    const id = req.params.id;
    await db.query(
      `UPDATE inventory_purchases
          SET status='approved', approved_by=?, approved_at=NOW(), updated_at=NOW()
        WHERE id=? AND status='pending'`,
      [req.session.userId, id]
    );
    res.redirect(`/purchase/${id}`);
  } catch (err) { next(err); }
};

exports.reject = async (req, res, next) => {
  try {
    const id = req.params.id;
    const notes = (req.body && (req.body.notes || req.body.approval_notes)) || null;
    await db.query(
      `UPDATE inventory_purchases
          SET status='rejected', approved_by=?, approved_at=NOW(), approval_notes=?, updated_at=NOW()
        WHERE id=? AND status='pending'`,
      [req.session.userId, notes, id]
    );
    res.redirect(`/purchase/${id}`);
  } catch (err) { next(err); }
};

// Export PDF: formulir Purchase Order
exports.exportPDF = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [poRows] = await db.query(`SELECT * FROM inventory_purchases WHERE id=?`, [id]);
    if (!poRows || poRows.length === 0) {
      return res.status(404).send('PO not found');
    }
    const po = poRows[0];

    const [items] = await db.query(
      `SELECT i.name, pi.quantity, pi.price, (pi.quantity*pi.price) as subtotal
       FROM inventory_purchase_items pi
       JOIN items i ON pi.item_id=i.id
       WHERE pi.inventory_purchase_id=?`,
      [id]
    );

    const total = items.reduce((sum, it) => sum + Number(it.subtotal || 0), 0);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=po-${po.purchase_number}.pdf`);
    doc.pipe(res);

    // Header institusi
    doc.fontSize(14).font("Helvetica-Bold")
       .text("Fakultas Teknologi Informasi - Universitas Andalas", { align: "center" });
    doc.moveDown(0.5);

    // Judul dokumen
    doc.fontSize(18).font("Helvetica-Bold")
       .text("FORMULIR PURCHASE ORDER", { align: "center" });
    doc.moveDown();

    // Informasi PO
    doc.fontSize(12).font("Helvetica")
       .text(`Nomor PO   : ${po.purchase_number}`)
       .text(`Tanggal    : ${po.purchase_date}`)
       .text(`Supplier   : ${po.supplier}`)
       .text(`Status     : ${po.status}`);
    doc.moveDown();

    // Tabel barang
    const tableTop = doc.y + 10;
    const startX = 50;
    const colWidths = [40, 200, 80, 100, 100]; // No, Item, Qty, Harga, Subtotal

    // Header tabel
    const headers = ["No", "Item", "Qty", "Harga", "Subtotal"];
    let x = startX;
    headers.forEach((h, i) => {
      doc.rect(x, tableTop, colWidths[i], 20).stroke();
      doc.font("Helvetica-Bold")
         .text(h, x + 5, tableTop + 5, { width: colWidths[i] - 10, align: "center" });
      x += colWidths[i];
    });

    // Isi tabel
    let y = tableTop + 20;
    items.forEach((it, idx) => {
      x = startX;
      const row = [
        idx + 1,
        it.name,
        it.quantity,
        Number(it.price).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
        Number(it.subtotal).toLocaleString('id-ID', { minimumFractionDigits: 2 })
      ];
      row.forEach((val, i) => {
        doc.rect(x, y, colWidths[i], 20).stroke();
        doc.font("Helvetica")
           .text(val.toString(), x + 5, y + 5, { width: colWidths[i] - 10, align: "center" });
        x += colWidths[i];
      });
      y += 20;
    });

    // Baris total
    const totalLabelWidth = colWidths.slice(0, 4).reduce((a, b) => a + b, 0);
    doc.rect(startX, y, totalLabelWidth, 20).stroke();
    doc.font("Helvetica-Bold")
       .text("Total", startX + 5, y + 5, { width: totalLabelWidth - 10, align: "right" });
    doc.rect(startX + totalLabelWidth, y, colWidths[4], 20).stroke();
    doc.text(
      Number(total).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
      startX + totalLabelWidth + 5,
      y + 5,
      { width: colWidths[4] - 10, align: "center" }
    );

    // Footer tanda tangan
    doc.moveDown(3);
    doc.fontSize(12).text("Disiapkan oleh,", startX, doc.y);
    doc.text("Disetujui,", startX + 300, doc.y);

    doc.end();
  } catch (err) {
    next(err);
  }
};

// API JSON
exports.apiList = async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    const [purchases] = await db.query(
      `SELECT * FROM inventory_purchases LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countRows] = await db.query(`SELECT COUNT(*) as cnt FROM inventory_purchases`);
    const total = countRows[0].cnt;
    const totalPages = Math.ceil(total / limit);

    res.json({
      purchases,
      pagination: {
        page: Number(page),
        limit,
        total,
        totalPages
      }
    });
  } catch (err) { next(err); }
};

// Ambil item dari procurement
exports.procurementItems = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [items] = await db.query(
      `SELECT pi.item_id, COALESCE(pi.item_name, i.name) as name, pi.quantity
       FROM inventory_procurement_items pi
       LEFT JOIN items i ON pi.item_id = i.id
       WHERE pi.inventory_procurement_id = ?
       ORDER BY pi.id ASC`,
      [id]
    );
    res.json({ items });
  } catch (err) { next(err); }
};

// Dashboard Statistik
async function safeCount(sql, params = []) {
  try {
    const [rows] = await db.query(sql, params);
    return rows[0] ? Number(rows[0].cnt) || 0 : 0;
  } catch (err) {
    console.warn(`[dashboard] statistik dilewati (${err.code || err.message}): ${sql}`);
    return 0;
  }
}

// Ambil baris dengan aman (kembalikan [] bila query gagal/tabel tak ada).
async function safeRows(sql, params = []) {
  try {
    const [rows] = await db.query(sql, params);
    return rows;
  } catch (err) {
    console.warn(`[dashboard] aktivitas dilewati (${err.code || err.message})`);
    return [];
  }
}

exports.dashboard = async (req, res, next) => {
  try {
    // Kartu statistik (berbasis alur permintaan/approval).
    const totalReq = await safeCount(`SELECT COUNT(*) as cnt FROM inventory_requests`);
    const pending = await safeCount(`SELECT COUNT(*) as cnt FROM inventory_requests WHERE status='pending'`);
    const approved = await safeCount(`SELECT COUNT(*) as cnt FROM inventory_requests WHERE status='approved'`);
    const rejected = await safeCount(`SELECT COUNT(*) as cnt FROM inventory_requests WHERE status='rejected'`);
    const totalPO = await safeCount(`SELECT COUNT(*) as cnt FROM inventory_purchases`);

    // 5 permintaan terbaru untuk tabel aktivitas.
    let recentRequests = [];
    try {
      const [rows] = await db.query(`
        SELECT p.id, p.request_number, p.status, p.created_at, e.name AS pemohon_name
        FROM inventory_requests p
        LEFT JOIN employees e ON p.employee_id = e.id
        ORDER BY p.created_at DESC
        LIMIT 5
      `);
      recentRequests = rows;
    } catch (err) {
      console.warn(`[dashboard] daftar terbaru dilewati (${err.code || err.message})`);
    }

    // Tren permintaan 6 bulan terakhir (selalu tampilkan 6 bulan, isi 0 bila kosong).
    const trendLabels = [];
    const trendData = [];
    try {
      const [rows] = await db.query(`
        SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS cnt
        FROM inventory_requests
        WHERE created_at >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 5 MONTH)
        GROUP BY ym
      `);
      const counts = {};
      rows.forEach(r => { counts[r.ym] = Number(r.cnt) || 0; });
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        trendLabels.push(monthNames[d.getMonth()]);
        trendData.push(counts[ym] || 0);
      }
    } catch (err) {
      console.warn(`[dashboard] tren dilewati (${err.code || err.message})`);
    }

    // ── Log Aktivitas (per-role) — dirangkai dari data yang ada, tanpa tabel log baru.
    const can = (p) => Array.isArray(req.session.permissions) && req.session.permissions.includes(p);
    const isApprover = can('manage_approval');
    const isOps = can('manage_procurement') || can('manage_po') || can('manage_receiving');
    const acts = [];
    const pushRows = (rows, mapFn) => rows.forEach((r) => { const e = mapFn(r); if (e && e.at) acts.push(e); });

    if (isApprover || isOps) {
      pushRows(await safeRows(
        `SELECT a.status, a.action_date AS at, r.request_number AS num
           FROM inventory_request_approvals a
           JOIN inventory_requests r ON r.id = a.inventory_request_id
          WHERE a.action_date IS NOT NULL
          ORDER BY a.action_date DESC LIMIT 8`),
        (r) => ({ at: r.at, kind: r.status === 'rejected' ? 'rejected' : 'approved',
                  text: r.status === 'rejected' ? `Permintaan ${r.num} ditolak` : `Permintaan ${r.num} disetujui` }));

      pushRows(await safeRows(
        `SELECT request_number AS num, created_at AS at FROM inventory_requests ORDER BY created_at DESC LIMIT 8`),
        (r) => ({ at: r.at, kind: 'info', text: `Permintaan ${r.num} diajukan` }));

      pushRows(await safeRows(
        `SELECT purchase_number AS num, status, approved_at AS at FROM inventory_purchases WHERE approved_at IS NOT NULL ORDER BY approved_at DESC LIMIT 8`),
        (r) => ({ at: r.at, kind: r.status === 'rejected' ? 'rejected' : 'approved',
                  text: r.status === 'rejected' ? `PO ${r.num} ditolak` : `PO ${r.num} disetujui` }));
    }
    if (isOps) {
      pushRows(await safeRows(
        `SELECT request_number AS num, created_at AS at FROM inventory_procurements ORDER BY created_at DESC LIMIT 8`),
        (r) => ({ at: r.at, kind: 'info', text: `Pengadaan ${r.num} dibuat` }));

      pushRows(await safeRows(
        `SELECT purchase_number AS num, updated_at AS at FROM inventory_purchases WHERE status='completed' ORDER BY updated_at DESC LIMIT 8`),
        (r) => ({ at: r.at, kind: 'done', text: `Penerimaan PO ${r.num} selesai` }));
    }

    const monthNamesA = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const activities = acts
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 8)
      .map((a) => {
        const d = new Date(a.at);
        const label = Number.isNaN(d.getTime())
          ? '-'
          : `${d.getDate()} ${monthNamesA[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        return { kind: a.kind, text: a.text, at_label: label };
      });

    res.render('dashboard', {
      title: 'Dashboard',
      user: req.session.username,
      totalReq,
      pending,
      approved,
      rejected,
      totalPO,
      recentRequests,
      activities,
      trendLabels: JSON.stringify(trendLabels),
      trendData: JSON.stringify(trendData)
    });
  } catch (err) { next(err); }
};
