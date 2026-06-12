const express = require('express');
const router = express.Router();
const atasanController = require('../controllers/atasanController');
const { isAuthenticated } = require('../middlewares/auth');

// Middleware otorisasi khusus: Hanya atasan_lvl_1 dan atasan_lvl_2 yang boleh mengakses
const isAtasan = (req, res, next) => {
    const role = req.session.user.role;
    if (role === 'atasan_lvl_1' || role === 'atasan_lvl_2') {
        return next();
    }
    // Jika pegawai atau admin yang mengakses
    return res.status(403).send('Akses Ditolak: Halaman ini khusus untuk Atasan.');
};

// Pastikan user sudah login dan memiliki role Atasan
router.use(isAuthenticated, isAtasan);

// Route Dashboard awal (redirect ke /cuti)
router.get('/', atasanController.index);

// Route GET daftar pengajuan cuti beserta filter dan pencarian
router.get('/cuti', atasanController.indexCuti);

// Route GET detail pengajuan cuti (Tahap 2)
router.get('/cuti/:id', atasanController.detailCuti);

module.exports = router;