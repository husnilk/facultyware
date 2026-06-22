const express = require('express');
const router = express.Router();

// Panggil authController yang baru
const authController = require('../controllers/authController');

// Panggil middleware auth jika butuh memproteksi rute tertentu di sini
const auth = require('../middlewares/auth');

// 1. Route Root (/)
// Kalau ada yang akses localhost:3000 langsung kita arahkan ke halaman login
router.get('/', (req, res) => {
    res.redirect('/login');
});

// 2. Route untuk menampilkan halaman login
router.get('/login', authController.renderLogin);

// 3. Route untuk memproses submit form login
router.post('/login', authController.processLogin);

// 4. Route untuk logout
router.get('/logout', authController.processLogout);

module.exports = router;