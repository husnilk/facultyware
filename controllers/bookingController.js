const db = require('../lib/database'); // JALUR DIREKTORI SUDAH DIPASTIKAN BENAR

// ========================================================
// FITUR 1 & 2: MANAJEMEN PENGAJUAN & LIST
// ========================================================

const getAllBookings = async (req, res, next) => {
    try {
        const user = req.session.user;
        
        // REVISI: Ubah JOIN employees menjadi JOIN users
        let query = `
            SELECT rl.*, r.name AS room_name, u.name AS borrower_name 
            FROM room_loans rl
            JOIN rooms r ON rl.room_id = r.id
            JOIN users u ON rl.employee_id = u.id
        `;
        let params = [];

        if (user.role !== 'penanggung_jawab') {
            query += " WHERE rl.employee_id = ?";
            params.push(user.id);
        }

        query += " ORDER BY rl.start_time DESC";
        const [bookings] = await db.query(query, params);

        res.render('booking-list', { title: 'Peminjaman Ruangan', bookings });
    } catch (err) {
        next(err);
    }
};

const getAddBookingPage = async (req, res, next) => {
    try {
        const [rooms] = await db.query("SELECT id, name FROM rooms");
        res.render('add-booking', { title: 'Ajukan Pemakaian Ruangan', rooms });
    } catch (err) {
        next(err);
    }
};

const createBooking = async (req, res) => {
    try {
        const { room_id, tanggal, purpose } = req.body;
        const employee_id = req.session.user.id;

        const jam_mulai = req.body.jam_mulai || req.body.start_time;
        const jam_selesai = req.body.jam_selesai || req.body.end_time;

        const start_time = `${tanggal} ${jam_mulai}:00`;
        const end_time = `${tanggal} ${jam_selesai}:00`;

        const checkConflictQuery = `
            SELECT id FROM room_loans 
            WHERE room_id = ? 
            AND status IN ('requested', 'approved')
            AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))
        `;
        const [conflicts] = await db.query(checkConflictQuery, [room_id, end_time, start_time, start_time, end_time]);

        if (conflicts.length > 0) {
            return res.status(400).json({ error: "Ruangan sudah terpakai atau diajukan pada jam tersebut!" });
        }

        const insertQuery = `
            INSERT INTO room_loans (room_id, employee_id, start_time, end_time, purpose, status) 
            VALUES (?, ?, ?, ?, ?, 'requested')
        `;
        await db.query(insertQuery, [room_id, employee_id, start_time, end_time, purpose]);

        res.status(200).json({ message: "Pengajuan peminjaman berhasil dikirim." });
    } catch (err) {
        res.status(500).json({ error: "Gagal menyimpan pengajuan: " + err.message });
    }
};

// ========================================================
// FITUR 4 & 5: VERIFIKASI & MENGUBAH STATUS SELESAI
// ========================================================
const handleAction = async (req, res, next) => {
    try {
        const bookingId = req.params.id;
        const { action_status } = req.body; 
        const adminId = req.session.user.id;

        await db.query("UPDATE room_loans SET status = ?, approved_by = ? WHERE id = ?", [action_status, adminId, bookingId]);
        res.redirect('/bookings');
    } catch (err) {
        next(err);
    }
};

// ========================================================
// FITUR 6: MEMBATALKAN PEMINJAMAN (MAHASISWA)
// ========================================================
const cancelBooking = async (req, res, next) => {
    try {
        const bookingId = req.params.id;
        const userId = req.session.user.id;

        const [booking] = await db.query("SELECT status FROM room_loans WHERE id = ? AND employee_id = ?", [bookingId, userId]);
        
        if (booking.length === 0) {
            return res.status(404).send("Data peminjaman tidak ditemukan.");
        }

        if (booking[0].status !== 'requested') {
            return res.status(400).send("Peminjaman yang sudah disetujui/ditolak tidak dapat dibatalkan.");
        }

        await db.query("DELETE FROM room_loans WHERE id = ?", [bookingId]);
        res.redirect('/bookings');
    } catch (err) {
        next(err);
    }
};

// ========================================================
// FITUR 3: CETAK BUKTI PEMINJAMAN (SURAT IZIN NATIVE BROWSER)
// ========================================================
const downloadReceiptPDF = async (req, res, next) => {
    try {
        const bookingId = req.params.id;
        const query = `
            SELECT rl.*, r.name AS room_name, u.name AS borrower_name 
            FROM room_loans rl
            JOIN rooms r ON rl.room_id = r.id
            JOIN users u ON rl.employee_id = u.id
            WHERE rl.id = ?
        `;
        const [rows] = await db.query(query, [bookingId]);

        if (rows.length === 0) return res.status(404).send("Data tidak ditemukan.");
        const b = rows[0];

        res.send(`
            <html>
            <head>
                <title>Bukti Peminjaman #${b.id}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; color: #333; }
                    .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 30px; }
                    .title { font-size: 20px; font-weight: bold; }
                    .content p { font-size: 14px; line-height: 2; }
                    .footer { margin-top: 50px; text-align: center; font-style: italic; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">FACULTYWARE - UNIVERSITAS ANDALAS</div>
                    <div>SURAT IZIN RESMI PEMAKAIAN RUANGAN</div>
                </div>
                <div class="content">
                    <p><b>Nomor Dokumen :</b> FTW/SRT/${b.id}/${new Date().getFullYear()}</p>
                    <p><b>Status Dokumen :</b> ${b.status.toUpperCase()}</p>
                    <p><b>Nama Peminjam :</b> ${b.borrower_name}</p>
                    <p><b>Nama Ruangan  :</b> ${b.room_name}</p>
                    <p><b>Waktu Pemakaian:</b> ${new Date(b.start_time).toLocaleString('id-ID')} s.d ${new Date(b.end_time).toLocaleString('id-ID')}</p>
                    <p><b>Keperluan     :</b> ${b.purpose}</p>
                </div>
                <div class="footer">
                    Dikeluarkan secara sah oleh Sistem Informasi Peminjaman Ruangan Facultyware.
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
    } catch (err) {
        next(err);
    }
};

// ========================================================
// FITUR 7: JADWAL REALTIME
// ========================================================
const getRealtimeAvailability = async (req, res, next) => {
    try {
        const queryKetersediaan = `
            SELECT r.id, r.name, r.code,
                (SELECT COUNT(*) FROM room_loans WHERE room_id = r.id AND status = 'approved' AND NOW() BETWEEN start_time AND end_time) as is_booked,
                (SELECT u.name FROM room_loans rl JOIN users u ON rl.employee_id = u.id WHERE rl.room_id = r.id AND rl.status = 'approved' AND NOW() BETWEEN rl.start_time AND rl.end_time LIMIT 1) as current_borrower,
                (SELECT end_time FROM room_loans WHERE room_id = r.id AND status = 'approved' AND NOW() BETWEEN start_time AND end_time LIMIT 1) as end_time
            FROM rooms r
        `;
        const [rooms] = await db.query(queryKetersediaan);

        // Fetch all bookings for the calendar view
        const queryBookings = `
            SELECT rl.*, r.name AS room_name, u.name AS borrower_name 
            FROM room_loans rl
            JOIN rooms r ON rl.room_id = r.id
            JOIN users u ON rl.employee_id = u.id
            ORDER BY rl.start_time ASC
        `;
        const [bookings] = await db.query(queryBookings);

        res.render('ketersediaan', { 
            title: 'Jadwal Ruangan Real-time', 
            rooms, 
            bookings, 
            user: req.session.user 
        });
    } catch (err) {
        next(err);
    }
};

// ========================================================
// FITUR 8: EKSPOR RIWAYAT DENGAN FILTER
// ========================================================
const getExportHistoryPage = async (req, res, next) => {
    try {
        const status = req.query.status || '';
        const tgl_mulai = req.query.tgl_mulai || '';
        const tgl_selesai = req.query.tgl_selesai || '';

        let query = `
            SELECT rl.*, r.name AS room_name, u.name AS borrower_name 
    FROM room_loans rl
    JOIN rooms r ON rl.room_id = r.id
    JOIN users u ON rl.employee_id = u.id
            WHERE 1=1
        `;
        let params = [];

        if (status) { query += " AND rl.status = ?"; params.push(status); }
        if (tgl_mulai) { query += " AND rl.start_time >= ?"; params.push(`${tgl_mulai} 00:00:00`); }
        if (tgl_selesai) { query += " AND rl.end_time <= ?"; params.push(`${tgl_selesai} 23:59:59`); }

        const [rows] = await db.query(query, params);
        const bookings = rows || [];

        res.render('export-riwayat', { 
            title: 'Ekspor Riwayat', 
            bookings, 
            status, 
            tgl_mulai, 
            tgl_selesai,
            user: req.session.user 
        });
    } catch (err) {
        next(err);
    }
};

const downloadExportHistoryPDF = async (req, res, next) => {
    try {
        const { status, tgl_mulai, tgl_selesai } = req.query;
        let query = `
            SELECT rl.*, r.name AS room_name, u.name AS borrower_name 
    FROM room_loans rl
    JOIN rooms r ON rl.room_id = r.id
    JOIN users u ON rl.employee_id = u.id
            WHERE 1=1
        `;
        let params = [];
        if (status) { query += " AND rl.status = ?"; params.push(status); }
        if (tgl_mulai) { query += " AND rl.start_time >= ?"; params.push(`${tgl_mulai} 00:00:00`); }
        if (tgl_selesai) { query += " AND rl.end_time <= ?"; params.push(`${tgl_selesai} 23:59:59`); }

        const [bookings] = await db.query(query, params);

        let tabelBaris = '';
        bookings.forEach((b, i) => {
            tabelBaris += `
                <tr>
                    <td style="border:1px solid #ccc; padding:8px; text-align:center;">${i+1}</td>
                    <td style="border:1px solid #ccc; padding:8px;">${b.borrower_name}</td>
                    <td style="border:1px solid #ccc; padding:8px;">${b.room_name}</td>
                    <td style="border:1px solid #ccc; padding:8px;">${new Date(b.start_time).toLocaleDateString('id-ID')}</td>
                    <td style="border:1px solid #ccc; padding:8px; text-transform:uppercase;">${b.status}</td>
                </tr>
            `;
        });

        res.send(`
            <html>
            <head><title>Laporan Riwayat Peminjaman</title></head>
            <body style="font-family:sans-serif; padding:30px;">
                <h3 style="text-align:center; margin-bottom:20px;">LAPORAN RIWAYAT EKSPOR PEMINJAMAN RUANGAN</h3>
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f2f2f2;">
                            <th style="border:1px solid #ccc; padding:8px;">No</th>
                            <th style="border:1px solid #ccc; padding:8px;">Peminjam</th>
                            <th style="border:1px solid #ccc; padding:8px;">Ruangan</th>
                            <th style="border:1px solid #ccc; padding:8px;">Tanggal</th>
                            <th style="border:1px solid #ccc; padding:8px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>${tabelBaris || '<tr><td colspan="5" style="text-align:center; padding:10px;">Tidak ada data</td></tr>'}</tbody>
                </table>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
    } catch (err) {
        next(err);
    }
};

// ========================================================
// FITUR 9: REKAP LAPORAN BULANAN
// ========================================================
const getMonthlyReport = async (req, res, next) => {
    try {
        const now = new Date();
        const bulan = req.query.bulan || (now.getMonth() + 1);
        const tahun = req.query.tahun || now.getFullYear();

        const queryLaporan = `
            SELECT rl.*, r.name AS room_name, u.name AS borrower_name 
    FROM room_loans rl
    JOIN rooms r ON rl.room_id = r.id
    JOIN users u ON rl.employee_id = u.id
            WHERE MONTH(rl.start_time) = ? AND YEAR(rl.start_time) = ?
            ORDER BY rl.start_time ASC
        `;
        const [rows] = await db.query(queryLaporan, [bulan, tahun]);
        const bookings = rows || [];

        res.render('laporan-bulanan', { title: 'Laporan Bulanan', bookings, bulan, tahun, user: req.session.user });
    } catch (err) {
        next(err);
    }
};

const downloadMonthlyReportPDF = async (req, res, next) => {
    try {
        const { bulan, tahun } = req.query;
        const queryLaporan = `
            SELECT rl.*, r.name AS room_name, u.name AS borrower_name 
    FROM room_loans rl
    JOIN rooms r ON rl.room_id = r.id
    JOIN users u ON rl.employee_id = u.id
            WHERE MONTH(rl.start_time) = ? AND YEAR(rl.start_time) = ?
        `;
        const [bookings] = await db.query(queryLaporan, [bulan, tahun]);

        let tabelBaris = '';
        bookings.forEach((b, i) => {
            tabelBaris += `
                <tr>
                    <td style="border:1px solid #ccc; padding:8px; text-align:center;">${i+1}</td>
                    <td style="border:1px solid #ccc; padding:8px;">${b.borrower_name}</td>
                    <td style="border:1px solid #ccc; padding:8px;">${b.room_name}</td>
                    <td style="border:1px solid #ccc; padding:8px;">${b.purpose}</td>
                    <td style="border:1px solid #ccc; padding:8px; text-transform:uppercase;">${b.status}</td>
                </tr>
            `;
        });

        res.send(`
            <html>
            <head><title>Laporan Bulanan ${bulan}/${tahun}</title></head>
            <body style="font-family:sans-serif; padding:30px;">
                <h3 style="text-align:center; margin-bottom:20px;">REKAPITULASI LAPORAN BULANAN - BULAN ${bulan} TAHUN ${tahun}</h3>
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f2f2f2;">
                            <th style="border:1px solid #ccc; padding:8px;">No</th>
                            <th style="border:1px solid #ccc; padding:8px;">Peminjam</th>
                            <th style="border:1px solid #ccc; padding:8px;">Ruangan</th>
                            <th style="border:1px solid #ccc; padding:8px;">Keperluan</th>
                            <th style="border:1px solid #ccc; padding:8px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>${tabelBaris || '<tr><td colspan="5" style="text-align:center; padding:10px;">Tidak ada data</td></tr>'}</tbody>
                </table>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
    } catch (err) {
        next(err);
    }
};

// ========================================================
// IMPLEMENTASI FITUR EDIT & DELETE (PENANGGUNG JAWAB)
// ========================================================

const getEditBookingPage = async (req, res, next) => {
    try {
        const user = req.session.user;
        if (user.role !== 'penanggung_jawab') {
            return res.status(403).send("Akses ditolak. Hanya Penanggung Jawab yang dapat mengubah peminjaman.");
        }

        const bookingId = req.params.id;
        const [bookings] = await db.query("SELECT * FROM room_loans WHERE id = ?", [bookingId]);
        if (bookings.length === 0) {
            return res.status(404).send("Data peminjaman tidak ditemukan.");
        }

        const booking = bookings[0];
        
        // Format tanggal, jam mulai, dan jam selesai
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);

        // Helper untuk format YYYY-MM-DD
        const year = start.getFullYear();
        const month = String(start.getMonth() + 1).padStart(2, '0');
        const day = String(start.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        // Helper untuk format HH:MM
        const startHour = String(start.getHours()).padStart(2, '0');
        const startMin = String(start.getMinutes()).padStart(2, '0');
        const formattedStart = `${startHour}:${startMin}`;

        const endHour = String(end.getHours()).padStart(2, '0');
        const endMin = String(end.getMinutes()).padStart(2, '0');
        const formattedEnd = `${endHour}:${endMin}`;

        const [rooms] = await db.query("SELECT id, name FROM rooms");

        res.render('edit-booking', { 
            title: 'Edit Peminjaman Ruangan', 
            booking, 
            rooms, 
            formattedDate, 
            formattedStart, 
            formattedEnd 
        });
    } catch (err) {
        next(err);
    }
};

const updateBooking = async (req, res) => {
    try {
        const user = req.session.user;
        if (user.role !== 'penanggung_jawab') {
            return res.status(403).json({ error: "Akses ditolak." });
        }

        const bookingId = req.params.id;
        const { room_id, tanggal, purpose, status } = req.body;

        const jam_mulai = req.body.jam_mulai || req.body.start_time;
        const jam_selesai = req.body.jam_selesai || req.body.end_time;

        const start_time = `${tanggal} ${jam_mulai}:00`;
        const end_time = `${tanggal} ${jam_selesai}:00`;

        // Cek konflik dengan mengecualikan peminjaman saat ini
        const checkConflictQuery = `
            SELECT id FROM room_loans 
            WHERE room_id = ? 
            AND id != ?
            AND status IN ('requested', 'approved')
            AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))
        `;
        const [conflicts] = await db.query(checkConflictQuery, [room_id, bookingId, end_time, start_time, start_time, end_time]);

        if (conflicts.length > 0) {
            return res.status(400).json({ error: "Ruangan sudah terpakai atau diajukan pada jam tersebut!" });
        }

        const updateQuery = `
            UPDATE room_loans 
            SET room_id = ?, start_time = ?, end_time = ?, purpose = ?, status = ?
            WHERE id = ?
        `;
        await db.query(updateQuery, [room_id, start_time, end_time, purpose, status, bookingId]);

        res.status(200).json({ message: "Peminjaman berhasil diperbarui." });
    } catch (err) {
        res.status(500).json({ error: "Gagal memperbarui peminjaman: " + err.message });
    }
};

const deleteBooking = async (req, res, next) => {
    try {
        const user = req.session.user;
        if (user.role !== 'penanggung_jawab') {
            return res.status(403).send("Akses ditolak.");
        }

        const bookingId = req.params.id;
        await db.query("DELETE FROM room_loans WHERE id = ?", [bookingId]);
        res.redirect('/bookings');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllBookings,
    getAddBookingPage,
    createBooking,
    handleAction,
    cancelBooking,
    downloadReceiptPDF,
    getRealtimeAvailability,
    getExportHistoryPage,
    downloadExportHistoryPDF,
    getMonthlyReport,
    downloadMonthlyReportPDF,
    getEditBookingPage,
    updateBooking,
    deleteBooking
};