const db = require('../lib/db');

const index = async (req, res) => {
  res.render('checkins/index', {
    title: 'Check-in Peserta',
    success: null,
    error: null,
    result: null,
    form: {}
  });
};

const process = async (req, res, next) => {
  const { ticket_number, attendance_method } = req.body;
  const checkedBy = req.session.userId;
  const method = attendance_method || 'manual';

  try {
    if (!ticket_number || ticket_number.trim() === '') {
      return res.render('checkins/index', {
        title: 'Check-in Peserta',
        success: null,
        error: 'Ticket number wajib diisi.',
        result: null,
        form: req.body
      });
    }

    if (!['manual', 'qr_scan', 'system'].includes(method)) {
      return res.render('checkins/index', {
        title: 'Check-in Peserta',
        success: null,
        error: 'Metode check-in tidak valid.',
        result: null,
        form: req.body
      });
    }

    const [registrations] = await db.query(`
      SELECT
        er.id AS registration_id,
        er.ticket_number,
        er.attendance_status,
        er.registration_number,
        e.title AS event_title,
        u.name AS participant_name,
        u.email AS participant_email
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      JOIN users u ON er.user_id = u.id
      WHERE er.ticket_number = ?
      LIMIT 1
    `, [ticket_number.trim()]);

    if (registrations.length === 0) {
      return res.render('checkins/index', {
        title: 'Check-in Peserta',
        success: null,
        error: 'Ticket number tidak ditemukan.',
        result: null,
        form: req.body
      });
    }

    const registration = registrations[0];

    if (registration.attendance_status === 'cancelled') {
      return res.render('checkins/index', {
        title: 'Check-in Peserta',
        success: null,
        error: 'Registrasi peserta sudah dibatalkan.',
        result: registration,
        form: req.body
      });
    }

    const [existing] = await db.query(`
      SELECT id
      FROM event_attendances
      WHERE event_registration_id = ?
      LIMIT 1
    `, [registration.registration_id]);

    if (existing.length > 0) {
      return res.render('checkins/index', {
        title: 'Check-in Peserta',
        success: null,
        error: 'Peserta ini sudah melakukan check-in sebelumnya.',
        result: registration,
        form: req.body
      });
    }

    await db.query(`
      INSERT INTO event_attendances
        (event_registration_id, checked_in_at, checked_by, attendance_method, status, checked_by_id, created_at, updated_at)
      VALUES
        (?, NOW(), ?, ?, 'present', ?, NOW(), NOW())
    `, [registration.registration_id, checkedBy, method, checkedBy]);

    await db.query(`
      UPDATE event_registrations
      SET attendance_status = 'attended', updated_at = NOW()
      WHERE id = ?
    `, [registration.registration_id]);

    return res.render('checkins/index', {
      title: 'Check-in Peserta',
      success: 'Check-in peserta berhasil dicatat.',
      error: null,
      result: registration,
      form: {}
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
  process
};