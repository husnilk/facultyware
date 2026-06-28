const express = require('express');
const router = express.Router();
const db = require('../lib/database');

// 1. Halaman Utama Dashboard (Membagi Dashboard Berdasarkan Role)
router.get('/', async function(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        let queryStats;
        let params = [];

        if (req.session.user.role === 'penanggung_jawab') {
            queryStats = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'requested' THEN 1 ELSE 0 END) as menunggu,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as disetujui,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as selesai,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as ditolak
                FROM room_loans
            `;
        } else {
            queryStats = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'requested' THEN 1 ELSE 0 END) as menunggu,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as disetujui,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as selesai,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as ditolak
                FROM room_loans 
                WHERE employee_id = ?
            `;
            params.push(req.session.user.id);
        }

        const [statsRows] = await db.query(queryStats, params);
        const stats = statsRows[0].total > 0 ? statsRows[0] : { total: 0, menunggu: 0, disetujui: 0, selesai: 0, ditolak: 0 };

        // Diubah agar sesuai dengan nama file di VS Code kamu (menggunakan tanda hubung)
        if (req.session.user.role === 'penanggung_jawab') {
            // Fetch popular rooms
            const [popularRooms] = await db.query(`
                SELECT r.name AS room_name, COUNT(rl.id) AS booking_count
                FROM room_loans rl
                JOIN rooms r ON rl.room_id = r.id
                GROUP BY rl.room_id, r.name
                ORDER BY booking_count DESC
                LIMIT 5
            `);

            // Fetch monthly trends (last 6 months)
            const [monthlyTrends] = await db.query(`
                SELECT DATE_FORMAT(start_time, '%Y-%m') AS month, COUNT(id) AS booking_count
                FROM room_loans
                WHERE start_time >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(start_time, '%Y-%m')
                ORDER BY month ASC
            `);

            // Fetch recent bookings (last 5)
            const [recentBookings] = await db.query(`
                SELECT rl.*, r.name AS room_name, u.name AS borrower_name 
                FROM room_loans rl
                JOIN rooms r ON rl.room_id = r.id
                JOIN users u ON rl.employee_id = u.id
                ORDER BY rl.start_time DESC
                LIMIT 5
            `);

            res.render('dashboard-admin', { 
                title: 'Dashboard Penanggung Jawab', 
                stats,
                popularRooms,
                monthlyTrends,
                recentBookings
            });
        } else {
            res.render('dashboard-user', { title: 'Dashboard Pengguna', stats });
        }
    } catch (err) {
        next(err);
    }
});

// ==========================================
// FITUR LOGIN (Menggunakan tabel users bawaan SQL)
// ==========================================

router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('login', { layout: false, error: null, success: null });
});

router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        
        // Cari di tabel users berdasarkan kolom 'name' atau 'email'
        const [users] = await db.query('SELECT * FROM users WHERE name = ? OR email = ?', [username, username]);

        if (users.length === 0) {
            return res.render('login', { layout: false, error: 'Username/Email atau Password salah!', success: null });
        }

        const user = users[0];

        // Validasi password (Mendukung enkripsi bcrypt atau plain text)
        let isMatch = false;
        try {
            const bcrypt = require('bcryptjs');
            isMatch = await bcrypt.compare(password, user.password);
        } catch (e) {
            isMatch = (password === user.password);
        }

        if (!isMatch && password !== user.password) {
            return res.render('login', { layout: false, error: 'Username/Email atau Password salah!', success: null });
        }

        // Cek Role ke tabel employees menggunakan ID dari users
        let userRole = 'mahasiswa'; 
        const [isEmployee] = await db.query('SELECT id FROM employees WHERE id = ?', [user.id]);
        if (isEmployee.length > 0) {
            userRole = 'penanggung_jawab';
        }

        // Simpan ke session utama
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: userRole
        };

        res.redirect('/');
    } catch (err) {
        console.error("Error login:", err);
        res.render('login', { layout: false, error: 'Terjadi kesalahan sistem: ' + err.message, success: null });
    }
});

// ==========================================
// FITUR REGISTRASI
// ==========================================

router.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('register', { layout: false, error: null });
});

router.post('/register', async (req, res, next) => {
    try {
        const { username, email, password, confirm_password } = req.body;

        if (!username || !email || !password) {
            return res.render('register', { layout: false, error: 'Semua kolom wajib diisi!' });
        }

        if (password !== confirm_password) {
            return res.render('register', { layout: false, error: 'Konfirmasi password tidak cocok!' });
        }

        const [existingUser] = await db.query('SELECT id FROM users WHERE name = ? OR email = ?', [username, email]);
        if (existingUser.length > 0) {
            return res.render('register', { layout: false, error: 'Username atau Email sudah digunakan!' });
        }

        let finalPassword = password;
        try {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            finalPassword = await bcrypt.hash(password, salt);
        } catch (e) {
            finalPassword = password;
        }

        const insertQuery = `
            INSERT INTO users (name, email, password, created_at, updated_at) 
            VALUES (?, ?, ?, NOW(), NOW())
        `;
        await db.query(insertQuery, [username, email, finalPassword]);

        res.render('login', { layout: false, error: null, success: 'Registrasi berhasil! Silakan login.' });
    } catch (err) {
        console.error("Error Registrasi:", err);
        res.render('register', { layout: false, error: 'Gagal melakukan registrasi: ' + err.message });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;