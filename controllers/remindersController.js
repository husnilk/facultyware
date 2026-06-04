const db = require('../lib/db');

const allowedChannels = ['email', 'whatsapp', 'sms', 'system'];

const index = async (req, res, next) => {
  try {
    const [events] = await db.query(`
      SELECT id, title, start_date, end_date, status
      FROM events
      WHERE status = 'published'
      ORDER BY start_date ASC
    `);

    res.render('reminders/index', {
      title: 'Kirim Reminder Event',
      events,
      success: null,
      error: null,
      form: {}
    });
  } catch (err) {
    next(err);
  }
};

const send = async (req, res, next) => {
  const { event_id, channel, message } = req.body;
  const sentBy = req.session.userId;

  try {
    const [events] = await db.query(`
      SELECT id, title, start_date, end_date, status
      FROM events
      WHERE status = 'published'
      ORDER BY start_date ASC
    `);

    if (!event_id || !channel || !message || message.trim() === '') {
      return res.render('reminders/index', {
        title: 'Kirim Reminder Event',
        events,
        success: null,
        error: 'Event, channel, dan pesan reminder wajib diisi.',
        form: req.body
      });
    }

    if (!allowedChannels.includes(channel)) {
      return res.render('reminders/index', {
        title: 'Kirim Reminder Event',
        events,
        success: null,
        error: 'Channel reminder tidak valid.',
        form: req.body
      });
    }

    const [eventRows] = await db.query(
      `SELECT id FROM events WHERE id = ? AND status = 'published'`,
      [event_id]
    );

    if (eventRows.length === 0) {
      return res.render('reminders/index', {
        title: 'Kirim Reminder Event',
        events,
        success: null,
        error: 'Event tidak ditemukan atau belum dipublikasikan.',
        form: req.body
      });
    }

    const [participants] = await db.query(`
      SELECT id
      FROM event_registrations
      WHERE event_id = ?
      AND attendance_status <> 'cancelled'
    `, [event_id]);

    if (participants.length === 0) {
      return res.render('reminders/index', {
        title: 'Kirim Reminder Event',
        events,
        success: null,
        error: 'Belum ada peserta terdaftar pada event ini.',
        form: req.body
      });
    }

    await db.query(`
      INSERT INTO event_reminders
        (event_id, sent_by, channel, message, sent_at, sent_by_id, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, NOW(), ?, NOW(), NOW())
    `, [event_id, sentBy, channel, message.trim(), sentBy]);

    res.render('reminders/index', {
      title: 'Kirim Reminder Event',
      events,
      success: `Reminder berhasil dicatat untuk ${participants.length} peserta.`,
      error: null,
      form: {}
    });
  } catch (err) {
    next(err);
  }
};

const history = async (req, res, next) => {
  const search = req.query.search || '';
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = 10;
  const offset = (page - 1) * limit;
  const keyword = `%${search}%`;

  try {
    const [countRows] = await db.query(`
      SELECT COUNT(*) AS total
      FROM event_reminders er
      JOIN events e ON er.event_id = e.id
      LEFT JOIN employees emp ON er.sent_by = emp.id
      WHERE e.title LIKE ? OR er.message LIKE ? OR er.channel LIKE ?
    `, [keyword, keyword, keyword]);

    const totalData = countRows[0].total;
    const totalPages = Math.ceil(totalData / limit) || 1;

    const [reminders] = await db.query(`
      SELECT
        er.id,
        er.channel,
        er.message,
        er.sent_at,
        e.title AS event_title,
        emp.name AS sender_name
      FROM event_reminders er
      JOIN events e ON er.event_id = e.id
      LEFT JOIN employees emp ON er.sent_by = emp.id
      WHERE e.title LIKE ? OR er.message LIKE ? OR er.channel LIKE ?
      ORDER BY er.sent_at DESC
      LIMIT ? OFFSET ?
    `, [keyword, keyword, keyword, limit, offset]);

    res.render('reminders/history', {
      title: 'Riwayat Reminder',
      reminders,
      search,
      page,
      totalPages
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
  send,
  history
};