const db = require('../lib/db');
const bcrypt = require('bcrypt');

exports.renderLogin = (req, res) => {
    if (req.session.user) {
        // Jika sudah login, arahkan ke dashboard masing-masing
        return res.redirect(`/${req.session.user.role === 'admin' ? 'admin' : (req.session.user.role === 'atasan_lvl_1' ? 'atasan' : (req.session.user.role === 'atasan_lvl_2' ? 'atasan-lvl2' : 'pegawai'))}`);
    }
    // Tambahkan layout: false agar tidak dibungkus oleh main.ejs
    res.render('auth/login', { title: 'Login - Facultyware', user: null, error: null, layout: false });
};

exports.processLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return res.render('auth/login', { title: 'Login - Facultyware', user: null, error: 'Email tidak terdaftar!', layout: false });

        const user = rows[0];

        // Cek kecocokan password menggunakan Bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.render('auth/login', { title: 'Login - Facultyware', user: null, error: 'Password salah!', layout: false });

        // Ambil Role User dari tabel model_has_roles & roles
        const [roleRows] = await db.execute(`
            SELECT r.name FROM roles r 
            JOIN model_has_roles mhr ON r.id = mhr.role_id 
            WHERE mhr.model_id = ?
        `, [user.id]);

        const userRole = roleRows.length > 0 ? roleRows[0].name : 'pegawai'; // Default pegawai jika tidak ada role

        // Simpan ke Session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: userRole
        };

        // Redirect sesuai Role
        if (userRole === 'admin') res.redirect('/admin');
        else if (userRole === 'atasan_lvl_1') res.redirect('/atasan');
        else if (userRole === 'atasan_lvl_2') res.redirect('/atasan-lvl2');
        else res.redirect('/pegawai');

    } catch (error) {
        console.error('Error saat login:', error);
        res.status(500).send('Terjadi kesalahan pada server');
    }
};

exports.processLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error(err);
        res.redirect('/login');
    });
};