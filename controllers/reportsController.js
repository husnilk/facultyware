const db = require("../lib/db");
const path = require("path");
const fs = require("fs");

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

const getValidEmployeeId = async (req) => {
  if (req.session.employeeId) {
    return req.session.employeeId;
  }

  if (req.session.userId) {
    const [employeeRows] = await db.query(
      `
      SELECT id
      FROM employees
      WHERE id = ?
      LIMIT 1
      `,
      [req.session.userId]
    );

    if (employeeRows.length > 0) {
      req.session.employeeId = employeeRows[0].id;
      return employeeRows[0].id;
    }
  }

  const [employees] = await db.query(
    `
    SELECT id
    FROM employees
    ORDER BY id ASC
    LIMIT 1
    `
  );

  if (employees.length === 0) {
    return null;
  }

  req.session.employeeId = employees[0].id;
  return employees[0].id;
};

const store = async (req, res, next) => {
  try {
    const { event_id, title, description, document_type } = req.body;

    if (!event_id || !title || !document_type) {
      const [events] = await db.query(
        "SELECT id, title FROM events ORDER BY start_date DESC"
      );

      return res.status(400).render("reports/upload", {
        title: "Upload Laporan Kegiatan",
        events,
        error: "Event, judul laporan, dan jenis dokumen wajib diisi.",
      });
    }

    if (!req.file) {
      const [events] = await db.query(
        "SELECT id, title FROM events ORDER BY start_date DESC"
      );

      return res.status(400).render("reports/upload", {
        title: "Upload Laporan Kegiatan",
        events,
        error: "File laporan wajib diunggah.",
      });
    }

    const uploadedBy = await getValidEmployeeId(req);

    if (!uploadedBy) {
      const [events] = await db.query(
        "SELECT id, title FROM events ORDER BY start_date DESC"
      );

      return res.status(400).render("reports/upload", {
        title: "Upload Laporan Kegiatan",
        events,
        error:
          "Belum ada data employee untuk kolom uploaded_by. Tambahkan data employee terlebih dahulu.",
      });
    }

    const filePath = `/uploads/reports/${req.file.filename}`;

    const [tableColumns] = await db.query("SHOW COLUMNS FROM event_documents");
    const availableColumns = new Set(tableColumns.map((column) => column.Field));

    const insertColumns = [];
    const placeholders = [];
    const values = [];

    const addValue = (column, value) => {
      if (availableColumns.has(column)) {
        insertColumns.push(column);
        placeholders.push("?");
        values.push(value);
      }
    };

    const addNow = (column) => {
      if (availableColumns.has(column)) {
        insertColumns.push(column);
        placeholders.push("NOW()");
      }
    };

    addValue("event_id", event_id);
    addValue("title", title);
    addValue("document_type", document_type);
    addValue("file_path", filePath);
    addValue("description", description || null);
    addValue("uploaded_by", uploadedBy);
    addNow("uploaded_at");

    // Kolom ini hanya akan dipakai kalau memang ada di database.
    addValue("uploaded_by_id", uploadedBy);

    addNow("created_at");
    addNow("updated_at");

    await db.query(
      `
      INSERT INTO event_documents (${insertColumns.join(", ")})
      VALUES (${placeholders.join(", ")})
      `,
      values
    );

    res.redirect("/reports");
  } catch (err) {
    next(err);
  }
};

const openFile = async (req, res, next) => {
  try {
    const id = req.params.id;

    const [rows] = await db.query(
      `
      SELECT id, title, file_path
      FROM event_documents
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).render("error", {
        message: "File laporan tidak ditemukan di database",
        error: { status: 404, stack: "" },
      });
    }

    const report = rows[0];

    if (!report.file_path) {
      return res.status(404).render("error", {
        message: "Path file laporan kosong",
        error: { status: 404, stack: "" },
      });
    }

    const fileName = path.basename(report.file_path);

    const possiblePaths = [
      path.join(__dirname, "..", "uploads", "reports", fileName),
      path.join(__dirname, "..", "public", "uploads", "reports", fileName),
      path.join(process.cwd(), "uploads", "reports", fileName),
      path.join(process.cwd(), "public", "uploads", "reports", fileName),
    ];

    const fileLocation = possiblePaths.find((item) => fs.existsSync(item));

    if (!fileLocation) {
      return res.status(404).render("error", {
        message: "File laporan tidak ditemukan di folder server",
        error: { status: 404, stack: "" },
      });
    }

    return res.sendFile(fileLocation);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
  uploadPage,
  store,
  openFile,
};