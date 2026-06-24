const db = require('../lib/db');

// ─────────────────────────────────────────────
// API – total peminjaman selesai (returned + rejected)
// ─────────────────────────────────────────────
const totalLoans = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM equipment_loans WHERE status IN ('returned', 'rejected')`
    );
    res.json({ total: rows[0].total });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// API – jumlah peminjaman dengan status 'requested'
// ─────────────────────────────────────────────
const requestedLoans = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM equipment_loans WHERE status = 'requested'`
    );
    res.json({ total: rows[0].total });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// API – peminjaman dibatalkan (rejected)
// ─────────────────────────────────────────────
const unreturnedLoans = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM equipment_loans WHERE status = 'rejected'`
    );
    res.json({ total: rows[0].total });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// API – track status peminjaman (Mahasiswa)
// ─────────────────────────────────────────────
const trackLoan = async (req, res) => {
    const idTransaksi = req.params.id;
    const userId = req.session.userId; 

    if (!idTransaksi || isNaN(idTransaksi)) {
        return res.status(400).json({ success: false, message: "ID Transaksi tidak valid." });
    }

    try {
        const query = `
            SELECT id, start_date, end_date, status 
            FROM equipment_loans 
            WHERE id = ? AND employee_id = ?
        `;
        const [rows] = await db.query(query, [idTransaksi, userId]); 

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: `Data tidak ditemukan.` });
        }

        return res.status(200).json({
            success: true,
            message: "Data pelacakan status berhasil ditemukan.",
            data: rows[0]
        });
    } catch (error) {
        console.error("REST API Error:", error);
        return res.status(500).json({ success: false, message: "Terjadi kegagalan server." });
    }
};

module.exports = {
  totalLoans,
  requestedLoans,
  unreturnedLoans,
  trackLoan
};
