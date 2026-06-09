const express = require('express');
const router = express.Router();
const pegawaiController = require('../controllers/pegawaiController');
const { isAuthenticated } = require('../middlewares/auth');
const acl = require('../middlewares/acl');

router.use(isAuthenticated, acl.checkRole('pegawai'));

router.get('/', pegawaiController.index);

router.get('/cuti', (req, res) => {
    res.send('Halaman Riwayat Pengajuan Cuti');
});

router.get('/cuti/tambah', (req, res) => {
    res.send('Form Pengajuan Cuti');
});

router.get('/notifikasi', (req, res) => {
    res.send('Halaman Notifikasi Pegawai');
});

module.exports = router;