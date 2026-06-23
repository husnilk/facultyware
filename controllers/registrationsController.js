const db = require('../lib/db');
const crypto = require('crypto');

// Halaman katalog event untuk user
exports.index = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;
    const search = req.query.q || '';

    let query = 'SELECT * FROM events WHERE status = "published"';
    const queryParams = [];

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM (${query}) as subquery`,
      queryParams
    );

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    query += ' ORDER BY start_date DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [events] = await db.query(query, queryParams);

    res.render('registrations/index', {
      events,
      title: 'Katalog Event',
      user: req.session.username,
      currentPage: page,
      totalPages,
      searchQuery: search
    });
  } catch (err) {
    next(err);
  }
};

// Halaman detail event
exports.detail = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM events WHERE id = ? AND status = "published"',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).render('error', {
        message: 'Event tidak ditemukan atau belum dipublish',
        error: { status: 404 }
      });
    }

    const event = rows[0];

    let isRegistered = false;

    if (req.session.userId) {
      const [regRows] = await db.query(
        'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?',
        [event.id, req.session.userId]
      );

      if (regRows.length > 0) {
        isRegistered = true;
      }
    }

    res.render('registrations/detail', {
      event,
      isRegistered,
      title: event.title,
      user: req.session.username,
      email: req.session.email
    });
  } catch (err) {
    next(err);
  }
};

// Form pendaftaran
exports.form = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/login');
    }

    const [rows] = await db.query(
      'SELECT * FROM events WHERE id = ? AND status = "published"',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).render('error', {
        message: 'Event tidak ditemukan',
        error: { status: 404 }
      });
    }

    const event = rows[0];

    const [regRows] = await db.query(
      'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?',
      [event.id, req.session.userId]
    );

    if (regRows.length > 0) {
      return res.redirect(`/tickets/${regRows[0].ticket_number}`);
    }

    res.render('registrations/form', {
      event,
      title: `Daftar - ${event.title}`,
      user: req.session.username,
      email: req.session.email
    });
  } catch (err) {
    next(err);
  }
};

// Proses pendaftaran
exports.store = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    if (!userId) {
      return res.redirect('/login');
    }

    const {
      full_name,
      address,
      email,
      phone,
      notes
    } = req.body;

    const [events] = await db.query(
      'SELECT * FROM events WHERE id = ? AND status = "published"',
      [id]
    );

    if (events.length === 0) {
      return res.status(404).render('error', {
        message: 'Event tidak ditemukan',
        error: { status: 404 }
      });
    }

    const [existing] = await db.query(
      'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length > 0) {
      return res.redirect(`/tickets/${existing[0].ticket_number}`);
    }

    const regNumber = `REG-${Date.now()}-${userId}-${id}`;
    const ticketNumber = `TIX-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const [tableColumns] = await db.query('SHOW COLUMNS FROM event_registrations');
    const availableColumns = new Set(tableColumns.map((column) => column.Field));

    const insertColumns = [];
    const placeholders = [];
    const values = [];

    const addValue = (column, value) => {
      if (availableColumns.has(column)) {
        insertColumns.push(column);
        placeholders.push('?');
        values.push(value);
      }
    };

    const addNow = (column) => {
      if (availableColumns.has(column)) {
        insertColumns.push(column);
        placeholders.push('NOW()');
      }
    };

    addValue('event_id', id);
    addValue('user_id', userId);
    addValue('registration_number', regNumber);
    addNow('registered_at');
    addValue('attendance_status', 'registered');

    // Kolom ini hanya dimasukkan kalau memang ada di database.
    // Jadi tidak akan error Unknown column lagi.
    addValue('full_name', full_name || '');
    addValue('address', address || '');
    addValue('email', email || req.session.email || '');
    addValue('phone', phone || '');
    addValue('notes', notes || '');

    addValue('ticket_number', ticketNumber);
    addNow('issued_at');

    await db.query(
      `
        INSERT INTO event_registrations (${insertColumns.join(', ')})
        VALUES (${placeholders.join(', ')})
      `,
      values
    );

    res.redirect(`/tickets/${ticketNumber}`);
  } catch (err) {
    next(err);
  }
};