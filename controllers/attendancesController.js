const db = require('../lib/db');
const exportAttendanceExcel = require('../utils/exportAttendanceExcel');

const index = async (req, res, next) => {
  const search = req.query.search || '';
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = 10;
  const offset = (page - 1) * limit;
  const keyword = `%${search}%`;

  try {
    const [countRows] = await db.query(`
      SELECT COUNT(*) AS total
      FROM event_attendances ea
      JOIN event_registrations er ON ea.event_registration_id = er.id
      JOIN events e ON er.event_id = e.id
      JOIN users u ON er.user_id = u.id
      WHERE e.title LIKE ?
        OR u.name LIKE ?
        OR u.email LIKE ?
        OR er.ticket_number LIKE ?
        OR ea.status LIKE ?
    `, [keyword, keyword, keyword, keyword, keyword]);

    const totalData = countRows[0].total;
    const totalPages = Math.ceil(totalData / limit) || 1;

    const [attendances] = await db.query(`
      SELECT
        ea.id,
        ea.checked_in_at,
        ea.checked_out_at,
        ea.attendance_method,
        ea.status,
        er.ticket_number,
        er.registration_number,
        e.title AS event_title,
        u.name AS participant_name,
        u.email AS participant_email
      FROM event_attendances ea
      JOIN event_registrations er ON ea.event_registration_id = er.id
      JOIN events e ON er.event_id = e.id
      JOIN users u ON er.user_id = u.id
      WHERE e.title LIKE ?
        OR u.name LIKE ?
        OR u.email LIKE ?
        OR er.ticket_number LIKE ?
        OR ea.status LIKE ?
      ORDER BY ea.checked_in_at DESC
      LIMIT ? OFFSET ?
    `, [keyword, keyword, keyword, keyword, keyword, limit, offset]);

    res.render('attendances/index', {
      title: 'Data Kehadiran Event',
      attendances,
      search,
      page,
      totalPages
    });
  } catch (err) {
    next(err);
  }
};

const recap = async (req, res, next) => {
  try {
    const [recaps] = await db.query(`
      SELECT
        e.id AS event_id,
        e.title AS event_title,
        COUNT(er.id) AS total_registered,
        SUM(CASE WHEN ea.status = 'present' THEN 1 ELSE 0 END) AS total_present,
        SUM(CASE WHEN ea.status = 'partial' THEN 1 ELSE 0 END) AS total_partial,
        SUM(CASE WHEN er.attendance_status = 'no_show' THEN 1 ELSE 0 END) AS total_no_show,
        SUM(CASE WHEN ea.id IS NULL AND er.attendance_status = 'registered' THEN 1 ELSE 0 END) AS total_not_checked_in
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id
      LEFT JOIN event_attendances ea ON er.id = ea.event_registration_id
      GROUP BY e.id, e.title
      ORDER BY e.start_date DESC
    `);

    res.render('attendances/recap', {
      title: 'Rekap Kehadiran Event',
      recaps
    });
  } catch (err) {
    next(err);
  }
};

const exportExcel = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT
        e.title AS event_title,
        u.name AS participant_name,
        u.email AS participant_email,
        er.registration_number,
        er.ticket_number,
        ea.status,
        ea.attendance_method,
        ea.checked_in_at,
        ea.checked_out_at
      FROM event_attendances ea
      JOIN event_registrations er ON ea.event_registration_id = er.id
      JOIN events e ON er.event_id = e.id
      JOIN users u ON er.user_id = u.id
      ORDER BY e.title ASC, ea.checked_in_at DESC
    `);

    return exportAttendanceExcel(res, rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
  recap,
  exportExcel
};