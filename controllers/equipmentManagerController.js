const db = require('../lib/db');
const PDFDocument = require('pdfkit');

// Helper: build WHERE clause from filters
function buildFilters(query) {
  const conditions = [];
  const params = [];

  if (query.search) {
    conditions.push('(a.name LIKE ? OR a.code LIKE ? OR u.name LIKE ?)');
    const like = `%${query.search}%`;
    params.push(like, like, like);
  }

  if (query.status) {
    conditions.push('el.status = ?');
    params.push(query.status);
  }

  if (query.date_from) {
    conditions.push('el.start_date >= ?');
    params.push(query.date_from);
  }

  if (query.date_to) {
    conditions.push('el.start_date <= ?');
    params.push(query.date_to);
  }

  return { conditions, params };
}

// Base SELECT for loan history
const BASE_SELECT = `
  SELECT 
    el.id,
    el.status,
    el.start_date,
    el.end_date,
    el.created_at,
    a.name  AS equipment_name,
    a.code  AS asset_code,
    u.name  AS employee_name
  FROM equipment_loans el
  JOIN equipments eq  ON el.equipment_id = eq.id
  JOIN assets a       ON eq.asset_id = a.id
  JOIN users u        ON el.employee_id = u.id
`;

// ─────────────────────────────────────────────
// 1. Dashboard – peminjaman yang sedang berlangsung (status: requested, approved)
// ─────────────────────────────────────────────
const ongoing = async (req, res, next) => {
  try {
    const { conditions, params } = buildFilters(req.query);
    const statusFilter = 'el.status IN ("requested", "approved")';
    const allConditions = conditions.length ? [statusFilter, ...conditions] : [statusFilter];
    const where = 'WHERE ' + allConditions.join(' AND ');

    const [rows] = await db.query(
      `${BASE_SELECT} ${where} ORDER BY el.created_at DESC`,
      params
    );

    res.render('manager/ongoing', {
      title: 'Peminjaman yang Sedang Berlangsung',
      data: rows,
      filters: req.query,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 1B. Dashboard – riwayat peminjaman (status: rejected, returned)
// ─────────────────────────────────────────────
const index = async (req, res, next) => {
  try {
    const { conditions, params } = buildFilters(req.query);
    const statusFilter = 'el.status IN ("rejected", "returned")';
    const allConditions = conditions.length ? [statusFilter, ...conditions] : [statusFilter];
    const where = 'WHERE ' + allConditions.join(' AND ');

    const [rows] = await db.query(
      `${BASE_SELECT} ${where} ORDER BY el.created_at DESC`,
      params
    );

    res.render('manager/index', {
      title: 'Riwayat Peminjaman',
      data: rows,
      filters: req.query,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 2. Detail peminjaman
// ─────────────────────────────────────────────
const detail = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `${BASE_SELECT} WHERE el.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) return res.status(404).render('error', {
      message: 'Data peminjaman tidak ditemukan.',
      error: { status: 404, stack: '' },
    });

    res.render('manager/detail', {
      title: 'Detail Peminjaman',
      loan: rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 3. Preview laporan (HTML, sebelum export PDF)
//    Hanya menampilkan status: rejected & returned
// ─────────────────────────────────────────────
const previewReport = async (req, res, next) => {
  try {
    const { conditions, params } = buildFilters(req.query);
    // Paksa hanya rejected dan returned
    conditions.push("el.status IN ('rejected', 'returned')");
    const where = 'WHERE ' + conditions.join(' AND ');

    const [rows] = await db.query(
      `${BASE_SELECT} ${where} ORDER BY el.created_at DESC`,
      params
    );

    res.render('manager/report-preview', {
      title: 'Preview Laporan',
      data: rows,
      filters: req.query,
      generatedAt: new Date().toLocaleString('id-ID'),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 4. Export PDF
//    Hanya menampilkan status: rejected & returned
// ─────────────────────────────────────────────
const exportPDF = async (req, res, next) => {
  try {
    const { conditions, params } = buildFilters(req.query);
    // Paksa hanya rejected dan returned
    conditions.push("el.status IN ('rejected', 'returned')");
    const where = 'WHERE ' + conditions.join(' AND ');

    const [rows] = await db.query(
      `${BASE_SELECT} ${where} ORDER BY el.created_at DESC`,
      params
    );

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="laporan-peminjaman-${Date.now()}.pdf"`
    );
    doc.pipe(res);

    // ── Header ──
    doc.fontSize(16).font('Helvetica-Bold').text('SIMPEL – Laporan Riwayat Peminjaman', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(
      `Dicetak pada: ${new Date().toLocaleString('id-ID')}`,
      { align: 'center' }
    );

    // Active filters summary
    const filterParts = [];
    if (req.query.search)    filterParts.push(`Pencarian: "${req.query.search}"`);
    if (req.query.status)    filterParts.push(`Status: ${req.query.status}`);
    if (req.query.date_from) filterParts.push(`Dari: ${req.query.date_from}`);
    if (req.query.date_to)   filterParts.push(`Sampai: ${req.query.date_to}`);
    if (filterParts.length) {
      doc.moveDown(0.5).fontSize(9).text('Filter: ' + filterParts.join(' | '), { align: 'center' });
    }

    doc.moveDown(1);

    // ── Table header ──
    const colX   = [40, 130, 250, 340, 420, 500];
    const colW   = [85, 115, 85, 75, 75, 65];
    const rowH   = 20;
    const headers = ['Kode Aset', 'Nama Peralatan', 'Peminjam', 'Tgl Mulai', 'Tgl Selesai', 'Status'];

    const drawRow = (y, cells, isHeader = false) => {
      if (isHeader) {
        doc.rect(colX[0], y, colX[colX.length - 1] + colW[colW.length - 1] - colX[0], rowH)
           .fill('#e2e8f0');
        doc.fillColor('black');
      }
      cells.forEach((text, i) => {
        doc.rect(colX[i], y, colW[i], rowH).stroke();
        doc
          .fontSize(isHeader ? 8 : 7.5)
          .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor('black')
          .text(String(text ?? '-'), colX[i] + 3, y + 5, {
            width: colW[i] - 6,
            ellipsis: true,
            lineBreak: false,
          });
      });
    };

    let y = doc.y;
    drawRow(y, headers, true);
    y += rowH;

    const statusLabel = {
      requested: 'Diminta',
      approved:  'Disetujui',
      returned:  'Dikembalikan',
      rejected:  'Ditolak',
    };

    rows.forEach((item) => {
      if (y + rowH > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
        drawRow(y, headers, true);
        y += rowH;
      }
      drawRow(y, [
        item.asset_code,
        item.equipment_name,
        item.employee_name,
        item.start_date ? new Date(item.start_date).toLocaleDateString('id-ID') : '-',
        item.end_date   ? new Date(item.end_date).toLocaleDateString('id-ID')   : '-',
        statusLabel[item.status] ?? item.status,
      ]);
      y += rowH;
    });

    // ── Summary ──
    doc.moveDown(2).fontSize(9).font('Helvetica')
       .text(`Total data: ${rows.length} peminjaman`, { align: 'right' });

    doc.end();
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 4B. Export PDF (Peminjaman yang Sedang Berlangsung)
// ─────────────────────────────────────────────
const exportOngoingPDF = async (req, res, next) => {
  try {
    const { conditions, params } = buildFilters(req.query);
    const statusFilter = 'el.status IN ("requested", "approved")';
    const allConditions = conditions.length ? [statusFilter, ...conditions] : [statusFilter];
    const where = 'WHERE ' + allConditions.join(' AND ');

    const [rows] = await db.query(
      `${BASE_SELECT} ${where} ORDER BY el.created_at DESC`,
      params
    );

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="peminjaman-berlangsung-${Date.now()}.pdf"`
    );
    doc.pipe(res);

    // ── Header ──
    doc.fontSize(16).font('Helvetica-Bold').text('SIMPEL – Laporan Peminjaman yang Sedang Berlangsung', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(
      `Dicetak pada: ${new Date().toLocaleString('id-ID')}`,
      { align: 'center' }
    );

    // Active filters summary
    const filterParts = [];
    if (req.query.search)    filterParts.push(`Pencarian: "${req.query.search}"`);
    if (req.query.status)    filterParts.push(`Status: ${req.query.status}`);
    if (req.query.date_from) filterParts.push(`Dari: ${req.query.date_from}`);
    if (req.query.date_to)   filterParts.push(`Sampai: ${req.query.date_to}`);
    if (filterParts.length) {
      doc.moveDown(0.5).fontSize(9).text('Filter: ' + filterParts.join(' | '), { align: 'center' });
    }

    doc.moveDown(1);

    // ── Table header ──
    const colX   = [40, 130, 250, 340, 420, 500];
    const colW   = [85, 115, 85, 75, 75, 65];
    const rowH   = 20;
    const headers = ['Kode Aset', 'Nama Peralatan', 'Peminjam', 'Tgl Mulai', 'Tgl Selesai', 'Status'];

    const drawRow = (y, cells, isHeader = false) => {
      if (isHeader) {
        doc.rect(colX[0], y, colX[colX.length - 1] + colW[colW.length - 1] - colX[0], rowH)
           .fill('#e2e8f0');
        doc.fillColor('black');
      }
      cells.forEach((text, i) => {
        doc.rect(colX[i], y, colW[i], rowH).stroke();
        doc
          .fontSize(isHeader ? 8 : 7.5)
          .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor('black')
          .text(String(text ?? '-'), colX[i] + 3, y + 5, {
            width: colW[i] - 6,
            ellipsis: true,
            lineBreak: false,
          });
      });
    };

    let y = doc.y;
    drawRow(y, headers, true);
    y += rowH;

    const statusLabel = {
      requested: 'Diminta',
      approved:  'Disetujui',
      returned:  'Dikembalikan',
      rejected:  'Ditolak',
    };

    rows.forEach((item) => {
      if (y + rowH > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
        drawRow(y, headers, true);
        y += rowH;
      }
      drawRow(y, [
        item.asset_code,
        item.equipment_name,
        item.employee_name,
        item.start_date ? new Date(item.start_date).toLocaleDateString('id-ID') : '-',
        item.end_date   ? new Date(item.end_date).toLocaleDateString('id-ID')   : '-',
        statusLabel[item.status] ?? item.status,
      ]);
      y += rowH;
    });

    // ── Summary ──
    doc.moveDown(2).fontSize(9).font('Helvetica')
       .text(`Total data: ${rows.length} peminjaman`, { align: 'right' });

    doc.end();
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 5. API – total peminjaman selesai (returned + rejected)
// ─────────────────────────────────────────────
const apiTotalLoans = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM equipment_loans WHERE status IN ('returned', 'rejected')`
    );
    res.json({ total: rows[0].total });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 5B. API – jumlah peminjaman dengan status 'requested'
// ─────────────────────────────────────────────
const apiRequestedLoans = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM equipment_loans WHERE status = 'requested'`
    );
    res.json({ total: rows[0].total });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 6. API – peminjaman dibatalkan (rejected)
// ─────────────────────────────────────────────
const apiUnreturnedLoans = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM equipment_loans WHERE status = 'rejected'`
    );
    res.json({ total: rows[0].total });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 7. Approve a single loan (Penanggung Jawab)
// ─────────────────────────────────────────────
const approveLoan = async (req, res, next) => {
  try {
    const loanId = req.params.id;

    await db.query(
      `UPDATE equipment_loans SET status = 'approved', updated_at = NOW() WHERE id = ? AND status = 'requested'`,
      [loanId]
    );

    res.redirect(req.get('referer') || '/manager/ongoing');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 7B. Return a single loan (tandai dikembalikan)
// ─────────────────────────────────────────────
const returnLoan = async (req, res, next) => {
  try {
    const loanId = req.params.id;

    await db.query(
      `UPDATE equipment_loans SET status = 'returned', updated_at = NOW() WHERE id = ? AND status = 'approved'`,
      [loanId]
    );

    res.redirect('/manager/ongoing');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 8. Reject a single loan (Penanggung Jawab)
// ─────────────────────────────────────────────
const rejectLoan = async (req, res, next) => {
  try {
    const loanId = req.params.id;

    await db.query(
      `UPDATE equipment_loans SET status = 'rejected', updated_at = NOW() WHERE id = ? AND status IN ('requested','approved')`,
      [loanId]
    );

    res.redirect(req.get('referer') || '/manager/ongoing');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 8. Cancel multiple loans (bulk) — set status to 'rejected'
// ─────────────────────────────────────────────
const cancelLoans = async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body['ids[]']) ? req.body['ids[]'] : (req.body.ids || []);
    if (!ids || ids.length === 0) return res.redirect(req.get('referer') || '/manager');

    await db.query(
      `UPDATE equipment_loans SET status = 'rejected', updated_at = NOW() WHERE id IN (?) AND status IN ('requested','approved')`,
      [ids]
    );

    res.redirect(req.get('referer') || '/manager/ongoing');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 9. Export CSV (Status Peminjaman Peralatan)
// ─────────────────────────────────────────────
const exportCSV = async (req, res, next) => {
  try {
    const { conditions, params } = buildFilters(req.query);
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await db.query(
      `${BASE_SELECT} ${where} ORDER BY el.created_at DESC`,
      params
    );

    const statusLabel = {
      requested: 'Diminta',
      approved:  'Disetujui',
      returned:  'Dikembalikan',
      rejected:  'Ditolak',
    };

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="status-peminjaman-${Date.now()}.csv"`);

    const escape = (v) => {
      if (v === null || v === undefined) return '';
      return `"${String(v).replace(/"/g, '""')}"`;
    };

    // CSV header
    let csv = ['Kode Aset', 'Nama Peralatan', 'Peminjam', 'Tgl Mulai', 'Tgl Selesai', 'Status', 'Dibuat Pada'].join(',') + '\n';

    rows.forEach((item) => {
      const line = [
        escape(item.asset_code),
        escape(item.equipment_name),
        escape(item.employee_name),
        escape(item.start_date ? new Date(item.start_date).toLocaleDateString('id-ID') : ''),
        escape(item.end_date ? new Date(item.end_date).toLocaleDateString('id-ID') : ''),
        escape(statusLabel[item.status] || item.status),
        escape(item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '')
      ].join(',');
      csv += line + '\n';
    });

    res.send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
  ongoing,
  detail,
  previewReport,
  exportPDF,
  exportOngoingPDF,
  apiTotalLoans,
  apiRequestedLoans,
  apiUnreturnedLoans,
  approveLoan,
  returnLoan,
  rejectLoan,
  cancelLoans,
  exportCSV,
};
