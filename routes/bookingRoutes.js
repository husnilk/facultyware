const express = require('express');
const router = express.Router();
const db = require('../lib/database');

// --- SATPAM MIDDLEWARE ---
router.use((req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
});

// 1. Tampilkan Daftar Peminjaman
router.get('/', async (req, res, next) => {
    try {
        let sql = '';
        let params = [];

        if (req.session.user.role === 'penanggung_jawab') {
            sql = `SELECT room_loans.*, rooms.name AS room_name, 
                   users.name AS borrower_name 
                   FROM room_loans 
                   JOIN rooms ON room_loans.room_id = rooms.id 
                   LEFT JOIN users ON users.id = room_loans.employee_id
                   ORDER BY room_loans.created_at DESC`;
        } else {
            sql = `SELECT room_loans.*, rooms.name AS room_name 
                   FROM room_loans 
                   JOIN rooms ON room_loans.room_id = rooms.id 
                   WHERE room_loans.employee_id = ? 
                   ORDER BY room_loans.created_at DESC`;
            params = [req.session.user.id];
        }

        const [bookings] = await db.query(sql, params);
        res.render('booking-list', { title: 'Daftar Peminjaman Ruangan', bookings: bookings });
    } catch (err) {
        next(err);
    }
});

// 2. Tampilkan Form Tambah
router.get('/add', async (req, res, next) => {
    try {
        const [rooms] = await db.query('SELECT * FROM rooms');
        res.render('add-booking', { title: 'Buat Pengajuan Baru', rooms: rooms });
    } catch (err) {
        next(err);
    }
});

// 3. Proses Simpan Data Form
router.post('/add', async (req, res, next) => {
    try {
        const { room_id, tanggal, jam_mulai, jam_selesai, purpose } = req.body;
        const start_time = `${tanggal} ${jam_mulai}:00`;
        const end_time = `${tanggal} ${jam_selesai}:00`;
        const approved_by_id = 1;
        const status = 'requested';
        const employee_id = req.session.user.id;

        const sql = `INSERT INTO room_loans (room_id, employee_id, start_time, end_time, purpose, status, approved_by_id, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

        await db.execute(sql, [room_id, employee_id, start_time, end_time, purpose, status, approved_by_id]);
        res.redirect('/bookings');
    } catch (err) {
        console.error("Error nambah data:", err);
        next(err);
    }
});

// FITUR 11 - Halaman Laporan Bulanan (Fazira)
router.get('/laporan/bulanan', async (req, res, next) => {
    try {
        if (req.session.user.role !== 'penanggung_jawab') {
            return res.status(403).send('Akses ditolak!');
        }

        const bulan = req.query.bulan || new Date().getMonth() + 1;
        const tahun = req.query.tahun || new Date().getFullYear();

        const [bookings] = await db.query(`
            SELECT room_loans.*, rooms.name AS room_name, 
            users.name AS borrower_name
            FROM room_loans 
            JOIN rooms ON room_loans.room_id = rooms.id
            LEFT JOIN users ON users.id = room_loans.employee_id
            WHERE MONTH(room_loans.start_time) = ? AND YEAR(room_loans.start_time) = ?
            ORDER BY room_loans.start_time ASC
        `, [bulan, tahun]);

        res.render('laporan-bulanan', { 
            title: 'Laporan Bulanan',
            bookings: bookings,
            bulan: bulan,
            tahun: tahun
        });
    } catch (err) {
        next(err);
    }
});

// FITUR 11 - Download PDF Laporan Bulanan (Fazira)
router.get('/laporan/bulanan/download', async (req, res, next) => {
    try {
        if (req.session.user.role !== 'penanggung_jawab') {
            return res.status(403).send('Akses ditolak!');
        }

        const bulan = req.query.bulan || new Date().getMonth() + 1;
        const tahun = req.query.tahun || new Date().getFullYear();

        const namaBulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

        const [data] = await db.query(`
            SELECT room_loans.*, rooms.name AS room_name, 
            users.name AS borrower_name
            FROM room_loans 
            JOIN rooms ON room_loans.room_id = rooms.id
            LEFT JOIN users ON users.id = room_loans.employee_id
            WHERE MONTH(room_loans.start_time) = ? AND YEAR(room_loans.start_time) = ?
            ORDER BY room_loans.start_time ASC
        `, [bulan, tahun]);

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=laporan-bulanan-${bulan}-${tahun}.pdf`);
        doc.pipe(res);

        // ===== HEADER =====
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a1a1a')
            .text('LAPORAN PEMINJAMAN RUANGAN', { align: 'center' });
        doc.fontSize(11).font('Helvetica').fillColor('#555555')
            .text(`Bulan: ${namaBulan[bulan - 1]} ${tahun}`, { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1.5).stroke('#333333');
        doc.moveDown(1);

        if (data.length === 0) {
            doc.fontSize(11).fillColor('#888888').text('Tidak ada data peminjaman pada bulan ini.', { align: 'center' });
        } else {
            const statusLabel = {
                'requested': 'MENUNGGU',
                'approved': 'DISETUJUI',
                'completed': 'SELESAI',
                'rejected': 'DITOLAK'
            };

            const cols = { no: 50, peminjam: 80, ruangan: 220, tanggal: 370, status: 460 };
            const rowHeight = 22;

            // Header tabel
            let y = doc.y;
            doc.rect(50, y, 495, rowHeight).fillAndStroke('#2c3e50', '#2c3e50');
            doc.font('Helvetica-Bold').fontSize(10).fillColor('white')
                .text('No',        cols.no,       y + 6, { width: 25 })
                .text('Peminjam',  cols.peminjam,  y + 6, { width: 135 })
                .text('Ruangan',   cols.ruangan,   y + 6, { width: 145 })
                .text('Tanggal',   cols.tanggal,   y + 6, { width: 85 })
                .text('Status',    cols.status,    y + 6, { width: 85 });
            y += rowHeight;

            // Baris data
            doc.font('Helvetica').fontSize(9);
            data.forEach((item, index) => {
                const bgColor = index % 2 === 0 ? '#ffffff' : '#f5f7fa';
                doc.rect(50, y, 495, rowHeight).fillAndStroke(bgColor, '#dddddd');
                doc.fillColor('#1a1a1a')
                    .text(index + 1,                                                cols.no,       y + 6, { width: 25 })
                    .text(item.borrower_name || '-',                                cols.peminjam,  y + 6, { width: 135 })
                    .text(item.room_name || '-',                                    cols.ruangan,   y + 6, { width: 145 })
                    .text(new Date(item.start_time).toLocaleDateString('id-ID'),    cols.tanggal,   y + 6, { width: 85 })
                    .text(statusLabel[item.status] || item.status,                  cols.status,    y + 6, { width: 85 });
                y += rowHeight;
            });

            // Garis penutup
            doc.moveTo(50, y).lineTo(545, y).lineWidth(1).stroke('#333333');
            doc.y = y + 10;
        }

        doc.moveDown(0.5);

        // Footer
        doc.moveDown(2);
        doc.fontSize(9).fillColor('#aaaaaa')
            .text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, { align: 'center' });

        doc.end();
    } catch (err) {
        next(err);
    }
});

// 4. Proses ACC / Tolak
router.post('/:id/action', async (req, res, next) => {
    try {
        if (req.session.user.role !== 'penanggung_jawab') {
            return res.status(403).send("Hanya Penanggung Jawab yang boleh melakukan aksi ini.");
        }

        const bookingId = req.params.id;
        const { action_status } = req.body;

        const sql = `UPDATE room_loans SET status = ?, updated_at = NOW() WHERE id = ?`;
        await db.execute(sql, [action_status, bookingId]);

        res.redirect('/bookings');
    } catch (err) {
        next(err);
    }
});

// FITUR 9 - Tandai Ruangan Selesai (Fazira)
router.post('/:id/selesai', async (req, res, next) => {
    try {
        const bookingId = req.params.id;
        const userId = req.session.user.id;

        const [booking] = await db.query(
            'SELECT * FROM room_loans WHERE id = ? AND employee_id = ?',
            [bookingId, userId]
        );

        if (booking.length === 0) {
            return res.status(403).render('error', {
                title: 'Akses Ditolak',
                message: 'Peminjaman tidak ditemukan atau bukan milik Anda.'
            });
        }

        if (booking[0].status !== 'approved') {
            return res.status(400).render('error', {
                title: 'Gagal',
                message: 'Hanya peminjaman yang disetujui yang bisa ditandai selesai.'
            });
        }

        await db.execute(
            'UPDATE room_loans SET status = ?, updated_at = NOW() WHERE id = ?',
            ['completed', bookingId]
        );

        res.redirect('/bookings');
    } catch (err) {
        next(err);
    }
});

// FITUR 12 - Halaman Export Riwayat
router.get('/export/riwayat', async (req, res, next) => {
    try {
        if (req.session.user.role !== 'penanggung_jawab') {
            return res.status(403).send('Akses ditolak!');
        }
        
        const status = req.query.status || '';
        const tgl_mulai = req.query.tgl_mulai || '';
        const tgl_selesai = req.query.tgl_selesai || '';

        let sql = `SELECT room_loans.*, rooms.name AS room_name, 
                   users.name AS borrower_name
                   FROM room_loans 
                   JOIN rooms ON room_loans.room_id = rooms.id
                   LEFT JOIN users ON users.id = room_loans.employee_id
                   WHERE 1=1`;
        let params = [];

        if (status) {
            sql += ` AND room_loans.status = ?`;
            params.push(status);
        }
        if (tgl_mulai) {
            sql += ` AND DATE(room_loans.start_time) >= ?`;
            params.push(tgl_mulai);
        }
        if (tgl_selesai) {
            sql += ` AND DATE(room_loans.start_time) <= ?`;
            params.push(tgl_selesai);
        }

        sql += ` ORDER BY room_loans.start_time DESC`;

        const [bookings] = await db.query(sql, params);

        res.render('export-riwayat', {
            title: 'Ekspor Riwayat Peminjaman',
            bookings: bookings,
            status: status,
            tgl_mulai: tgl_mulai,
            tgl_selesai: tgl_selesai
        });
    } catch (err) {
        next(err);
    }
});

// FITUR 12 - Download PDF Export Riwayat
router.get('/export/riwayat/download', async (req, res, next) => {
    try {
        if (req.session.user.role !== 'penanggung_jawab') {
            return res.status(403).send('Akses ditolak!');
        }

        const status = req.query.status || '';
        const tgl_mulai = req.query.tgl_mulai || '';
        const tgl_selesai = req.query.tgl_selesai || '';

        let sql = `SELECT room_loans.*, rooms.name AS room_name, 
                   users.name AS borrower_name
                   FROM room_loans 
                   JOIN rooms ON room_loans.room_id = rooms.id
                   LEFT JOIN users ON users.id = room_loans.employee_id
                   WHERE 1=1`;
        let params = [];

        if (status) {
            sql += ` AND room_loans.status = ?`;
            params.push(status);
        }
        if (tgl_mulai) {
            sql += ` AND DATE(room_loans.start_time) >= ?`;
            params.push(tgl_mulai);
        }
        if (tgl_selesai) {
            sql += ` AND DATE(room_loans.start_time) <= ?`;
            params.push(tgl_selesai);
        }

        sql += ` ORDER BY room_loans.start_time DESC`;

        const [data] = await db.query(sql, params);

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=riwayat-peminjaman.pdf`);
        doc.pipe(res);

        // ===== HEADER =====
        const statusLabelHeader = {
            'requested': 'MENUNGGU',
            'approved': 'DISETUJUI',
            'completed': 'SELESAI',
            'rejected': 'DITOLAK'
        };

        doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a1a1a')
            .text('RIWAYAT PEMINJAMAN RUANGAN', { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1.5).stroke('#333333');
        doc.moveDown(1);

        if (data.length === 0) {
            doc.fontSize(11).fillColor('#888888').text('Tidak ada data yang sesuai filter.', { align: 'center' });
        } else {
            const statusLabel = {
                'requested': 'MENUNGGU',
                'approved': 'DISETUJUI',
                'completed': 'SELESAI',
                'rejected': 'DITOLAK'
            };

            const cols = { no: 50, peminjam: 80, ruangan: 220, tanggal: 370, status: 460 };
            const rowHeight = 22;

            // Header tabel
            let y = doc.y;
            doc.rect(50, y, 495, rowHeight).fillAndStroke('#2c3e50', '#2c3e50');
            doc.font('Helvetica-Bold').fontSize(10).fillColor('white')
                .text('No',        cols.no,       y + 6, { width: 25 })
                .text('Peminjam',  cols.peminjam,  y + 6, { width: 135 })
                .text('Ruangan',   cols.ruangan,   y + 6, { width: 145 })
                .text('Tanggal',   cols.tanggal,   y + 6, { width: 85 })
                .text('Status',    cols.status,    y + 6, { width: 85 });
            y += rowHeight;

            // Baris data
            doc.font('Helvetica').fontSize(9);
            data.forEach((item, index) => {
                const bgColor = index % 2 === 0 ? '#ffffff' : '#f5f7fa';
                doc.rect(50, y, 495, rowHeight).fillAndStroke(bgColor, '#dddddd');
                doc.fillColor('#1a1a1a')
                    .text(index + 1,                                                cols.no,       y + 6, { width: 25 })
                    .text(item.borrower_name || '-',                                cols.peminjam,  y + 6, { width: 135 })
                    .text(item.room_name || '-',                                    cols.ruangan,   y + 6, { width: 145 })
                    .text(new Date(item.start_time).toLocaleDateString('id-ID'),    cols.tanggal,   y + 6, { width: 85 })
                    .text(statusLabel[item.status] || item.status,                  cols.status,    y + 6, { width: 85 });
                y += rowHeight;
            });

            // Garis penutup
            doc.moveTo(50, y).lineTo(545, y).lineWidth(1).stroke('#333333');
            doc.y = y + 10;
        }

        doc.moveDown(0.5);
        
        // Footer
        doc.moveDown(2);
        doc.fontSize(9).fillColor('#aaaaaa')
            .text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, { align: 'center' });

        doc.end();
    } catch (err) {
        next(err);
    }
});

module.exports = router;