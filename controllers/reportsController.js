const db = require("../lib/db");

const index = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const keyword = `%${search}%`;

    const [reports] = await db.query(
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
      WHERE 
        ed.title LIKE ? OR
        e.title LIKE ? OR
        ed.document_type LIKE ?
      ORDER BY ed.uploaded_at DESC
      `,
      [keyword, keyword, keyword]
    );

    res.render("reports/index", {
      title: "Laporan Kegiatan",
      reports,
      search,
    });
  } catch (err) {
    next(err);
  }
};

const uploadPage = async (req, res, next) => {
  try {
    const [events] = await db.query(
      `
      SELECT id, title
      FROM events
      ORDER BY start_date DESC
      `
    );

    res.render("reports/upload", {
      title: "Upload Laporan Kegiatan",
      events,
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

const store = async (req, res, next) => {
  try {
    const { event_id, title, description, document_type } = req.body;

    if (!event_id || !title || !document_type) {
      const [events] = await db.query("SELECT id, title FROM events ORDER BY start_date DESC");

      return res.status(400).render("reports/upload", {
        title: "Upload Laporan Kegiatan",
        events,
        error: "Event, judul laporan, dan jenis dokumen wajib diisi.",
      });
    }

    if (!req.file) {
      const [events] = await db.query("SELECT id, title FROM events ORDER BY start_date DESC");

      return res.status(400).render("reports/upload", {
        title: "Upload Laporan Kegiatan",
        events,
        error: "File laporan wajib diunggah.",
      });
    }

    const [employees] = await db.query("SELECT id FROM employees ORDER BY id ASC LIMIT 1");

    if (employees.length === 0) {
      const [events] = await db.query("SELECT id, title FROM events ORDER BY start_date DESC");

      return res.status(400).render("reports/upload", {
        title: "Upload Laporan Kegiatan",
        events,
        error: "Belum ada data employee untuk kolom uploaded_by. Tambahkan data employee terlebih dahulu.",
      });
    }

    const uploadedBy = req.session.userId || employees[0].id;
    const filePath = `/uploads/reports/${req.file.filename}`;

    await db.query(
      `
      INSERT INTO event_documents
      (event_id, title, document_type, file_path, description, uploaded_by, uploaded_at, uploaded_by_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), NOW())
      `,
      [
        event_id,
        title,
        document_type,
        filePath,
        description || null,
        uploadedBy,
        uploadedBy,
      ]
    );

    res.redirect("/reports");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
  uploadPage,
  store,
};