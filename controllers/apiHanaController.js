const db = require("../lib/db");

const participants = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        er.id,
        er.registration_number,
        er.ticket_number,
        er.attendance_status,
        er.certificate_number,
        u.name AS participant_name,
        u.email AS participant_email,
        e.title AS event_title,
        ea.status AS checkin_status
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      JOIN events e ON er.event_id = e.id
      LEFT JOIN event_attendances ea ON ea.event_registration_id = er.id
      ORDER BY er.registered_at DESC
      `
    );

    res.json({
      success: true,
      message: "Data peserta berhasil diambil",
      data: rows,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data peserta",
      error: err.message,
    });
  }
};

const participantDetail = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        er.id,
        er.registration_number,
        er.ticket_number,
        er.attendance_status,
        er.certificate_number,
        u.name AS participant_name,
        u.email AS participant_email,
        e.title AS event_title,
        ea.status AS checkin_status
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      JOIN events e ON er.event_id = e.id
      LEFT JOIN event_attendances ea ON ea.event_registration_id = er.id
      WHERE er.id = ?
      `,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data peserta tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Detail peserta berhasil diambil",
      data: rows[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail peserta",
      error: err.message,
    });
  }
};

const certificates = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        er.id,
        er.registration_number,
        er.certificate_number,
        er.generated_at,
        u.name AS participant_name,
        u.email AS participant_email,
        e.title AS event_title
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      JOIN events e ON er.event_id = e.id
      LEFT JOIN event_attendances ea ON ea.event_registration_id = er.id
      WHERE er.attendance_status = 'attended' OR ea.status = 'present'
      ORDER BY er.generated_at DESC
      `
    );

    res.json({
      success: true,
      message: "Data sertifikat berhasil diambil",
      data: rows,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data sertifikat",
      error: err.message,
    });
  }
};

const reports = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        ed.id,
        ed.title,
        ed.document_type,
        ed.file_path,
        ed.description,
        ed.uploaded_at,
        e.title AS event_title
      FROM event_documents ed
      JOIN events e ON ed.event_id = e.id
      ORDER BY ed.uploaded_at DESC
      `
    );

    res.json({
      success: true,
      message: "Data laporan kegiatan berhasil diambil",
      data: rows,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data laporan kegiatan",
      error: err.message,
    });
  }
};

module.exports = {
  participants,
  participantDetail,
  certificates,
  reports,
};