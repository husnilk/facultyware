const db = require("../lib/db");

const index = async (req, res, next) => {
  try {
    const [participants] = await db.query(
      `
      SELECT
        er.id,
        er.registration_number,
        er.ticket_number,
        er.attendance_status,
        er.certificate_number,
        er.generated_at,
        u.name AS participant_name,
        u.email AS participant_email,
        e.title AS event_title,
        e.start_date,
        ea.status AS checkin_status
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      JOIN events e ON er.event_id = e.id
      LEFT JOIN event_attendances ea ON ea.event_registration_id = er.id
      WHERE er.attendance_status = 'attended' OR ea.status = 'present'
      ORDER BY e.start_date DESC
      `
    );

    res.render("certificates/index", {
      title: "Sertifikat Peserta",
      participants,
    });
  } catch (err) {
    next(err);
  }
};

const show = async (req, res, next) => {
  try {
    const id = req.params.id;

    const [rows] = await db.query(
      `
      SELECT
        er.id,
        er.registration_number,
        er.ticket_number,
        er.attendance_status,
        er.certificate_number,
        er.file_path,
        er.generated_at,
        u.name AS participant_name,
        u.email AS participant_email,
        e.title AS event_title,
        e.start_date,
        e.end_date,
        e.venue,
        ea.status AS checkin_status
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
        message: "Data sertifikat tidak ditemukan",
        error: { status: 404, stack: "" },
      });
    }

    const participant = rows[0];

    const isEligible =
      participant.attendance_status === "attended" ||
      participant.checkin_status === "present";

    if (!isEligible) {
      return res.status(400).render("error", {
        message: "Peserta belum memenuhi syarat untuk mendapatkan sertifikat",
        error: { status: 400, stack: "" },
      });
    }

    if (!participant.certificate_number) {
      const certificateNumber = `CERT-${participant.id}-${Date.now()}`;

      await db.query(
        `
        UPDATE event_registrations
        SET certificate_number = ?, generated_at = NOW(), file_path = ?
        WHERE id = ?
        `,
        [certificateNumber, `/certificates/${certificateNumber}`, id]
      );

      participant.certificate_number = certificateNumber;
      participant.generated_at = new Date();
    }

    res.render("certificates/show", {
      title: "Cetak Sertifikat",
      participant,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
  show,
};