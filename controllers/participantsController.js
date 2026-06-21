const db = require("../lib/db");

const index = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const keyword = `%${search}%`;

    const [countRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      JOIN events e ON er.event_id = e.id
      WHERE 
        u.name LIKE ? OR
        u.email LIKE ? OR
        e.title LIKE ? OR
        er.registration_number LIKE ? OR
        er.ticket_number LIKE ?
      `,
      [keyword, keyword, keyword, keyword, keyword]
    );

    const totalData = countRows[0].total;
    const totalPages = Math.ceil(totalData / limit);

    const [participants] = await db.query(
      `
      SELECT
        er.id,
        er.registration_number,
        er.ticket_number,
        er.attendance_status,
        er.registered_at,
        er.certificate_number,
        u.name AS participant_name,
        u.email AS participant_email,
        e.title AS event_title,
        e.start_date,
        e.end_date,
        ea.status AS checkin_status
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      JOIN events e ON er.event_id = e.id
      LEFT JOIN event_attendances ea ON ea.event_registration_id = er.id
      WHERE 
        u.name LIKE ? OR
        u.email LIKE ? OR
        e.title LIKE ? OR
        er.registration_number LIKE ? OR
        er.ticket_number LIKE ?
      ORDER BY er.registered_at DESC
      LIMIT ? OFFSET ?
      `,
      [keyword, keyword, keyword, keyword, keyword, limit, offset]
    );

    res.render("participants/index", {
      title: "Daftar Peserta Event",
      participants,
      search,
      page,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
};

const detail = async (req, res, next) => {
  try {
    const id = req.params.id;

    const [rows] = await db.query(
      `
      SELECT
        er.id,
        er.registration_number,
        er.ticket_number,
        er.attendance_status,
        er.notes,
        er.registered_at,
        er.certificate_number,
        er.file_path,
        er.generated_at,
        u.name AS participant_name,
        u.email AS participant_email,
        e.title AS event_title,
        e.description AS event_description,
        e.event_type,
        e.delivery_mode,
        e.start_date,
        e.end_date,
        e.start_time,
        e.end_time,
        e.venue,
        ea.status AS checkin_status,
        ea.checked_in_at,
        ea.checked_out_at
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      JOIN events e ON er.event_id = e.id
      LEFT JOIN event_attendances ea ON ea.event_registration_id = er.id
      WHERE er.id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).render("error", {
        message: "Data peserta tidak ditemukan",
        error: { status: 404, stack: "" },
      });
    }

    res.render("participants/detail", {
      title: "Detail Peserta",
      participant: rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { attendance_status } = req.body;

    const allowedStatus = ["registered", "attended", "no_show", "cancelled"];

    if (!allowedStatus.includes(attendance_status)) {
      return res.status(400).render("error", {
        message: "Status pendaftaran tidak valid",
        error: { status: 400, stack: "" },
      });
    }

    await db.query(
      `
      UPDATE event_registrations
      SET attendance_status = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [attendance_status, id]
    );

    res.redirect(`/participants/${id}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
  detail,
  updateStatus,
};