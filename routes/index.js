var express = require("express");
var router = express.Router();
const indexController = require("../controllers/indexController");
const { isAuthenticated } = require("../middlewares/auth");

/* GET home page. */
router.get("/", indexController.index);

router.get("/home", isAuthenticated, indexController.home);

<<<<<<< Updated upstream
router.get("/login", indexController.loginPage);

router.post("/login", indexController.login);
=======
            res.render('dashboard-admin', {
                title: 'Dashboard Penanggung Jawab',
                stats: {
                    total: totalSemua[0].total,
                    menunggu: menunggu[0].total,
                    disetujui: disetujui[0].total,
                    selesai: selesai[0].total,
                    ditolak: ditolak[0].total
                }
            });
        } else {
            const userId = req.session.user.id;
            const [totalPeminjaman] = await db.query(
                'SELECT COUNT(*) as total FROM room_loans WHERE employee_id = ?', [userId]
            );
            const [menunggu] = await db.query(
                'SELECT COUNT(*) as total FROM room_loans WHERE employee_id = ? AND status = "requested"', [userId]
            );
            const [disetujui] = await db.query(
                'SELECT COUNT(*) as total FROM room_loans WHERE employee_id = ? AND status = "approved"', [userId]
            );
            const [selesai] = await db.query(
                'SELECT COUNT(*) as total FROM room_loans WHERE employee_id = ? AND status = "completed"', [userId]
            );
            const [ditolak] = await db.query(
                'SELECT COUNT(*) as total FROM room_loans WHERE employee_id = ? AND status = "rejected"', [userId]
            );

            res.render('dashboard-user', {
                title: 'Dashboard Pengguna',
                stats: {
                    total: totalPeminjaman[0].total,
                    menunggu: menunggu[0].total,
                    disetujui: disetujui[0].total,
                    selesai: selesai[0].total,
                    ditolak: ditolak[0].total
                }
            });
        }
    } catch (err) {
        next(err);
    }
});
>>>>>>> Stashed changes

router.get("/logout", indexController.logout);

<<<<<<< Updated upstream
module.exports = router;
=======
// 3. Rute Proses Cek Login
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [username]);

        if (users.length === 0) return res.render('login', { layout: false, error: 'Email atau Password salah!' });

        const user = users[0];
        if (password !== user.password) return res.render('login', { layout: false, error: 'Email atau Password salah!' });

        // Cek role dari tabel model_has_roles
        let userRole = 'pengguna';
        const [userRoles] = await db.query(
            `SELECT roles.name FROM roles 
            JOIN model_has_roles ON roles.id = model_has_roles.role_id 
            WHERE model_has_roles.model_id = ? 
            AND model_has_roles.model_type = 'App\\\\Models\\\\User'`,
            [user.id]
        );
        if (userRoles.length > 0 && userRoles[0].name === 'penanggung_jawab') {
            userRole = 'penanggung_jawab';
        }

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: userRole
        };

        res.redirect('/');
    } catch (err) {
        console.error("Error login:", err);
        next(err);
    }
});

// 4. Rute Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// 5. Halaman Register
router.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('register', { layout: false, error: null });
});

// 6. Proses Register
router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Cek email sudah ada atau belum
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.render('register', { layout: false, error: 'Email sudah terdaftar!' });
        }

        await db.query(
            'INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            [name, email, password]
        );

        res.redirect('/login');
    } catch (err) {
        next(err);
    }
});

module.exports = router;
>>>>>>> Stashed changes
