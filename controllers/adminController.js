const db = require('../lib/db');
const ExcelJS = require('exceljs');

function createSlug(text) {
  const baseSlug = String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const uniqueCode = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  return `${baseSlug || 'event'}-${uniqueCode}`;
}

async function getValidEmployeeId(req) {
  const candidateIds = [
    req.session?.employee?.id,
    req.session?.employeeId,
    req.session?.user?.employee_id,
    req.session?.user?.id,
    req.session?.userId
  ].filter(Boolean);

  for (const id of candidateIds) {
    const [rows] = await db.query(
      'SELECT id FROM employees WHERE id = ? LIMIT 1',
      [id]
    );

    if (rows.length > 0) {
      return rows[0].id;
    }
  }

  const [employees] = await db.query(
    'SELECT id FROM employees ORDER BY id ASC LIMIT 1'
  );

  if (employees.length > 0) {
    return employees[0].id;
  }

  throw new Error('Tidak ada data employees. Tambahkan minimal 1 data employee terlebih dahulu.');
}

exports.listEvents = async (req, res, next) => {
  try {
    const [events] = await db.query(
      `
        SELECT *
        FROM events
        WHERE COALESCE(status, '') != 'cancelled'
        ORDER BY id DESC
      `
    );

    res.render('admin/events', { events });
  } catch (err) {
    next(err);
  }
};

exports.addEvent = async (req, res, next) => {
  try {
    const eventName = (
      req.body.name ||
      req.body.title ||
      req.body.event_name ||
      req.body.nama_event ||
      ''
    ).trim();

    if (!eventName) {
      return res.redirect('/admin/events');
    }

    const employeeId = await getValidEmployeeId(req);
    const slug = createSlug(eventName);

    const today = new Date().toISOString().slice(0, 10);

    await db.query(
      `
        INSERT INTO events (
          title,
          slug,
          description,
          event_type,
          delivery_mode,
          start_date,
          end_date,
          status,
          created_by,
          created_by_id,
          published_by_id,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        eventName,
        slug,
        '',
        'seminar',
        'offline',
        today,
        today,
        'draft',
        employeeId,
        employeeId,
        employeeId
      ]
    );

    res.redirect('/admin/events');
  } catch (err) {
    next(err);
  }
};

exports.publishEvent = async (req, res, next) => {
  try {
    const employeeId = await getValidEmployeeId(req);

    await db.query(
      `
        UPDATE events
        SET
          status = 'published',
          published_by = ?,
          published_by_id = ?,
          published_at = NOW(),
          updated_at = NOW()
        WHERE id = ?
      `,
      [employeeId, employeeId, req.params.id]
    );

    res.redirect('/admin/events');
  } catch (err) {
    next(err);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    await db.query(
      `
        UPDATE events
        SET
          status = 'cancelled',
          updated_at = NOW()
        WHERE id = ?
      `,
      [req.params.id]
    );

    res.redirect('/admin/events');
  } catch (err) {
    next(err);
  }
};

exports.apiActiveEvents = async (req, res, next) => {
  try {
    const [events] = await db.query(
      `
        SELECT *
        FROM events
        WHERE COALESCE(status, '') != 'cancelled'
        ORDER BY id DESC
      `
    );

    res.json({
      message: 'Data event aktif',
      total: events.length,
      data: events
    });
  } catch (err) {
    next(err);
  }
};

exports.apiDeletedEvents = async (req, res, next) => {
  try {
    const [events] = await db.query(
      `
        SELECT *
        FROM events
        WHERE status = 'cancelled'
        ORDER BY id DESC
      `
    );

    res.json({
      message: 'Data event yang sudah dihapus',
      total: events.length,
      data: events
    });
  } catch (err) {
    next(err);
  }
};

exports.apiCommittee = async (req, res, next) => {
  try {
    const [data] = await db.query(
      'SELECT * FROM committee WHERE event_id = ?',
      [req.params.id]
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.exportExcel = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM committee WHERE event_id = ?',
      [req.params.id]
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Panitia');

    sheet.columns = [
      { header: 'Nama', key: 'name', width: 30 },
      { header: 'Role', key: 'role', width: 20 }
    ];

    sheet.addRows(rows);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=panitia.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};